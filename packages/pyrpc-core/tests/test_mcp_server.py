"""MCP protocol tests for the local pyRPC server (official in-memory client)."""

import json
import uuid
from collections.abc import AsyncIterator
from pathlib import Path

import pytest
from mcp import Client
from mcp_fixtures import make_project, unique_module, write_config
from pyrpc_core import default_router
from pyrpc_core.mcp_server import create_server


@pytest.fixture(autouse=True)
def clean_registry():
    default_router._procedures.clear()
    yield
    default_router._procedures.clear()


def mcp_client() -> AsyncIterator[Client]:
    # Inline async-with in each test: the anyio plugin owns the task, so an
    # async pytest fixture would be torn down in a different one.
    return Client(create_server(), raise_exceptions=True)


def new_project(
    tmp_path: Path,
    *,
    config: dict | None = None,
    module_body: str | None = None,
) -> tuple[Path, str]:
    """Write a project with a uniquely named router and return (root, module)."""
    return make_project(
        tmp_path / f"proj_{uuid.uuid4().hex[:8]}",
        config=config,
        module_body=module_body,
    )


def text_of(result) -> str:
    return "".join(block.text for block in result.content)


# ── tools/list ────────────────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_tools_list_names_and_annotations():
    async with mcp_client() as client:
        tools = (await client.list_tools()).tools
    by_name = {t.name: t for t in tools}
    assert set(by_name) == {"introspect_project", "check_call", "run_codegen"}

    assert by_name["introspect_project"].annotations.read_only_hint is True
    assert by_name["check_call"].annotations.read_only_hint is True
    assert by_name["run_codegen"].annotations.read_only_hint is False
    assert by_name["run_codegen"].annotations.idempotent_hint is True

    check = by_name["check_call"]
    props = check.input_schema["properties"]
    assert set(props) == {"procedure", "args"}
    # procedure is mandatory, args optional
    assert "procedure" in check.input_schema.get("required", [])
    assert "args" not in check.input_schema.get("required", [])


# ── introspect_project ────────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_introspect_happy_path(tmp_path, monkeypatch):
    root, module = new_project(tmp_path)
    monkeypatch.chdir(root)

    async with mcp_client() as client:
        result = await client.call_tool("introspect_project", {})
    assert not result.is_error
    data = result.structured_content

    assert data["framework"] == "fastapi"
    assert data["entrypoint"] == f"{module}:app"
    assert data["types_module"] == module
    assert [c["root"] for c in data["clients"]] == [(root / "web").as_posix()]

    by_name = {p["name"]: p for p in data["procedures"]}
    assert {"get_post", "create_post", "untyped"} <= set(by_name)
    assert by_name["get_post"]["kind"] == "query"
    assert by_name["get_post"]["doc"] == "Fetch one post by id."
    assert by_name["create_post"]["kind"] == "mutation"

    params = by_name["get_post"]["parameters"]
    assert params[0]["name"] == "id"
    assert params[0]["required"] is True
    assert params[0]["schema_"]["type"] == "integer"

    defaults = {p["name"]: p["default"] for p in by_name["create_post"]["parameters"]}
    assert json.loads(defaults["title"]) == "untitled"


@pytest.mark.anyio
async def test_introspect_without_config(tmp_path, monkeypatch):
    empty = tmp_path / f"empty_{uuid.uuid4().hex[:8]}"
    empty.mkdir()
    monkeypatch.chdir(empty)

    async with mcp_client() as client:
        result = await client.call_tool("introspect_project", {})
    assert result.is_error
    assert f"No pyrpc.json found in {empty.as_posix()}" in text_of(result)
    assert "'pyrpc init'" in text_of(result)


@pytest.mark.anyio
async def test_introspect_invalid_json(tmp_path, monkeypatch):
    root = tmp_path / f"badjson_{uuid.uuid4().hex[:8]}"
    root.mkdir()
    (root / "pyrpc.json").write_text("{not json", encoding="utf-8")
    monkeypatch.chdir(root)

    async with mcp_client() as client:
        result = await client.call_tool("introspect_project", {})
    assert result.is_error
    assert "is not valid JSON" in text_of(result)


