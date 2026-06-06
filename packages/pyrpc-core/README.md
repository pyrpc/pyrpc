# pyrpc-core

Core RPC protocol and runtime for [pyRPC](https://pyrpc.dev). Provides the `@rpc` decorator, `RPCClient`, schema introspection, and the `pyrpc` CLI.

## What's included

- `@rpc` decorator — register Python functions as RPC procedures
- `RPCClient` — dynamic Python-to-Python RPC client (no codegen required)
- Schema registry — introspection of all registered procedures, inputs, outputs
- `pyrpc` CLI — `serve`, `dev`, `inspect`, `codegen`, `pull`, `version`

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

Run `pyrpc serve my_module` to serve the procedures over HTTP.

## License

MIT
