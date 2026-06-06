# pyrpc-flask

[Flask](https://flask.palletsprojects.com/) adapter for [pyRPC](https://pyrpc.com). Mounts RPC procedures as Flask routes.

## Installation

```bash
uv add pyrpc-flask
```

## Usage

```python
from pyrpc_core import rpc
from pyrpc_flask import mount_flask
from flask import Flask

app = Flask(__name__)

@rpc
def add(a: int, b: int) -> int:
    return a + b

mount_flask(app)
```

Creates `POST /rpc` for JSON-RPC 2.0 calls and `GET /rpc` for schema introspection.

## License

MIT
