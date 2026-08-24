import asyncio

import pytest
from pydantic import BaseModel
from pyrpc_core.core.interpreter import handle_request
from pyrpc_core.core.registry import Router

# --- Setup Procedures ---

router = Router()

@router.rpc
def add(a: int, b: int) -> int:
    return a + b

@router.rpc
async def async_greet(name: str) -> str:
    await asyncio.sleep(0.01)
    return f"Hello {name}"

class User(BaseModel):
    id: int
    username: str

@router.rpc
def get_user_name(user: User) -> str:
    return user.username

@router.rpc
def invalid_return() -> int:
    return "not an int"

# --- Tests ---

@pytest.mark.asyncio
async def test_primitive_validation_success():
    payload = {"id": 1, "method": "add", "params": {"a": 10, "b": 20}}
    response = await handle_request(payload, router=router)
    assert response["result"] == 30
    assert response["id"] == 1

@pytest.mark.asyncio
async def test_primitive_validation_failure():
    # Pass a string instead of an int
    payload = {"id": 2, "method": "add", "params": {"a": "ten", "b": 20}}
    response = await handle_request(payload, router=router)
    assert response["error"]["code"] == -32602
    assert "Validation failed" in response["error"]["message"]
    assert response["error"]["data"]["field"] == "a"

@pytest.mark.asyncio
async def test_async_procedure():
    payload = {"id": 3, "method": "async_greet", "params": ["World"]}
    response = await handle_request(payload, router=router)
    assert response["result"] == "Hello World"

@pytest.mark.asyncio
async def test_pydantic_model_validation():
    payload = {
        "id": 4, 
        "method": "get_user_name", 
        "params": {"user": {"id": 1, "username": "alice"}}
    }
    response = await handle_request(payload, router=router)
    assert response["result"] == "alice"

@pytest.mark.asyncio
async def test_return_type_validation_failure():
    payload = {"id": 5, "method": "invalid_return", "params": {}}
    response = await handle_request(payload, router=router)
    assert response["error"]["code"] == -32603
    assert "Return type validation failed" in response["error"]["message"]

@pytest.mark.asyncio
async def test_router_merging():
    sub_router = Router()
    @sub_router.rpc
    def sub_func(): return "sub"
    
    main_router = Router()
    main_router.merge(sub_router, prefix="test.")
    
    # Check if sub_func is accessible via prefix
    payload = {"id": 6, "method": "test.sub_func", "params": {}}
    response = await handle_request(payload, router=main_router)
    assert response["result"] == "sub"

@pytest.mark.asyncio
async def test_method_not_found():
    payload = {"id": 7, "method": "non_existent", "params": {}}
    response = await handle_request(payload, router=router)
    assert response["error"]["code"] == -32601
