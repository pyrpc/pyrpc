# pyRPC Roadmap

High-level direction and explicit non-goals for the project.

## Shipped (v0.1.0-alpha.1 → v0.11.1)

### Core & protocol

- JSON-RPC 2.0 protocol with structured error responses
- Async and sync procedure dispatch (`RPCCallable` auto-detects event loop)
- `Router` with `merge()` for modular procedure organization
- Introspection endpoint (`GET /rpc`)
- Pydantic v2 TypeAdapter-based runtime validation

### Server adapters

- **FastAPI** — `mount_fastapi(app)`
- **Flask** — `mount_flask(app)`
- **Django** — `mount_django(app)` (native async views, no anyio bridge)
- **Standalone ASGI** — `PyRPCAsgiApp`
- Framework extras: `pip install pyrpc-core[fastapi]`, `[flask]`, `[django]`

### Code generation

- Python → TypeScript type mapper (int, str, bool, Optional, List, Dict, unions, nested generics)
- `@model` → typed TypeScript interfaces via `jsonschema-ts` (with npx daemon, ~4.6ms)
- `pyrpc codegen` accepts file paths and URLs
- `pyrpc pull <module> -o schema.json` for portable schema export

### TypeScript client

- `createClient<Types>()` — proxy-based with full type inference
- `@pyrpc/types` — `import type { Types } from "@pyrpc/types"` resolves to the generated source-tree file via tsconfig paths
- `@pyrpc/client` with `PyRPCError` (code, message, data)

### Client framework adapters (v0.9.0)

- `@pyrpc/react` — TanStack Query hooks + utils
- `@pyrpc/next` — App Router: `createNextClient`, RSC prefetch, HydrateClient
- `@pyrpc/vue` — Vue 3 + TanStack VueQueryPlugin
- `@pyrpc/svelte` — Svelte + TanStack Query
- Procedure kinds: `@rpc.query` / `@rpc.mutation` (bare `@rpc` = query)
- One `api` object: Provider, hooks, server helpers on the same export

### CLI & dev tools

- `pyrpc dev` — setup wizard, file watcher, type regeneration, dev server
- `pyrpc dev` server detection — probes `host:port`; skips uvicorn and attaches watcher-only when a server is already running
- `pyrpc dev` starts uvicorn with `--reload` by default (`--no-reload` to disable)
- `pyrpc dev --yes` / `--module` / `--client` — fully non-interactive setup for CI and scripts
- `pyrpc dev --reconfigure` — re-run the setup wizard, pre-filling current values
- `pyrpc watch` — type-watcher only, no server started
- Watcher reloads edited modules (`importlib.reload`) so regenerated types reflect the latest code
- `pyrpc serve` — standalone server
- `pyrpc version`, `pyrpc inspect`, `pyrpc pull`
- Daemon-first design: JSON pipe (stdio) for Python ↔ TypeScript communication
- 715× speedup via persistent npx daemon
- Auto adapter installation (`npm install @pyrpc/<adapter>` on first run)

### Config (v0.10.0 → v0.11.x)

- `pyrpc.json` — dedicated config (replaces `[tool.pyrpc]` in pyproject.toml)
- Zero-config setup: the `pyrpc dev` wizard writes `pyrpc.json` on first run, then never runs again
- Fields: `module`, `framework` (auto-detected), and `client` (single root) or `clients` (list) — no `output`, `entrypoint`, or `client_root`
- Multi-client support (v0.11.0): one schema, many TypeScript frontends; types generated per client
- Generated types live at `<client>/__pyrpc.d.ts` in the user's source tree — committed, diffable, never in `node_modules`
- tsconfig paths injected surgically by `pyrpc_core/tsconfig.py` via jsonc-edit (idempotent, preserves comments, raises on conflicting aliases)
- The dev loop watches `pyrpc.json` itself and re-wires when module or clients change

### Docs & publishing

- Fumadocs documentation site with guides, API reference, and blog
- npm: `@pyrpc/types`, `@pyrpc/client`, `@pyrpc/react`, `@pyrpc/next`, `@pyrpc/vue`, `@pyrpc/svelte`
- PyPI: `pyrpc-core`, `pyrpc-codegen`, `pyrpc-fastapi`, `pyrpc-flask`, `pyrpc-django-adapter`
- GitHub Actions CI: API-token PyPI publish, npm publish on tag push
- Architecture diagrams via LikeC4

## Near-term

- **Middleware hooks** — request/response middleware at the core level (auth, logging, rate limiting as user-space patterns)
- **Typed errors** — user-defined error codes and data shapes that flow from Python procedures through codegen into `PyRPCError` on the TypeScript side
- **Performance benchmarks** — baseline latency and throughput numbers per adapter, with a repeatable benchmark suite

## Longer-term

- **WebSocket transport** — persistent connection with JSON-RPC 2.0 over WebSocket
- **Subscription support** — server-push procedures via the WebSocket transport
- **Context propagation** — request-scoped context that flows through procedure chains
- **Plugin system** — user-space plugins that hook into core events without modifying core
- **OpenTelemetry integration** — trace spans at adapter and core boundaries

## Non-goals

These are things pyRPC will explicitly not become:

| Ask | Why not |
|-----|---------|
| GraphQL-like query language | pyRPC is an RPC system, not a query engine. Adding field selection, query ASTs, or a schema DSL would duplicate GraphQL with less ecosystem support. |
| Streaming-first transport | Streaming is planned (WebSocket) but pyRPC will not be built around streaming primitives. Request-response is the default. |
| Auth system in core | Authentication belongs at the framework or middleware level. Core will provide hooks but not ship auth primitives, user models, or session management. |
| Schema-first workflow | pyRPC types derive from Python code, not from a schema file. There will be no `schema.py` to edit, no codegen-first workflow. |
| Full gRPC replacement | pyRPC does not aim to support bidirectional streaming, HTTP/2 push, or the full gRPC service contract. JSON-RPC 2.0 is the protocol. |
| Monorepo scaffolding | pyRPC will not ship `create-pyrpc-app` or template generators. The examples directory shows project structure without enforcing it. |
| Database ORM or migration tooling | pyRPC is an RPC layer, not a data layer. It does not care how data is stored or migrated. |
| CLI-managed deployment | `pyrpc serve` is for development. Production deployment is the user's responsibility (Docker, serverless, etc.). |
