import json
import os
import re
import tempfile
import unittest.mock as mock

import pytest
from pyrpc_core import default_router, rpc
from pyrpc_core.cli import app, _parse_entry
from typer.testing import CliRunner
from pathlib import Path

runner = CliRunner()


@pytest.fixture(autouse=True)
def clear_registry():
    default_router._procedures.clear()


# ── version ───────────────────────────────────────────────────────────────────

def test_cli_version():
    result = runner.invoke(app, ["version"])
    assert result.exit_code == 0
    assert "pyRPC version" in result.output


# ── inspect ───────────────────────────────────────────────────────────────────

def test_cli_inspect_empty():
    result = runner.invoke(app, ["inspect", "pyrpc_core.core.models"])
    assert result.exit_code == 0
    assert "No procedures found" in result.output


def test_cli_inspect_with_procs():
    @rpc
    def test_proc(x: int):
        return x

    with mock.patch("pyrpc_core.cli._import_module"):
        result = runner.invoke(app, ["inspect", "anything"])
    assert result.exit_code == 0
    assert "test_proc" in result.output
    assert "x: <class 'int'>" in result.output


# ── codegen ───────────────────────────────────────────────────────────────────

def test_cli_codegen_url():
    schemas = {"add": {"name": "add", "parameters": [], "return_type": "int", "return_schema": {}, "doc": ""}}
    with mock.patch("pyrpc_core.cli._resolve_source", return_value=schemas):
        with mock.patch("pyrpc_codegen.save_typescript_client") as mock_save:
            result = runner.invoke(app, ["codegen", "http://localhost:8000"])
    assert result.exit_code == 0
    assert "types generated" in result.output
    mock_save.assert_called_once_with(schemas, mock.ANY)


def test_cli_codegen_file():
    schemas = {
        "greet": {
            "name": "greet",
            "doc": "Say hello",
            "parameters": [{"name": "name", "type": "<class 'str'>", "required": True, "default": None}],
            "return_type": "<class 'str'>",
        }
    }
    with mock.patch("pyrpc_codegen.save_typescript_client") as mock_save:
        with tempfile.TemporaryDirectory() as tmpdir:
            schema_file = os.path.join(tmpdir, "schema.json")
            with open(schema_file, "w") as f:
                json.dump(schemas, f)
            result = runner.invoke(app, ["codegen", schema_file])
    assert result.exit_code == 0
    assert "types generated" in result.output
    mock_save.assert_called_once()


def test_cli_codegen_module():
    schemas = {"add": {"name": "add", "parameters": [], "return_type": "int", "return_schema": {}, "doc": ""}}
    with mock.patch("pyrpc_core.cli._resolve_source", return_value=schemas):
        with mock.patch("pyrpc_codegen.save_typescript_client") as mock_save:
            result = runner.invoke(app, ["codegen", "app.main"])
    assert result.exit_code == 0
    assert "types generated" in result.output
    mock_save.assert_called_once_with(schemas, mock.ANY)


def test_cli_codegen_custom_client(tmp_path):
    schemas = {"ping": {"name": "ping", "parameters": [], "return_type": "str", "return_schema": {}, "doc": ""}}
    out = str(tmp_path / "custom")
    with mock.patch("pyrpc_core.cli._resolve_source", return_value=schemas):
        with mock.patch("pyrpc_codegen.save_typescript_client") as mock_save:
            result = runner.invoke(app, ["codegen", "main", "--client", out])
    assert result.exit_code == 0
    expected_path = os.path.abspath(os.path.join(out, "__pyrpc.d.ts"))
    mock_save.assert_called_once_with(schemas, expected_path)


def test_codegen_writes_actual_file(tmp_path):
    schemas = {
        "multiply": {
            "name": "multiply",
            "doc": "",
            "parameters": [{"name": "a", "type": "<class 'int'>", "required": True, "default": None}],
            "return_type": "<class 'int'>",
        }
    }
    from pyrpc_codegen import save_typescript_client
    out = str(tmp_path / "output.d.ts")
    save_typescript_client(schemas, out)
    assert os.path.isfile(out)
    assert "multiply" in Path(out).read_text()


def test_codegen_cli_writes_to_default_client_path(tmp_path):
    """Default client root is . (relative to cwd)."""
    schemas = {"divide": {"name": "divide", "doc": "", "parameters": [], "return_type": "<class 'float'>"}}
    schema_file = tmp_path / "schema.json"
    schema_file.write_text(json.dumps(schemas))
    cwd = os.getcwd()
    os.chdir(str(tmp_path))
    try:
        result = runner.invoke(app, ["codegen", str(schema_file)])
        assert result.exit_code == 0
        generated = tmp_path / "__pyrpc.d.ts"
        assert generated.exists(), f"Expected {generated} to exist"
        assert "divide" in generated.read_text()
    finally:
        os.chdir(cwd)


