# 1. Architecture Overview

## The Big Picture

```
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│         PYTHON (Server)             │     │       TYPESCRIPT (Client)            │
│                                      │     │                                      │
│  def add(a: int, b: int) -> int      │     │  import type { Types } from "..."    │
│       │                              │     │  const client = createClient<Types>  │
│       ▼                              │     │  const sum = await client.add(1, 2)  │
│  @rpc decorator triggers             │     │        │                            │
│  Procedure.__init__()                │     │        │  TypeScript checks:         │
│    • inspect.signature()             │     │        │  add exists? ✅             │
│    • TypeAdapter(int)                │     │        │  params are numbers? ✅     │
│    • stored in Router._procedures    │     │        │  return is number? ✅       │
│       │                              │     │        ▼                            │
│       ▼                              │     │  Proxy intercepts:                  │
│  At runtime:                         │     │  client.add → "add" (method name)   │
│  POST /rpc {"method":"add",          │     │  [1, 2] → params                    │
│           "params":[1,2]}            │     │        │                            │
│       │                              │     │        │  fetch POST /rpc           │
│       ◄─────────────────────────────────────┘        │                            │
│       │                              │               ▼                            │
│  handle_request()                    │     │  Response: {"result": 3}             │
│    • Router.get("add")               │     │  Trust the server → return as T      │
│    • Procedure.execute([1,2])        │     │                                      │
│    • Pydantic validates input ✅     │     └──────────────────────────────────────┘
│    • fn(a=1, b=2) → 3               │
│    • Pydantic validates output ✅    │
│    • return {"result": 3}            │
└──────────────────────────────────────┘
```

### Key constraint: The Language Boundary

**Why we can't just use `typeof` like tRPC:**

tRPC is TypeScript on both sides of the wire. This allows:
```typescript
// Server (TypeScript)
export const appRouter = t.router({...});
export type AppRouter = typeof appRouter;  // ← TypeScript magic

// Client (TypeScript)
import type { AppRouter } from '../server';
const trpc = createTRPCClient<AppRouter>(); // ← types flow FOR FREE
```

pyRPC is **Python on one side, TypeScript on the other**. There's no `typeof` across languages. So we must:

1. **Extract** the type information from Python at build time
2. **Serialize** it as JSON (the universal bridge format)
3. **Regenerate** TypeScript types from that JSON

This is the same problem Prisma solves (DSL → TypeScript), but we solve it with Python annotations → JSON → TypeScript.

---

## The Three Paths to Type Safety

We offer three ways to generate types, each designed for a different workflow:

### Path A: CI/CD Pipeline (Two-Step)

```
┌── CI STEP 1 (Python machine) ─────────────────────┐
│                                                     │
│  pyrpc pull app.main                                │
│     │                                                │
│     ├── import app.main  (triggers @rpc)             │
│     ├── @rpc creates Procedure objects               │
│     ├── get_registry_schema() extracts type info     │
│     └── writes pyrpc-schema.json  ◄── INTERMEDIATE   │
│                                                     │
└─────────────────────────────────────────────────────┘
                          │
                          ▼  (JSON file committed or passed as artifact)
                          │
┌── CI STEP 2 (any machine) ─────────────────────────┐
│                                                     │
│  pyrpc codegen pyrpc-schema.json                    │
│     │                                                │
│     ├── reads JSON schema from disk                  │
│     ├── _pytype_to_ts() maps Python→TS types        │
│     ├── Jinja2 template renders interface            │
│     └── writes node_modules/@pyrpc/types/src/       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Best for:** When the backend and frontend are in different repos, or CI needs to explicitly version the schema.

### Path B: One-Shot Dev Workflow

```
┌── Running dev server ──────────────┐     ┌── Developer machine ───────────────┐
│                                     │     │                                    │
│  pyrpc serve app.main               │     │  pyrpc codegen http://localhost    │
│     │                                │     │     │                              │
│     │  (server is running,           │     │     ├── GET http://localhost/rpc  │
│     │   GET /rpc works)              │     │     ├── receives JSON schema      │
│     │                                │     │     ├── same codegen pipeline     │
│     └────────────────────────────────┼────►│     └── writes TS types           │
│                                      │     │                                  │
└──────────────────────────────────────┘     └──────────────────────────────────┘
```

**Best for:** Development — server is running locally, just run one command after any server change.

### Path C: npm Postinstall (First-Time Setup)

```
npm install @pyrpc/client  (or @pyrpc/types)
  │
  ▼
postinstall.js runs automatically
  │
  ├── Is this a terminal? → Yes → Prompt: "Backend URL?"
  ├── Is PYRPC_URL set? → Yes → Fetch schema automatically
  ├── No → Print instructions to run pyrpc codegen
  │
  ▼
Fetches GET <url>/rpc → generates Types → writes to node_modules/
```

**Best for:** First-time project setup. Gets you from zero to type-safe quickly.

### Which one should YOU use?

| Situation | Recommended path |
|---|---|
| Development (server running locally) | **Path B** — `pyrpc codegen http://localhost:8000` |
| CI/CD for separate frontend/backend | **Path A** — `pyrpc pull` then `pyrpc codegen` |
| First-time install of the package | **Path C** — postinstall script prompts |
| Monorepo with shared types | **Path A or B** — your build system handles it |

---

## Package Map

```
pyrpc/
│
├── packages/
│   │
│   ├── pyrpc-core/           # The HEART — Python runtime
│   │   ├── core/procedure.py     # Procedure compilation (TypeAdapter, signature)
│   │   ├── core/registry.py      # Router (stores all procedures)
│   │   ├── core/introspection.py # Schema generation (str types + JSON Schema)
│   │   ├── core/interpreter.py   # Request handler (JSON-RPC dispatch)
│   │   ├── core/models.py        # RpcRequest/RpcResponse Pydantic models
│   │   └── transport/asgi.py     # ASGI server (POST /rpc, GET /rpc)
│   │
│   ├── pyrpc-codegen/        # The BUILDER — CLI + TypeScript codegen
│   │   ├── main.py               # CLI: pull, serve, codegen, inspect
│   │   ├── ts_codegen.py         # _pytype_to_ts() — Python string → TS type
│   │   └── templates/client.ts.j2 # Jinja2 template for the interface
│   │
│   ├── client/               # @pyrpc/client — the actual npm package
│   │   └── src/client.ts         # createClient<TTypes>() + Proxy
│   │
│   └── types/                # @pyrpc/types — placeholder + postinstall
│       ├── src/index.ts          # Placeholder: type Types = Record<string, never>
│       └── postinstall.js        # Prompts for URL, fetches schema, generates
│
├── tests/                   # Python tests (pytest)
└── system-design/           # You are here
```

---

## Architecture Principles

1. **Zero runtime client overhead.** `@pyrpc/client` has zero dependencies. Types are erased by TypeScript at compile time — the JS bundle is tiny.

2. **Compile once, execute many.** `Procedure.__init__()` does expensive work (signature inspection, TypeAdapter construction) once at module import time. The `execute()` hot path is fast — just bind, validate, call.

3. **Validation on the server.** Pydantic TypeAdapters validate every parameter and return value on every request. The client sends data raw (no client-side schema validation). This keeps the client simple.

4. **JSON as the bridge format.** Python type annotations → JSON strings → TypeScript type names. JSON is the universal language that both Python and JavaScript understand.

5. **No monorepo required.** Unlike tRPC, you don't need to be in a monorepo to share types. The JSON schema file or HTTP endpoint serves as the type contract between separate repos.
