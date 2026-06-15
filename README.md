<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/public/branding/png/pyrpc-wordmark-bg-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="docs/public/branding/png/pyrpc-wordmark-bg-light.png" />
    <img alt="pyRPC" src="docs/public/branding/png/pyrpc-wordmark-bg-light.png" />
  </picture>
</div>

<p align="center">
  Type-safe RPC for Python &amp; TypeScript
</p>

<p align="center">
  One <code>@rpc</code> decorator defines the endpoint, generates TypeScript types, and validates every request at runtime.
</p>

<p align="center">
  <a href="https://pyrpc.com/docs"><b>Docs</b></a>
  ·
  <a href="https://pyrpc.com/changelog"><b>Changelog</b></a>
  ·
  <a href="https://github.com/pyrpc/pyrpc/discussions"><b>Community</b></a>
</p>

<p align="center">
  <a href="https://pypi.org/project/pyrpc-core/">
    <img src="https://img.shields.io/pypi/v/pyrpc-core?style=flat&colorA=000000&colorB=000000" alt="PyPI version"/>
  </a>
  <a href="https://github.com/pyrpc/pyrpc/stargazers">
    <img src="https://img.shields.io/github/stars/pyrpc/pyrpc?style=flat&colorA=000000&colorB=000000" alt="GitHub stars"/>
  </a>
</p>

<div align="center">
  <img src="docs/public/demo/pyrpc_demo.gif" alt="pyRPC demo" width="100%" />
  <p align="center"><em>Change a Python type. TypeScript knows instantly.</em></p>
</div>

```python
from pyrpc_core import rpc

@rpc
def add(a: int, b: int) -> int:
    return a + b
```

```ts
import { createClient } from "@pyrpc/client"
import type { Types } from "@pyrpc/types"

const client = createClient<Types>()
const result = await client.add(10, 5)  // typed as number
```

---

## Install

> pyRPC is in active development. APIs may change as we approach a stable release. Read the [changelog](https://pyrpc.com/changelog) and [roadmap](./ROADMAP.md) for direction.

```bash
# Using uv
uv add pyrpc-core

# Using pip
pip install pyrpc-core
```

The `pyrpc` CLI (dev, serve, inspect, codegen, pull) is included out of the box. Framework adapters are available as extras:

```bash
uv add pyrpc-core[fastapi]   # FastAPI adapter
uv add pyrpc-core[flask]     # Flask adapter
uv add pyrpc-core[django]     # Django adapter
```

## Quick Start

### 1. Define your procedures

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

### 2. Start the dev server

```bash
pyrpc dev
```

On first run, it prompts for your framework, Python module, distribution mode, and client path - then generates types automatically.

### 3. Call from TypeScript

```ts
import { createClient } from "@pyrpc/client"
import type { Types } from "@pyrpc/types"

const client = createClient<Types>()
const result = await client.add(10, 5)
console.log(result)  // 15
```

### 4. Or from Python

```python
from pyrpc_core import RPCClient

with RPCClient("http://localhost:8000") as client:
    result = client.add(10, 5)
    print(f"Result: {result}")
```

---

## Distribution Modes

pyRPC supports two ways to sync TypeScript types:

- **Workspace** (default) - for monorepos. The server writes types directly into your client's `node_modules/@pyrpc/types`.
- **Server** - for separate repositories. The client fetches types via `npx pyrpc sync` over HTTP.

Configure via `pyrpc.json`:

```json
{
  "version": 1,
  "framework": "fastapi",
  "entrypoint": "server",
  "client_root": "../frontend",
  "distribution": "workspace"
}
```

---

## Documentation

- [Docs site](https://pyrpc.com/docs) - guides, API reference, mental model
- [examples/](./examples/) - complete server and client implementations
- [PYRPC.md](./PYRPC.md) - architecture, invariants, and contributor policy
- [Changelog](https://pyrpc.com/changelog) - per-release changes

## Contributing

pyRPC is a free and open source project licensed under the [MIT License](./LICENSE). You are free to do whatever you want with it.

You can help continue its development by:

- [Contributing to the source code](./CONTRIBUTING.md)
- [Suggesting new features and reporting issues](https://github.com/pyrpc/pyrpc/issues)

## Security

If you discover a security vulnerability within pyRPC, please report it via [GitHub Security Advisories](https://github.com/pyrpc/pyrpc/security/advisories/new).

All reports will be promptly addressed, and you'll be credited accordingly.
