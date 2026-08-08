from django.http import HttpResponse
from pyrpc_core import rpc


def index(request):
    """Django index view - following official Django tutorial pattern"""
    return HttpResponse("<h1>Django + pyRPC Server</h1><p>pyRPC endpoint: /rpc/</p>")


@rpc.query
async def greet(name: str = "World") -> dict:
    """Greets a user - Django style."""
    return {"message": f"Hello, {name}!", "framework": "Django"}


@rpc.query
async def read_item(item_id: int, q: str = None) -> dict:
    """Reads an item by ID."""
    return {"item_id": item_id, "q": q, "framework": "Django"}


@rpc.mutation
async def create_item(name: str, description: str = None) -> dict:
    """Creates a new item."""
    return {
        "name": name, 
        "description": description, 
        "created": True,
        "framework": "Django"
    }