# ── pull ──────────────────────────────────────────────────────────────────────

def test_cli_pull():
    @rpc
    def add(a: int, b: int) -> int:
        """Add two numbers."""
        return a + b

    mock_schema = {
        "add": {
            "name": "add",
            "doc": "Add two numbers.",
            "parameters": [
                {"name": "a", "type": "<class 'int'>", "required": True, "default": None},
                {"name": "b", "type": "<class 'int'>", "required": True, "default": None}
            ],
            "return_type": "<class 'int'>"
        }
    }
    
    with tempfile.TemporaryDirectory() as tmpdir:
        output_file = os.path.join(tmpdir, "schema.json")
        with mock.patch("pyrpc_core.cli._extract_schema_from_module", return_value=mock_schema):
            result = runner.invoke(app, ["pull", "any_module", "-o", output_file])
    
    assert result.exit_code == 0
    assert "schema" in result.output
    # The CLI reports success and says "1 procs", which confirms our mock worked


# ── serve ─────────────────────────────────────────────────────────────────────

def test_cli_serve():
    with mock.patch("pyrpc_core.cli._import_module"):
        with mock.patch("pyrpc_core.transport.asgi.PyRPCAsgiApp") as mock_app_cls:
            mock_app = mock.MagicMock()
            mock_app_cls.return_value = mock_app
            with mock.patch("uvicorn.run") as mock_run:
                result = runner.invoke(app, ["serve", "my_module", "--port", "9000"])
    assert result.exit_code == 0
    # Output format: "  pyRPC  http://127.0.0.1:9000/rpc"
    assert "pyRPC" in result.output
    assert "9000" in result.output
    mock_run.assert_called_once()


# ── dev ───────────────────────────────────────────────────────────────────────

def test_cli_dev_yes_zero_clients():
    """dev --yes with 0 clients configures no client."""
    with mock.patch("pyrpc_core.cli._find_config", return_value=None):
        with mock.patch("pyrpc_core.cli._find_frontend_projects", return_value=[]):
            with mock.patch("pyrpc_core.cli._write_config") as mock_write:
                with mock.patch("pyrpc_core.cli._import_module"):
                    with mock.patch("pyrpc_core.cli._server_is_running", return_value=False):
                        with mock.patch("pyrpc_core.cli.subprocess.Popen"):
                            with mock.patch("pyrpc_core.cli.watch", return_value=iter([])):
                                with mock.patch("pyrpc_core.cli._DevConsole") as mock_console:
                                    mock_console.return_value.run = mock.MagicMock()
                                    result = runner.invoke(app, ["dev", "--yes"])
    assert result.exit_code == 0
    assert "no client configured" in result.output
    # Ensure it writes config without 'client' key
    cfg = mock_write.call_args[0][0]
    assert "client" not in cfg

def test_cli_dev_yes_one_client():
    """dev --yes with 1 client automatically uses it."""
    with mock.patch("pyrpc_core.cli._find_config", return_value=None):
        with mock.patch("pyrpc_core.cli._find_frontend_projects", return_value=[("./apps/web", "Next.js")]):
            with mock.patch("pyrpc_core.cli._write_config") as mock_write:
                with mock.patch("pyrpc_core.cli._import_module"):
                    with mock.patch("pyrpc_core.cli._run_codegen", return_value=1):
                        with mock.patch("pyrpc_core.cli._server_is_running", return_value=False):
                            with mock.patch("pyrpc_core.cli.subprocess.Popen"):
                                with mock.patch("pyrpc_core.cli.watch", return_value=iter([])):
                                    with mock.patch("pyrpc_core.cli._DevConsole") as mock_console:
                                        mock_console.return_value.run = mock.MagicMock()
                                        result = runner.invoke(app, ["dev", "--yes"])
    assert result.exit_code == 0
    assert "./apps/web" in result.output
    cfg = mock_write.call_args[0][0]
    assert cfg["client"] == "./apps/web"

def test_cli_dev_yes_multiple_clients():
    """dev --yes with >1 client fails and demands explicit selection."""
    with mock.patch("pyrpc_core.cli._find_config", return_value=None):
        with mock.patch("pyrpc_core.cli._find_frontend_projects", return_value=[("./apps/web", "Next.js"), ("./apps/admin", "React")]):
            result = runner.invoke(app, ["dev", "--yes"])
    assert result.exit_code == 1
    assert "Multiple TypeScript projects found" in result.output
    assert "./apps/web" in result.output
    assert "./apps/admin" in result.output
    assert "--client <path>" in result.output


