# pyrpc-flask

[Flask](https://flask.palletsprojects.com/) adapter for [pyRPC](https://pyrpc.dev). Mounts RPC procedures as a Flask route.

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

Starts an HTTP server with JSON-RPC 2.0 semantics at `/rpc`.

## License

MIT
