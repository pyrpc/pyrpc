# pyRPC × Next.js Example

Full-stack example: FastAPI backend + Next.js App Router frontend, connected by pyRPC.

## Setup

```bash
# 1. Install Python deps — one command with the adapter included
pip install pyrpc-core[fastapi]

# 2. Install frontend deps
npm install
# postinstall automatically adds "@pyrpc/types" to tsconfig.json paths
```

## Dev workflow

```bash
# Terminal 1 — starts the FastAPI server AND keeps TypeScript types in sync
pyrpc dev
# First run: answers 2 questions, writes pyrpc.json
# Every run after: reads pyrpc.json, no questions

# Terminal 2 — Next.js dev server
npm run dev
```

That's it. Every time you add or change a Python `@rpc` procedure, `pyrpc dev` regenerates `src/__pyrpc.d.ts` within ~300ms and your TypeScript editor updates automatically.

## How types flow

```
Python @rpc decorator
  → pyrpc dev watches .py files
  → regenerates src/__pyrpc.d.ts
  → tsconfig.json paths: "@pyrpc/types" → "./src/__pyrpc.d.ts"
  → import type { Types } from "@pyrpc/types"  ✓ fully typed
```

## Project structure

```
examples/nextjs/
├── server.py          # FastAPI app with @rpc procedures
├── pyrpc.json         # Created by pyrpc dev on first run
├── src/
│   └── __pyrpc.d.ts   # Generated — do not edit by hand
├── lib/
│   └── pyrpc.ts       # The api object — import this everywhere
├── app/
│   ├── layout.tsx     # Server Component — mounts <Providers>
│   ├── providers.tsx  # 'use client' — wraps QueryClient provider
│   ├── page.tsx       # Server Component — prefetches data
│   └── greeting.tsx   # Client Component — uses hooks
└── tsconfig.json      # Has "@pyrpc/types" path alias
```

## Why providers.tsx is separate from layout.tsx

`layout.tsx` is a Server Component by default in the Next.js App Router.
Server Components cannot use `useState`, React context, or `'use client'`.
The pyRPC provider needs all three — so it lives in a separate
`providers.tsx` file marked `'use client'`, which `layout.tsx` imports.
This is the standard pattern used by tRPC, TanStack Query, and better-auth.
