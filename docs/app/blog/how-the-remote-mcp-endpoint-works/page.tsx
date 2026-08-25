import Link from 'next/link'

export default function HowTheRemoteMcpEndpointWorks() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    How the Remote MCP Endpoint Works
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    pyRPC hosts a remote MCP server at <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">mcp.pyrpc.com</code>. It serves documentation to AI agents over the Streamable HTTP transport. This post explains what it does, how it works under the hood, and what it does not do.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Two routes, one domain</h2>
                <p>
                    The <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">mcp.pyrpc.com</code> domain has two routes. The root returns a small JSON object with the server name and version. The <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">/mcp</code> endpoint is the MCP protocol handler. Everything else returns 404.
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`mcp.pyrpc.com/         -> { name, version, mcp_endpoint }
mcp.pyrpc.com/mcp      -> MCP protocol handler (Streamable HTTP)
mcp.pyrpc.com/*        -> 404`}</code></pre>
                <p>
                    The root exists for humans who want to verify the server is running. MCP clients never hit it. Clients connect to <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">/mcp</code> and discover capabilities through the protocol itself, not from a public JSON document.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The two tools</h2>
                <p>
                    The server exposes exactly two tools: <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">search_docs</code> and <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">get_doc</code>.
                </p>
                <p>
                    <strong>search_docs</strong> takes a query string and an optional limit. It searches the Orama index that backs the docs site search bar. Results include page titles, URLs, and content excerpts. This is the same index the browser uses when you type in the search box at the top of the docs.
                </p>
                <p>
                    <strong>get_doc</strong> takes a path like <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">/docs/server/fastapi</code> and returns the full page content as markdown. It reads from the same Fumadocs source that generates the static pages. The content is always current because it is rendered from the live MDX files, not a snapshot.
                </p>
                <p>
                    That is it. Two tools. The server does not try to be a general-purpose documentation AI. It gives the agent structured access to the documentation, and the agent does the reasoning.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How the request flows</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`Agent                          mcp.pyrpc.com              Fumadocs / Orama
  |                                |                          |
  |-- initialize ----------------->|                          |
  |<--- capabilities --------------|                          |
  |                                |                          |
  |-- tools/list ----------------->|                          |
  |<--- [search_docs, get_doc] ---|                          |
  |                                |                          |
  |-- search_docs("FastAPI") ----->|                          |
  |                                |-- search(query) -------->|
  |                                |<--- [results] ----------|
  |<--- results -------------------|                          |
  |                                |                          |
  |-- get_doc("/docs/server/fast")-|                          |
  |                                |-- getPage(slug) -------->|
  |                                |-- getLLMText(page) ---->|
  |                                |<--- markdown ------------|
  |<--- markdown content ----------|                          |`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What it does not do</h2>
                <p>
                    The remote server does not execute procedures. It does not import your code. It does not know what your project exposes. It has no write permissions, no authentication, and no access to any user&rsquo;s codebase. It serves pyRPC documentation, same as the static site.
                </p>
                <p>
                    For code introspection, use the local MCP server (<code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc mcp</code>). That server imports your backend module and walks your live registry. The two servers are complementary, not interchangeable.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Host and Origin validation</h2>
                <p>
                    The endpoint validates incoming requests against two lists: allowed hosts and allowed origins. Only <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">mcp.pyrpc.com</code> and <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc.com</code> are accepted. Requests from other hosts or origins are rejected. This prevents the endpoint from being called by arbitrary third-party sites.
                </p>
                <p>
                    When no Origin header is present, the check passes. This is standard for server-to-server MCP calls where the client does not send an Origin header, such as CLI tools and local agents connecting over HTTP.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Stateless by design</h2>
                <p>
                    The handler runs in stateless mode. Each request is independent. There is no session state, no conversation history, no context carried between calls. This means the server can scale horizontally on serverless infrastructure without sticky sessions. It also means there is no memory of what the agent asked before. Every call is self-contained.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The middleware layer</h2>
                <p>
                    Next.js middleware handles the routing. When a request arrives for <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">mcp.pyrpc.com/mcp</code>, the middleware rewrites it to <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">/api/mcp</code>. When a request arrives for <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">mcp.pyrpc.com/</code>, it rewrites to <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">/api/mcp-metadata</code>. All other paths return 404.
                </p>
                <p>
                    This keeps the MCP routes isolated from the docs site. The docs live at <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc.com</code>. The MCP server lives at <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">mcp.pyrpc.com</code>. Same deployment, different hostnames, different purposes.
                </p>
            </section>
        </article>
    )
}
