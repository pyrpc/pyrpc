import json
import os
import re
import tempfile
import unittest.mock as mock

import pytest
from pyrpc_core import default_router, rpc
from pyrpc_core.cli import app
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

    with mock.patch("pyrpc_core.cli._import_module"):
        result = runner.invoke(app, ["inspect", "anything"])
        assert result.exit_code == 0
        assert "test_proc" in result.output
        assert "x: <class 'int'>" in result.output

def test_cli_codegen_url():
    schemas = {"add": {"name": "add", "parameters": [], "return_type": "int", "return_schema": {}, "doc": ""}}
    with mock.patch("pyrpc_core.cli._resolve_source") as mock_resolve:
        mock_resolve.return_value = schemas
        with mock.patch("pyrpc_codegen.save_typescript_client") as mock_save:
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

    with mock.patch("pyrpc_codegen.save_typescript_client") as mock_save:
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
    with mock.patch("pyrpc_core.cli._resolve_source") as mock_resolve:
        mock_resolve.return_value = schemas
        with mock.patch("pyrpc_codegen.save_typescript_client") as mock_save:
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

        with mock.patch("pyrpc_core.cli._import_module"):
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
    with mock.patch("pyrpc_core.cli._import_module"):
        with mock.patch("pyrpc_core.transport.asgi.PyRPCAsgiApp") as mock_app_cls:
            mock_app = mock.MagicMock()
            mock_app_cls.return_value = mock_app
            with mock.patch("uvicorn.run") as mock_run:
                result = runner.invoke(app, ["serve", "my_module", "--port", "9000"])
                assert result.exit_code == 0
                assert "pyRPC server" in result.output
                mock_run.assert_called_once()
                args, kwargs = mock_run.call_args
                assert kwargs["port"] == 9000

def test_cli_dev_types_only():
    with mock.patch("pyrpc_core.get_registry_schema") as mock_get:
        mock_get.return_value = {}
        with mock.patch("pyrpc_codegen.save_typescript_client"):
            with mock.patch("pyrpc_core.cli.watch") as mock_watch:
                mock_watch.return_value = []
                with mock.patch("builtins.input", return_value="exit"):
                    result = runner.invoke(app, ["dev", "my_module", "--types-only"])
                    assert result.exit_code == 0

def test_cli_dev():
    with mock.patch("pyrpc_core.get_registry_schema") as mock_get:
        mock_get.return_value = {}
        with mock.patch("pyrpc_codegen.save_typescript_client"):
            with mock.patch("pyrpc_core.cli.subprocess"):
                with mock.patch("pyrpc_core.cli.watch") as mock_watch:
                    mock_watch.return_value = []
                    with mock.patch("builtins.input", return_value="exit"):
                        result = runner.invoke(app, ["dev", "my_module"])
                        assert result.exit_code == 0

def test_dev_no_module_no_config():
    with mock.patch("pyrpc_core.cli._ensure_config", return_value=None):
        result = runner.invoke(app, ["dev"])
    assert result.exit_code == 0
    assert "Setup cancelled" in result.output


def _strip_ansi(text: str) -> str:
    return re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', text)


def test_dev_flags_in_help():
    result = runner.invoke(app, ["dev", "--help"])
    assert result.exit_code == 0
    output = _strip_ansi(result.output)
    assert "--reconfigure" in output
    assert "--framework" in output
    assert "--entry" in output
    assert "--client-root" in output


# ── Integration: dev with CLI overrides ─────────────────────

def test_dev_with_framework_flag_writes_config(tmp_path):
    from pyrpc_core.cli import CONFIG_FILE
    cwd = os.getcwd()
    os.chdir(str(tmp_path))
    try:
        cfg = tmp_path / CONFIG_FILE
        cfg.write_text(json.dumps({"framework": "fastapi", "entrypoint": "my_module", "client_root": "../frontend", "distribution": "workspace"}))
        os.makedirs(tmp_path.parent / "frontend", exist_ok=True)
        with mock.patch("pyrpc_core.cli._read_pyrpc_config", return_value={"framework": "fastapi", "entrypoint": "my_module", "client_root": "../frontend", "distribution": "workspace"}):
            with mock.patch("pyrpc_core.cli._find_pyrpc_json", return_value=cfg):
                with mock.patch("pyrpc_core.get_registry_schema", return_value={}):
                    with mock.patch("pyrpc_codegen.save_typescript_client"):
                        with mock.patch("pyrpc_core.cli.subprocess"):
                            with mock.patch("pyrpc_core.cli.watch", return_value=[]):
                                with mock.patch("builtins.input", return_value="exit"):
                                    runner.invoke(app, ["dev", "--framework", "flask"])
        written = json.loads(cfg.read_text())
        assert written["framework"] == "flask"
        assert written["entrypoint"] == "my_module"
    finally:
        os.chdir(cwd)


