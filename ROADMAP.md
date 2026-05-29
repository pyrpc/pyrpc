# pyRPC Roadmap

High-level direction and explicit non-goals for the project.

## Current (v0.1.x – v0.2.x)

- Core protocol and interpreter stability
- FastAPI and Flask adapter parity
- TypeScript client with generated types (postinstall setup)
- Working async/sync dispatch in `RPCCallable`
- Introspection endpoint and codegen alignment
- Docs site with guides, examples, and API reference

## Near-term (v0.3.x – v0.5.x)

- **Pydantic model → TypeScript interface generation**  -  emit typed interfaces for `@model` classes, not just procedure parameters.
- **File-watcher dev mode**  -  `pyrpc dev` that starts the server and regenerates types on Python file change (no HTTP polling).
- **Routers / namespaces**  -  group procedures under namespaces for larger projects.
- **Middleware hooks**  -  request/response middleware at the core level (auth, logging, rate limiting as user-space patterns).
- **Error type standardization**  -  typed error codes and error data shapes that flow through both Python and TypeScript.
- **Performance benchmarks**  -  baseline latency and throughput numbers per adapter.

## Longer-term (v0.6.x+)

- **WebSocket transport**  -  persistent connection with JSON-RPC 2.0 over WebSocket.
- **Subscription support**  -  server-push procedures via the WebSocket transport.
- **Plugin system**  -  user-space plugins that hook into core events without modifying core.
- **Context propagation**  -  request-scoped context that flows through procedure chains.
- **OpenTelemetry integration**  -  trace spans at adapter and core boundaries.

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
