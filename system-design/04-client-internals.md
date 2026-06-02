# 4. Client Internals

## Package Structure

```
packages/client/src/
│
├── index.ts       # Barrel: re-exports createClient, PyRPCError, types
├── client.ts      # PyRPCClient class + createClient<TTypes>() factory
├── types.ts       # RpcRequest, RpcResponse, ClientOptions
├── error.ts       # PyRPCError class
└── client.test.ts # Vitest tests (mocked fetch)
```

## The Proxy Architecture (Two Layers)

The entire client is built on JavaScript's `Proxy`. There are two layers:

### Layer 1: The `rpc` getter (method → HTTP routing)

```typescript
// client.ts:77-90
public get rpc(): any {
  return new Proxy({}, {
    get: (_, method: string) => {
      return (...args: any[]) => {
        // Smart parameter detection:
        //   client.add(1, 2)       → positional: [1, 2]
        //   client.getUser({id:1}) → named: {id: 1}
        const params = (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0]))
          ? args[0]   // named params
          : args;     // positional params
        return this.request(method, params);
      };
    }
  });
}
```

This creates a Proxy where **any property access** returns a function that sends an RPC request. `this.rpc["add"]` returns `(1, 2) => POST /rpc`.

### Layer 2: The `createClient` proxy (API surface)

```typescript
// client.ts:96-106
export function createClient<TTypes = any>(options: ClientOptions = {}): PyRPCClient & TTypes {
  const client = new PyRPCClient(options);

  return new Proxy(client, {
    get(target, prop: string, receiver) {
      // BLOCK: don't expose the internal rpc getter
      if (prop === 'rpc') return undefined;

      // PASSTHROUGH: client properties like baseUrl
      if (prop in target) return Reflect.get(target, prop, receiver);

      // RPC METHOD: everything else goes to the rpc proxy
      return target.rpc[prop];
    }
  }) as any;
}
```

### How property access resolves:

```
                    ┌─ "add" → NOT in PyRPCClient
                    │           → target.rpc["add"] → POST /rpc
                    │
                    ├─ "greet" → NOT in PyRPCClient
                    │            → target.rpc["greet"] → POST /rpc
                    │
client.XXX ─────────┼─ "baseUrl" → IN PyRPCClient
                    │              → Reflect.get → returns "http://..."
                    │
                    ├─ "rpc" → SPECIAL CASE → returns undefined
                    │
                    └─ anything else → NOT in PyRPCClient
                                     → target.rpc[prop] → POST /rpc
```

### Why `client.rpc.add()` doesn't work (and shouldn't)

tRPC uses `trpc.greet.query(...)` — the `.query()` suffix identifies the procedure type (query vs mutation). pyrpc doesn't have query/mutation distinction — ALL procedures are just methods you call directly: `client.add(1, 2)`.

The old code let `client.rpc.add(1, 2)` work because `rpc` was a property on PyRPCClient that the outer proxy passed through. This was confusing — two ways to call the same thing.

**The fix:** The outer proxy now returns `undefined` for `prop === 'rpc'`, making `client.rpc` inaccessible.

```
// ❌ OLD — two ways to call:
client.add(1, 2)      // works
client.rpc.add(1, 2)  // also works (confusing!)

// ✅ NEW — one way:
client.add(1, 2)      // works
client.rpc.add(1, 2)  // TypeError: client.rpc is undefined
```

This matches tRPC's pattern where you call methods on the client directly.

---

## The Generic Type Parameter

```typescript
createClient<TTypes = any>
```

**Without the generic:** `TTypes = any`, so the returned client has no type information:
```typescript
const client = createClient({ baseUrl: "..." });
// client.add(1, 2) → Promise<any> (no type safety)
```

**With the generic:** `TTypes = Types` constrains the proxy:
```typescript
import type { Types } from "@pyrpc/types";
const client = createClient<Types>({ baseUrl: "..." });
// client.add(1, 2) → Promise<number> ✅
// client.add("x")  → TypeScript error ❌
```

**How it works internally:**

The return type is `PyRPCClient & TTypes` — an intersection type. TypeScript sees:
- `client.baseUrl` → from `PyRPCClient` ✅
- `client.add` → from `TTypes` (which is `Types`) ✅
- `client.rpc` → from `PyRPCClient` (but we return undefined at runtime — the type still shows it in TS, but accessing it gives `undefined`)

