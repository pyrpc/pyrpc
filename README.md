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
- **Universal Validation**: Powered by Pydantic v2—automatic validation for primitives and models.
- **Type-safe bridge**: Get a tRPC-like experience with Python and TypeScript.

---

### Modular Installation

pyRPC follows a modular packaging strategy. You only pay for what you use.

#### 1. Core (Required)
The tiny core protocol and runtime.
```bash
uv add pyrpc-core
# or
pip install pyrpc-core
```

#### 2. Adapters (Optional)
Install the adapter for your favorite framework.

**FastAPI**
```bash
uv add pyrpc-fastapi
```

**Flask**
```bash
uv add pyrpc-flask
```

#### 3. Codegen (Optional)
Tools for generating TypeScript clients.
```bash
uv add pyrpc-codegen
```

---

### Quick Start

#### 1. Server-side (FastAPI Example)
Define your procedures and mount the RPC layer.

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

#### 2. Client-side (TypeScript)
Generate typed contracts from your server to enable end-to-end typed inference.

```bash
npx pyrpc codegen --url http://localhost:8000
```

```ts
import { createClient } from "@pyrpc/client"
import type { Types } from "@pyrpc/types"

const client = createClient<Types>()

// Fully typed result and parameters!
const result = await client.add(10, 5)
```

#### 3. Client-side (Python)
Call your procedures from other Python services or scripts with zero codegen required.

```python
from pyrpc_core import RPCClient

with RPCClient("http://localhost:8000") as client:
    # Everything is dynamic and introspected at runtime
    result = client.add(10, 5)
    print(f"Result: {result}")
```

---

### CLI Utilities
The `pyrpc` CLI provides tooling for serving, inspecting, and generating typed contracts from your RPC procedures.

- `pyrpc serve`: Instantly host a Python RPC module for local development and testing.
- `pyrpc inspect`: Explore registered procedures, inputs, outputs, and namespaces.
- `pyrpc codegen`: Generate TypeScript types/contracts for end-to-end typed clients.

### Documentation & Examples
Check out the [examples/](examples/) directory for complete server and client implementations.

### License
MIT

### CLI Usage

```bash
pyrpc --help
```
