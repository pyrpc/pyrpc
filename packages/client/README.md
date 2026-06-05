# @pyrpc/client

Universal TypeScript client for [pyRPC](https://pyrpc.dev). Type-safe RPC calls to your Python backend — install, import, call.

## Installation

```bash
npm install @pyrpc/client
# or
pnpm add @pyrpc/client
# or
bun add @pyrpc/client
```

## Usage

```typescript
import { createClient } from "@pyrpc/client";
import type { Types } from "@pyrpc/types";

const client = createClient<Types>({
  baseUrl: "https://api.example.com",
});

const user = await client.get_user(1);
console.log(user.name); // Fully typed — no manual type definitions needed
```

The proxy-based API lets you call any remote procedure as a local method. Parameters are passed positionally or as a single object for named arguments.

### Error handling

```typescript
import { createClient, PyRPCError } from "@pyrpc/client";

try {
  await client.delete_user(1);
} catch (error) {
  if (error instanceof PyRPCError) {
    console.error(error.code, error.message);
  }
}
```

## API

### `createClient<T>(options?)`

Creates a proxy client that forwards method calls to the server. The generic parameter `T` is your `Types` interface for full type safety.

- `baseUrl` — Server root URL (defaults to `window.location.origin` in browsers)
- `headers` — Static or async `HeadersInit`

**Note:** There is no `.rpc` property. Call methods directly on the client object.

## Keywords

rpc, pyrpc, typescript, client, type-safe, api, remote-procedure-call

## License

MIT
