import Link from 'next/link'

export default function V090ReleasePage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    v0.9.0, Framework adapters, procedure kinds, one api object
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 5:30am</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    pyRPC 0.9.0 ships TanStack Query adapters for React, Next.js, Vue, and Svelte; server-side <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.query</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.mutation</code>; and a single <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api</code> object DX for app code.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">npm</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/react</code></li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/next</code></li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/vue</code></li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/svelte</code></li>
                    <li>Updated <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code></li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">PyPI</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code>, procedure kinds on the decorator / schema</li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code>, branded Types + procedureKinds</li>
                    <li>Adapters unchanged in API; republished in lockstep</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Quick start</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`npm install @pyrpc/next @pyrpc/react @pyrpc/client @pyrpc/types @tanstack/react-query

export const api = createNextClient<Types>({ baseUrl: "..." })
<api.Provider>{children}</api.Provider>
api.greet.useQuery({ name: "Ada" })`}
                </pre>

                <p>
                    <Link href="/blog/framework-adapters-deep-dive" className="text-fd-foreground underline underline-offset-2">Deep dive</Link> · <Link href="/blog/package-versioning-and-releases" className="text-fd-foreground underline underline-offset-2">Versioning</Link> · <Link href="/blog/publishing-pyrpc-packages" className="text-fd-foreground underline underline-offset-2">Publishing guide</Link>
                </p>
            </section>
        </article>
    )
}
