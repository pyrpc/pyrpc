import pytest
from pyrpc_server import rpc, default_router, get_registry_schema
from pyrpc_codegen import generate_typescript_client

@pytest.fixture(autouse=True)
def clear_registry():
    default_router._procedures.clear()

def test_generate_typescript_client():
    @rpc
    def add(a: int, b: int) -> int:
        """Add two numbers."""
        return a + b
    
    schemas = get_registry_schema(default_router)
    content = generate_typescript_client(schemas)
    
    assert "export interface Types" in content
    assert "add(a: any, b: any): Promise<any>;" in content

def test_generate_typescript_client_empty():
    schemas = get_registry_schema(default_router)
    content = generate_typescript_client(schemas)
    assert "export interface Types {" in content
