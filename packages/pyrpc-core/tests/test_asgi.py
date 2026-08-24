import pytest
from httpx import ASGITransport, AsyncClient
from pyrpc_core import asgi_app, default_router, rpc


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


@pytest.mark.anyio
async def test_asgi_batch_queries():
    @rpc.query
    def get_user(id: int) -> int:
        return id * 10

    batch = [
        {"id": "a", "method": "get_user", "params": {"id": 1}},
        {"id": "b", "method": "get_user", "params": {"id": 2}},
        {"id": "c", "method": "get_user", "params": {"id": 3}},
    ]

    async with AsyncClient(transport=ASGITransport(app=asgi_app), base_url="http://test") as client:
        response = await client.post("/rpc", json=batch)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 3
        assert [d["result"] for d in data] == [10, 20, 30]
        assert all(d["error"] is None for d in data)
        assert [d["id"] for d in data] == ["a", "b", "c"]


@pytest.mark.anyio
async def test_asgi_batch_mutations():
    created = []

    @rpc.mutation
    def create_user(name: str) -> str:
        created.append(name)
        return name

    batch = [
        {"id": "a", "method": "create_user", "params": {"name": "Alice"}},
        {"id": "b", "method": "create_user", "params": {"name": "Bob"}},
    ]

    async with AsyncClient(transport=ASGITransport(app=asgi_app), base_url="http://test") as client:
        response = await client.post("/rpc", json=batch)

        assert response.status_code == 200
        data = response.json()
        assert [d["result"] for d in data] == ["Alice", "Bob"]
        assert created == ["Alice", "Bob"]


@pytest.mark.anyio
async def test_asgi_batch_preserves_individual_errors():
    @rpc
    def get_user(id: int) -> int:
        if id < 0:
            raise ValueError("no negative ids")
        return id

    batch = [
        {"id": "ok", "method": "get_user", "params": {"id": 1}},
        {"id": "bad", "method": "get_user", "params": {"id": -1}},
        {"id": "ok2", "method": "get_user", "params": {"id": 2}},
    ]

    async with AsyncClient(transport=ASGITransport(app=asgi_app), base_url="http://test") as client:
        response = await client.post("/rpc", json=batch)

        assert response.status_code == 200
        data = response.json()
        assert data[0]["result"] == 1
        assert data[0]["error"] is None
        assert data[1]["result"] is None
        assert data[1]["error"]["message"] == "no negative ids"
        assert data[2]["result"] == 2
        assert data[2]["error"] is None


@pytest.mark.anyio
async def test_asgi_batch_rejects_unknown_method():
    batch = [
        {"id": "a", "method": "does_not_exist", "params": {}},
    ]

    async with AsyncClient(transport=ASGITransport(app=asgi_app), base_url="http://test") as client:
        response = await client.post("/rpc", json=batch)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert data[0]["error"]["code"] == -32601
        assert "does_not_exist" in data[0]["error"]["message"]


@pytest.mark.anyio
async def test_asgi_single_request_unchanged_by_batch_support():
    """Existing non-batched clients must keep working."""
    @rpc
    def add(a: int, b: int) -> int:
        return a + b

    async with AsyncClient(transport=ASGITransport(app=asgi_app), base_url="http://test") as client:
        payload = {"id": 1, "method": "add", "params": {"a": 1, "b": 2}}
        response = await client.post("/rpc", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["result"] == 3
        assert not isinstance(data, list)
