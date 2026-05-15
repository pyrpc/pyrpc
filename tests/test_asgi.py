import pytest
from httpx import ASGITransport, AsyncClient
from pyrpc_core import rpc, asgi_app, default_router

@pytest.fixture(autouse=True)
def clear_registry():
    default_router._procedures.clear()

@pytest.mark.anyio
async def test_asgi_rpc_success():
    @rpc
    def add(a: int, b: int) -> int:
        return a + b
    
    async with AsyncClient(transport=ASGITransport(app=asgi_app), base_url="http://test") as client:
        payload = {"id": 1, "method": "add", "params": {"a": 10, "b": 20}}
        response = await client.post("/rpc", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["result"] == 30
        assert data["error"] is None

@pytest.mark.anyio
async def test_asgi_404():
    async with AsyncClient(transport=ASGITransport(app=asgi_app), base_url="http://test") as client:
        response = await client.get("/not-found")
        assert response.status_code == 404

@pytest.mark.anyio
async def test_asgi_invalid_json():
    async with AsyncClient(transport=ASGITransport(app=asgi_app), base_url="http://test") as client:
        response = await client.post(
            "/rpc", 
            content="invalid-json", 
            headers={"content-type": "application/json"}
        )
        assert response.status_code == 400
        assert "Invalid JSON" in response.json()["error"]
