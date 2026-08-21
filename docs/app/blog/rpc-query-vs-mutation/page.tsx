import Link from 'next/link'

export default function RpcQueryVsMutationPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    @rpc.query and @rpc.mutation: why procedure kinds exist
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 4:15am</time>
                    <span>&middot;</span>
                    <span>10 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    TanStack Query has two verbs: read (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code>) and write (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code>). JSON-RPC does not. So pyRPC adds an optional <strong>kind</strong> on each procedure, declared on the server, shipped through codegen, enforced on the typed hooks.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Server</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`from pyrpc_core import rpc

@rpc.query
def get_user(user_id: int) -> dict:
    ...

@rpc.mutation
def update_user(user_id: int, name: str) -> dict:
    ...

# Bare @rpc still works → kind "query" (backward compatible)`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What you import</h2>
                <p>
                    You import <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Types</code> only. Codegen brands each procedure with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_pyrpcKind</code> and emits a runtime map adapters load automatically. No second “kinds” import in app code.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why not only client-side hooks?</h2>
                <p>
                    Allowing every procedure to expose both hooks forever works, but lies to the type system. Declaring kind on the server makes the contract honest: a mutation is not a cacheable query key, and autocomplete shows the right hook.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Wire format</h2>
                <p>
                    Kind does not change JSON-RPC. It is metadata for codegen and adapters. The POST body is still <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{`{ id, method, params }`}</code>.
                </p>

                <p>
                    <Link href="/docs/server/procedures" className="text-fd-foreground underline underline-offset-2">Procedures docs</Link> · <Link href="/blog/framework-adapters-deep-dive" className="text-fd-foreground underline underline-offset-2">Adapters deep dive</Link>
                </p>
            </section>
        </article>
    )
}