**Note on `client.rpc` type vs runtime:** TypeScript still types `client.rpc` based on the `PyRPCClient` class (which defines a `get rpc()`). But at runtime, the proxy intercepts it and returns `undefined`. This is a deliberate trade-off: the type says it exists (for TypeScript compatibility), but at runtime it's blocked. We could make it fully private with a `#` prefix in the future.

---

## The `request()` Method — Wire Protocol

```typescript
// client.ts:38-72
private async request<T>(method: string, params: any): Promise<T> {
  // 1. Build the JSON-RPC envelope
  const body = {
    id: Math.random().toString(36).substring(7),  // unique request ID
    method,                                         // e.g., "add"
    params,                                         // e.g., [1, 2] or {a: 1, b: 2}
  };

  // 2. Merge default headers with user headers
  const headers = {
    'Content-Type': 'application/json',
    ...userHeaders,   // supports both static and dynamic (function) headers
  };

  // 3. Send POST to the RPC endpoint
  const response = await fetch(`${this.baseUrl}/rpc`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  // 4. Parse response
  const data = await response.json();

  // 5. Check for server-side error
  if (data.error) {
    throw new PyRPCError(data.error.code, data.error.message, data.error.data);
  }

  // 6. Return result (trust the server)
  return data.result as T;
}
```

**Important:** The `as T` cast is a TypeScript type assertion. There is NO runtime validation of the response on the client side. The client trusts the server returns the correct shape. This is the same design as tRPC.

---

## Header Configuration

The client supports both static and dynamic headers:

```typescript
// Static headers
const client = createClient({
  baseUrl: "http://localhost:8000",
  headers: { Authorization: "Bearer token123" },
});

// Dynamic headers (function, called on every request)
const client = createClient({
  baseUrl: "http://localhost:8000",
  headers: () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  }),
});

// Async dynamic headers
const client = createClient({
  baseUrl: "http://localhost:8000",
  headers: async () => {
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  },
});
```

This is useful for auth tokens that expire and need refreshing.

---

## `@pyrpc/types` — The Placeholder Package

The `@pyrpc/types` npm package serves two purposes:

### 1. Placeholder (so imports don't fail before codegen)

```typescript
// packages/types/src/index.ts
export type Types = Record<string, never>;
```

Before codegen runs, `import type { Types } from "@pyrpc/types"` works but resolves to an empty object type — no methods exist. This prevents TypeScript errors during initial setup.

### 2. Postinstall script (first-time type generation)

```javascript
// packages/types/postinstall.js
function main() {
  if (isInteractive) {
    // Prompt user for backend URL
    const url = await question("Backend URL (default: http://localhost:8000): ");
    // Fetch GET /rpc
    const schemas = await fetchSchema(url);
    // Generate Types interface
    const code = generate(schemas);
    // Write to node_modules/@pyrpc/types/src/index.ts
    fs.writeFileSync(TYPES_FILE, code);
  }
}
```

### After codegen runs, the file gets replaced:

```typescript
// node_modules/@pyrpc/types/src/index.ts (generated)
export interface Types {
  add(a: number, b: number): Promise<number>;
  greet(name: string): Promise<string>;
  process(items: number[], flag: boolean): Promise<Item | null>;
  get_user(id: number): Promise<User>;
}
```

---

## Runtime Type Safety: What's Guaranteed

| Phase | What happens | Type checks? |
|---|---|---|
| **You type `client.add(1, 2)`** | IDE shows autocomplete, TS checks types against `Types` | ✅ Yes |
| **You run `tsc`** | Compiler error if you call a non-existent method or wrong params | ✅ Yes |
| **Browser runs JS** | Proxy intercepts, sends `POST /rpc`, receives JSON | ❌ No (erased) |
| **Server receives request** | Pydantic validates param types | ✅ Yes |

**The key insight: TypeScript types are compile-time only.** Once compiled to JavaScript:
- The `Types` interface is completely gone (zero bytes in the bundle)
- The generic `TTypes` is erased
- The Proxy routes method names as strings to `POST /rpc`
- Values are plain JSON objects — no type enforcement

This is the same as tRPC. Type safety comes from TypeScript, not from runtime checks on the client.
