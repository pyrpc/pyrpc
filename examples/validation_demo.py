"""
Validation demo — tests Pydantic input/output validation with pyRPC.

Runs directly (no server needed):
    uv run python examples/validation_demo.py
"""

from typing import Optional, Dict
import asyncio
import json

from pyrpc_core import rpc, model, handle_request

# 1. Simple primitives
@rpc
def greet(name: str, age: int) -> str:
    return f"Hello {name}, you are {age} years old."

# 2. Complex nested types using @model
@model
class Address:
    city: str
    zip_code: str

@model
class User:
    id: int
    name: str
    address: Address
    tags: Optional[list[str]] = None

@rpc
def create_user(user: User) -> Dict[str, str]:
    return {"status": "success", "user_id": str(user.id)}

# 3. Return type validation
@rpc
def get_user_bad() -> User:
    # This will fail return type validation because it returns a dict missing fields
    return {"id": 1}

async def main():
    print("--- 1. Valid Primitive Request ---")
    req1 = {"id": 1, "method": "greet", "params": {"name": "Alice", "age": 30}}
    res1 = await handle_request(req1)
    print(json.dumps(res1, indent=2))

    print("\n--- 2. Invalid Primitive Request (age is string) ---")
    req2 = {"id": 2, "method": "greet", "params": {"name": "Bob", "age": "thirty"}}
    res2 = await handle_request(req2)
    print(json.dumps(res2, indent=2))

    print("\n--- 3. Valid Complex Request ---")
    req3 = {
        "id": 3, 
        "method": "create_user", 
        "params": {
            "user": {
                "id": 101, 
                "name": "Charlie", 
                "address": {"city": "New York", "zip_code": "10001"}
            }
        }
    }
    res3 = await handle_request(req3)
    print(json.dumps(res3, indent=2))

    print("\n--- 4. Invalid Complex Request (missing address) ---")
    req4 = {
        "id": 4, 
        "method": "create_user", 
        "params": {
            "user": {
                "id": 102, 
                "name": "Dave"
            }
        }
    }
    res4 = await handle_request(req4)
    print(json.dumps(res4, indent=2))
    
    print("\n--- 5. Return Type Validation Error ---")
    req5 = {"id": 5, "method": "get_user_bad", "params": {}}
    res5 = await handle_request(req5)
    print(json.dumps(res5, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
