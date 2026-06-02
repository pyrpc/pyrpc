"""
Standalone ASGI server example (no framework adapter needed).

Run directly:
    uv run python examples/asgi_standalone.py

Or with the CLI:
    pyrpc serve examples.asgi_standalone
"""

import uvicorn
from pyrpc_core import rpc, asgi_app

@rpc
def add(a: int, b: int) -> int:
    """Adds two numbers together."""
    return a + b

@rpc
def greet(name: str = "World") -> str:
    """Greets a user."""
    return f"Hello, {name}!"

@rpc
async def get_status() -> dict:
    """Asynchronously returns server status."""
    return {"status": "online", "version": "0.1.0"}

if __name__ == "__main__":
    print("Starting asgi_standalone on http://localhost:8000")
    print("RPC Endpoint: http://localhost:8000/rpc")
    uvicorn.run(asgi_app, host="0.0.0.0", port=8000)
