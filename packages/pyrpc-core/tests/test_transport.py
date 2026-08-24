import json

import pytest
from pydantic import BaseModel
from pyrpc_core.core.introspection import get_procedure_schema, get_registry_schema
from pyrpc_core.core.registry import Procedure, Router
from pyrpc_core.transport.asgi import PyRPCAsgiApp

# --- Introspection Tests ---

class User(BaseModel):
    id: int
    name: str

def test_procedure_introspection():
    def my_func(user: User, tags: list[str]) -> bool:
        """My docstring"""
        return True
    
    proc = Procedure(my_func)
    schema = get_procedure_schema(proc)
    assert schema.name == "my_func"
    assert schema.doc == "My docstring"
    assert schema.return_type == "<class 'bool'>"
    
    # Check parameters
    params = {p.name: p for p in schema.parameters}
    assert "user" in params
    assert params["user"].schema_["properties"]["id"]["type"] == "integer"
    assert "tags" in params
    assert params["tags"].schema_["type"] == "array"

def test_registry_introspection():
    router = Router()
    @router.rpc
    def add(a: int, b: int): pass
    
    schemas = get_registry_schema(router)
    assert "add" in schemas
    assert len(schemas["add"].parameters) == 2

# --- ASGI Transport Tests ---

@pytest.mark.asyncio
async def test_asgi_app_basic():
    router = Router()
    @router.rpc
    def hello(): return "world"
    
    app = PyRPCAsgiApp(router=router)
    
    # Mock ASGI interaction
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/rpc"
    }
    
    sent_messages = []
    
    async def mock_receive():
        return {
            "type": "http.request",
            "body": json.dumps({"id": 1, "method": "hello", "params": {}}).encode("utf-8"),
            "more_body": False
        }
        
    async def mock_send(message):
        sent_messages.append(message)
        
    await app(scope, mock_receive, mock_send)
    
    # Verify response
    # 1. Start message
    assert sent_messages[0]["type"] == "http.response.start"
    assert sent_messages[0]["status"] == 200
    
    # 2. Body message
    assert sent_messages[1]["type"] == "http.response.body"
    res_payload = json.loads(sent_messages[1]["body"].decode("utf-8"))
    assert res_payload["result"] == "world"

@pytest.mark.asyncio
async def test_asgi_app_404():
    app = PyRPCAsgiApp()
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/wrong"
    }
    
    sent_messages = []
    async def mock_send(message): sent_messages.append(message)
    
    await app(scope, None, mock_send)
    assert sent_messages[0]["status"] == 404
