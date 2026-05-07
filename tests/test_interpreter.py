import pytest
from pyrpc_server import handle_request, rpc, default_registry

@pytest.fixture(autouse=True)
def clear_registry():
    default_registry._procedures.clear()

@pytest.mark.anyio
async def test_handle_request_sync():
    @rpc
    def add(a: int, b: int) -> int:
        return a + b
    
    payload = {"id": 1, "method": "add", "params": {"a": 10, "b": 20}}
    response = await handle_request(payload)
    
    assert response["id"] == 1
    assert response["result"] == 30
    assert response["error"] is None

@pytest.mark.anyio
async def test_handle_request_async():
    @rpc
    async def async_add(a: int, b: int) -> int:
        return a + b
    
    payload = {"id": "req-1", "method": "async_add", "params": [5, 5]}
    response = await handle_request(payload)
    
    assert response["id"] == "req-1"
    assert response["result"] == 10
    assert response["error"] is None

@pytest.mark.anyio
async def test_handle_request_not_found():
    payload = {"id": 1, "method": "ghost", "params": {}}
    response = await handle_request(payload)
    
    assert response["id"] == 1
    assert response["result"] is None
    assert response["error"]["code"] == 404
    assert "Method not found" in response["error"]["message"]

@pytest.mark.anyio
async def test_handle_request_exception():
    @rpc
    def fail():
        raise ValueError("Boom")
    
    payload = {"id": "err", "method": "fail"}
    response = await handle_request(payload)
    
    assert response["id"] == "err"
    assert response["result"] is None
    assert response["error"]["code"] == 500
    assert "Boom" in response["error"]["message"]

@pytest.mark.anyio
async def test_handle_request_invalid_payload():
    payload = {"id": 1, "method": 123} # method should be str
    response = await handle_request(payload)
    
    assert response["id"] == 1
    assert response["error"]["code"] == 400
    assert "Invalid request" in response["error"]["message"]


