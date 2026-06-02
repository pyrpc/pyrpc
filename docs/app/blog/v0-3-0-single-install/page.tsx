import Link from 'next/link'

export default function V030Post() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    v0.3.0  -  pyrpc-cli merged into core, one-command install
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 2, 2026 at 10:15pm</time>
                    <span>&middot;</span>
                    <span>5 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    v0.3.0 is the simplest install yet. <code>pip install pyrpc-core</code> now gives you the entire pyRPC stack — runtime, CLI, and code generation — in a single command.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What changed</h2>
                <p>
                    Previously, pyRPC shipped as three separate packages to break a circular dependency between core and codegen. After <code>pyrpc-codegen</code> was refactored into a pure library with zero pyrpc imports, the circular dependency no longer existed. The middle package (<code>pyrpc-cli</code>) no longer served a purpose.
                </p>
                <p>
                    We merged pyrpc-cli's source into pyrpc-core and deleted the separate package. The dependency chain went from three packages to two:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`Before:  pyrpc-core → pyrpc-cli → pyrpc-codegen  (3 packages)
After:   pyrpc-core → pyrpc-codegen                (2 packages)`}</pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Install is now one command</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`pip install pyrpc-core`}</pre>
                <p>
                    That's it. The <code>pyrpc</code> CLI is available immediately — <code>pyrpc serve</code>, <code>pyrpc dev</code>, <code>pyrpc inspect</code>, <code>pyrpc codegen</code>, and <code>pyrpc pull</code> all work out of the box. No extras, no optional dependencies, no separate install steps.
                </p>
                <p>
                    Frontend-only developers just <code>npm install @pyrpc/client</code> — the postinstall script fetches the schema from your server and generates types automatically. The <code>pyrpc-codegen</code> library is an internal dependency; you never install it directly.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">No API changes</h2>
                <p>
                    Nothing moved or changed names. The same <code>@rpc</code> decorator, the same <code>Router</code> and <code>Interpreter</code>, the same adapters for FastAPI and Flask. If you were on v0.2.0, upgrade is just:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`pip install --upgrade pyrpc-core`}</pre>
                <p>
                    The only difference is one fewer package to install.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Full changelog</h2>
                <ul className="space-y-2">
                    <li><strong>Packaging:</strong> pyrpc-cli merged into pyrpc-core. <code>pip install pyrpc-core</code> is now the single entry point.</li>
                    <li><strong>CLI:</strong> All commands live in <code>pyrpc_core.cli</code>. Entry point registered via <code>[project.scripts]</code> in pyproject.toml.</li>
                    <li><strong>Docs:</strong> README, CONTRIBUTING, PYRPC.md, installation guides, plugin docs — all rewritten for single-install flow. No more pyrpc-cli references.</li>
                    <li><strong>System design:</strong> Architecture diagram and dependency section updated to reflect the 2-package structure.</li>
                    <li><strong>Blog:</strong> New post explaining the merge rationale and trade-offs.</li>
                    <li><strong>Favicon:</strong> pyrpc mark added as site favicon.</li>
                </ul>

                <p className="mt-8">
                    See the <Link href="/changelog" className="underline underline-offset-2 hover:text-fd-foreground transition-colors">full changelog</Link> for details.
                </p>
            </section>
        </article>
    )
}
