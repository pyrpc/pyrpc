import pytest
from flask import Flask
from pyrpc_server import rpc, default_router
from pyrpc_server_flask import mount_flask

@pytest.fixture(autouse=True)
def clear_registry():
    default_router._procedures.clear()

def test_flask_mount_success():
    @rpc
    def subtract(a: int, b: int) -> int:
        return a - b
    
    app = Flask(__name__)
    mount_flask(app)
    
    client = app.test_client()
    payload = {"id": 1, "method": "subtract", "params": [50, 20]}
    response = client.post("/rpc", json=payload)
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["id"] == 1
    assert data["result"] == 30
    assert data["error"] is None

def test_flask_async_procedure():
    @rpc
    async def async_mul(a: int, b: int) -> int:
        return a * b
    
    app = Flask(__name__)
    mount_flask(app)
    
    client = app.test_client()
    payload = {"id": "flask-1", "method": "async_mul", "params": [6, 7]}
    response = client.post("/rpc", json=payload)
    
    assert response.status_code == 200
    assert response.get_json()["result"] == 42
