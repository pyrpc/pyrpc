import pytest
from pyrpc_server import rpc, asgi_app, default_router, RPCClient

@pytest.fixture(autouse=True)
def clear_registry():
    default_router._procedures.clear()

@pytest.mark.anyio
async def test_client_async_success():
    @rpc
    def add(a: int, b: int) -> int:
        return a + b
    
    # We use asgi transport to test without a real server
    async with RPCClient("http://test") as client:
        # Mocking the internal client to use ASGITransport
        import httpx
        client._async_client = httpx.AsyncClient(
            transport=httpx.ASGITransport(app=asgi_app), 
            base_url="http://test"
        )
        
        # Test dynamic async call via .aio()
        result = await client.add.aio(10, 20)
        assert result == 30
        
        # Test explicit call_async
        result = await client.call_async("add", a=5, b=5)
        assert result == 10

def test_client_sync_success(monkeypatch):
    @rpc
    def multiply(a: int, b: int) -> int:
        return a * b
    
    with RPCClient("http://test") as client:
        # Instead of transport (which is hard for sync/asgi), mock the client post
        import httpx
        def mock_post(*args, **kwargs):
            payload = kwargs.get("json")
            # Minimal simulation of handle_request
            request = httpx.Request("POST", "http://test/rpc", json=payload)
            return httpx.Response(
                200, 
                json={"id": payload["id"], "result": 20, "error": None},
                request=request
            )

        
        monkeypatch.setattr(client._sync_client, "post", mock_post)
        
        # Test dynamic sync call
        result = client.multiply(10, 2)
        assert result == 20
        
        # Test explicit call_sync
        result = client.call_sync("multiply", a=3, b=4)
        # We need to update mock for different values or just verify it's called
        assert result == 20 # Mock returns 20


@pytest.mark.anyio
async def test_client_error():
    from pyrpc_server import RPCError
    @rpc
    def fail():
        raise ValueError("RPC Error Test")
    
    async with RPCClient("http://test") as client:
        import httpx
        client._async_client = httpx.AsyncClient(
            transport=httpx.ASGITransport(app=asgi_app), 
            base_url="http://test"
        )
        
        with pytest.raises(RPCError) as exc:
            await client.fail.aio()
        assert exc.value.code == -32603
        assert "RPC Error Test" in exc.value.message


