"""
Flask + pyRPC server example.

Run directly:
    uv run python examples/flask_server.py

Or with the CLI:
    pyrpc serve examples.flask_server
"""

from pyrpc_core import rpc
from pyrpc_flask import mount_flask
from flask import Flask

app = Flask(__name__)

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

mount_flask(app)

if __name__ == "__main__":
    print("Starting flask_server on http://localhost:8000")
    print("RPC Endpoint: http://localhost:8000/rpc")
    app.run(host="0.0.0.0", port=8000)
