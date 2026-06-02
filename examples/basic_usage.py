"""
Minimal pyRPC usage — just the @rpc decorator.

Run with a server adapter (FastAPI/Flask/ASGI) or the CLI:
    pyrpc serve examples.basic_usage
"""

from pyrpc_core import rpc

"""
This file shows the minimal imports needed for pyRPC.
Run it alongside basic_client.py to see the full flow.
"""

@rpc
def ping() -> str:
    return "pong"
