# 6. Deployment & Runtime Considerations

## When Does Codegen Run? (And Who Runs It?)

Code generation is **not automatic** — there's no background watcher (yet). You (or your CI pipeline) run it explicitly. Here's when and why:

| When | How | Who runs it |
|---|---|---|
| **npm install** | `postinstall.js` prompts for URL → fetches schema → writes types | The developer (first-time setup) |
| **During development** | `pyrpc codegen http://localhost:8000` after changing server code | The developer |
| **In CI/CD** | `pyrpc pull app.main` then `pyrpc codegen schema.json` | The CI pipeline |
| **After deployment** | `pyrpc codegen https://api.example.com` from anywhere | Anyone who needs types |

### What about a background watcher? (Let's discuss)

The user asked about adding a background watcher, like Prisma's `prisma generate --watch`. Here are the options:

#### Option 1: File Watcher (`pyrpc codegen --watch`)

```
pyrpc codegen --watch pyrpc-schema.json
  │  Watches the JSON file for changes
  │  When the file changes → regenerates TypeScript types
```

**Pros:** Simple, explicit, matches Prisma's model  
**Cons:** Only works with file-based schema, not HTTP URLs

#### Option 2: Server-Side Watcher (`pyrpc serve --watch-schema`)

```
pyrpc serve app.main --watch-schema
  │  Starts a file watcher on the Python module
  │  When @rpc definitions change → auto-rebuilds schema
  │  Optionally writes to a file or pushes to clients
```

**Pros:** Automatically detects server-side changes  
**Cons:** Complex to implement, needs to know where the client expects types

#### Option 3: Internal Package Watcher

```
Python package (installed)
  │  When you do: pip install pyrpc-core
  │  It installs a background service that watches your @rpc code
```

**Pros:** Seamless, always running  
**Cons:** Heavy, unexpected background process, security concerns

#### Our recommendation (for now):

**Don't add a watcher yet.** Here's why:

1. **TypeScript types are compile-time only.** A watcher doesn't add runtime value — it only saves you from running `pyrpc codegen` manually. That's a convenience, not a correctness issue.

2. **The developer workflow is already fast:**
   ```
   # Terminal 1: server
   pyrpc serve app.main --reload
   
   # Terminal 2: after changing server code
   pyrpc codegen http://localhost:8000
   ```

3. **CI doesn't need a watcher.** CI runs `pyrpc pull` once and generates types — it's a single step in the pipeline.

4. **We'd want to get the DX right first.** If we add a watcher, it should be invisible, reliable, and cross-platform. That's a significant engineering effort.

**Future possibility:** A `pyrpc codegen --watch` flag that watches the server's `GET /rpc` endpoint and regenerates when the schema changes (e.g., by comparing a hash). This would be the most useful form.

---

## Does `pyrpc pull` Generate a Visible `pyrpc-schema.json` File?

**Yes, it does — but only when you explicitly ask for it.**

```
pyrpc pull app.main -o pyrpc-schema.json
#         ^^^^^^^^   ^^^^^^^^^^^^^^^^^^^^
#         module      output file (default: pyrpc-schema.json)
```

The JSON file is an **intermediate artifact** — like a `package-lock.json` or a compiled binary. You can:
- **Check it into git** (so clients can generate types without running Python)
- **Use it in CI** (pass it between build stages)
- **Ignore it** and use `pyrpc codegen http://...` instead (no file needed)

**You don't need to use `pyrpc pull` at all.** The simpler flow is:

```
# If you have a running server:
pyrpc codegen http://localhost:8000

# This combines "pull" (GET /rpc) and "codegen" in one step
```

The two-step flow (`pull` → `codegen`) exists for CI when:
1. The server and client build in different pipelines
2. You want to commit the schema to git for visibility
3. You don't want to run a server in CI

---

## `pyrpc pull` vs `pyrpc codegen http://...` — Same Thing, Different Packages

**They do the same thing: extract schema, generate types.**

```
pyrpc pull app.main -o schema.json    pyrpc codegen http://localhost:8000
       │                                        │
       │  Needs Python locally                  │  Any machine with HTTP access
       │  + app.main importable                 │  + a running server
       │                                        │
       ▼                                        ▼
  get_registry_schema() ── same ──►  GET /rpc returns same data
       │                                        │
       ▼                                        ▼
  writes schema.json ── intermediate ──► (no file — directly reads HTTP)
       │                                        │
       ▼                                        ▼
  pyrpc codegen schema.json                     │
       │                                        │
       └────────── both run ────────────────────┘
                    │
                    ▼
            _pytype_to_ts() + Jinja2
                    │
                    ▼
            TypeScript interface written to disk
```

### So which one should you use?

| You have... | Use this command |
|---|---|
| A running local server | `pyrpc codegen http://localhost:8000` |
| A remote server | `pyrpc codegen https://api.example.com` |
| Python + the module locally, no server | `pyrpc pull app.main -o schema.json` then `pyrpc codegen schema.json` |
| A JSON schema file from someone else | `pyrpc codegen schema.json` |

**They're not redundant — they're different tools for different situations.** Both produce the same TypeScript types in the end.

---

## tRPC's Approach: Why It's Different

tRPC does NOT have codegen, pull, or watchers. Here's how it works:

```typescript
// SERVER (TypeScript)
const appRouter = t.router({
  greet: t.procedure.input(z.string()).query(({ input }) => `Hello ${input}`),
});
export type AppRouter = typeof appRouter;  // ← THIS is the "codegen"

// CLIENT (TypeScript)
import type { AppRouter } from '../server';
const trpc = createTRPCClient<AppRouter>();
```

