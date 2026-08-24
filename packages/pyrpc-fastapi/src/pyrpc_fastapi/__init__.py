from typing import Any

from pyrpc_core import Router, default_router, handle_request, model, rpc

__all__ = ["mount_fastapi", "rpc", "model", "Router", "default_router", "handle_request"]


def mount_fastapi(app: Any, router: Router | None = None) -> None:
    """
    Mount the pyRPC RPC endpoint onto a FastAPI application.

    Args:
        app: A FastAPI application instance.
        router: An optional pyRPC Router. If None, the global default router is used.
    """
    resolved = router or default_router

    @app.post("/rpc")
    async def rpc_endpoint(payload: dict[str, Any]):
        return await handle_request(payload, router=resolved)

    @app.get("/rpc")
    async def introspection_endpoint():
        from pyrpc_core import get_registry_schema
        schemas = get_registry_schema(resolved)
        return {
            name: schema.model_dump()
            for name, schema in schemas.items()
        }
