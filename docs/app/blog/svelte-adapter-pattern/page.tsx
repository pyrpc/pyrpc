import Link from 'next/link'

export default function TheSvelteAdapterPatternPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The Svelte adapter: framework-native, zero ceremony
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 7:45am</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Svelte has its own query library (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@tanstack/svelte-query</code>) with a different API shape than React's. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/svelte</code> adapter respects that difference while keeping the same transport and kind system.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Setup</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`import { createSvelteClient } from "@pyrpc/svelte"
import type { Types } from "@pyrpc/types"
import { procedureKinds } from "@pyrpc/types"

const api = createSvelteClient<Types>({
  baseUrl: "http://localhost:8000",
  kinds: procedureKinds,
})`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Provider setup</h2>
                <p>
                    Svelte Query uses a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">setContext</code>-based provider. The adapter wraps this in a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">setup.ts</code> file:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// src/lib/pyrpc/setup.ts
import { QueryClient } from "@tanstack/svelte-query"
import { api } from "./pyrpc"

export const queryClient = new QueryClient()`}
                </pre>
                <p>
                    Wrap the app root with Svelte Query's provider. No custom provider component needed.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Using procedures</h2>
                <p>
                    Svelte Query exposes <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createQuery</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createMutation</code> as functions, not hooks:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`<script>
import { api } from "$lib/pyrpc/setup"
import { createQuery } from "@tanstack/svelte-query"

const userQuery = createQuery(
  api.get_user.queryOptions({ userId: 1 })
)
</script>

{#if $userQuery.isLoading}
  <p>Loading...</p>
{:else}
  <p>{$userQuery.data.name}</p>
{/if}`}
                </pre>
                <p>
                    For mutations, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createMutation</code> works the same way. The adapter's Proxy ensures you only get the right function for each procedure kind.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why Svelte is different from React/Vue</h2>
                <p>
                    React re-renders on state change. Vue uses reactivity proxies. Svelte compiles to imperative DOM updates. TanStack Svelte Query bridges this with stores (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">$query</code> prefix). The adapter respects this, no React hooks, no Vue composition, just Svelte stores.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The invariant holds</h2>
                <p>
                    Same <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createClient</code> underneath. Same <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">procedureKinds</code>. Same query keys. Just Svelte-native integration.
                </p>

                <p>
                    <Link href="/docs/client/svelte" className="text-fd-foreground underline underline-offset-2">Svelte docs</Link> · <Link href="/blog/vue-svelte-adapters" className="text-fd-foreground underline underline-offset-2">Vue and Svelte adapters</Link>
                </p>
            </section>
        </article>
    )
}
