# Security

pyRPC runs your Python functions, exposes them over HTTP, and generates TypeScript code - so security bugs matter. If you find one, please tell us before posting it publicly.

## Reporting

Send a private advisory on GitHub:

https://github.com/pyrpc/pyrpc/security/advisories/new

Include:

- What the issue is and what it lets an attacker do
- Steps to reproduce (a small PoC is great)
- Version, OS, arch

We will get back to you within a few days. Once it is fixed, we will credit you in the release notes - unless you would rather stay anonymous.

Please do not open a public GitHub issue for security reports.

## Supported Versions

Until 1.0.0, only the latest minor release receives security fixes. Right now that is 0.1.x.

Pre-release versions (alpha, beta, rc) get best-effort evaluation with no SLA.

## What is in Scope

- **Core protocol layer** in `packages/pyrpc-core/` - JSON deserialization, Pydantic validation, procedure dispatch
- **Adapter boundary** in `packages/pyrpc-fastapi/`, `packages/pyrpc-flask/` and `packages/pyrpc-django-adapter/` - how HTTP requests become core calls
- **Generated code** in `packages/pyrpc-codegen/` - TypeScript type output that must not contain executable code
- **Introspection endpoint** - `GET /rpc` exposes procedure names and type signatures; leaking information is in scope
- **Error responses** - stack traces or internal paths must not leak to clients

## What is Not in Scope

- Bugs in upstream dependencies (FastAPI, Flask, Pydantic, httpx, etc.) - report those upstream. We will ship the fix once it is released.
- Anything that needs an already-compromised machine or a local attacker with shell access
- Older versions (before the latest stable release)

## What We Do to Keep Things Safe

- **Validation at the boundary.** All RPC input is validated through Pydantic at the core interpreter layer. Adapters must not skip or re-implement this validation.
- **No executable codegen output.** The TypeScript codegen emits type definitions only - no runtime code, no eval, no dynamic imports.
- **Introspection is opt-in.** The `GET /rpc` endpoint is served when you mount an adapter. You can disable it at the server level.
- **Error messages are safe by default.** Stack traces and internal state require explicit opt-in to be exposed in responses.
- **Dependency CVEs are prioritized.** Security updates in dependencies get expedited release queue placement.

## What We Cannot Promise

pyRPC runs whatever Python code you (or your users) register with `@rpc`. If a procedure deletes files or exposes sensitive data, that is the procedure author's responsibility - pyRPC does not sandbox user code.

The introspection endpoint reveals the full surface area of your API. Treat it like you would an OpenAPI schema in production: control access at the reverse proxy or network level.

Generated types are consumed by your frontend build. If the codegen output is committed to your repository, treat it like any other generated artifact - review changes in PRs.
