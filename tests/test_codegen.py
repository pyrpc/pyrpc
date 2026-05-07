import pytest
from pyrpc_server import rpc, default_registry
from pyrpc_server_codegen import generate_typescript_client

@pytest.fixture(autouse=True)
def clear_registry():
    default_registry._procedures.clear()

def test_generate_typescript_client():
    @rpc
    def add(a: int, b: int) -> int:
        """Add two numbers."""
        return a + b
    
    content = generate_typescript_client(default_registry)
    
    assert "export class PyRPCClient" in content
    assert "async add(a: any, b: any): Promise<any>" in content
    assert 'return this.execute("add", {' in content
    assert '"a": a,' in content
    assert '"b": b' in content

def test_generate_typescript_client_empty():
    content = generate_typescript_client(default_registry)
    assert "class PyRPCClient" in content
    # Should not have any methods other than constructor and execute
    assert "async " not in content.split("private async execute")[1]
