import Link from 'next/link'

export default function FastApiReactTutorialPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    FastAPI + React: full-stack type safety from zero
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 8, 2026 at 9:00am</time>
                    <span>&middot;</span>
                    <span>10 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">fastapi-react</code> example is the most direct way to understand what pyRPC does. You write Python functions, decorate them with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.query</code> or <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.mutation</code>, and the React side gets fully typed <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code> hooks — no schema file, no codegen step you have to run manually.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Prerequisites</h2>
                <p>You need Python 3.11+, Node 18+, and either <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">uv</code> or <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pip</code>.</p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Project layout</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`fastapi-react/
  server/
    main.py           ← FastAPI app + pyRPC procedures
    pyrpc.json        ← written by pyrpc dev on first run
  client/
    src/
      pyrpc.ts        ← createReactClient setup
      index.tsx       ← api.Provider wraps the app
      App.tsx         ← useQuery / useMutation calls`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 1 — the server</h2>
                <p>
                    Three procedures: <strong>two queries</strong> (read operations) and <strong>one mutation</strong> (write operation). The decorator kind is the only thing that differs — pyRPC uses it to generate the right hook type on the frontend.
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# server/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pyrpc_core import rpc
from pyrpc_fastapi import mount_fastapi

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@rpc.query
def read_root():
    return {"Hello": "World"}

@rpc.query
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}

@rpc.mutation
def create_item(name: str, description: str = None):
    return {"name": name, "description": description, "created": True}

mount_fastapi(app)`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 2 — start pyrpc dev</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`cd server
uv add pyrpc-core[fastapi]
pyrpc dev`}
                </pre>
                <p>
                    First run: a 2-question wizard writes <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc.json</code>. Every run after: reads that file automatically. If you want to skip the wizard entirely:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# auto-detect module and output
pyrpc dev --yes

# fully explicit — CI-safe
pyrpc dev --yes --module main --output ../client/src/__pyrpc.d.ts`}
                </pre>
                <p>
                    pyRPC starts uvicorn on <strong>:8000</strong>, writes <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">src/__pyrpc.d.ts</code> in the client, and re-generates it on every <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.py</code> save.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 3 — client setup</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# src/pyrpc.ts
import { createReactClient } from "@pyrpc/react"
import type { Types } from "@pyrpc/types"

export const api = createReactClient<Types>({
  baseUrl: process.env.REACT_APP_API_URL ?? "http://localhost:8000",
})`}
                </pre>
                <p>
                    Wrap the root component with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.Provider</code> — this is the TanStack Query cache boundary:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// src/index.tsx
import { api } from "./pyrpc"

root.render(
  <api.Provider>
    <App />
  </api.Provider>
)`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 4 — call the procedures</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// src/App.tsx
import { useState } from "react"
import { api } from "./pyrpc"

function App() {
  const [name, setName] = useState("")

  const { data: greeting, isLoading } = api.read_root.useQuery()
  const { data: item } = api.read_item.useQuery({ item_id: 42, q: "test" })
  const createItem = api.create_item.useMutation()

  return (
    <div>
      {isLoading ? <p>Loading…</p> : <pre>{JSON.stringify(greeting)}</pre>}
      <pre>{JSON.stringify(item)}</pre>

      <input value={name} onChange={e => setName(e.target.value)} />
      <button
        onClick={() => createItem.mutate({ name, description: \`Item: \${name}\` })}
        disabled={createItem.isPending}
      >
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
cd server && pyrpc dev

# Terminal 2
cd client && npm install && npm start`}
                </pre>
                <p>
                    Open <strong>http://localhost:3000</strong>. The app queries all three procedures and renders the results. Rename a procedure in Python — TypeScript flags the broken call immediately.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Next steps</h2>
                <p>
                    The same FastAPI server works with Next.js, Vue, and Svelte — only the frontend adapter changes. See the <a href="https://github.com/pyrpc/pyrpc/tree/main/examples" className="text-fd-foreground underline underline-offset-2">examples directory</a> for all 12 combinations.
                </p>
            </section>
        </article>
    )
}
