import Link from 'next/link'

export default function HowToSetUpMcpInUnder5Minutes() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    How to set up MCP in under 5 minutes
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 3:30pm</time>
                    <span>&middot;</span>
                    <span>5 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    There are two paths to getting MCP running with pyRPC. One takes about thirty seconds. The other takes about five minutes. Both get you to a working agent with structured tools for your Python project.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Remote: thirty seconds</h2>
                <p>
                    If you just need framework documentation, run the remote setup:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`npx pyrpc mcp`}</code></pre>
                <p>
                    Select your agent from the list. The command writes the config, registers the remote documentation server, and exits. No install, no dependencies, no config files to hand-edit. The server hosts current framework docs and serves them through MCP tool calls your agent already understands.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Local: five minutes</h2>
                <p>
                    If you need code introspection, payload validation, and client generation, go local:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`# 1. Add the MCP dependency
uv add "pyrpc-core[mcp]"

# 2. Register with your agent
uv run pyrpc mcp

# 3. Verify it works
# Ask your agent: "introspect my project"`}</code></pre>
                <p>
                    Step one pulls the MCP SDK alongside pyRPC core. Step two writes the agent config for your client. Step three confirms the server can import your routers and return the procedure tree.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What each command does</h2>
                <p>
                    <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">uv add "pyrpc-core[mcp]"</code> installs pyRPC core with the optional MCP extra. The MCP Python SDK becomes available. No other packages are needed.
                </p>
                <p>
                    <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">uv run pyrpc mcp</code> detects your agent, writes the stdio server config, and registers it. For Claude Code it writes <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">.claude/settings.json</code>. For Cursor it writes <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">.cursor/mcp.json</code>. For VS Code it writes <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">.vscode/mcp.json</code>.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The it-just-works principle</h2>
                <p>
                    No config files to edit by hand. No paths to find in your virtualenv. No environment variables to export. The commands detect what they need and write what they must. If the agent is running, it picks up the new server on next restart.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The two setup paths</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`
Remote (30s)                   Local (5min)
-----------                    ------------
npx pyrpc mcp                  uv add "pyrpc-core[mcp]"
  |                              |
  v                              v
select agent                   uv run pyrpc mcp
  |                              |
  v                              v
done                           verify with agent
  |                              |
  v                              v
framework docs                 full code introspection
`}</code></pre>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Next steps</h2>
                <p>
                    Once the server is registered, try these in order. Ask the agent to introspect your project. It will call <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">introspect_project</code> and return your procedure tree. Ask it to validate a payload with <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">check_call</code>. Ask it to regenerate your clients with <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">run_codegen</code>.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Common first-time issues</h2>
                <p>
                    <strong>Agent does not see the server.</strong> Restart the agent. Most clients read MCP config at startup, not on file change.
                </p>
                <p>
                    <strong>&ldquo;No procedures found.&rdquo;</strong> Your <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc.json</code> is missing <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">backend.entrypoint</code>. Add it and restart the server.
                </p>
                <p>
                    <strong>MCP SDK not installed.</strong> Re-run <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">uv add "pyrpc-core[mcp]"</code>. The extra is required for the <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">mcp</code> subcommand.
                </p>
                <p>
                    <strong>Server crashes on start.</strong> Run <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">uv run pyrpc mcp</code> directly and check stderr. Import errors in your entrypoint are the usual cause.
                </p>
            </section>
        </article>
    )
}
