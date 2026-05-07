__version__ = "0.1.0"

from .client.python_client import RPCClient, RPCError
from .core.decorators import default_registry, rpc
from .core.introspection import get_procedure_schema, get_registry_schema
from .core.interpreter import handle_request
from .core.models import RpcRequest, RpcResponse
from .core.registry import ProcedureRegistry
from .transport.asgi import PyRPCAsgiApp, app as asgi_app

__all__ = [
    "ProcedureRegistry",
    "rpc",
    "default_registry",
    "RpcRequest",
    "RpcResponse",
    "handle_request",
    "PyRPCAsgiApp",
    "asgi_app",
    "RPCClient",
    "RPCError",
    "get_procedure_schema",
    "get_registry_schema",
]
