# pyrpc-fastapi

[FastAPI](https://fastapi.tiangolo.com/) adapter for [pyRPC](https://pyrpc.com). Mounts RPC procedures as FastAPI routes.

## Installation

```bash
uv add pyrpc-fastapi
```

## Usage

```python
from pyrpc_core import rpc
from pyrpc_fastapi import mount_fastapi
from fastapi import FastAPI

app = FastAPI()

@rpc
def add(a: int, b: int) -> int:
    return a + b

mount_fastapi(app)
```

Creates `POST /rpc` for JSON-RPC 2.0 calls (single and batch) and `GET /rpc` for schema introspection.

## License

MIT
