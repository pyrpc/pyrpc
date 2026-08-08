import Link from 'next/link'

export default function DjangoSvelteTutorialPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Django + Svelte: async Python backend, reactive Svelte stores
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 8, 2026 at 2:00pm</time>
                    <span>&middot;</span>
                    <span>9 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Django + Svelte pairs Django's mature ecosystem with Svelte's reactive store model. The wiring is the same as every other Django example — import <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">views</code> in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">urls.py</code>, mount <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc_django_adapter.urls</code>. The Svelte side uses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createSvelteClient</code> and the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">$store</code> subscription pattern.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Server</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# views.py
@rpc.query
async def greet(name: str = "World") -> dict:
    return {"message": f"Hello, {name}!", "framework": "Django"}

@rpc.query
async def read_item(item_id: int, q: str = None) -> dict:
    return {"item_id": item_id, "q": q}

@rpc.mutation
async def create_item(name: str, description: str = None) -> dict:
    return {"name": name, "description": description, "created": True}

# urls.py
from . import views  # triggers registration
urlpatterns = [path("rpc/", include("pyrpc_django_adapter.urls")), ...]

# settings.py
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Client</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// src/lib/pyrpc.ts
import { createSvelteClient } from "@pyrpc/svelte"
import type { Types } from "@pyrpc/types"

export const api = createSvelteClient<Types>({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
})`}
                </pre>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { api } from "$lib/pyrpc"
  let name = ""
  const greeting = api.greet.createQuery(() => ({ name: "Django User" }))
  const item = api.read_item.createQuery(() => ({ item_id: 42, q: "django-test" }))
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
{`cd server && uv add pyrpc-core[django] && pyrpc dev --yes --module myproject.views
cd client && npm install && npm run dev`}
                </pre>
                <p>Open <strong>http://localhost:5173</strong>. Full source at <a href="https://github.com/pyrpc/pyrpc/tree/main/examples/django-svelte" className="text-fd-foreground underline underline-offset-2">examples/django-svelte</a>.</p>
            </section>
        </article>
    )
}
