import pytest
from typer.testing import CliRunner
from pyrpc_codegen.main import app
from pyrpc import rpc, default_registry
import unittest.mock as mock

runner = CliRunner()

@pytest.fixture(autouse=True)
def clear_registry():
    default_registry._procedures.clear()

def test_cli_version():
    result = runner.invoke(app, ["version"])
    assert result.exit_code == 0
    assert "pyRPC version" in result.output

def test_cli_inspect_empty():
    # We need a module that can be imported. Let's use 'pyrpc.core.models' as it doesn't have RPCs usually
    result = runner.invoke(app, ["inspect", "pyrpc.core.models"])
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

def test_cli_codegen():
    @rpc
    def add(a: int): return a
    
    with mock.patch("pyrpc_codegen.main._import_module"):
        with mock.patch("pyrpc_codegen.main.save_typescript_client") as mock_save:
            result = runner.invoke(app, ["codegen", "-m", "any", "-o", "test.ts"])
            assert result.exit_code == 0
            assert "Successfully generated test.ts" in result.output
            mock_save.assert_called_once()

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
