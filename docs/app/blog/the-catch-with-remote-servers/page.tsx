import Link from 'next/link'

export default function TheCatchWithRemoteServers() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The catch with remote MCP servers
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 3:00pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Remote MCP servers sound like the obvious next step. Host the server, point agents at it, skip the local install entirely. But the ecosystem is not there yet, and pretending otherwise leads to integration dead ends. Here is what actually works, what does not, and why.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Claude Desktop refuses remote servers</h2>
                <p>
                    Claude Desktop runs MCP servers locally over stdio. It does not connect to remote HTTP endpoints. This is a design decision, not a bug: Anthropic&rsquo;s custom-connector model assumes the server runs on the user&rsquo;s machine, under their control. If you host a remote MCP server and point Claude Desktop at it, it will not connect.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">VS Code supports them natively</h2>
                <p>
                    VS Code&rsquo;s MCP integration includes a <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">servers.http</code> configuration that connects to remote endpoints. This is the one major client where remote servers work out of the box. Cursor also supports SSE transport, though the setup is less documented.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The auth gap</h2>
                <p>
                    The MCP specification has no built-in authentication for HTTP servers. There is no OAuth flow, no API key handshake, no token exchange. The spec defines JSON-RPC over HTTP, period. This means any remote server either runs completely open or bolts on auth outside the protocol. Neither option is great for production use.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What read-only actually means</h2>
                <p>
                    When we describe a remote MCP server as read-only, we mean the server serves static documentation, not your code. It can return framework references, API schemas, and configuration examples. It cannot import your routers, validate your payloads, or introspect your types. The data is public knowledge with no blast radius, which is exactly why auth matters less.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Rate limiting and availability</h2>
                <p>
                    A hosted MCP server is infrastructure. Infrastructure has SLAs, cost curves, and failure modes. Rate limiting protects against abuse but also throttles legitimate use. Downtime means every connected agent loses context. For a documentation server this is manageable; for a code-introspection server it is a non-starter.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The two-server pattern</h2>
                <p>
                    The practical architecture today is two servers with different trust profiles. The local server handles code introspection: it imports your routers, validates payloads, and regenerates clients. The remote server handles framework knowledge: it serves documentation, configuration patterns, and API references. Agents connect to both, but they serve different purposes and carry different privileges.
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`
agent
  |
  +---> local stdio server (your code)
  |       - introspect_project
  |       - check_call
  |       - run_codegen
  |
  +---> remote HTTP server (docs)
          - framework reference
          - config examples
          - API schemas
`}</code></pre>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this is still better than copy-pasting docs</h2>
                <p>
                    The alternative to a remote documentation server is stuffing docs into context windows manually. That approach burns tokens on every conversation, goes stale between copy-paste sessions, and has no structured query surface. A remote MCP server serves current documentation through a protocol the agent already speaks, with structured tool calls instead of raw text dumps.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The future</h2>
                <p>
                    The MCP specification is evolving toward OAuth 2.0 support for HTTP servers. When that lands, remote servers can authenticate properly, which opens the door to hosted introspection servers with credential scoping. Registry servers that aggregate multiple MCP endpoints behind a single authenticated surface are also emerging. For now, the local-first, remote-for-docs pattern is the pragmatic choice.
                </p>
            </section>
        </article>
    )
}
