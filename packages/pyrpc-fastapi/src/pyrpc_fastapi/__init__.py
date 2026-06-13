from pyrpc_core import handle_request, Router, rpc, model, default_router
from typing import Any, Optional, Dict


def mount_fastapi(app: Any, router: Optional[Router] = None) -> None:
    """
    Mount the pyRPC RPC endpoint onto a FastAPI application.

    Args:
        app: A FastAPI application instance.
        router: An optional pyRPC Router. If None, the global default router is used.
    """
    resolved = router or default_router

    @app.post("/rpc")
    async def rpc_endpoint(payload: Dict[str, Any]):
        return await handle_request(payload, router=resolved)

    @app.get("/rpc")
    async def introspection_endpoint():
        from pyrpc_core import get_registry_schema
        schemas = get_registry_schema(resolved)
        return {
            name: schema.model_dump() if hasattr(schema, "model_dump") else schema
            for name, schema in schemas.items()
        }
