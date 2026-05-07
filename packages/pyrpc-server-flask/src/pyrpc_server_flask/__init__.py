from typing import Any

from pyrpc_server import handle_request


def mount_flask(app: Any) -> None:
    """
    Mount the pyRPC RPC endpoint onto a Flask application.

    Args:
        app: A Flask application instance.
    """
    # Import inside function to avoid hard dependency on Flask if not used
    from flask import request, jsonify
    import anyio

    @app.route("/rpc", methods=["POST"])
    def rpc_endpoint():
        payload = request.get_json(force=True)
        # Flask is generally sync, so we use anyio.run to execute the async interpreter
        response_dict = anyio.run(handle_request, payload)
        return jsonify(response_dict)
