import Link from 'next/link'

export default function V0140ReleaseNotes() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    pyRPC v0.14.0: pyrpc mcp, your backend as an AI-native surface
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 12:00pm</time>
                    <span>&middot;</span>
                    <span>6 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    pyRPC v0.14.0 ships one feature, and it is a big one: a local MCP (Model Context Protocol) server built into the CLI. Running <code>pyrpc mcp</code> inside your project turns your real backend into a live tool surface for AI coding clients like Claude Code, Cursor, VS Code, Windsurf, and OpenCode. Agents stop guessing at your API and start working from the actual registry.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The headline: pyrpc mcp</h2>
                <p>
                    After installing the optional MCP dependency, any MCP client can launch pyRPC as a stdio subprocess and ask three questions: what does this project expose (<code>introspect_project</code>), would these arguments be accepted (<code>check_call</code>), and are the generated TypeScript types current (<code>run_codegen</code>). The server imports your configured backend module, so answers come from your environment: your framework adapter, your models, your decorators.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>introspect_project:</strong> every registered procedure with kind (query or mutation), parameter names, types, requiredness, defaults, docstrings, and full input/output JSON Schemas.</li>
                    <li><strong>check_call:</strong> validates hypothetical arguments against real Python types without executing anything, returning structured per-parameter errors an agent can act on immediately.</li>
                    <li><strong>run_codegen:</strong> regenerates each configured client's __pyrpc.ts through the same pipeline as pyrpc codegen. dry_run=true by default; the dry run reports up to date, would update, or would create per target.</li>
                </ul>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Security posture</h2>
                <p>
                    There is deliberately no tool that executes procedures. An agent connected through MCP can read schemas and validate payloads, but can never trigger a database write, a network call, or any other side effect of your backend. The server is local-only stdio with no telemetry and no network egress. Tool annotations advertise mutability honestly so well-behaved clients can gate accordingly.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Packaging</h2>
                <p>
                    The SDK rides as an optional extra, so production images installing plain pyrpc-core stay lean:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`uv add "pyrpc-core[mcp]"`}</pre>
                <p>
                    Plain installs that attempt <code>pyrpc mcp</code> get a precise remediation message on stderr and exit code 2, never protocol noise on stdout and never a traceback.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Upgrade path</h2>
                <p>
                    No breaking changes. Bump, add the extra where you want agent integration, and point your client at <code>uv run pyrpc mcp</code>. The docs gained a dedicated MCP page with copy-paste configuration for every major client.
                </p>
            </section>
        </article>
    )
}
