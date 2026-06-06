<div align="center">
  <picture>
    <img alt="pyRPC" src="https://github.com/user-attachments/assets/6f7b3e8e-2e66-4135-a89d-c84b3cefcfe1" />
  </picture>

  <br/>

  <a href="https://pepy.tech/project/pyrpc-core">
    <img src="https://img.shields.io/pypi/dm/pyrpc-core?style=flat&colorA=000000&colorB=000000" alt="PyPI downloads"/>
  </a>
  <a href="https://www.npmjs.com/package/@pyrpc/client">
    <img src="https://img.shields.io/npm/dm/@pyrpc/client?style=flat&colorA=000000&colorB=000000" alt="npm downloads"/>
  </a>
  <a href="https://github.com/pyrpc/pyrpc/stargazers">
    <img src="https://img.shields.io/github/stars/pyrpc/pyrpc?style=flat&colorA=000000&colorB=000000" alt="GitHub stars"/>
  </a>
  <a href="https://www.npmjs.com/package/@pyrpc/client">
    <img src="https://img.shields.io/npm/v/@pyrpc/client.svg?style=flat&colorA=000000&colorB=000000" alt="npm version"/>
  </a>

  <p>
    <a href="https://pyrpc.com"><b>Website</b></a>
    ·
    <a href="https://github.com/pyrpc/pyrpc/issues"><b>Issues</b></a>
  </p>
</div>

> [!WARNING]
> pyRPC is in active development. APIs may change as we approach a stable release. Read the [changelog](https://pyrpc.com/changelog) and [roadmap](./ROADMAP.md) for direction.

## pyRPC

**pyRPC** is type-safe RPC for Python and TypeScript. It gives you a tRPC-like experience with a Python backend: one `@rpc` decorator defines the endpoint, generates the TypeScript types, and validates every request at runtime.

Unlike REST, there are no URL conventions, no status code mapping, no manual fetch wrappers. Unlike GraphQL, there is no query language, no schema file, no resolver tree. Unlike gRPC, there is no IDL, no codegen-first workflow, no protobuf compilation step. pyRPC starts from Python code and reaches into TypeScript  -  not the other way around.

### Philosophy
- **Python-first, TypeScript reach**  -  your Python functions are the source of truth. TypeScript types are derived from them.
- **Low ceremony**  -  one install, one decorator, one import on the client side. No schema files, no config, no CLI required for Python-to-Python.
- **Framework-agnostic core**  -  `pyrpc-core` knows nothing about FastAPI or Flask. Adapters translate HTTP into core calls.
- **Validation at runtime**  -  every parameter and return value is validated by Pydantic v2. The type definitions in TypeScript are derived from the same introspection that powers validation.
- **Standards-based transport**  -  JSON-RPC 2.0 on the wire. The protocol is explicit and language-agnostic.
- **Lockstep versioning**  -  all Python and npm packages release together at the same version. No ecosystem drift.

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

#### 3. CLI & Codegen (Built-in)
The `pyrpc` terminal command (serve, dev, inspect, codegen, pull) is included with `pyrpc-core`.
No separate install needed.
```bash
# The pyrpc CLI comes built-in
uv run pyrpc version
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

#### 2. Start the dev server
Run `pyrpc dev` from your project root. On first run, it prompts for your framework, Python module, and TypeScript client path - then generates types automatically.

```bash
# CLI comes with pyrpc-core - no extra install needed
pyrpc dev
```

#### 3. Client-side (TypeScript)
Once the dev server is running, use the typed client:

```ts
import { createClient } from "@pyrpc/client"
import type { Types } from "@pyrpc/types"

const client = createClient<Types>()

// Fully typed result and parameters - no manual type definitions needed
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

- `pyrpc dev`: Start the dev server with automatic type regeneration and interactive console. First run prompts for framework, entrypoint, and client root - creates `pyrpc.json`.
- `pyrpc serve`: Instantly host a Python RPC module for local development and testing.
- `pyrpc inspect`: Explore registered procedures, inputs, outputs, and namespaces.
- `pyrpc codegen`: Generate TypeScript types/contracts for end-to-end typed clients.
- `pyrpc pull`: Extract RPC schema from a Python module and save as JSON.

### Versioning

pyRPC uses `0.x.y` versioning while the API stabilizes. Pre-release tags use `-alpha.N`, `-beta.N`, and `-rc.N` suffixes. All packages - Python and npm - release in lockstep at the same version.

See the [changelog](https://pyrpc.com/changelog) for per-release details and [ROADMAP.md](./ROADMAP.md) for direction and non-goals.

### Documentation & Examples

- [Docs site](https://pyrpc.com/docs) - guides, API reference, mental model
- [examples/](./examples/) - complete server and client implementations
- [PYRPC.md](./PYRPC.md) - architecture, invariants, and contributor policy
- [Changelog](https://pyrpc.com/changelog) - per-release changes

### License

MIT

### Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the PR workflow and [PYRPC.md](./PYRPC.md) for subsystem boundaries.

### Security

Report vulnerabilities privately: https://github.com/pyrpc/pyrpc/security/advisories/new

See [SECURITY.md](./SECURITY.md) for scope and supported versions.
