<div align="center">
  <img width="1044" height="262" alt="banner-dark" src="https://github.com/user-attachments/assets/7aada9c1-44f2-4f99-b0e7-2c62ae5827a1" />
  
  <p>
    <a href="https://pyrpc.com">Website</a>
    ·
    <a href="https://github.com/pyrpc/pyrpc/issues">Issues</a>
  </p>
</div>

## pyRPC

**pyRPC** is a modern, tRPC-inspired "drop-in RPC layer" for Python. It's designed to be dead simple, type-safe, and framework-agnostic.

Inspired by giving you the best DX, pRPC focuses on giving you a type-safe bridge between your backend and frontend without forcing a specific architecture or framework.

### Philosophy
- **Dead simple install**: Zero config, zero ceremony.
- **Works everywhere**: Plugs into FastAPI, Flask, or any ASGI server.
- **Batteries included but modular**: Install only what you need.
- **Type-safe bridge**: Get a tRPC-like experience with Python and TypeScript.

---

### Modular Installation

pRPC follows a modular packaging strategy. You only pay for what you use.

#### 1. Core (Required)
The tiny core protocol and runtime.
```bash
uv add prpc
# or
pip install prpc
```

#### 2. Adapters (Optional)
Install the adapter for your favorite framework.

**FastAPI**
```bash
uv add prpc-fastapi
```

**Flask**
```bash
uv add prpc-flask
```

#### 3. Codegen (Optional)
Tools for generating TypeScript clients.
```bash
uv add prpc-codegen
```

---

### Quick Start

#### 1. Server-side (FastAPI Example)
Define your procedures and mount the RPC layer.

```python
from prpc import rpc
from prpc_fastapi import mount_fastapi
from fastapi import FastAPI

app = FastAPI()

@rpc
def add(a: int, b: int) -> int:
    return a + b

mount_fastapi(app)
```

#### 2. Client-side (Python)
Call your procedures with full type support and dynamic method discovery.

```python
from prpc import RPCClient

with RPCClient("http://localhost:8000") as client:
    result = client.add(10, 5)
    print(f"Result: {result}")
```

#### 3. Client-side (TypeScript)
Use the CLI to generate a type-safe TS client.

```bash
prpc codegen -m my_app.main -o client.ts
```

---

### CLI Utilities
The `prpc` command (provided by `prpc-codegen`) allows you to:
- `prpc serve`: Instantly host an RPC module.
- `prpc inspect`: Visualize all registered procedures.
- `prpc codegen`: Generate frontend clients.

### Documentation & Examples
Check out the [examples/](examples/) directory for complete server and client implementations.

### License
MIT

### CLI Usage

```bash
prpc --help
```
