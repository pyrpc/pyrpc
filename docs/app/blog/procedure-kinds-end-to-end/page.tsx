import Link from 'next/link'

export default function ProcedureKindsEndToEndPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    How procedure kinds flow from Python to TypeScript
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 6:00am</time>
                    <span>&middot;</span>
                    <span>12 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    You write <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.mutation</code> on a Python function. Three layers later, TypeScript autocomplete shows <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.useMutation()</code> instead of <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.useQuery()</code>. This post traces that journey end-to-end.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 1: the Python decorator</h2>
                <p>
                    On the server, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.mutation</code> is a thin wrapper around <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code>. It sets <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kind=ProcedureKind.MUTATION</code> on the procedure object:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`from pyrpc_core import rpc

@rpc.mutation
def update_user(user_id: int, name: str) -> dict:
    ...`}
                </pre>
                <p>
                    Under the hood, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">rpc.mutation</code> calls the same <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">register()</code> as <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code>, but passes <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kind="mutation"</code>. The procedure stores it. No magic.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 2: introspection picks it up</h2>
                <p>
                    When you run <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc codegen</code> or hit <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">GET /rpc</code>, introspection serializes every procedure. Each one now includes a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kind</code> field:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`{
  "procedures": {
    "get_user": { "params": [...], "result": "...", "kind": "query" },
    "update_user": { "params": [...], "result": "...", "kind": "mutation" }
  }
}`}
                </pre>
                <p>
                    The default is <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"query"</code>. Bare <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code> works exactly like before, no breaking change.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 3: codegen emits two things</h2>
                <p>
                    The Jinja2 template in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client.ts.j2</code> reads the schema and produces:
                </p>
                <ol className="list-decimal pl-6 space-y-1">
                    <li>The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Types</code> interface (the same one you already know)</li>
                    <li>A <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ProcedureKinds</code> type and a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">procedureKinds</code> const</li>
                </ol>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`export interface Types {
  get_user: (userId: number) => Promise<User>
  update_user: (userId: number, name: string) => Promise<User>
}

export type ProcedureKinds = {
  get_user: "query"
  update_user: "mutation"
}

export const procedureKinds = {
  get_user: "query",
  update_user: "mutation",
} as const satisfies ProcedureKinds`}
                </pre>
                <p>
                    The type is for TypeScript. The const is for runtime, adapters need an actual value to compare against.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 4: the adapter reads kinds</h2>
                <p>
                    You pass <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kinds: procedureKinds</code> when creating the client. The adapter's Proxy handler checks the kind for each procedure name and returns the matching hook:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`const api = createReactClient<Types>({
  baseUrl: "...",
  kinds: procedureKinds,
})

// get_user → "query" → useQuery
api.get_user.useQuery({ userId: 1 })

// update_user → "mutation" → useMutation
api.update_user.useMutation()`}
                </pre>
                <p>
                    Without <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kinds</code>, every procedure gets both hooks. That is the backward-compatible path for existing code.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this matters</h2>
                <p>
                    The kind is declared once on the server. It cannot drift from the TypeScript side. If you add <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.mutation</code> to a procedure, the next codegen run automatically flips the hook from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code> to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code> in your frontend. No manual wiring.
                </p>

                <p>
                    <Link href="/docs/server/procedures" className="text-fd-foreground underline underline-offset-2">Procedures docs</Link> · <Link href="/blog/rpc-query-vs-mutation" className="text-fd-foreground underline underline-offset-2">Why procedure kinds exist</Link>
                </p>
            </section>
        </article>
    )
}
