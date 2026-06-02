# pyRPC System Design

> **What is this?** A hand-holding walkthrough of how pyRPC works — from Python annotations to TypeScript type safety. Each document explains not just *what* happens, but *why* it's designed that way, where we took inspiration from, and how it compares to tools like tRPC, Prisma, and better-auth.

## The Core Problem

**Python backend** wants to talk to a **TypeScript frontend** with full type safety. But Python and TypeScript are different languages — you can't use TypeScript's `typeof` operator on a Python function.

```python
# Python server — types are real Python types
@rpc
def add(a: int, b: int) -> int: ...
```

```typescript
// TypeScript client — needs TypeScript types
const result = await client.add(1, 2);
//              ^? Should be typed as Promise<number>
```

**How do we bridge this gap?** This is what pyRPC solves.

## Inspiration from the Ecosystem

| Tool | Approach | Language Boundary | What we learned |
|---|---|---|---|
| **tRPC** | Pure `typeof` inference | TS ↔ TS | The dev experience: one import, full type safety, zero boilerplate. **Can't use directly** (we're Python ↔ TS). |
| **Prisma** | CLI codegen (`prisma generate`) | Prisma DSL ↔ TS | How to generate types across languages. The `--watch` pattern for auto-regeneration. |
| **better-auth** | Plugin-based inference | TS ↔ TS | Clean plugin architecture for type bridging. |
| **FastAPI** | Pydantic → OpenAPI → codegen | Python ↔ TS | Inspiration for using Pydantic's JSON Schema as the bridge format. |

## Documents

| # | Title | What it covers |
|---|---|---|
| **1** | [Architecture Overview](./01-architecture-overview.md) | High-level picture: packages, language boundaries, the three paths to type safety |
| **2** | [Type Generation Flow](./02-type-generation-flow.md) | How `int` becomes `number`: the full pipeline from `@rpc` to `import type { Types }` |
| **3** | [Server Internals](./03-server-internals.md) | Procedure compilation, registry, introspection, ASGI transport |
| **4** | [Client Internals](./04-client-internals.md) | The `Proxy` pattern, `createClient<TTypes>`, why we removed `.rpc.` access |
| **5** | [Data Flow](./05-data-flow.md) | Request/response lifecycle, validation, error handling — from button click to database |
| **6** | [Deployment & Runtime](./06-deployment-considerations.md) | Monorepo vs separate projects, watchers, CI/CD, runtime vs compile-time |

## Quick Navigation

- **If you're new:** Start with [Architecture Overview](./01-architecture-overview.md)
- **If you want to understand types:** Jump to [Type Generation Flow](./02-type-generation-flow.md)
- **If you're debugging the client:** Read [Client Internals](./04-client-internals.md)
- **If you're deploying:** See [Deployment & Runtime](./06-deployment-considerations.md)

> **Note:** The `system-design/` folder is gitignored — it's documentation for developers, not part of the published package.