def test_dev_with_entry_flag_writes_config(tmp_path):
    from pyrpc_core.cli import CONFIG_FILE
    cwd = os.getcwd()
    os.chdir(str(tmp_path))
    try:
        cfg = tmp_path / CONFIG_FILE
        cfg.write_text(json.dumps({"framework": "fastapi", "entrypoint": "old_module", "client_root": "../frontend", "distribution": "workspace"}))
        os.makedirs(tmp_path.parent / "frontend", exist_ok=True)
        with mock.patch("pyrpc_core.cli._read_pyrpc_config", return_value={"framework": "fastapi", "entrypoint": "old_module", "client_root": "../frontend", "distribution": "workspace"}):
            with mock.patch("pyrpc_core.cli._find_pyrpc_json", return_value=cfg):
                with mock.patch("pyrpc_core.get_registry_schema", return_value={}):
                    with mock.patch("pyrpc_codegen.save_typescript_client"):
                        with mock.patch("pyrpc_core.cli.subprocess"):
                            with mock.patch("pyrpc_core.cli.watch", return_value=[]):
                                with mock.patch("builtins.input", return_value="exit"):
                                    runner.invoke(app, ["dev", "--entry", "new_module"])
        written = json.loads(cfg.read_text())
        assert written["entrypoint"] == "new_module"
    finally:
        os.chdir(cwd)


def test_dev_with_client_root_flag_writes_config(tmp_path):
    from pyrpc_core.cli import CONFIG_FILE
    cwd = os.getcwd()
    os.chdir(str(tmp_path))
    try:
        cfg = tmp_path / CONFIG_FILE
        cfg.write_text(json.dumps({"framework": "fastapi", "entrypoint": "my_module", "client_root": "../old-client", "distribution": "workspace"}))
        os.makedirs(tmp_path.parent / "new-client", exist_ok=True)
        with mock.patch("pyrpc_core.cli._read_pyrpc_config", return_value={"framework": "fastapi", "entrypoint": "my_module", "client_root": "../old-client", "distribution": "workspace"}):
            with mock.patch("pyrpc_core.cli._find_pyrpc_json", return_value=cfg):
                with mock.patch("pyrpc_core.get_registry_schema", return_value={}):
                    with mock.patch("pyrpc_codegen.save_typescript_client"):
                        with mock.patch("pyrpc_core.cli.subprocess"):
                            with mock.patch("pyrpc_core.cli.watch", return_value=[]):
                                with mock.patch("pyrpc_core.cli._handle_migration") as mock_migrate:
                                    with mock.patch("builtins.input", return_value="exit"):
                                        runner.invoke(app, ["dev", "--client-root", "../new-client"])
        written = json.loads(cfg.read_text())
        assert written["client_root"] == "../new-client"
        mock_migrate.assert_called_once()
    finally:
        os.chdir(cwd)


def test_codegen_writes_actual_file(tmp_path):
    schemas = {
        "multiply": {
            "name": "multiply",
            "doc": "",
            "parameters": [
                {"name": "a", "type": "<class 'int'>", "required": True, "default": None}
            ],
            "return_type": "<class 'int'>",
        }
    }
    schema_file = tmp_path / "schema.json"
    schema_file.write_text(json.dumps(schemas))
    from pyrpc_codegen import save_typescript_client
    out = os.path.join(str(tmp_path), "output.ts")
    save_typescript_client(schemas, out)
    assert os.path.isfile(out)
    content = schema_file.parent / "output.ts"
    assert "multiply" in content.read_text()


def test_codegen_cli_writes_to_disk(tmp_path):
    schemas = {
        "divide": {
            "name": "divide",
            "doc": "",
            "parameters": [],
            "return_type": "<class 'float'>",
        }
    }
    schema_file = tmp_path / "schema.json"
    schema_file.write_text(json.dumps(schemas))
    cwd = os.getcwd()
    os.chdir(str(tmp_path))
    try:
        result = runner.invoke(app, ["codegen", str(schema_file)])
        assert result.exit_code == 0
        generated = tmp_path / "node_modules/@pyrpc/types/src/index.ts"
        assert generated.exists()
        assert "divide" in generated.read_text()
    finally:
        os.chdir(cwd)


def test_parse_entry_module_only():
    from pyrpc_core.cli import _parse_entry
    module, app_var = _parse_entry("app.main")
    assert module == "app.main"
    assert app_var is None


def test_parse_entry_with_app():
    from pyrpc_core.cli import _parse_entry
    module, app_var = _parse_entry("app.main:app")
    assert module == "app.main"
    assert app_var == "app"


def test_parse_entry_complex():
    from pyrpc_core.cli import _parse_entry
    module, app_var = _parse_entry("my_package.submodule:create_app()")
    assert module == "my_package.submodule"
    assert app_var == "create_app()"


def test_read_config_no_pyrpc_json():
    from pyrpc_core.cli import _read_pyrpc_config
    config = _read_pyrpc_config()
    assert config is None


def test_write_and_read_config(tmp_path):
    from pyrpc_core.cli import _read_pyrpc_config, _write_pyrpc_config, CONFIG_FILE, CONFIG_VERSION

    cwd = os.getcwd()
    os.chdir(str(tmp_path))
    try:
        ok = _write_pyrpc_config({"framework": "fastapi", "entrypoint": "app.main:app", "client_root": "../frontend"})
        assert ok

        config = _read_pyrpc_config()
        assert config["framework"] == "fastapi"
        assert config["entrypoint"] == "app.main:app"
        assert config["client_root"] == "../frontend"
        assert config["version"] == CONFIG_VERSION

        pyrpc_json = tmp_path / CONFIG_FILE
        assert pyrpc_json.exists()
    finally:
        os.chdir(cwd)
