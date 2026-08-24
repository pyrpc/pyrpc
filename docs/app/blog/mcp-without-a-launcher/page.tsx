import Link from 'next/link'

export default function McpWithoutALauncher() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Why pyrpc mcp is a subcommand, not a package
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 9:00am</time>
                    <span>&middot;</span>
                    <span>5 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    When we decided pyRPC should speak MCP, the first question was not which tools to expose. It was what shape the artifact should take. A separate launcher package? A standalone server binary? We shipped none of those, and the research says that is the mature choice.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The graveyard of launcher packages</h2>
                <p>
                    Neon published @neondatabase/mcp-server-neon as a local stdio proxy for two years and forty versions. It is now formally deprecated in favor of their hosted endpoint, with the SSE transport scheduled to start answering 410 Gone. The lesson is not that local servers are wrong. It is that a second artifact with its own version line, supply chain, and discovery story is a liability you eventually pay down.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What Prisma does instead</h2>
                <p>
                    Prisma's local MCP has no package of its own at all. The repository named prisma/mcp contains only registry metadata and a stale desktop-extension launcher; the real implementation lives inside the main prisma CLI as the <code>mcp</code> subcommand. You install the tool you already use and gain the capability for free. Better Auth's CLI similarly carries an mcp command whose entire job is registering their hosted endpoint into whatever client you run.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The pyRPC decision</h2>
                <p>
                    <code>pyrpc mcp</code> is a subcommand of the CLI users already have, for three reasons that compound. First, distribution: uv add pyrpc-core is the only step, and the client config references a command that provably exists. Second, lifecycle: the server updates with the framework it introspects, so there is exactly one version train to reason about. Third, trust: the process is launched by the user's own client from their own environment, which is precisely the privilege model introspection requires.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The cost we accepted</h2>
                <p>
                    A subcommand must live where the CLI lives, so the MCP SDK becomes part of our dependency tree rather than a separate project's. That tradeoff is real, and we handled it by making the dependency optional at the package level while keeping the command first-class at the CLI level. The next post covers why the split between local and remote surfaces made this asymmetry acceptable.
                </p>
            </section>
        </article>
    )
}
