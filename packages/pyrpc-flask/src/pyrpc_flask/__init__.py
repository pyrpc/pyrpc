from pyrpc_server import handle_request, Router, rpc, model
from typing import Any, Optional


def mount_flask(app: Any, router: Optional[Router] = None) -> None:
    """
    Mount the pyRPC RPC endpoint onto a Flask application.

    Args:
        app: A Flask application instance.
        router: An optional pyRPC Router. If None, the global default router is used.
    """
    # Import inside function to avoid hard dependency on Flask if not used
    from flask import request, jsonify
    import anyio

    @app.route("/rpc", methods=["POST"])
    def rpc_endpoint():
        payload = request.get_json(force=True)
        # Flask is generally sync, so we use anyio.run to execute the async interpreter
        response_dict = anyio.run(handle_request, payload, router)
        return jsonify(response_dict)

    @app.route("/rpc", methods=["GET"])
    def introspection_endpoint():
        from pyrpc_server import get_registry_schema
        schemas = get_registry_schema(router)
        return jsonify({
            name: schema.model_dump() if hasattr(schema, "model_dump") else schema
            for name, schema in schemas.items()
        })
