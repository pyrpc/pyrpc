# pyrpc-core

Core RPC protocol and runtime for [pyRPC](https://pyrpc.com). Provides the `rpc` decorator, `Router`, `RPCClient`, schema introspection, and the `pyrpc` CLI.

## What's included

- `rpc` decorator (`from pyrpc_core import rpc`) - register functions as RPC procedures on the global `default_router`
- `Router` - create isolated routers with `router.rpc` decorator
- `RPCClient` / `RPCError` - dynamic Python-to-Python RPC client (no codegen required)
- `model` - Pydantic dataclass decorator for validated request/response models
- `PyRPCAsgiApp` / `asgi_app` - ASGI transport for serving RPC without a framework adapter
- Schema introspection - `get_procedure_schema`, `get_registry_schema`
- `pyrpc` CLI - `serve`, `dev`, `inspect`, `codegen`, `pull`, `version`

## Installation

```bash
uv add pyrpc-core
# or
pip install pyrpc-core
```

## Quick start

```python
from pyrpc_core import rpc, RPCClient

@rpc
def add(a: int, b: int) -> int:
    return a + b
```

Run `pyrpc serve my_module` to serve the procedures over HTTP, or mount via an adapter (FastAPI, Flask).

## License

MIT
