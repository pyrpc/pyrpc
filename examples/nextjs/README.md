# pyRPC Next.js example

Full App Router demo using `createNextClient` from `@pyrpc/next` + `@pyrpc/react` + TanStack Query.

## Run

Terminal 1 — Python API:

```bash
uv run python examples/nextjs/server.py
```

Terminal 2 — Next.js (from repo root after `npm install`):

```bash
npm run dev --workspace=pyrpc-nextjs-example
```

Open http://localhost:3000

The page prefetches `greet` / `get_status` on the server, hydrates into the client, and demonstrates a mutation.
