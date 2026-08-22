import Link from 'next/link'

export default function OneApiObjectPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    One api object: Provider, prefetch, and hooks in the same place
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 4:00am</time>
                    <span>&middot;</span>
                    <span>9 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The easiest RPC clients are the ones you barely configure. For pyRPC’s TanStack adapters, that means a single exported value (call it <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client</code>, or <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc</code>) that carries procedures, the provider, and (on Next) prefetch/hydration.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The shape</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`export const api = createNextClient<Types>({
  baseUrl: process.env.PYRPC_URL!,
})

// layout
<api.Provider>{children}</api.Provider>

// server
await api.prefetch.greet("Ada")
<api.HydrationBoundary state={api.dehydrate()}>…</api.HydrationBoundary>

// client
api.greet.useQuery("Ada")`}
                </pre>
                <p>
                    No destructuring. No second “hooks client” import. The factory name is <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">create*Client</code>; the variable name is yours.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this beats returning four exports</h2>
                <p>
                    Early drafts returned <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{`{ api, prefetch, dehydrate, HydrationBoundary }`}</code>. Correct, but noisy, every file re-imported a different subset. Collapsing onto one object matches how people already think about “the client,” and keeps App Router helpers discoverable via autocomplete on the same value.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Reserved helper names</h2>
                <p>
                    Top-level helpers (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Provider</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">prefetch</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">dehydrate</code>, …) win if they collide with a procedure name. Don’t name an RPC procedure <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">prefetch</code>. Same class of constraint as other typed RPC clients.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">React and Vue</h2>
                <p>
                    React: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.Provider</code> + <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.greet.useQuery</code>. Vue: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createPyrpcVue</code> returns the same idea with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.plugin</code> for TanStack’s Vue Query plugin.
                </p>

                <p>
                    Next: <Link href="/blog/nextjs-rsc-prefetch-hydration" className="text-fd-foreground underline underline-offset-2">RSC prefetch &amp; hydration</Link> · <Link href="/docs/client/nextjs" className="text-fd-foreground underline underline-offset-2">Docs</Link>
                </p>
            </section>
        </article>
    )
}
