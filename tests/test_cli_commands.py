import json
import os
import tempfile
import unittest.mock as mock

import pytest
from pyrpc_core import default_router, rpc
from pyrpc_cli.main import app
from typer.testing import CliRunner

runner = CliRunner()

@pytest.fixture(autouse=True)
def clear_registry():
    default_router._procedures.clear()

def test_cli_version():
    result = runner.invoke(app, ["version"])
    assert result.exit_code == 0
    assert "pyRPC version" in result.output

def test_cli_inspect_empty():
    result = runner.invoke(app, ["inspect", "pyrpc_core.core.models"])
    assert result.exit_code == 0
    assert "No procedures found" in result.output

def test_cli_inspect_with_procs():
    @rpc
    def test_proc(x: int):
        return x

    with mock.patch("pyrpc_cli.main._import_module"):
        result = runner.invoke(app, ["inspect", "anything"])
        assert result.exit_code == 0
        assert "test_proc" in result.output
        assert "x: <class 'int'>" in result.output

def test_cli_codegen_url():
    schemas = {"add": {"name": "add", "parameters": [], "return_type": "int", "return_schema": {}, "doc": ""}}
    with mock.patch("pyrpc_cli.main._resolve_source") as mock_resolve:
        mock_resolve.return_value = schemas
        with mock.patch("pyrpc_cli.main.save_typescript_client") as mock_save:
            result = runner.invoke(app, ["codegen", "http://localhost:8000"])
            assert result.exit_code == 0
            assert "Types written to" in result.output
            mock_save.assert_called_once_with(schemas, mock.ANY)

def test_cli_codegen_file():
    schemas = {
        "greet": {
            "name": "greet",
            "doc": "Say hello",
            "parameters": [
                {"name": "name", "type": "<class 'str'>", "required": True, "default": None}
            ],
            "return_type": "<class 'str'>",
        }
    }

    with mock.patch("pyrpc_cli.main.save_typescript_client") as mock_save:
        with tempfile.TemporaryDirectory() as tmpdir:
            schema_file = os.path.join(tmpdir, "schema.json")
            with open(schema_file, "w") as f:
                json.dump(schemas, f)

            result = runner.invoke(app, ["codegen", schema_file])

            assert result.exit_code == 0
            assert "Types written to" in result.output
            mock_save.assert_called_once()

def test_cli_codegen_module():
    schemas = {"add": {"name": "add", "parameters": [], "return_type": "int", "return_schema": {}, "doc": ""}}
    with mock.patch("pyrpc_cli.main._resolve_source") as mock_resolve:
        mock_resolve.return_value = schemas
        with mock.patch("pyrpc_cli.main.save_typescript_client") as mock_save:
            result = runner.invoke(app, ["codegen", "app.main"])
            assert result.exit_code == 0
            assert "Types written to" in result.output
            mock_save.assert_called_once_with(schemas, mock.ANY)

def test_cli_pull():
    @rpc
    def add(a: int, b: int) -> int:
        """Add two numbers."""
        return a + b

    with tempfile.TemporaryDirectory() as tmpdir:
        output_file = os.path.join(tmpdir, "schema.json")

        with mock.patch("pyrpc_cli.main._import_module"):
            result = runner.invoke(app, ["pull", "any_module", "-o", output_file])

        assert result.exit_code == 0
        assert "Schema extracted" in result.output
        assert os.path.exists(output_file)
        with open(output_file) as f:
            data = json.load(f)
        assert "add" in data
        assert data["add"]["doc"] == "Add two numbers."
        assert "return_schema" in data["add"]
        assert data["add"]["parameters"][0]["name"] == "a"
        assert "schema" in data["add"]["parameters"][0]

def test_cli_serve():
    with mock.patch("pyrpc_cli.main._import_module"):
        with mock.patch("pyrpc_core.transport.asgi.PyRPCAsgiApp") as mock_app_cls:
            mock_app = mock.MagicMock()
            mock_app_cls.return_value = mock_app
            with mock.patch("uvicorn.run") as mock_run:
                result = runner.invoke(app, ["serve", "my_module", "--port", "9000"])
                assert result.exit_code == 0
                assert "Starting pyRPC server" in result.output
                mock_run.assert_called_once()
                args, kwargs = mock_run.call_args
                assert kwargs["port"] == 9000

