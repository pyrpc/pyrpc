import inspect

import pytest
import httpx
from pyrpc_core.client.python_client import RPCClient, RPCError
from pyrpc_core.transport.asgi import PyRPCAsgiApp
from pyrpc_core.core.registry import Router

@pytest.mark.asyncio
async def test_rpc_client_integration():
    # 1. Setup Server
    router = Router()
    @router.rpc
    def multiply(a: int, b: int) -> int:
        return a * b
        
    @router.rpc
    def error_func():
        raise ValueError("Something went wrong")
        
    app = PyRPCAsgiApp(router=router)
    
    # 2. Setup Client with ASGITransport
    # This allows the client to talk to the app without a real server
    transport = httpx.ASGITransport(app=app)
    async_client = httpx.AsyncClient(transport=transport, base_url="http://testserver")
    sync_client = httpx.Client(transport=transport, base_url="http://testserver")
    
    async with RPCClient("http://testserver", async_client=async_client) as client:
        # Test Async Call
        res = await client.multiply.aio(a=5, b=6)
        assert res == 30
        
        # Test Error Handling
        with pytest.raises(RPCError) as excinfo:
            await client.error_func.aio()
        assert excinfo.value.code == -32603
        assert "Something went wrong" in excinfo.value.message

@pytest.mark.asyncio
async def test_rpc_client_validation_error():
    router = Router()
    @router.rpc
    def square(n: int) -> int: return n * n
    
    app = PyRPCAsgiApp(router=router)
    transport = httpx.ASGITransport(app=app)
    async_client = httpx.AsyncClient(transport=transport, base_url="http://testserver")
    
    async with RPCClient("http://testserver", async_client=async_client) as client:
        # Send invalid type (string instead of int)
        with pytest.raises(RPCError) as excinfo:
            await client.square.aio(n="not-a-number")
        
        assert excinfo.value.code == -32602  # Invalid Params
        assert "Validation failed" in excinfo.value.message


@pytest.mark.asyncio
async def test_sync_procedure_calls_call_sync():
    """
    Sync procedure + injected schema → ``__call__`` invokes ``call_sync``
    and returns the value directly (not a coroutine).
    """
    from unittest.mock import patch

    router = Router()
    @router.rpc
    def multiply(a: int, b: int) -> int:
        return a * b

    app = PyRPCAsgiApp(router=router)
    transport = httpx.ASGITransport(app=app)
    async_client = httpx.AsyncClient(transport=transport, base_url="http://testserver")
    sync_client = httpx.Client(transport=transport, base_url="http://testserver")

    async with RPCClient("http://testserver", async_client=async_client, sync_client=sync_client) as client:
        client.set_schema({"multiply": False})
        with patch.object(client, "call_sync", return_value=30) as mock_call_sync:
            result = client.multiply(a=5, b=6)
            mock_call_sync.assert_called_once_with("multiply", a=5, b=6)
            assert result == 30
            assert not inspect.iscoroutine(result)


@pytest.mark.asyncio
async def test_async_procedure_calls_call_async():
    """
    Async procedure + injected schema → ``__call__`` invokes ``call_async``
    and returns a coroutine.
    """
    router = Router()
    @router.rpc
    async def fetch_data() -> str:
        return "hello"

    app = PyRPCAsgiApp(router=router)
    transport = httpx.ASGITransport(app=app)
    async_client = httpx.AsyncClient(transport=transport, base_url="http://testserver")
    sync_client = httpx.Client(transport=transport, base_url="http://testserver")

    async with RPCClient("http://testserver", async_client=async_client, sync_client=sync_client) as client:
        client.set_schema({"fetch_data": True})
        # call_async goes through ASGITransport (async → works)
        coro = client.fetch_data()
        assert inspect.iscoroutine(coro)
        result = await coro
        assert result == "hello"


@pytest.mark.asyncio
async def test_aio_override_works_for_sync_procedure():
    """.aio() always returns an awaitable regardless of the server procedure type."""
    router = Router()
    @router.rpc
    def multiply(a: int, b: int) -> int:
        return a * b

    app = PyRPCAsgiApp(router=router)
    transport = httpx.ASGITransport(app=app)
    async_client = httpx.AsyncClient(transport=transport, base_url="http://testserver")
    sync_client = httpx.Client(transport=transport, base_url="http://testserver")

    async with RPCClient("http://testserver", async_client=async_client, sync_client=sync_client) as client:
        result = await client.multiply.aio(a=5, b=6)
        assert result == 30


@pytest.mark.asyncio
async def test_aio_override_works_for_async_procedure():
    """.aio() works for async procedures too."""
    router = Router()
    @router.rpc
    async def fetch_data() -> str:
        return "hello"

    app = PyRPCAsgiApp(router=router)
    transport = httpx.ASGITransport(app=app)
    async_client = httpx.AsyncClient(transport=transport, base_url="http://testserver")
    sync_client = httpx.Client(transport=transport, base_url="http://testserver")

    async with RPCClient("http://testserver", async_client=async_client, sync_client=sync_client) as client:
        result = await client.fetch_data.aio()
        assert result == "hello"


def test_sync_procedure_dispatch_in_sync_context():
    """
    Sync context + injected schema → ``__call__`` invokes ``call_sync``
    and returns the value directly.
    """
    from unittest.mock import patch

    with RPCClient("http://testserver") as client:
        client.set_schema({"multiply": False})
        with patch.object(client, "call_sync", return_value=30) as mock_call_sync:
            result = client.multiply(a=5, b=6)
            mock_call_sync.assert_called_once_with("multiply", a=5, b=6)
            assert result == 30
            assert not inspect.iscoroutine(result)


@pytest.mark.asyncio
async def test_fallback_when_schema_unavailable():
    """When schema fetch fails, fall back to event-loop detection (old behavior)."""
    router = Router()
    @router.rpc
    def multiply(a: int, b: int) -> int:
        return a * b

    app = PyRPCAsgiApp(router=router)
    transport = httpx.ASGITransport(app=app)
    async_client = httpx.AsyncClient(transport=transport, base_url="http://testserver")
    # No sync_client with transport → schema fetch will fail silently

    async with RPCClient("http://testserver", async_client=async_client) as client:
        # Falls back to event-loop detection → returns coroutine in async context
        result = await client.multiply(a=5, b=6)
        assert result == 30
