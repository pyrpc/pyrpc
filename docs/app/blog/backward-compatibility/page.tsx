import Link from 'next/link'

export default function BackwardCompatibilityPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Backward compatibility: how @rpc stayed working through v0.9.0
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 8:30am</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    v0.9.0 added procedure kinds, four new npm packages, and a new codegen output format. None of it broke existing code. Here is how.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Bare @rpc defaults to query</h2>
                <p>
                    If you have code like this, it still works exactly as before:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`@rpc
def greet(name: str) -> str:
    return f"Hello, {name}!"`}
                </pre>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">rpc</code> (without <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.query</code> or <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.mutation</code>) sets <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kind="query"</code> by default. The introspection schema now includes <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kind: "query"</code> on every procedure. Codegen emits <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ProcedureKinds</code> with all queries. The adapters use that to show <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code> on every procedure.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Without kinds, both hooks appear</h2>
                <p>
                    If you do not pass <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kinds: procedureKinds</code> to the adapter, every procedure gets both <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code>. That is the backward-compatible path — you can adopt kinds gradually.
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// No kinds — both hooks exist on every procedure
const api = createReactClient<Types>({ baseUrl: "..." })
api.greet.useQuery("Ada")   // works
api.greet.useMutation()     // also works (but wasteful)`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">createClient is unchanged</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code> v0.9.0 is a version bump only. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createClient</code> function, the Proxy, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">PyRPCError</code>, and the transport are identical.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Framework adapters are opt-in</h2>
                <p>
                    The new packages (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/react</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">next</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">vue</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">svelte</code>) are new npm packages. If you use <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createClient</code> directly, nothing changes. The adapters are an addition, not a replacement.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">PyPI extras are additive</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pip install pyrpc-core</code> still works. The extras (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core[fastapi]</code>, etc.) are optional additions. The standalone adapter packages (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-fastapi</code>, etc.) still exist.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The principle</h2>
                <p>
                    Every new feature is opt-in. Bare <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code> works. No-kinds adapters work. Existing installs work. The only thing that changes is that the introspection schema now includes a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kind</code> field. If your code ignores it, nothing breaks.
                </p>

                <p>
                    <Link href="/docs/server/procedures" className="text-fd-foreground underline underline-offset-2">Procedures docs</Link> · <Link href="/blog/rpc-query-vs-mutation" className="text-fd-foreground underline underline-offset-2">Why procedure kinds exist</Link>
                </p>
            </section>
        </article>
    )
}
