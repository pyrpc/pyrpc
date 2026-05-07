import pytest
from pydantic import BaseModel
from pyrpc import rpc, default_registry, get_procedure_schema, get_registry_schema

@pytest.fixture(autouse=True)
def clear_registry():
    default_registry._procedures.clear()

class User(BaseModel):
    id: int
    name: str

def test_get_procedure_schema_simple():
    def add(a: int, b: int = 0) -> int:
        """Add two numbers."""
        return a + b
    
    schema = get_procedure_schema(add)
    
    assert schema.name == "add"
    assert schema.doc == "Add two numbers."
    assert len(schema.parameters) == 2
    
    # Param 'a'
    assert schema.parameters[0].name == "a"
    assert "integer" in schema.parameters[0].schema_["type"]
    assert schema.parameters[0].required is True
    
    # Param 'b'
    assert schema.parameters[1].name == "b"
    assert schema.parameters[1].required is False
    assert schema.parameters[1].default == 0
    
    # Return type
    assert "integer" in schema.return_schema["type"]

def test_get_procedure_schema_complex():
    @rpc
    def get_user(user_id: int) -> User:
        return User(id=user_id, name="Test")
    
    schema = get_procedure_schema(get_user)
    
    assert schema.name == "get_user"
    assert schema.return_schema["type"] == "object"
    assert "id" in schema.return_schema["properties"]
    assert "name" in schema.return_schema["properties"]

def test_get_registry_schema():
    @rpc
    def ping():
        return "pong"
    
    @rpc
    def greet(name: str):
        return f"Hello {name}"
    
    registry_schema = get_registry_schema(default_registry)
    
    assert "ping" in registry_schema
    assert "greet" in registry_schema
    assert len(registry_schema) == 2
    assert registry_schema["ping"].name == "ping"
    assert registry_schema["greet"].parameters[0].name == "name"