@pytest.mark.anyio
async def test_introspect_missing_backend(tmp_path, monkeypatch):
    root = tmp_path / f"nobackend_{uuid.uuid4().hex[:8]}"
    root.mkdir()
    write_config(root, {"clients": []})
    monkeypatch.chdir(root)

    async with mcp_client() as client:
        result = await client.call_tool("introspect_project", {})
    assert result.is_error
    message = text_of(result)
    assert "no valid 'backend' section" in message
    assert "fastapi" in message  # lists valid frameworks
    assert '"backend"' in message  # shows a remediation snippet


@pytest.mark.anyio
async def test_introspect_backend_sniff_hint(tmp_path, monkeypatch):
    root = tmp_path / f"sniff_{uuid.uuid4().hex[:8]}"
    root.mkdir()
    (root / "main.py").write_text(
        "from pyrpc_fastapi import mount_fastapi\nmount_fastapi(app)\n",
        encoding="utf-8",
    )
    write_config(root, {})
    monkeypatch.chdir(root)

    async with mcp_client() as client:
        result = await client.call_tool("introspect_project", {})
    assert result.is_error
    assert "suggest framework 'fastapi'" in text_of(result)


@pytest.mark.anyio
async def test_introspect_django_requires_types_module(tmp_path, monkeypatch):
    root = tmp_path / f"dj_{uuid.uuid4().hex[:8]}"
    root.mkdir()
    manage = root / "manage.py"
    manage.write_text("# django\n", encoding="utf-8")
    write_config(
        root,
        {
            "backend": {
                "framework": "django",
                "entrypoint": manage.as_posix(),
            }
        },
    )
    monkeypatch.chdir(root)

    async with mcp_client() as client:
        result = await client.call_tool("introspect_project", {})
    assert result.is_error
    assert "types_module" in text_of(result)


@pytest.mark.anyio
async def test_introspect_broken_import(tmp_path, monkeypatch):
    root, _ = new_project(
        tmp_path,
        config={
            "backend": {"framework": "fastapi", "entrypoint": "does_not_exist:app"},
        },
    )
    monkeypatch.chdir(root)

    async with mcp_client() as client:
        result = await client.call_tool("introspect_project", {})
    assert result.is_error
    message = text_of(result)
    assert "Failed to import backend module 'does_not_exist'" in message
    assert "ModuleNotFoundError" in message


# ── check_call ────────────────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_check_call_valid(tmp_path, monkeypatch):
    root, _ = new_project(tmp_path)
    monkeypatch.chdir(root)

    async with mcp_client() as client:
        result = await client.call_tool(
            "check_call", {"procedure": "get_post", "args": {"id": 5}}
        )
    assert not result.is_error
    data = result.structured_content
    assert data["valid"] is True
    assert data["errors"] == []


@pytest.mark.anyio
async def test_check_call_invalid_argument_type(tmp_path, monkeypatch):
    root, _ = new_project(tmp_path)
    monkeypatch.chdir(root)

    async with mcp_client() as client:
        result = await client.call_tool(
            "check_call", {"procedure": "get_post", "args": {"id": "not-an-int"}}
        )
    # the tool call itself succeeded; validation failed inside it
    assert not result.is_error
    data = result.structured_content
    assert data["valid"] is False
    assert data["errors"][0]["param"] == "id"


@pytest.mark.anyio
async def test_check_call_missing_required_and_defaults(tmp_path, monkeypatch):
    root, _ = new_project(tmp_path)
    monkeypatch.chdir(root)

    async with mcp_client() as client:
        missing = await client.call_tool(
            "check_call", {"procedure": "get_post", "args": {}}
        )
        ok_default = await client.call_tool(
            "check_call", {"procedure": "create_post", "args": {}}
        )
    assert missing.structured_content["valid"] is False
    assert ok_default.structured_content["valid"] is True


