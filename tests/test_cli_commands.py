import json
import os
import tempfile
import pytest
from typer.testing import CliRunner
from pyrpc_codegen.main import app
from pyrpc_core import rpc, default_router
import unittest.mock as mock

runner = CliRunner()

@pytest.fixture(autouse=True)
def clear_registry():
    default_router._procedures.clear()

def test_cli_version():
    result = runner.invoke(app, ["version"])
    assert result.exit_code == 0
    assert "pyRPC version" in result.output

def test_cli_inspect_empty():
    # We need a module that can be imported. Let's use 'pyrpc.core.models' as it doesn't have RPCs usually
    result = runner.invoke(app, ["inspect", "pyrpc_core.core.models"])
    assert result.exit_code == 0
    assert "No procedures found" in result.output

def test_cli_inspect_with_procs():
    @rpc
    def test_proc(x: int):
        return x
    
    # We need to mock _import_module because 'tests.test_cli_commands' might not be importable easily by name here
    with mock.patch("pyrpc_codegen.main._import_module"):
        result = runner.invoke(app, ["inspect", "anything"])
        assert result.exit_code == 0
        assert "test_proc" in result.output
        assert "x: <class 'int'>" in result.output

def test_cli_codegen_url():
    with mock.patch("pyrpc_codegen.main._load_schema") as mock_load:
        mock_load.return_value = {"add": {"name": "add", "parameters": [], "return_type": "int", "return_schema": {}, "doc": ""}}
        with mock.patch("pyrpc_codegen.main.save_typescript_client") as mock_save:
            result = runner.invoke(app, ["codegen", "http://localhost:8000", "-o", "test.ts"])
            assert result.exit_code == 0
            assert "Types written to test.ts" in result.output
            mock_save.assert_called_once()

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

    with tempfile.TemporaryDirectory() as tmpdir:
        schema_file = os.path.join(tmpdir, "schema.json")
        with open(schema_file, "w") as f:
            json.dump(schemas, f)

        output_file = os.path.join(tmpdir, "types.ts")
        result = runner.invoke(app, ["codegen", schema_file, "-o", output_file])

        assert result.exit_code == 0
        assert "Types written to" in result.output
        assert os.path.exists(output_file)
        with open(output_file) as f:
            content = f.read()
        assert "export interface Types" in content
        assert "greet(name: string): Promise<string>;" in content

def test_cli_pull():
    @rpc
    def add(a: int, b: int) -> int:
        """Add two numbers."""
        return a + b

    with tempfile.TemporaryDirectory() as tmpdir:
        output_file = os.path.join(tmpdir, "schema.json")

        with mock.patch("pyrpc_codegen.main._import_module"):
            result = runner.invoke(app, ["pull", "any_module", "-o", output_file])

        assert result.exit_code == 0
        assert "Schema extracted" in result.output
        assert os.path.exists(output_file)
        with open(output_file) as f:
            data = json.load(f)
        assert "add" in data
        assert data["add"]["doc"] == "Add two numbers."

def test_cli_serve():
    with mock.patch("pyrpc_codegen.main._import_module"):
        with mock.patch("uvicorn.run") as mock_run:

            result = runner.invoke(app, ["serve", "my_module", "--port", "9000"])
            assert result.exit_code == 0
            assert "Starting pyRPC server" in result.output
            mock_run.assert_called_once()
            # Check port was passed
            args, kwargs = mock_run.call_args
            assert kwargs["port"] == 9000
