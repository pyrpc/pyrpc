from typing import Any, Dict

from pyrpc_server import handle_request


def mount_fastapi(app: Any) -> None:
    """
    Mount the pyRPC RPC endpoint onto a FastAPI application.

    Args:
        app: A FastAPI application instance.
    """

    @app.post("/rpc")
    async def rpc_endpoint(payload: Dict[str, Any]):
        return await handle_request(payload)
