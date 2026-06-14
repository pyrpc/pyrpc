from pyrpc_core import handle_request, Router, rpc, model, default_router
from typing import Any, Optional


def mount_flask(app: Any, router: Optional[Router] = None) -> None:
    """
    Mount the pyRPC RPC endpoint onto a Flask application.

    Args:
        app: A Flask application instance.
        router: An optional pyRPC Router. If None, the global default router is used.
    """
    resolved = router or default_router

    # Import inside function to avoid hard dependency on Flask if not used
    from flask import request, jsonify
    import anyio

    @app.route("/rpc", methods=["POST"])
    def rpc_endpoint():
        payload = request.get_json(force=True)
        # Flask is generally sync, so we use anyio.run to execute the async interpreter
        response_dict = anyio.run(handle_request, payload, resolved)
        return jsonify(response_dict)

    @app.route("/rpc", methods=["GET"])
    def introspection_endpoint():
        from pyrpc_core import get_registry_schema
        schemas = get_registry_schema(resolved)
        return jsonify({
            name: schema.model_dump()
            for name, schema in schemas.items()
        })
