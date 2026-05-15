import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pyrpc_core import rpc, default_router
from pyrpc_fastapi import mount_fastapi

@pytest.fixture(autouse=True)
def clear_registry():
    default_router._procedures.clear()

def test_fastapi_mount_success():
    @rpc
    def greet(name: str) -> str:
        return f"Hello {name}"
    
    app = FastAPI()
    mount_fastapi(app)
    
    client = TestClient(app)
    payload = {"id": "f-1", "method": "greet", "params": {"name": "FastAPI"}}
    response = client.post("/rpc", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "f-1"
    assert data["result"] == "Hello FastAPI"
    assert data["error"] is None

def test_fastapi_async_procedure():
    @rpc
    async def async_greet(name: str) -> str:
        return f"Async Hello {name}"
    
    app = FastAPI()
    mount_fastapi(app)
    
    client = TestClient(app)
    payload = {"id": "f-2", "method": "async_greet", "params": {"name": "World"}}
    response = client.post("/rpc", json=payload)
    
    assert response.status_code == 200
    assert response.json()["result"] == "Async Hello World"
