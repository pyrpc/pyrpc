import Link from 'next/link'

export default function DryRunFirstCodegen() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Codegen through an MCP: dry run first, narrow writes, honest hints
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 2:00pm</time>
                    <span>&middot;</span>
                    <span>4 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    run_codegen is the one mutating tool in the surface, so it got the conservative treatment on three axes: default behavior, reported scope, and protocol honesty.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">dry_run=true is the signature</h2>
                <p>
                    Calling run_codegen with no arguments writes nothing. It imports your backend, renders the TypeScript client exactly as pyrpc codegen would, compares against each configured target, and reports one status per file: up to date, would update, or would create. Only an explicit dry_run=false crosses the write boundary. An agent that wants to check type freshness never mutates a repo by accident, and a human reviewing the transcript can see the moment intent changed from reading to writing.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Scope: generated files only</h2>
                <p>
                    The CLI's full setup also edits tsconfig.json and bundler configs to wire the @pyrpc/types alias. The MCP deliberately does not. Generated output is deterministic, idempotent, and trivially reviewable; config surgery is neither. If targets lack wiring, the tool's report says so and points at pyrpc init and pyrpc codegen. Keeping mutation narrow enough to describe in one sentence is what makes the annotation below honest rather than aspirational.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Idempotence as an annotation</h2>
                <p>
                    The tool declares read_only_hint false, destructive_hint false, idempotent_hint true. Idempotent means running it twice leaves the same bytes, which the comparison logic guarantees: identical content short-circuits to unchanged without rewriting the file. Well-behaved clients use these hints to decide when to prompt; the spec is careful to call them hints, and our documentation repeats the warning. The actual guarantees live in defaults and scope, where they cannot be ignored.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Diff you can audit</h2>
                <p>
                    Because dry-run comparison uses the exact renderer the writer uses, would update means byte-level drift exists, nothing fuzzier. Agents get a cheap freshness oracle, and the eventual write lands as a reviewable single-file diff per client root.
                </p>
            </section>
        </article>
    )
}