@pytest.mark.anyio
async def test_check_call_unknown_procedure_lists_available(tmp_path, monkeypatch):
    root, _ = new_project(tmp_path)
    monkeypatch.chdir(root)

    async with mcp_client() as client:
        result = await client.call_tool("check_call", {"procedure": "nope", "args": {}})
    assert result.is_error
    message = text_of(result)
    assert "No procedure named 'nope'" in message
    assert "get_post" in message and "create_post" in message


@pytest.mark.anyio
async def test_check_call_never_executes(tmp_path, monkeypatch):
    sentinel = tmp_path / "side_effect.txt"
    body = (
        "from pyrpc_core import rpc\n"
        f"BOMB = {sentinel.as_posix()!r}\n"
        "@rpc.query\n"
        "def boom() -> int:\n"
        "    open(BOMB, 'w').write('executed')\n"
        "    return 1\n"
    )
    root, _ = new_project(tmp_path, module_body=body)
    monkeypatch.chdir(root)

    async with mcp_client() as client:
        result = await client.call_tool("check_call", {"procedure": "boom", "args": {}})
    assert result.structured_content["valid"] is True
    assert not sentinel.exists(), "check_call must never execute procedures"


# ── run_codegen ───────────────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_run_codegen_dry_run_writes_nothing(tmp_path, monkeypatch):
    root, _ = new_project(tmp_path)
    web = root / "web" / "__pyrpc.ts"
    monkeypatch.chdir(root)

    async with mcp_client() as client:
        result = await client.call_tool("run_codegen", {"dry_run": True})
    assert not result.is_error
    data = result.structured_content
    assert data["dry_run"] is True
    assert data["procedure_count"] >= 3
    assert data["files"][0]["status"] == "would create"
    assert not web.exists()


@pytest.mark.anyio
async def test_run_codegen_write_then_up_to_date(tmp_path, monkeypatch):
    root, _ = new_project(tmp_path)
    web = root / "web" / "__pyrpc.ts"
    monkeypatch.chdir(root)

    async with mcp_client() as client:
        created = await client.call_tool("run_codegen", {"dry_run": False})
        files = created.structured_content["files"]
        assert files[0]["status"] == "created"
        assert web.stat().st_size > 0

        again = await client.call_tool("run_codegen", {})
        assert again.structured_content["files"][0]["status"] == "up to date"

        web.write_text(web.read_text(encoding="utf-8") + "\n// drift\n", encoding="utf-8")
        drifted = await client.call_tool("run_codegen", {"dry_run": True})
        assert drifted.structured_content["files"][0]["status"] == "would update"


@pytest.mark.anyio
async def test_run_codegen_without_clients_errors(tmp_path, monkeypatch):
    name = unique_module()
    root, _ = make_project(
        tmp_path / f"noclient_{uuid.uuid4().hex[:8]}",
        config={"backend": {"framework": "fastapi", "entrypoint": f"{name}:app"}},
        module_name=name,
        with_web_dir=False,
    )
    monkeypatch.chdir(root)

    async with mcp_client() as client:
        result = await client.call_tool("run_codegen", {})
    assert result.is_error
    message = text_of(result)
    assert "'clients' section" in message
    assert '"root"' in message


@pytest.mark.anyio
async def test_run_codegen_missing_client_dir(tmp_path, monkeypatch):
    name = unique_module()
    root, _ = make_project(
        tmp_path / f"gone_{uuid.uuid4().hex[:8]}",
        config={
            "backend": {"framework": "fastapi", "entrypoint": f"{name}:app"},
            "clients": [{"framework": "Next.js", "root": "./ghost"}],
        },
        module_name=name,
        with_web_dir=False,
    )
    monkeypatch.chdir(root)

    async with mcp_client() as client:
        result = await client.call_tool("run_codegen", {})
    assert result.is_error
    message = text_of(result)
    assert "does not exist" in message
    assert "ghost" in message