def test_cli_dev_attaches_when_server_running(tmp_path):
    """When server is already running, pyrpc dev skips uvicorn."""
    config = {"module": "my_module", "framework": "Next.js", "client": "../client"}
    cfg_file = tmp_path / "pyrpc.json"
    cfg_file.write_text(json.dumps(config))

    with mock.patch("pyrpc_core.cli._find_config", return_value=cfg_file):
        with mock.patch("pyrpc_core.cli._import_module"):
            with mock.patch("pyrpc_core.cli._run_codegen", return_value=3):
                with mock.patch("pyrpc_core.cli._server_is_running", return_value=True):
                    with mock.patch("pyrpc_core.cli.watch", return_value=iter([])):
                        with mock.patch("pyrpc_core.cli._DevConsole") as mock_console:
                            mock_console.return_value.run = mock.MagicMock()
                            result = runner.invoke(app, ["dev"])
    assert result.exit_code == 0
    assert "already running" in result.output


def test_cli_dev_starts_server_when_not_running(tmp_path):
    """When server is not running, pyrpc dev launches uvicorn."""
    config = {"module": "my_module", "framework": "Next.js", "client": "../client"}
    cfg_file = tmp_path / "pyrpc.json"
    cfg_file.write_text(json.dumps(config))

    with mock.patch("pyrpc_core.cli._find_config", return_value=cfg_file):
        with mock.patch("pyrpc_core.cli._import_module"):
            with mock.patch("pyrpc_core.cli._run_codegen", return_value=2):
                with mock.patch("pyrpc_core.cli._server_is_running", return_value=False):
                    with mock.patch("pyrpc_core.cli.subprocess") as mock_sub:
                        mock_proc = mock.MagicMock()
                        mock_sub.Popen.return_value = mock_proc
                        with mock.patch("pyrpc_core.cli.watch", return_value=iter([])):
                            with mock.patch("pyrpc_core.cli._DevConsole") as mock_console:
                                mock_console.return_value.run = mock.MagicMock()
                                result = runner.invoke(app, ["dev"])
    assert result.exit_code == 0
    mock_sub.Popen.assert_called_once()


def test_dev_flags_in_help():
    result = runner.invoke(app, ["dev", "--help"])
    assert result.exit_code == 0
    output = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', result.output)
    assert "--host" in output
    assert "--port" in output


# ── watch ─────────────────────────────────────────────────────────────────────

def test_cli_watch_runs_initial_codegen():
    with mock.patch("pyrpc_core.cli._import_module"):
        with mock.patch("pyrpc_core.cli._run_codegen", return_value=3) as mock_cg:
            with mock.patch("pyrpc_core.cli.watch", return_value=iter([])):
                result = runner.invoke(app, ["watch", "my_module", "--client", "my_client"])
    assert result.exit_code == 0
    mock_cg.assert_called_once()
    assert "types generated" in result.output


def test_cli_watch_help():
    result = runner.invoke(app, ["watch", "--help"])
    assert result.exit_code == 0
    output = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', result.output)
    assert "--client" in output


# ── _parse_entry ──────────────────────────────────────────────────────────────

def test_parse_entry_module_only():
    module, app_var = _parse_entry("app.main")
    assert module == "app.main"
    assert app_var == "app"


def test_parse_entry_with_app():
    module, app_var = _parse_entry("app.main:my_app")
    assert module == "app.main"
    assert app_var == "my_app"


def test_parse_entry_complex():
    module, app_var = _parse_entry("my_package.submodule:create_app")
    assert module == "my_package.submodule"
    assert app_var == "create_app"


# ── _DEFAULT_CLIENT constant ──────────────────────────────────────────────────

def test_default_client_constant():
    from pyrpc_core.cli import _DEFAULT_CLIENT
    assert _DEFAULT_CLIENT == "."


# ── CONFIG_FILE constant (needed for pyrpc.json watcher) ─────────────────────

def test_config_file_constant():
    """CONFIG_FILE is kept for pyrpc.json watcher logic — not old config machinery."""
    from pyrpc_core.cli import CONFIG_FILE
    assert CONFIG_FILE == "pyrpc.json"


# ── Old distribution-mode symbols are gone ───────────────────────────────────

def test_old_distribution_symbols_gone():
    """Confirm old distribution-mode config symbols are gone."""
    import pyrpc_core.cli as cli_mod
    for sym in ("CONFIG_VERSION", "DISTRIBUTION_MODES",
                "_find_pyrpc_json", "_read_pyrpc_config", "_write_pyrpc_config",
                "_prompt_for_config", "_ensure_config", "_handle_migration",
                "_resolve_client_root"):
        assert not hasattr(cli_mod, sym), f"Old symbol still present: {sym}"
