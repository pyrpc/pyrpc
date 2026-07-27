import Link from 'next/link'

export default function FromCreateClientToHooksPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Migrating from createClient to TanStack hooks
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 5:15am</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    You already have:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`const client = createClient<Types>({ baseUrl })
const user = await client.get_user({ id: 1 })`}
                </pre>
                <p>
                    Hooks are the same procedures with caching:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`const api = createReactClient<Types>({ baseUrl })
const { data: user } = api.get_user.useQuery({ id: 1 })`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Keep both</h2>
                <p>
                    Adapters expose <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.client</code> (and Next’s <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.createCaller()</code>) for Promise-style calls in loaders, scripts, and Server Actions. You do not have to delete <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createClient</code> usage overnight.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Mark mutations on the server</h2>
                <p>
                    When you adopt hooks, annotate writes with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.mutation</code> and regenerate types so <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code> is the typed path.
                </p>

                <p>
                    <Link href="/blog/rpc-query-vs-mutation" className="text-fd-foreground underline underline-offset-2">Query vs mutation</Link>
                </p>
            </section>
        </article>
    )
}
