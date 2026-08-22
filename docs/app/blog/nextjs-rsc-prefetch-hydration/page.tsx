import Link from 'next/link'

export default function NextRscPrefetchPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Next.js RSC: prefetch, dehydrate, and HydrationBoundary
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 4:30am</time>
                    <span>&middot;</span>
                    <span>11 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Server Components cannot call <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code>. They can still fetch data and seed the TanStack Query cache so the client hydrates without a flash refetch. That is what <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createNextClient</code>’s server helpers are for.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The pipeline</h2>
                <ol className="list-decimal pl-6 space-y-2">
                    <li><strong>prefetch</strong>, run a query on the server into a request-scoped <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">QueryClient</code>.</li>
                    <li><strong>dehydrate</strong>, serialize that cache (TanStack API).</li>
                    <li><strong>HydrationBoundary</strong>, client boundary that rehydrates the cache.</li>
                    <li><strong>api.*.useQuery</strong>, reads warm data in a Client Component.</li>
                </ol>

                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`export default async function Page() {
  await api.prefetch.greet("Ada")
  return (
    <api.HydrationBoundary state={api.dehydrate()}>
      <Greeting />
    </api.HydrationBoundary>
  )
}`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Prefetch ≠ mutations</h2>
                <p>
                    Prefetch is for <strong>queries</strong>. Server-side writes use <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.createCaller()</code> (Promise client). Client mutations use <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.update_user.useMutation()</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">When you can skip hydration</h2>
                <p>
                    If you never prefetch on the server, you only need <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.Provider</code> + client hooks. Prefetch/dehydrate/HydrationBoundary are the fast path for SEO and first paint, not required for every page.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">baseUrl on the server</h2>
                <p>
                    RSC has no <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">window</code>. Always set <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">baseUrl</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">PYRPC_URL</code> for Next.
                </p>

                <p>
                    <Link href="/blog/nextjs-tanstack-query-tutorial" className="text-fd-foreground underline underline-offset-2">Full tutorial</Link> · <Link href="/blog/one-api-object" className="text-fd-foreground underline underline-offset-2">One api object</Link>
                </p>
            </section>
        </article>
    )
}
