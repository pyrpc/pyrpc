import Link from 'next/link'

export default function FlaskSvelteTutorialPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Flask + Svelte: minimal server, typed Svelte stores
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 8, 2026 at 12:00pm</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Flask + Svelte is the combination for developers who want the absolute minimum on the server and prefer Svelte's reactive primitives on the client. The same <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createQuery</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createMutation</code> pattern from the FastAPI + Svelte example applies here; only the server changes.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Server</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# server/main.py
from flask import Flask
from flask_cors import CORS
from pyrpc_core import rpc
from pyrpc_flask import mount_flask

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

@rpc.query
def greet(name: str = "World") -> dict:
    return {"message": f"Hello, {name}!"}

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
{`// src/lib/pyrpc.ts
import { createSvelteClient } from "@pyrpc/svelte"
import type { Types } from "@pyrpc/types"

export const api = createSvelteClient<Types>({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:5000",
})`}
                </pre>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { api } from "$lib/pyrpc"
  let name = ""
  const greeting = api.greet.createQuery()
  const item = api.read_item.createQuery(() => ({ item_id: 42, q: "test" }))
  const createItem = api.create_item.createMutation()
  function handleCreate() {
    $createItem.mutate({ name }); name = ""
  }
</script>

{#if $greeting.isPending}<p>Loading…</p>
{:else}<pre>{JSON.stringify($greeting.data)}</pre>{/if}
<pre>{JSON.stringify($item.data)}</pre>
<input bind:value={name} />
<button on:click={handleCreate} disabled={$createItem.isPending}>
  {$createItem.isPending ? "Creating…" : "Create"}
</button>
{#if $createItem.isSuccess}<pre>{JSON.stringify($createItem.data)}</pre>{/if}`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Run it</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`cd server && uv add pyrpc-core[flask] && pyrpc dev --yes
cd client && npm install && npm run dev`}
                </pre>
                <p>Open <strong>http://localhost:5173</strong>. Full source at <a href="https://github.com/pyrpc/pyrpc/tree/main/examples/flask-svelte" className="text-fd-foreground underline underline-offset-2">examples/flask-svelte</a>.</p>
            </section>
        </article>
    )
}
