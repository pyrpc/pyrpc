import json
from typing import Any, Callable, Dict, List, Optional, Tuple

from ..core.interpreter import handle_request
from ..core.introspection import get_registry_schema

CORS_HEADERS: List[Tuple[bytes, bytes]] = [
    (b"access-control-allow-origin", b"*"),
    (b"access-control-allow-methods", b"OPTIONS, GET, POST"),
    (b"access-control-allow-headers", b"Content-Type"),
    (b"access-control-max-age", b"86400"),
]


class PyRPCAsgiApp:
    """
    A minimal ASGI application for serving pyRPC requests.
    """

    def __init__(self, router: Optional[Any] = None) -> None:
        self.router = router

    async def __call__(self, scope: Dict[str, Any], receive: Callable, send: Callable) -> None:
        """
        The ASGI entry point.
        """
        if scope["type"] != "http":
            return

        method = scope.get("method")
        path = scope.get("path")

        if method == "OPTIONS" and path == "/rpc":
            await send({
                "type": "http.response.start",
                "status": 204,
                "headers": CORS_HEADERS,
            })
            await send({"type": "http.response.body", "body": b""})
            return

        if method == "POST" and path == "/rpc":
            await self.handle_rpc(receive, send)
        elif method == "GET" and path == "/rpc":
            await self.handle_introspection(send)
        else:
            await self.send_response(
                send, 404, {"error": "Not Found", "message": f"Cannot {method} {path}"}
            )

    async def handle_introspection(self, send: Callable) -> None:
        """
        Handle a GET /rpc request for introspection.
        """
        # Convert Pydantic models to dicts for JSON serialization
        # Since get_registry_schema returns a dict of ProcedureSchema, 
        # and ProcedureSchema is likely a Pydantic model.
        schemas = get_registry_schema(self.router)
        
        # Convert Pydantic models to dicts
        response_data = {
            name: schema.model_dump()
            for name, schema in schemas.items()
        }
        
        await self.send_response(send, 200, response_data)

    async def handle_rpc(self, receive: Callable, send: Callable) -> None:
        """
        Handle an RPC request.
        """
        body = b""
        more_body = True
        while more_body:
            message = await receive()
            body += message.get("body", b"")
            more_body = message.get("more_body", False)

        try:
            if not body:
                payload = {}
            else:
                payload = json.loads(body)
        except json.JSONDecodeError:
            await self.send_response(send, 400, {"error": "Invalid JSON"})
            return

        response_dict = await handle_request(payload, router=self.router)
        await self.send_response(send, 200, response_dict)

    async def send_response(self, send: Callable, status_code: int, content: Dict[str, Any]) -> None:
        """
        Helper to send a JSON response.
        """
        response_body = json.dumps(content).encode("utf-8")
        await send(
            {
                "type": "http.response.start",
                "status": status_code,
                "headers": [
                    (b"content-type", b"application/json"),
                ] + CORS_HEADERS,
            }
        )
        await send(
            {
                "type": "http.response.body",
                "body": response_body,
            }
        )


# Global instance for easy use
app = PyRPCAsgiApp()
