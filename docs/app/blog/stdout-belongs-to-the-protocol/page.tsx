import Link from 'next/link'

export default function StdoutBelongsToProtocol() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    stdout belongs to the protocol: stdio discipline in pyrpc mcp
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 4:00pm</time>
                    <span>&middot;</span>
                    <span>4 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">

                <p>
                    stdio MCP servers have one inviolable rule: stdout is the wire. Every byte written there is parsed as protocol by the client. One cheerful print statement from your code, one library banner, one buffered leftover at interpreter shutdown, and the connection corrupts in ways that look like flaky bugs rather than what they are.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How the official SDK helps, and where it cannot</h2>
                <p>
                    While serving, the SDK redirects flushed stdout writes to stderr, which catches the common case of subprocesses and print calls mid-session. Two windows remain dangerous: anything flushed before serving begins, and anything buffered until process exit drains it. That puts the obligation on us: between process start and mcp.run(), the command must emit nothing to stdout under any path, including failure.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Our rule, mechanically enforced</h2>
                <p>
                    The dependency-missing path is the trap most integrations fumble. Ours prints its remediation through typer.echo(err=True) and exits before the server module is even imported, verified by a unit test asserting stderr content and exit code 2. During serving, diagnostics flow exclusively through logging, which the SDK routes to stderr. And the stdio test suite parses every single stdout line as JSON-RPC, so contamination is not a code-review opinion, it is a red build:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# every stdout line must be protocol, not commentary
line = proc.stdout.readline()
message = json.loads(line)  # raises on any contamination`}</pre>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The payoff</h2>
                <p>
                    Clean transport discipline is invisible when present and catastrophic when absent. It is also the cheapest kind of production polish: a convention, a helper, and tests that turn the convention into physics. The result is a server you can point Claude Desktop, Cursor, or OpenCode at with the same confidence as any flagship integration.
                </p>
            </section>
        </article>
    )
}
