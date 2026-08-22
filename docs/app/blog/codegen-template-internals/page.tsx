import Link from 'next/link'

export default function CodegenTemplateInternalsPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Inside the codegen template: what client.ts.j2 actually generates
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 6:30am</time>
                    <span>&middot;</span>
                    <span>10 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    When you run <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc codegen</code>, a Jinja2 template turns your Python schema into a TypeScript file. This post walks through what that template produces and why.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The input</h2>
                <p>
                    Codegen receives a JSON schema extracted from your Python code. It contains procedure names, parameter types, return types, and (since v0.9.0) a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kind</code> field per procedure.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The output structure</h2>
                <p>
                    The generated <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">index.ts</code> has three sections:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// 1. Imports
import { Types as BaseTypes } from "@pyrpc/types"

// 2. Types interface, one method per procedure
export interface Types extends BaseTypes {
  greet: (name: string) => Promise<string>
  get_user: (userId: number) => Promise<User>
  update_user: (userId: number, name: string) => Promise<User>
}

// 3. ProcedureKinds, runtime kind map
export type ProcedureKinds = {
  greet: "query"
  get_user: "query"
  update_user: "mutation"
}

export const procedureKinds = {
  greet: "query",
  get_user: "query",
  update_user: "mutation",
} as const satisfies ProcedureKinds`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why extend BaseTypes</h2>
                <p>
                    The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">extends BaseTypes</code> pattern means the generated file is compatible with the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> placeholder. If codegen has not run yet, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Types</code> is an empty record. After codegen, it has your procedures. TypeScript stays happy either way.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How parameters map</h2>
                <p>
                    Python parameters become positional TypeScript parameters:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# Python
@rpc.query
def get_user(user_id: int, include_posts: bool = False) -> dict: ...

// Generated TypeScript
get_user: (userId: number, includePosts?: boolean) => Promise<User>`}
                </pre>
                <p>
                    Required parameters are positional. Default values become optional parameters with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">?</code>. Names are camelCased automatically.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Model interfaces</h2>
                <p>
                    Pydantic models referenced in return types get their own interfaces via <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jsonschema-ts</code>. These are inlined in the same file or imported from a shared definitions block.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The npx daemon</h2>
                <p>
                    The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jsonschema-ts</code> integration runs a persistent Node.js process. First call: ~3.3s (cold start). Subsequent calls: ~4.6ms. That is a 715× speedup for the type conversion step. The template itself is instant, the bottleneck was always <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npx</code> subprocess overhead.
                </p>

                <p>
                    <Link href="/docs/client/overview" className="text-fd-foreground underline underline-offset-2">Client docs</Link> · <Link href="/blog/npx-daemon-internals" className="text-fd-foreground underline underline-offset-2">npx daemon deep dive</Link>
                </p>
            </section>
        </article>
    )
}
