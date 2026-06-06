# @pyrpc/client

Universal TypeScript client for [pyRPC](https://pyrpc.com). Type-safe RPC calls to your Python backend - install, import, call.

## Installation

```bash
npm install @pyrpc/client
# or
pnpm add @pyrpc/client
# or
bun add @pyrpc/client
```

On install, `@pyrpc/client` runs a `postinstall` script that prompts you to choose a **distribution mode**:

- **Workspace** — types are written by the server-side `pyrpc dev` / `pyrpc codegen` commands.
- **Server** — types are fetched from a running server at `npx pyrpc sync` time.

CI / non-TTY environments skip the prompt silently. Re-run with `npx pyrpc sync` to generate types later.

## Usage

```typescript
import { createClient, type Types } from "@pyrpc/client";

const client = createClient<Types>({
  baseUrl: "https://api.example.com",
});

const user = await client.get_user(1);
console.log(user.name); // Fully typed - no manual type definitions needed
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

## CLI — `npx pyrpc sync`

After install, you can sync types from a server distribution:

```bash
npx pyrpc sync
```

Reads `pyrpc-client.json` and behaves according to the configured distribution:

- **workspace** — prints "Nothing to sync — server writes types directly."
- **server** — fetches schema from the configured `server_url` and regenerates `@pyrpc/types/src/index.ts`.

Run `npx pyrpc --help` for options.

## API

### `createClient<T>(options?)`

Creates a proxy client that forwards method calls to the server. The generic parameter `T` is your `Types` interface for full type safety.

- `baseUrl` - Server root URL (defaults to `window.location.origin` in browsers)
- `headers` - Static or async `HeadersInit`

**Note:** There is no `.rpc` property. Call methods directly on the client object.

## Keywords

rpc, pyrpc, typescript, client, type-safe, api, remote-procedure-call

## License

MIT
