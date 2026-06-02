# PYRPC.md

pyRPC loads `PYRPC.md` from the repo root as project memory. This file is also the living architecture document for contributors and AI agents.

## Project

pyRPC  -  type-safe RPC for Python and TypeScript.

| Property | Value |
|----------|-------|
| Package manager | `uv` (Python) + `npm` (TypeScript) |
| Publish targets | PyPI + npm |
| Protocol | JSON-RPC 2.0 |
| Runtime validation | Pydantic v2 |
| Python min version | 3.11 |
| Node min version | 20 |

### Packages

| Package | Ecosystem | Description |
|---------|-----------|-------------|
| `pyrpc-core` | PyPI | Protocol, router, execution, validation |
| `pyrpc-fastapi` | PyPI | FastAPI adapter |
| `pyrpc-flask` | PyPI | Flask adapter |
| `pyrpc-codegen` | PyPI | TypeScript code generation library |
| `pyrpc-core` | PyPI | Runtime + CLI (serve, inspect, codegen, pull, dev) |
| `@pyrpc/client` | npm | TypeScript client |
| `@pyrpc/types` | npm | Generated type definitions (postinstall) |

## Product Thesis

pyRPC is a Python-first RPC system with TypeScript reach. It gives you type safety across the network boundary without framework lock-in.

- **Type safety across the boundary**  -  one `@rpc` decorator generates both the runtime endpoint and the TypeScript type.
- **Low ceremony**  -  no schemas, no config files, no codegen CLI required for Python-to-Python calls.
- **Framework adapters, not framework lock-in**  -  the core knows nothing about FastAPI or Flask. Adapters translate HTTP into core calls.
- **Standards-based transport**  -  JSON-RPC 2.0 is not incidental. It is the protocol contract.
- **Validation at runtime**  -  Pydantic v2 validates every parameter and return value. The type definitions in TypeScript are derived from the same introspection that powers runtime validation.

### What pyRPC is not

- A GraphQL replacement  -  no query language, no subscriptions, no field-level selection.
- A streaming framework  -  no server-sent events, no WebSocket transport (yet).
- An auth system  -  adapters may integrate with framework auth, but the core does not ship auth primitives.
- A schema-first system  -  there is no schema file to edit. Types derive from Python code.
- A monorepo scaffolding tool  -  the examples show project structure but pyRPC does not generate project boilerplate.

## Architecture

### Layering

```
┌──────────────────────────────────────────────────────────┐
│  Adapters (pyrpc-fastapi, pyrpc-flask)                    │
│  Translate framework HTTP → core Interpreter              │
├──────────────────────────────────────────────────────────┤
│  pyrpc-core                                               │
│  Protocol, router, CLI, validation, dev console            │
├──────────────────────────────────────────────────────────┤
│  pyrpc-codegen                                            │
│  Introspection → TypeScript type generation (library)     │
├──────────────────────────────────────────────────────────┤
│  @pyrpc/client (@pyrpc/types)                              │
│  TypeScript client + generated type definitions            │
└──────────────────────────────────────────────────────────┘
```

### Rules

**Core is framework-agnostic.**
`pyrpc-core` must not import FastAPI, Flask, Starlette, or any web framework. It ships the RPC protocol, router, interpreter, and Pydantic-backed validation. Any HTTP concern belongs in an adapter.

**Adapters are thin shells.**
Adapters translate framework request/response into `Interpreter.handle_request()`. They must not fork protocol behavior, add adapter-specific validation, or invent new semantics. An adapter's job is plumbing, not policy.

**JSON-RPC 2.0 is not private.**
The wire format is part of the product identity. Changing the protocol shape must be evaluated against every adapter, client, and codegen consumer. There is no internal-only protocol evolution.

**Introspection and codegen share the same truth.**
`get_registry_schema()` is the single source of truth for both runtime introspection (used by debug tools) and TypeScript code generation. Codegen must not re-invent schema extraction. If introspection changes, codegen and the TypeScript client must be evaluated together.

**Postinstall is setup, not production.**
The `@pyrpc/types` npm postinstall script handles development setup. In CI, codegen runs explicitly as a build step (`pyrpc codegen <url>`). The two paths must produce identical output for the same schema.

