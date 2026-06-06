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
