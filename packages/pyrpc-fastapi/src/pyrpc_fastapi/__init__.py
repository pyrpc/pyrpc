from pyrpc_server import handle_request, Router, rpc, model
from typing import Any, Optional, Dict


def mount_fastapi(app: Any, router: Optional[Router] = None) -> None:
    """
    Mount the pyRPC RPC endpoint onto a FastAPI application.

    Args:
        app: A FastAPI application instance.
        router: An optional pyRPC Router. If None, the global default router is used.
    """

    @app.post("/rpc")
    async def rpc_endpoint(payload: Dict[str, Any]):
        return await handle_request(payload, router=router)

    @app.get("/rpc")
    async def introspection_endpoint():
        from pyrpc_server import get_registry_schema
        schemas = get_registry_schema(router)
        return {
            name: schema.model_dump() if hasattr(schema, "model_dump") else schema
            for name, schema in schemas.items()
        }
