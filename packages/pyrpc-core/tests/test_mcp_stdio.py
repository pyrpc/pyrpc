"""Integration tests: launch `pyrpc mcp` as a real stdio subprocess.

These catch what in-memory testing cannot: wire framing, stdout purity,
subprocess lifecycle, and the exact launch shape MCP clients use.
"""

import json
import shutil
import subprocess
import sys
import uuid
from pathlib import Path

import pytest
from mcp import Client
from mcp.client.stdio import StdioServerParameters
from mcp_fixtures import make_project
from pyrpc_core import default_router


@pytest.fixture(autouse=True)
def clean_registry():
    default_router._procedures.clear()
    yield
    default_router._procedures.clear()


def _pyrpc_command() -> list[str]:
    """Absolute launch command for the installed console script."""
    found = shutil.which("pyrpc")
    if found:
        return [found]
    candidate = Path(sys.executable).parent / "pyrpc"
    if candidate.is_file():
        return [str(candidate)]
    pytest.fail("pyrpc console script not found on PATH or next to sys.executable")


def _launch(project: Path) -> subprocess.Popen:
    return subprocess.Popen(
        [*_pyrpc_command(), "mcp"],
        cwd=project,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )


def _send(proc: subprocess.Popen, msg: dict) -> None:
    assert proc.stdin is not None
    proc.stdin.write(json.dumps(msg) + "\n")
    proc.stdin.flush()


def _recv(proc: subprocess.Popen) -> dict:
    """Read one line; every stdout byte must be protocol JSON."""
    line = proc.stdout.readline()  # type: ignore[union-attr]
    assert line.strip(), "server closed stdout before responding"
    return json.loads(line)


def test_stdio_handshake_stdout_purity_and_clean_exit(tmp_path):
    root, _ = make_project(tmp_path / f"stdio_{uuid.uuid4().hex[:8]}")
    proc = _launch(root)
    try:
        _send(
            proc,
            {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2025-06-18",
                    "capabilities": {},
                    "clientInfo": {"name": "pytest", "version": "0"},
                },
            },
        )
        init = _recv(proc)
        info = init["result"]["serverInfo"]
        assert info["name"] == "pyrpc"
        assert info["version"]

        _send(proc, {"jsonrpc": "2.0", "method": "notifications/initialized"})

        _send(proc, {"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
        tools = _recv(proc)["result"]["tools"]
        assert {t["name"] for t in tools} == {
            "introspect_project",
            "check_call",
            "run_codegen",
        }
        annotations = {t["name"]: t.get("annotations") for t in tools}
        assert annotations["introspect_project"]["readOnlyHint"] is True
        assert annotations["run_codegen"]["readOnlyHint"] is False

        _send(
            proc,
            {
                "jsonrpc": "2.0",
                "id": 3,
                "method": "tools/call",
                "params": {"name": "introspect_project", "arguments": {}},
            },
        )
        call = _recv(proc)
        data = call["result"]["structuredContent"]
        assert data["framework"] == "fastapi"
        assert data["procedure_count"] >= 3

        proc.stdin.close()
    finally:
        code = proc.wait(timeout=30)
    # stdout carried only protocol frames (every line parsed above); closing
    # stdin ends the server cleanly like a well-behaved stdio server.
    assert code == 0
    err = proc.stderr.read() if proc.stderr else ""
    assert "Traceback" not in err


def test_official_client_over_stdio(tmp_path):
    root, module = make_project(tmp_path / f"client_{uuid.uuid4().hex[:8]}")
    params = StdioServerParameters(
        command=_pyrpc_command()[0],
        args=["mcp"],
        cwd=str(root),
    )
    async def scenario():
        async with Client(params) as client:
            result = await client.call_tool("introspect_project", {})
            assert not result.is_error
            data = result.structured_content
            assert data["framework"] == "fastapi"
            assert data["entrypoint"] == f"{module}:app"

            check = await client.call_tool(
                "check_call",
                {"procedure": "get_post", "args": {"id": "bad"}},
            )
            assert check.structured_content["valid"] is False

    import anyio

    anyio.run(scenario)


def test_mcp_command_without_dependency(monkeypatch):
    """Without the optional extra, the CLI must fail loudly on stderr."""
    from pyrpc_core.cli import app
    from typer.testing import CliRunner

    monkeypatch.setitem(sys.modules, "mcp", None)
    # Submodules may already be cached by earlier tests; block them all.
    for name in [
        key
        for key in list(sys.modules)
        if key.startswith("mcp.")
    ]:
        monkeypatch.setitem(sys.modules, name, None)
    result = CliRunner().invoke(app, ["mcp"])
    assert result.exit_code == 2
    combined = (result.output or "") + (getattr(result, "stderr", "") or "")
    assert "pyrpc-core[mcp]" in combined


def test_stdio_no_config_fails_with_remediation_not_traceback(tmp_path):
    empty = tmp_path / f"noconf_{uuid.uuid4().hex[:8]}"
    empty.mkdir()
    proc = _launch(empty)
    try:
        _send(
            proc,
            {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2025-06-18",
                    "capabilities": {},
                    "clientInfo": {"name": "pytest", "version": "0"},
                },
            },
        )
        _recv(proc)
        _send(proc, {"jsonrpc": "2.0", "method": "notifications/initialized"})
        _send(
            proc,
            {
                "jsonrpc": "2.0",
                "id": 2,
                "method": "tools/call",
                "params": {"name": "introspect_project", "arguments": {}},
            },
        )
        response = _recv(proc)
    finally:
        proc.stdin.close()
        proc.wait(timeout=30)
    result = response["result"]
    assert result["isError"] is True
    text = result["content"][0]["text"]
    assert "No pyrpc.json" in text
    assert "'pyrpc init'" in text
