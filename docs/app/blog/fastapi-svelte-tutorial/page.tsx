import Link from 'next/link'

export default function FastApiSvelteTutorialPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    FastAPI + Svelte: typed Python procedures as Svelte stores
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 8, 2026 at 10:30am</time>
                    <span>&middot;</span>
                    <span>9 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Svelte's store contract fits TanStack Svelte Query naturally, every <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createQuery</code> call returns a store you subscribe to with the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">$</code> prefix. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/svelte</code> puts typed procedure wrappers on top of that, so you get full inference from Python to Svelte template with no glue code.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Client setup</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// src/lib/pyrpc.ts
import { createSvelteClient } from "@pyrpc/svelte"
import type { Types } from "@pyrpc/types"

export const api = createSvelteClient<Types>({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
})`}
                </pre>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query"
  const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
  <slot />
</QueryClientProvider>`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Using the stores</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { api } from "$lib/pyrpc"

  let name = ""

  const greeting = api.read_root.createQuery()
  const item = api.read_item.createQuery(() => ({ item_id: 42, q: "test" }))
  const createItem = api.create_item.createMutation()

  function handleCreate() {
    if (name.trim()) {
      $createItem.mutate({ name, description: \`Item: \${name}\` })
      name = ""
    }
  }
</script>

{#if $greeting.isPending}
  <p>Loading…</p>
{:else}
  <pre>{JSON.stringify($greeting.data)}</pre>
{/if}

<pre>{JSON.stringify($item.data)}</pre>

<input bind:value={name} placeholder="Item name" />
<button on:click={handleCreate} disabled={$createItem.isPending}>
  {$createItem.isPending ? "Creating…" : "Create"}
</button>

{#if $createItem.isSuccess}
  <pre>{JSON.stringify($createItem.data)}</pre>
{/if}`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Key Svelte patterns</h2>
                <p>
                    <strong>Store subscription.</strong> Prefix stores with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">$</code> to read their current value, both in the template and in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{'<script>'}</code>.
                </p>
                <p>
                    <strong>Reactive args.</strong> Pass a getter function to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createQuery</code> when args depend on reactive state. The query re-fetches whenever the getter returns a new value.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Run it</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# Terminal 1
cd server && uv add pyrpc-core[fastapi] && pyrpc dev

# Terminal 2
cd client && npm install && npm run dev`}
                </pre>
                <p>Open <strong>http://localhost:5173</strong>. Full source at <a href="https://github.com/pyrpc/pyrpc/tree/main/examples/fastapi-svelte" className="text-fd-foreground underline underline-offset-2">examples/fastapi-svelte</a>.</p>
            </section>
        </article>
    )
}
