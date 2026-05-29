# @pyrpc/client

Universal TypeScript client for [pyRPC](https://pyrpc.dev). Type-safe RPC calls to your Python backend — install, import, call.

## Installation

```bash
npm install @pyrpc/client
```

The postinstall script in `@pyrpc/types` will prompt for your server URL and generate typed contracts automatically.

For CI, set the `PYRPC_URL` environment variable:

```bash
PYRPC_URL=https://api.example.com npm install @pyrpc/client
```

## Usage

```typescript
import { createClient } from "@pyrpc/client";
import type { Types } from "@pyrpc/types";

const client = createClient<Types>({
  baseUrl: "https://api.example.com",
});

const user = await client.get_user(1);
console.log(user.name);
```

The proxy-based API lets you call any remote procedure as a local method. Parameters are passed positionally or as a single object for named arguments.

### Dynamic headers (auth)

```typescript
const client = createClient({
  baseUrl: "https://api.example.com",
  headers: () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  }),
});
```

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

### `createClient<TTypes>(options?)`

Creates a proxy client that forwards method calls to the server.

- `baseUrl` — Server root URL (defaults to `window.location.origin` in browsers)
- `headers` — Static, dynamic, or async `HeadersInit`

## License

MIT
