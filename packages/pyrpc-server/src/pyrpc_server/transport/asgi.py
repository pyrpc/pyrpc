import json
from typing import Any, Callable, Dict, Optional

from ..core.interpreter import handle_request


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
        from ..core.introspection import get_registry_schema
        # We need to convert the schema objects to dicts for JSON serialization
        # Since get_registry_schema returns a dict of ProcedureSchema, 
        # and ProcedureSchema is likely a Pydantic model.
        schemas = get_registry_schema(self.router)
        
        # Convert Pydantic models to dicts
        response_data = {
            name: schema.model_dump() if hasattr(schema, "model_dump") else schema
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
                ],
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