def test_cli_dev_types_only():
    with mock.patch("pyrpc_cli.main.get_registry_schema") as mock_get:
        mock_get.return_value = {}
        with mock.patch("pyrpc_cli.main.save_typescript_client"):
            with mock.patch("pyrpc_cli.main.watch") as mock_watch:
                mock_watch.return_value = []
                with mock.patch("builtins.input", return_value="exit"):
                    result = runner.invoke(app, ["dev", "my_module", "--types-only"])
                    assert result.exit_code == 0

def test_cli_dev():
    with mock.patch("pyrpc_cli.main.get_registry_schema") as mock_get:
        mock_get.return_value = {}
        with mock.patch("pyrpc_cli.main.save_typescript_client"):
            with mock.patch("pyrpc_cli.main.subprocess"):
                with mock.patch("pyrpc_cli.main.watch") as mock_watch:
                    mock_watch.return_value = []
                    with mock.patch("builtins.input", return_value="exit"):
                        result = runner.invoke(app, ["dev", "my_module"])
                        assert result.exit_code == 0

def test_cli_shell_help():
    with mock.patch("pyrpc_cli.main._fetch_schema") as mock_fetch:
        mock_fetch.return_value = {"add": {"name": "add", "parameters": [], "return_type": "int", "doc": ""}}
        with mock.patch("builtins.input", side_effect=["help()", "exit"]):
            result = runner.invoke(app, ["shell", "http://localhost:8000"])
            assert result.exit_code == 0
            assert "Available procedures" in result.output

def test_cli_shell_inspect():
    with mock.patch("pyrpc_cli.main._fetch_schema") as mock_fetch:
        mock_fetch.return_value = {"add": {"name": "add", "parameters": [], "return_type": "int", "doc": ""}}
        with mock.patch("builtins.input", side_effect=["inspect()", "exit"]):
            result = runner.invoke(app, ["shell", "http://localhost:8000"])
            assert result.exit_code == 0
            assert "add" in result.output


def test_dev_no_module_no_config():
    with mock.patch("pyrpc_cli.main._ensure_config", return_value=None):
        result = runner.invoke(app, ["dev"])
    assert result.exit_code != 0
    assert "No module specified" in result.output


def test_dev_reconfigure_flag_help():
    result = runner.invoke(app, ["dev", "--help"])
    assert result.exit_code == 0
    assert "--reconfigure" in result.output


def test_parse_entry_module_only():
    from pyrpc_cli.main import _parse_entry
    module, app_var = _parse_entry("app.main")
    assert module == "app.main"
    assert app_var is None


def test_parse_entry_with_app():
    from pyrpc_cli.main import _parse_entry
    module, app_var = _parse_entry("app.main:app")
    assert module == "app.main"
    assert app_var == "app"


def test_parse_entry_complex():
    from pyrpc_cli.main import _parse_entry
    module, app_var = _parse_entry("my_package.submodule:create_app()")
    assert module == "my_package.submodule"
    assert app_var == "create_app()"


def test_read_config_no_pyproject():
    from pyrpc_cli.main import _read_pyrpc_config
    config = _read_pyrpc_config()
    assert config is None


def test_write_and_read_config(tmp_path):
    from pyrpc_cli.main import _read_pyrpc_config, _write_pyrpc_config

    pyproject = tmp_path / "pyproject.toml"
    pyproject.write_text("[project]\nname = \"test\"\nversion = \"0.1.0\"\n")

    cwd = os.getcwd()
    os.chdir(str(tmp_path))
    try:
        ok = _write_pyrpc_config({"framework": "fastapi", "entry": "app.main:app"})
        assert ok

        config = _read_pyrpc_config()
        assert config["framework"] == "fastapi"
        assert config["entry"] == "app.main:app"

        content = pyproject.read_text()
        assert "[tool.pyrpc]" in content
        assert 'framework = "fastapi"' in content
        assert 'entry = "app.main:app"' in content
    finally:
        os.chdir(cwd)
