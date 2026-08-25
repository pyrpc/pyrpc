import Link from 'next/link'

export default function WhyMcpIsAnExtra() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Why MCP Is an Extra, Not a Default
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    When we shipped <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc mcp</code> in v0.14.0, the first question from early adopters was why it lives behind <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">uv add "pyrpc-core[mcp]"</code> instead of being part of the default install. The short answer: the MCP SDK is heavy, pyRPC&rsquo;s core value is RPC, and optional-to-default is additive while default-to-optional is breaking.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What the MCP SDK actually pulls in</h2>
                <p>
                    Resolving <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">mcp 2.1</code> as a dependency adds 18 transitive packages to the install tree. Most are lightweight, but several are not:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>cryptography</strong>, pulled by pyjwt&rsquo;s crypto extra. The first compiled binary wheel in pyrpc-core&rsquo;s entire dependency tree. Megabytes per platform, with a CVE-patch cadence every consumer inherits whether they need it or not.</li>
                    <li><strong>pydantic 2.12 minimum</strong>, which quietly raises the floor for every downstream package.</li>
                    <li><strong>starlette and sse-starlette</strong>, transport layers that the stdio server never touches.</li>
                    <li><strong>opentelemetry-api</strong>, the jsonschema family, httpx, and others that add surface area without adding value for projects that do not use AI agents.</li>
                </ul>
                <p>
                    pyRPC&rsquo;s existing dependency set before the MCP extra is intentionally small. Adding the SDK would roughly triple the package count for a feature that most deployments never need.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The dependency tree comparison</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`pyrpc-core (default)           pyrpc-core[mcp]
─────────────────────          ─────────────────────
pydantic >=2.0                  pydantic >=2.12  (raised floor)
typing-extensions               typing-extensions
click                          click
rich                           rich
                               ── added by mcp ──
                               mcp 2.1
                                 ├─ starlette
                                 ├─ sse-starlette
                                 ├─ opentelemetry-api
                                 ├─ httpx
                                 ├─ pydantic-extra-types
                                 ├─ pyjwt[crypto]
                                 │   └─ cryptography  (compiled binary)
                                 ├─ jsonschema
                                 ├─ httpcore
                                 ├─ anyio
                                 ├─ h11
                                 ├─ sniffio
                                 ├─ idna
                                 ├─ certifi
                                 └─ ...`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">pyRPC&rsquo;s core value is RPC, not MCP</h2>
                <p>
                    The package ships a type-safe RPC framework with code generation, framework adapters, and a CLI. Projects that install pyrpc-core need routers, schemas, and TypeScript output. They do not need a protocol server for AI clients. The MCP surface is a value-add for teams using AI coding tools, not a requirement for using pyRPC itself.
                </p>
                <p>
                    This is the same principle FastAPI applies with <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">fastapi[standard]</code>, or SQLAlchemy with its async extras. The runtime library stays lean. The developer experience extras opt in.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The asymmetry that decided it</h2>
                <p>
                    Promoting an optional extra to default later is purely additive. Nobody&rsquo;s build breaks, adoption data justifies the weight, and the release notes carry good news. Demoting a default back to an extra is the opposite: it breaks every project that relied on plain installs providing the capability.
                </p>
                <p>
                    Starting conservative preserves the option to change direction. Starting bold forecloses retreat. The UX cost of the extra is one token in one install command. The config snippets for MCP clients are identical either way.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The thin CLI wrapper principle</h2>
                <p>
                    <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc mcp</code> does zero protocol work itself. It spawns a subprocess, passes the stdio file descriptors to the MCP SDK, and exits when the client disconnects. The entire command is a thin wrapper around process management. All the actual protocol handling lives in the <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">mcp</code> extra.
                </p>
                <p>
                    This means the default install can include the <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc mcp</code> command in its help text, show a clear remediation message when the extra is missing, and never import anything from the SDK unless the user explicitly asks for it. The boundary is clean.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">First-class despite optional</h2>
                <p>
                    Optional must not mean second-class. The command appears in help regardless. The missing-dependency error prints the exact uv and pip commands to install the extra. The docs lead with the MCP setup. Tests always install the extra, so quality gates never weaken.
                </p>
                <p>
                    If adoption ever argues for promotion, the path is a minor release away. Additive, safe, and data-driven. That is exactly how dependency boundaries should work.
                </p>
            </section>
        </article>
    )
}
