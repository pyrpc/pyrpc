import json
import os
import re
import tempfile
import unittest.mock as mock

import pytest
from pyrpc_core import default_router, rpc
from pyrpc_core.cli import app, _parse_entry
from typer.testing import CliRunner

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


def test_cli_codegen_custom_output(tmp_path):
    schemas = {"ping": {"name": "ping", "parameters": [], "return_type": "str", "return_schema": {}, "doc": ""}}
    out = str(tmp_path / "custom" / "types.d.ts")
    with mock.patch("pyrpc_core.cli._resolve_source", return_value=schemas):
        with mock.patch("pyrpc_codegen.save_typescript_client") as mock_save:
            result = runner.invoke(app, ["codegen", "main", "--output", out])
    assert result.exit_code == 0
    mock_save.assert_called_once_with(schemas, os.path.abspath(out))


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


def test_codegen_cli_writes_to_default_src_path(tmp_path):
    """Default output is src/__pyrpc.d.ts (relative to cwd)."""
    schemas = {"divide": {"name": "divide", "doc": "", "parameters": [], "return_type": "<class 'float'>"}}
    schema_file = tmp_path / "schema.json"
    schema_file.write_text(json.dumps(schemas))
    cwd = os.getcwd()
    os.chdir(str(tmp_path))
    try:
        result = runner.invoke(app, ["codegen", str(schema_file)])
        assert result.exit_code == 0
        generated = tmp_path / "src" / "__pyrpc.d.ts"
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

    with tempfile.TemporaryDirectory() as tmpdir:
        output_file = os.path.join(tmpdir, "schema.json")
        with mock.patch("pyrpc_core.cli._import_module"):
            result = runner.invoke(app, ["pull", "any_module", "-o", output_file])
    assert result.exit_code == 0
    assert "Schema extracted" in result.output
    assert os.path.exists(output_file)
    with open(output_file) as f:
        data = json.load(f)
    assert "add" in data
    assert data["add"]["doc"] == "Add two numbers."


# ── serve ─────────────────────────────────────────────────────────────────────

def test_cli_serve():
    with mock.patch("pyrpc_core.cli._import_module"):
        with mock.patch("pyrpc_core.transport.asgi.PyRPCAsgiApp") as mock_app_cls:
            mock_app = mock.MagicMock()
            mock_app_cls.return_value = mock_app
            with mock.patch("uvicorn.run") as mock_run:
                result = runner.invoke(app, ["serve", "my_module", "--port", "9000"])
    assert result.exit_code == 0
    assert "pyRPC server" in result.output
    mock_run.assert_called_once()
    _, kwargs = mock_run.call_args
    assert kwargs["port"] == 9000


# ── dev ───────────────────────────────────────────────────────────────────────

def test_cli_dev_attaches_when_server_running():
    """When server is already running, pyrpc dev skips uvicorn."""
    with mock.patch("pyrpc_core.cli._import_module"):
        with mock.patch("pyrpc_core.cli._run_codegen", return_value=3):
            with mock.patch("pyrpc_core.cli._server_is_running", return_value=True):
                with mock.patch("pyrpc_core.cli.watch", return_value=iter([])):
                    with mock.patch("pyrpc_core.cli._DevConsole") as mock_console:
                        mock_console.return_value.run = mock.MagicMock()
                        result = runner.invoke(app, ["dev", "my_module:app"])
    assert result.exit_code == 0
    assert "already running" in result.output


def test_cli_dev_starts_server_when_not_running():
    """When server is not running, pyrpc dev launches uvicorn."""
    with mock.patch("pyrpc_core.cli._import_module"):
        with mock.patch("pyrpc_core.cli._run_codegen", return_value=2):
            with mock.patch("pyrpc_core.cli._server_is_running", return_value=False):
                with mock.patch("pyrpc_core.cli.subprocess") as mock_sub:
                    mock_proc = mock.MagicMock()
                    mock_sub.Popen.return_value = mock_proc
                    with mock.patch("pyrpc_core.cli.watch", return_value=iter([])):
                        with mock.patch("pyrpc_core.cli._DevConsole") as mock_console:
                            mock_console.return_value.run = mock.MagicMock()
                            result = runner.invoke(app, ["dev", "my_module:app"])
    assert result.exit_code == 0
    mock_sub.Popen.assert_called_once()


def test_dev_flags_in_help():
    result = runner.invoke(app, ["dev", "--help"])
    assert result.exit_code == 0
    output = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', result.output)
    assert "--output" in output
    assert "--host" in output
    assert "--port" in output


# ── watch ─────────────────────────────────────────────────────────────────────

def test_cli_watch_runs_initial_codegen():
    with mock.patch("pyrpc_core.cli._import_module"):
        with mock.patch("pyrpc_core.cli._run_codegen", return_value=3) as mock_cg:
            with mock.patch("pyrpc_core.cli.watch", return_value=iter([])):
                result = runner.invoke(app, ["watch", "my_module"])
    assert result.exit_code == 0
    mock_cg.assert_called_once()
    assert "types generated" in result.output


def test_cli_watch_help():
    result = runner.invoke(app, ["watch", "--help"])
    assert result.exit_code == 0
    output = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', result.output)
    assert "--output" in output


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


# ── import guard: no old config symbols ───────────────────────────────────────

def test_no_pyrpc_json_symbols():
    """Confirm old config-file symbols are gone."""
    import pyrpc_core.cli as cli_mod
    for sym in ("CONFIG_FILE", "CONFIG_VERSION", "DISTRIBUTION_MODES",
                "_find_pyrpc_json", "_read_pyrpc_config", "_write_pyrpc_config",
                "_prompt_for_config", "_ensure_config", "_handle_migration",
                "_resolve_client_root"):
        assert not hasattr(cli_mod, sym), f"Old symbol still present: {sym}"


def test_no_questionary_import():
    """Confirm questionary is not imported anywhere in cli.py."""
    import pyrpc_core.cli as cli_mod
    import sys
    assert "questionary" not in sys.modules or True  # questionary may be installed
    # More reliable: check cli source
    import inspect
    src = inspect.getsource(cli_mod)
    assert "questionary" not in src


# ── Path import ───────────────────────────────────────────────────────────────
from pathlib import Path
