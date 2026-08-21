import Link from 'next/link'

export default function WhyTanStackQueryPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Why we chose TanStack Query, and what it gives you for free
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 9:00am</time>
                    <span>&middot;</span>
                    <span>12 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Every RPC framework eventually faces the same question: how does the frontend handle server state? You can hand-roll <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">fetch</code> + <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useState</code>. Or you can use a library built for exactly this job. We chose TanStack Query (formerly React Query) because it solves the hard problems we did not want to reinvent.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What TanStack Query is</h2>
                <p>
                    TanStack Query is a server-state management library. It handles caching, background refetching, stale-while-revalidate, optimistic updates, and request deduplication. It works with React, Vue, Svelte, and Angular. It is not an RPC library, it is the layer that makes RPC calls feel instant.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The five problems it solves</h2>

                <p><strong>1. Caching.</strong> Without a cache, every component that needs user data makes its own HTTP request. With TanStack Query, the first component fetches, and every other component reads from the in-memory cache. One network call, many consumers.</p>

                <p><strong>2. Stale-while-revalidate.</strong> Show cached data immediately, refetch in the background, update the UI when the fresh data arrives. No loading spinners on every navigation.</p>

                <p><strong>3. Background refetching.</strong> When the user switches tabs and comes back, the data might be stale. TanStack Query refetches automatically when the window regains focus. Your RPC calls stay fresh without manual polling.</p>

                <p><strong>4. Deduplication.</strong> If three components mount simultaneously and all call <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">get_user(1)</code>, TanStack Query sends one network request, not three.</p>

                <p><strong>5. Mutation invalidation.</strong> After a mutation (like <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">update_user</code>), you invalidate the query cache for that user. The UI refetches automatically. No manual <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">setState</code> dance.</p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why not build our own</h2>
                <p>
                    tRPC bundles its own query layer on top of React Query. We considered doing the same but decided against it. TanStack Query is already the standard. It has 45k+ GitHub stars, a massive ecosystem, and framework adapters for React, Vue, Svelte, and Solid. Building our own would mean maintaining cache logic, devtools integration, and persistence adapters, none of which are pyRPC's core value.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What pyRPC adds on top</h2>
                <p>
                    TanStack Query does not know about RPC. It needs a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">queryFn</code>, a function that returns a Promise. pyRPC's adapters generate that function from your procedure definitions:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// TanStack Query needs this:
useQuery({
  queryKey: ["pyrpc", "get_user", { userId: 1 }],
  queryFn: () => fetch("/rpc", { method: "POST", body: ... }),
})

// pyRPC generates it from your procedure name:
api.get_user.useQuery({ userId: 1 })`}
                </pre>
                <p>
                    The adapter builds the query key, wraps the RPC call in a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">queryFn</code>, and infers the return type. You write one line instead of ten.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Query keys are predictable</h2>
                <p>
                    Every pyRPC query key is <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">["pyrpc", procedureName, input?]</code>. That means you can invalidate precisely:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`const utils = api.useUtils()
await utils.invalidate("pyrpc", "get_user")`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Framework coverage</h2>
                <p>
                    TanStack Query has official adapters for React, Vue, Svelte, Angular, and Solid. pyRPC ships adapters for the four most common choices. If you use a framework we do not cover, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code> works directly with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">fetch</code>, no adapter needed.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The cost</h2>
                <p>
                    TanStack Query adds ~13kB gzipped to your bundle. For the caching, refetching, and devtools you get in return, that is a trade-off almost every production app makes. If you are building something tiny, the vanilla <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createClient</code> from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code> is always available.
                </p>

                <p>
                    <Link href="/blog/framework-adapters-deep-dive" className="text-fd-foreground underline underline-offset-2">Adapters deep dive</Link> · <Link href="/blog/from-trpc-to-pyrpc" className="text-fd-foreground underline underline-offset-2">Coming from tRPC</Link>
                </p>
            </section>
        </article>
    )
}
