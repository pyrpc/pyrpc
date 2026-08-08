import Link from 'next/link'

export default function FastApiNextJsTutorialPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    FastAPI + Next.js: RSC prefetch with a Python backend
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 8, 2026 at 9:30am</time>
                    <span>&middot;</span>
                    <span>12 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Next.js App Router adds one capability that plain React doesn't have: Server Components can prefetch data before the page is sent to the browser. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/next</code> plugs directly into that pattern — <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.prefetch</code> warms the TanStack cache on the server, and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.HydrationBoundary</code> hands it to the browser. Client components call <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code> and see instant data with no loading state.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Project layout</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`fastapi-nextjs/
  server/
    main.py               ← FastAPI app (identical to fastapi-react server)
    pyrpc.json
  client/
    lib/pyrpc.ts          ← createNextClient
    app/
      layout.tsx          ← RootLayout + Providers
      providers.tsx       ← "use client" QueryClient + api.Provider
      page.tsx            ← Server component: prefetch
      counter.tsx         ← Client component: useQuery/useMutation`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The server (unchanged)</h2>
                <p>The FastAPI server is identical to the React example — the backend doesn't know or care which frontend framework you use.</p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pyrpc_core import rpc
from pyrpc_fastapi import mount_fastapi

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@rpc.query
def read_root(): return {"Hello": "World"}

@rpc.query
def read_item(item_id: int, q: str = None): return {"item_id": item_id, "q": q}

@rpc.mutation
def create_item(name: str, description: str = None):
    return {"name": name, "description": description, "created": True}

mount_fastapi(app)`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Client setup</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// lib/pyrpc.ts
import { createNextClient } from "@pyrpc/next"
import type { Types } from "@pyrpc/types"

export const api = createNextClient<Types>({
  baseUrl: process.env.PYRPC_URL ?? "http://localhost:8000",
})`}
                </pre>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// app/providers.tsx
"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { api } from "@/lib/pyrpc"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider>{children}</api.Provider>
    </QueryClientProvider>
  )
}`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Server component — prefetch</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// app/page.tsx
import { api } from "@/lib/pyrpc"
import { Counter } from "./counter"

export default async function Page() {
  // warm the cache before the HTML is sent
  await api.prefetch.read_root()
  await api.prefetch.read_item({ item_id: 42, q: "test" })

  return (
    <api.HydrationBoundary state={api.dehydrate()}>
      <Counter />
    </api.HydrationBoundary>
  )
}`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Client component — hooks</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// app/counter.tsx
"use client"
import { api } from "@/lib/pyrpc"
import { useState } from "react"

export function Counter() {
  const [name, setName] = useState("")

  // already in cache — renders without a loading state
  const { data: greeting, isLoading } = api.read_root.useQuery()
  const { data: item } = api.read_item.useQuery({ item_id: 42, q: "test" })
  const createItem = api.create_item.useMutation()

  return (
    <div>
      {isLoading ? <p>Loading…</p> : <pre>{JSON.stringify(greeting)}</pre>}
      <pre>{JSON.stringify(item)}</pre>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button onClick={() => createItem.mutate({ name, description: \`Item: \${name}\` })}
              disabled={createItem.isPending}>
        {createItem.isPending ? "Creating…" : "Create"}
      </button>
      {createItem.isSuccess && <pre>{JSON.stringify(createItem.data)}</pre>}
    </div>
  )
}`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Run it</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# Terminal 1
cd server && uv add pyrpc-core[fastapi] && pyrpc dev

# Terminal 2
cd client && npm install && npm run dev`}
                </pre>
                <p>
                    Open <strong>http://localhost:3000</strong>. The greeting and item data render instantly — no loading spinner — because the server prefetched them before shipping the HTML. The create form works client-side as a normal mutation.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">When to skip prefetch</h2>
                <p>
                    Prefetch is optional. If you don't call <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.prefetch</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code> fetches on mount exactly like plain React — still fully typed, just no server warm-up.
                </p>
            </section>
        </article>
    )
}
