import Link from 'next/link'

export default function ThreeToolsNoMore() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Three tools, and the discipline of stopping there
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 10:00am</time>
                    <span>&middot;</span>
                    <span>5 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The MCP specification makes it trivially easy to keep adding tools, and the failure mode is quiet: every tool name, description, and schema lands in the model's context whether or not it is useful. Agents degrade measurably once tool lists bloat. v0.14.0 ships three tools, and each one earned its place against a question borrowed from the spec's own error guidance: could a competent model not accomplish this another way?
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The three that made it</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>introspect_project</strong> is the one thing grep cannot reconstruct: the live registry with kinds, defaults, docstrings, and JSON Schemas. Static parsing cannot resolve conditional registration or decorator metadata.</li>
                    <li><strong>check_call</strong> answers would these arguments be accepted, which lets an agent verify a payload before writing client code instead of shipping a guess and waiting for CI.</li>
                    <li><strong>run_codegen</strong> wraps the existing pipeline because regeneration is genuinely stateful work: import the module, render, compare, write. An agent doing this by hand would re-implement the CLI badly.</li>
                </ul>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Annotations carry the policy</h2>
                <p>
                    Every tool declares ToolAnnotations. The two read-only tools set readOnlyHint true and openWorldHint false. Codegen sets readOnlyHint false with destructiveHint false and idempotentHint true, because running it twice converges to the same bytes. These are hints, not security, and we treat them that way: the real guarantee for the read tools is architectural (they never call your function), and the real limit for codegen is the dry_run default plus the narrow file scope.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What did not make it</h2>
                <p>
                    Project diagnostics, link inspection, configuration linting, and procedure execution were all prototyped on paper and deferred. Each would be easy to add and hard to remove once agents depend on them. The industry's most disciplined servers converge on two to four tools; Better Auth hosts exactly two. Three is a statement about restraint, and restraint is a feature agents can feel.
                </p>
            </section>
        </article>
    )
}