**Types flow for free** because both sides are TypeScript. No JSON serialization, no type mapping, no CLI command.

**Why pyrpc can't do this:** Python and TypeScript are different languages. TypeScript can't `typeof` a Python function. You MUST serialize type information through JSON.

**File structure in tRPC:** tRPC recommends but doesn't enforce:
```
server/
  trpc.ts       # initTRPC (one-time setup)
  appRouter.ts  # all procedures + export type AppRouter
  index.ts      # HTTP server
client/
  index.ts      # createTRPCClient<AppRouter>
```

The router file must export the type (`export type AppRouter = typeof appRouter`) so the client can import it. This is the only structural requirement.

**No watcher needed:** Since types are just TypeScript, your IDE (via ts-server) instantly reflects changes. Change a procedure's return type, and the client code immediately shows errors — no build step, no watcher.

---

## Deployed Server (No Monorepo)

The user said: "when I say deployed I don't mean CI/CD. I just mean it's not a monorepo, but it still doesn't matter since the local client still makes a request to the URL and rpc endpoint with a GET and it serves the type defined for that."

**This is correct.** If your server is deployed at `https://api.example.com`:

```bash
# On ANY machine:
pyrpc codegen https://api.example.com
#   → GET https://api.example.com/rpc
#   → Receives the current schema from the running server
#   → Generates TypeScript types
```

The generated types match the **currently deployed** server. If you deploy a new version, you re-run codegen. The types are always a snapshot of what's deployed.

**This works even without a monorepo.** The server doesn't need to share code with the client. The `GET /rpc` endpoint is the contract.

---

## Comparison: pyrpc vs tRPC vs Prisma

| Aspect | **pyRPC** | **tRPC** | **Prisma** |
|---|---|---|---|
| **Languages** | Python ↔ TS | TS ↔ TS | Prisma DSL ↔ TS |
| **Type origin** | Python annotations | `typeof appRouter` | `schema.prisma` file |
| **How types cross** | JSON serialization → codegen | TypeScript `import type` | CLI codegen |
| **CLI command?** | Yes (`pyrpc codegen`) | No | Yes (`prisma generate`) |
| **Watch mode?** | No (planned: `--watch`) | N/A | Yes (`--watch`) |
| **Monorepo needed?** | No (JSON/HTTP is the contract) | Yes (needs `import type`) | No |
| **Runtime validation** | Server-side Pydantic | Client-side Zod (optional) | Client-side Prisma |
| **Client dependencies** | Zero | `@trpc/server` types | Prisma Client runtime |
| **Codegen visibility** | `pyrpc-schema.json` is optional | No generated files | `prisma/` directory is generated |
| **File structure enforced?** | No | No (recommended only) | Yes (schema file location matters) |

### Which approach is "best"?

There's no single best approach — it depends on your stack:

| If you have... | Use... |
|---|---|
| **TypeScript on both sides** | **tRPC** — zero codegen, pure inference, best DX |
| **Python backend, TS frontend** | **pyRPC** — codegen across languages, Pydantic validation |
| **Strongly-typed database layer** | **Prisma** — schema-first DSL, powerful queries |

**For pyRPC specifically:** We follow the Prisma model (codegen from a schema) because we MUST — Python types can't be inferred in TypeScript. But the developer experience (the `import type { Types }` + `createClient<TTypes>()` pattern) is modeled after tRPC.

---

## Type Safety Boundaries: What's Trusted Where

```
┌─ TypeScript Compile Time ─────────────────────┐
│                                                 │
│  import type { Types } from "@pyrpc/types"     │
│  createClient<Types>({ baseUrl })              │
│                                                 │
│  ✅ client.add(1, 2)     → checked against     │
│  ❌ client.add("x")      → Types interface     │
│  ❌ client.nonexistent() → Types interface     │
│                                                 │
│  The Types interface is the SOURCE OF TRUTH    │
│  for what the client can call.                 │
│                                                 │
└─────────────────────────────────────────────────┘
                      │ Trust: "types match the server"
                      ▼
┌─ JavaScript Runtime (Client) ──────────────────┐
│                                                 │
│  Proxy intercepts method name as string         │
│  Sends POST /rpc with raw JSON                 │
│  Receives JSON response                        │
│  Returns data.result as T (type assertion)     │
│                                                 │
│  ⚠️ NO runtime validation of response shape    │
│  ⚠️ If server returns wrong shape → runtime bug│
│                                                 │
└─────────────────────────────────────────────────┘
                      │ Trust: "server validates input"
                      ▼
┌─ Python Runtime (Server) ──────────────────────┐
│                                                 │
│  Pydantic TypeAdapters validate:               │
│    • Parameter types match annotations ✅       │
│    • Return types match annotations ✅          │
│                                                 │
│  Function business logic runs                   │
│  Returns result or error                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

### What happens when types are out of sync:

**Scenario:** Server changes `add(a: int) -> int` to `add(a: int, b: int) -> int`, client doesn't regenerate.

```typescript
// Client still uses OLD types:
await client.add(1);
// POST {"method": "add", "params": [1]}
```

```python
# Server expects NEW signature:
def add(a: int, b: int) -> int:
    ...
```

```
Server receives: {"method": "add", "params": [1]}
sig.bind(1) → TypeError: missing required argument 'b'
→ Returns: {"error": {"code": -32602, "message": "Invalid params"}}
→ Client throws PyRPCError
```

**No crash — just a runtime error.** The same as calling any REST API with wrong params.

---

## Adding `.gitignore` Entry

The `system-design/` folder should be gitignored — it's local documentation for developers, not part of the published package:

```gitignore
# .gitignore
system-design/
```

This is already done in the project's `.gitignore`.
