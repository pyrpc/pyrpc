<div align="center">
  <picture>
    <img alt="banner-dark" src="https://github.com/user-attachments/assets/6f7b3e8e-2e66-4135-a89d-c84b3cefcfe1" />
  </picture>
  
  <p>
    <a href="https://pyrpc.com">Website</a>
    ·
    <a href="https://github.com/pyrpc/pyrpc/issues">Issues</a>
  </p>
</div>

> [!WARNING]
> pyRPC is in beta. APIs may change as development continues. If you run into issues, please open an issue.

## pyRPC

**pyRPC** is a modern, tRPC-inspired "drop-in RPC layer" for Python. It's designed to be dead simple, type-safe, and framework-agnostic.

Inspired by giving you the best DX, pyRPC focuses on giving you a type-safe bridge between your backend and frontend without forcing a specific architecture or framework.

### Philosophy
- **Dead simple install**: Zero config, zero ceremony.
- **Works everywhere**: Plugs into FastAPI, Flask, or any ASGI server.
- **Batteries included but modular**: Install only what you need.
- **Type-safe bridge**: Get a tRPC-like experience with Python and TypeScript.

---

### Modular Installation

pyRPC follows a modular packaging strategy. You only pay for what you use.

#### 1. Core (Required)
The tiny core protocol and runtime.
```bash
uv add pyrpc-server
# or
pip install pyrpc-server
```

#### 2. Adapters (Optional)
Install the adapter for your favorite framework.

**FastAPI**
```bash
uv add pyrpc-server-fastapi
```

**Flask**
```bash
uv add pyrpc-server-flask
```

#### 3. Codegen (Optional)
Tools for generating TypeScript clients.
```bash
uv add pyrpc-server-codegen
```

---

### Quick Start

#### 1. Server-side (FastAPI Example)
Define your procedures and mount the RPC layer.

```python
from pyrpc import rpc
from pyrpc_fastapi import mount_fastapi
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
from pyrpc import RPCClient

with RPCClient("http://localhost:8000") as client:
    result = client.add(10, 5)
    print(f"Result: {result}")
```

#### 3. Client-side (TypeScript)
Use the CLI to generate a type-safe TS client.

```bash
pyrpc codegen -m my_app.main -o client.ts
```

---

### CLI Utilities
The `pyrpc` command (provided by `pyrpc-server-codegen`) allows you to:
- `pyrpc serve`: Instantly host an RPC module.
- `pyrpc inspect`: Visualize all registered procedures.
- `pyrpc codegen`: Generate frontend clients.

### Documentation & Examples
Check out the [examples/](examples/) directory for complete server and client implementations.

### License
MIT

### CLI Usage

```bash
pyrpc --help
```
