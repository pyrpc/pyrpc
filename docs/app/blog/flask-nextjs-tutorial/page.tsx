import Link from 'next/link'

export default function FlaskNextJsTutorialPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Flask + Next.js: App Router with a Flask backend
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 8, 2026 at 12:30pm</time>
                    <span>&middot;</span>
                    <span>9 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Flask + Next.js is an interesting combination: a lightweight Python server paired with a full-featured SSR frontend. Because pyRPC's transport is just <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">POST /rpc</code>, the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/next</code> adapter doesn't care whether the server is FastAPI or Flask, the setup is identical.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Server</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# server/main.py
from flask import Flask
from flask_cors import CORS
from pyrpc_core import rpc
from pyrpc_flask import mount_flask

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

@rpc.query
def greet(name: str = "World") -> dict:
    return {"message": f"Hello, {name}!", "framework": "Flask"}

@rpc.query
def read_item(item_id: int, q: str = None) -> dict:
    return {"item_id": item_id, "q": q}

@rpc.mutation
def create_item(name: str, description: str = None) -> dict:
    return {"name": name, "description": description, "created": True}

mount_flask(app)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Client</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// lib/pyrpc.ts
import { createNextClient } from "@pyrpc/next"
import type { Types } from "@pyrpc/types"

export const api = createNextClient<Types>({
  baseUrl: process.env.PYRPC_URL ?? "http://localhost:5000",  // Flask port
})`}
                </pre>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// app/page.tsx (Server Component)
import { api } from "@/lib/pyrpc"
import { Counter } from "./counter"

export default async function Page() {
  await api.prefetch.greet({ name: "Flask User" })
  await api.prefetch.read_item({ item_id: 42, q: "flask-test" })
  return (
    <api.HydrationBoundary state={api.dehydrate()}>
      <Counter />
    </api.HydrationBoundary>
  )
}`}
                </pre>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// app/counter.tsx ("use client")
import { api } from "@/lib/pyrpc"
import { useState } from "react"

export function Counter() {
  const [name, setName] = useState("")
  const { data: greeting, isLoading } = api.greet.useQuery({ name: "Flask User" })
  const { data: item } = api.read_item.useQuery({ item_id: 42, q: "flask-test" })
  const createItem = api.create_item.useMutation()

  return (
    <div>
      {isLoading ? <p>Loading…</p> : <pre>{JSON.stringify(greeting)}</pre>}
      <pre>{JSON.stringify(item)}</pre>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button onClick={() => createItem.mutate({ name })} disabled={createItem.isPending}>
        {createItem.isPending ? "Creating…" : "Create"}
      </button>
      {createItem.isSuccess && <pre>{JSON.stringify(createItem.data)}</pre>}
    </div>
  )
}`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Run it</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`cd server && uv add pyrpc-core[flask] && pyrpc dev --yes
cd client && npm install && npm run dev`}
                </pre>
                <p>Open <strong>http://localhost:3000</strong>. Full source at <a href="https://github.com/pyrpc/pyrpc/tree/main/examples/flask-nextjs" className="text-fd-foreground underline underline-offset-2">examples/flask-nextjs</a>.</p>
            </section>
        </article>
    )
}
