import Link from 'next/link'

export default function ProcedureKindsInTypesPackagePage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The tiny change in @pyrpc/types that powers everything
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 7:00am</time>
                    <span>&middot;</span>
                    <span>6 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> package used to export one thing: a placeholder <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Types</code> interface. Codegen overwrote it. In v0.9.0, we added two more exports, and they are the glue between codegen and the adapters.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Before v0.9.0</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// node_modules/@pyrpc/types/src/index.ts (placeholder)
export type Types = Record<string, never>`}
                </pre>
                <p>
                    After codegen runs, this file is overwritten with your actual procedures. The adapters import <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Types</code> from here.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">After v0.9.0</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`export type Types = Record<string, never>

/** @internal Runtime kind map, loaded automatically by framework adapters. */
export type ProcedureKinds = Record<string, never>

/** @internal Runtime kind map, loaded automatically by framework adapters. */
export const procedureKinds = {} as const satisfies ProcedureKinds`}
                </pre>
                <p>
                    Two additions: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ProcedureKinds</code> (a type) and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">procedureKinds</code> (a const value). Both are placeholders that codegen overwrites.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why both a type and a const</h2>
                <p>
                    TypeScript types are erased at runtime. If codegen only emitted <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{"type ProcedureKinds = { ... }"}</code>, the adapter could not read the kinds at runtime. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">const procedureKinds</code> is the actual value the adapter's Proxy handler checks.
                </p>
                <p>
                    The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">as const satisfies ProcedureKinds</code> pattern ensures the const matches the type at compile time while preserving literal types.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What codegen produces</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`export type ProcedureKinds = {
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

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this is in @pyrpc/types, not a separate package</h2>
                <p>
                    The adapters already import <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Types</code> from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code>. Adding <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ProcedureKinds</code> to the same file means one import, one package, one codegen step. No new dependencies for users.
                </p>

                <p>
                    <Link href="/blog/procedure-kinds-end-to-end" className="text-fd-foreground underline underline-offset-2">How procedure kinds flow end-to-end</Link> · <Link href="/docs/client/overview" className="text-fd-foreground underline underline-offset-2">Client docs</Link>
                </p>
            </section>
        </article>
    )
}
