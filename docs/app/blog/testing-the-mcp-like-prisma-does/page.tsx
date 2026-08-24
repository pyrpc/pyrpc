import Link from 'next/link'

export default function TestingTheMcpLikePrismaDoes() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Three layers of proof: testing pyrpc mcp end to end
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 6:00pm</time>
                    <span>&middot;</span>
                    <span>5 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    An MCP server is a protocol implementation wearing your product's name, so testing it only as Python functions would be malpractice. The suite exercises three layers: handler logic, wire protocol through the official client, and a genuine subprocess speaking over real pipes.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Layer one: the official in-memory client</h2>
                <p>
                    The SDK ships a Client that connects to a server object directly, no transport, the same idea as FastAPI's TestClient. Seventeen tests ride it: tools/list shape and annotations, input schemas, structured content for happy paths, and every failure mode asserted as is_error with remediation text rather than exceptions. Because it is the same client the SDK uses on itself, protocol drift gets caught by upstream tests before it ever reaches ours.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Layer two: a real subprocess over real pipes</h2>
                <p>
                    In-memory cannot catch framing bugs, buffering hazards, or lifecycle mistakes, so the stdio suite launches pyrpc mcp as an actual child process in a temporary project and speaks raw JSON-RPC across stdin and stdout. Every stdout line is parsed as protocol, proving purity mechanically. The handshake asserts serverInfo identifies as pyrpc with the right version. Closing stdin must end the process cleanly with exit zero, because that is exactly how GUI clients terminate sessions.
                </p>
                <p>
                    The same suite drives the official Client with StdioServerParameters, which is character-for-character how Cursor or Claude Desktop launch the server. If a config snippet in the docs stops working, this layer notices before users do.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Layer three: the matrix</h2>
                <p>
                    Windows earned its keep again. The nine-leg matrix caught ClientInfo paths carrying native backslash separators while every other path in tool output used forward slashes, a cosmetic inconsistency that would have confused cross-platform agents forever. Normalized once, covered forever. Handler isolation details matter too: unique module names per test defeat sys.modules caching, and the global registry clears between tests so assertions stay exact.
                </p>
            </section>
        </article>
    )
}
