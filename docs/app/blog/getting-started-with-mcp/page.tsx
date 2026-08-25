import Link from 'next/link'

export default function GettingStartedWithMcp() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Getting Started With MCP: A Practical Guide
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026</time>
                    <span>&middot;</span>
                    <span>10 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    pyRPC has two MCP surfaces: a remote server that provides documentation to agents, and a local server that provides your project&apos;s API to agents. This guide walks through setting up both, then combining them.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Prerequisites</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Python 3.11 or later</li>
                    <li>Node.js 18 or later</li>
                    <li><a href="https://docs.astral.sh/uv/getting-started/installation/" className="text-fd-foreground underline underline-offset-2 hover:text-fd-muted-foreground transition-colors">uv</a> installed</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Part 1: Remote Documentation MCP (5 minutes)</h2>
                <p>
                    The remote MCP server provides pyRPC documentation to your agent. No project setup required.
                </p>

                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`npx pyrpc mcp`}</code></pre>
                <p>
                    The CLI detects which AI coding agents are installed on your system and lets you select which ones to configure. It writes the MCP server URL (<code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">https://mcp.pyrpc.com/mcp</code>) into each agent&apos;s config file.
                </p>
                <p>
                    Verify the connection by asking your agent to search for something:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`"Search the pyRPC docs for FastAPI integration"`}</code></pre>
                <p>
                    The agent should return results from the documentation, including relevant guide pages and code examples. That is it. Your agent now has access to the full pyRPC documentation.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Part 2: Local Project MCP (5 minutes)</h2>
                <p>
                    The local MCP server provides your project&apos;s actual API to your agent. This is where the real power is.
                </p>

                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`# Add MCP support to your project
uv add "pyrpc-core[mcp]"`}</code></pre>
                <p>
                    Then register the local server with your agent. For Claude Code:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`claude mcp add pyrpc -- pyrpc mcp`}</code></pre>
                <p>
                    For other agents, add the MCP entry manually to their config:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`{
  "mcpServers": {
    "pyrpc": {
      "command": "pyrpc",
      "args": ["mcp"]
    }
  }
}`}</code></pre>

                <p>
                    Now try the three core tools:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>introspect_project:</strong> Ask &ldquo;What procedures does my project expose?&rdquo; The agent sees every registered procedure with full parameter schemas.</li>
                    <li><strong>check_call:</strong> Ask &ldquo;Would calling create_user with email=test@example.com work?&rdquo; The agent gets back per-parameter errors if something is wrong.</li>
                    <li><strong>run_codegen:</strong> Ask &ldquo;Generate a React hook for create_user&rdquo; The agent runs codegen with dry_run=true first, then writes it only after approval.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Part 3: Both together</h2>
                <p>
                    Configure both servers in the same agent. This gives your agent two capabilities: understanding your project and understanding pyRPC.
                </p>
                <p>
                    Now the agent can answer &ldquo;how do I add authentication?&rdquo; using the remote docs server, and &ldquo;what procedures does my app expose?&rdquo; using the local server. It switches between them based on context.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Troubleshooting</h2>

                <p>
                    <strong>npx pyrpc mcp hangs or times out</strong>
                </p>
                <p>
                    The MCP server communicates over stdio. Make sure your agent is configured to use stdio transport, not HTTP. Check that Node.js 18+ is installed by running <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">node --version</code>.
                </p>

                <p>
                    <strong>introspect_project returns &ldquo;no config found&rdquo;</strong>
                </p>
                <p>
                    The local MCP server looks for <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc.json</code> in your project root. Make sure you are running from the directory that contains it. If you have not created one yet, run <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc init</code>.
                </p>

                <p>
                    <strong>Client shows no tools</strong>
                </p>
                <p>
                    Confirm <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">uv add &quot;pyrpc-core[mcp]&quot;</code> succeeded. Restart your agent after adding the MCP server. Most agents only read MCP configuration at startup.
                </p>

                <p>
                    <strong>ModuleNotFoundError on import</strong>
                </p>
                <p>
                    A dependency of your entrypoint module is missing from the environment running the MCP server. Verify <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc dev</code> works in the same checkout.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Next steps</h2>
                <p>
                    With both MCP servers running, explore the full documentation, join the community to ask questions and share what you build, or contribute to the project itself. The two-server pattern scales: add more MCP servers for your database, your deployment platform, or any other tool your agent needs to understand.
                </p>
            </section>
        </article>
    )
}
