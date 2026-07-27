"""
pyRPC backend for the Next.js example.

Run:
    uv run python examples/nextjs/server.py
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pyrpc_core import rpc
from pyrpc_fastapi import mount_fastapi

app = FastAPI(title="pyRPC Next.js Example")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@rpc.query
def greet(name: str = "World") -> str:
    """Greets a user."""
    return f"Hello, {name}!"


@rpc.query
async def get_status() -> dict:
    """Returns server status."""
    return {"status": "online", "version": "0.8.1"}


@rpc.mutation
def set_display_name(name: str) -> dict:
    """Example mutation."""
    return {"ok": True, "name": name}


mount_fastapi(app)

if __name__ == "__main__":
    print("pyRPC server: http://localhost:8000/rpc")
    uvicorn.run(app, host="0.0.0.0", port=8000)
