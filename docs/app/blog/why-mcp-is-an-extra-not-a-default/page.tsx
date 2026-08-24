import Link from 'next/link'

export default function WhyMcpIsAnExtra() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Measured in wheels: why the MCP SDK is an extra, not a default
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 5:00pm</time>
                    <span>&middot;</span>
                    <span>5 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The loudest internal debate about pyrpc mcp was not protocol or tooling. It was whether the MCP SDK belongs in pyrpc-core's default dependencies or behind an extra. We measured before deciding, and the measurement changed the answer.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What default actually costs</h2>
                <p>
                    Resolving pyrpc-core's existing dependency set plus mcp 2.1 pulls eighteen additional packages into every install. Most are modest: starlette and sse-starlette for transports stdio never touches, opentelemetry-api, the jsonschema family, httpx2. The headline is cryptography, pulled by pyjwt's crypto extra: the first compiled binary wheel in pyrpc-core's tree, megabytes per platform, with a CVE-patch cadence every consumer inherits. The SDK also requires pydantic 2.12 minimum, quietly raising our floor for everyone.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The precedent we almost misread</h2>
                <p>
                    Prisma ships its MCP inside the main package, and so does Better Auth's CLI. But their packages are developer tools that never appear in production containers. pyrpc-core is dual-natured: it is also the runtime library imported by every deployment. The closer analogy for a Python framework is FastAPI, whose answer to exactly this tension is extras like fastapi[standard].
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The asymmetry that decided it</h2>
                <p>
                    Promoting an extra to default later is purely additive: nobody breaks, adoption data justifies the weight. Demoting a default back to an extra breaks everyone who relied on plain installs providing the capability. Starting conservative preserves the option; starting bold forecloses retreat. Config snippets are identical either way once installed, so the UX cost is one token in one install command.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">First-class despite optional</h2>
                <p>
                    Optional must not mean second-class. The command appears in help regardless, the missing-dependency error states the exact uv and pip commands, and the docs lead with the extra. Tests always install it, so quality gates never weaken. If adoption ever argues for promotion, the path is a minor release away, additive and safe.
                </p>
            </section>
        </article>
    )
}