**Versioning is lockstep.**
All PyPI packages and all npm packages release together at the same version. Drift between Python and npm package versions is a release bug, not an inconvenience. The `scripts/release.mjs` script enforces this.

## Quality Bar

- **Core changes require tests.** Protocol, router, interpreter, and validation changes must include Python tests.
- **Adapter changes require framework-level tests.** A change to `pyrpc-fastapi` must be tested with a running FastAPI test client.
- **Codegen changes require output validation.** Changes to `ts_codegen.py` must be validated against known schema snapshots or fixture tests.
- **Client changes require TypeScript compilation and typing verification.** The `@pyrpc/client` test suite must pass and `tsc --noEmit` must succeed.
- **Docs changes require build verification.** The docs site must build without errors.
- **Breaking changes must be called out in release notes.** A breaking change is anything that requires user code changes, schema regeneration, or adapter reconfiguration.

## Releases

```
scripts/release.mjs <version>
```

- All packages release in lockstep at the same version.
- Tags use `vX.Y.Z` format (e.g., `v0.2.0`).
- Pre-releases use `-alpha.N`, `-beta.N`, or `-rc.N` suffix.
- GitHub release notes must include:
  - What changed (bullet list by subsystem)
  - Breaking changes (with upgrade steps)
  - New dependencies or minimum version changes
  - Upgrade notes for both Python and npm consumers

The release script updates `version` in all `package.json` and `pyproject.toml` files from one command.

## Testing

```bash
# Python (all packages)
uv run pytest

# TypeScript client
cd packages/client && npm test

# Docs build
cd docs && npm run build
```

- Python tests run against the installed workspace packages.
- TypeScript tests run against the local `packages/client` source.
- Framework tests (FastAPI, Flask) require the corresponding package installed.

## Contribution Policy

PRs should be scoped to one subsystem. A single PR that touches core, adapters, and codegen is hard to review and easy to break.

| Subsystem | Path | Review focus |
|-----------|------|-------------|
| Core | `packages/pyrpc-core/` | Protocol behavior, validation invariants, router semantics |
| Adapter | `packages/pyrpc-fastapi/`, `packages/pyrpc-flask/` | Correct HTTP translation, error mapping, framework integration |
| Client | `packages/client/`, `packages/types/` | TypeScript ergonomics, type inference, API surface |
| Codegen | `packages/pyrpc-codegen/` | Type mapping accuracy, output correctness, introspection alignment |
| Docs | `docs/` | Accuracy, completeness, build output |
| Release | `scripts/`, root `pyproject.toml`, root `package.json` | Version consistency, tag discipline, changelog clarity |

### Guidelines

- Small obvious fixes can go straight to PR (typos, test cleanup, refactors with identical behavior).
- Larger changes need a discussion first (open an issue or start a discussion).
- One PR equals one logical change. Avoid mixing refactors with features.
- PR titles should follow conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- Link related issues in the PR description.

## Security

pyRPC is a networking library. The attack surface includes exposed introspection endpoints, deserialization of untrusted input, and generated code that may be committed to repositories.

### Reporting

Report vulnerabilities via GitHub private advisory: https://github.com/pyrpc/pyrpc/security/advisories/new

### Scope

- Request validation bypass  -  can an attacker send a payload that skips Pydantic validation?
- Introspection leakage  -  does the `/rpc` endpoint expose more information than the user expects?
- Codegen trust  -  can generated types or client code introduce vulnerabilities into consuming projects?
- Adapter boundary  -  does an adapter expose core internals that the protocol intends to keep private?

### Rules

- Validation happens at the core interpreter boundary. Adapters must not skip or re-implement core validation.
- Introspection is opt-in. Running a pyRPC server with introspection enabled exposes procedure names and type signatures by design. Users should be aware of this.
- Error messages must not leak stack traces or internal state to clients unless explicitly configured for debugging.

## Files that reference this document

- `README.md`  -  front door, product messaging
- `CONTRIBUTING.md`  -  PR flow, development setup
- `ROADMAP.md`  -  future direction, non-goals
- `docs/`  -  canonical learning path
- `scripts/release.mjs`  -  lockstep release automation
