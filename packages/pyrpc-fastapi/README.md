# pyrpc-fastapi

[FastAPI](https://fastapi.tiangolo.com/) adapter for [pyRPC](https://pyrpc.dev). Mounts RPC procedures as a FastAPI route.

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

Starts an HTTP server with JSON-RPC 2.0 semantics at `/rpc`.

## License

MIT
