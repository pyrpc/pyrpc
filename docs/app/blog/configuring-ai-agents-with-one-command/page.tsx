import Link from 'next/link'

export default function ConfiguringAiAgentsWithOneCommand() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Configuring AI Agents with One Command
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Every AI coding agent stores MCP server configuration in a different file, in a different format, at a different path. Claude Desktop uses <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">~/.claude/settings.json</code>. Cursor uses <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">.cursor/mcp.json</code>. VS Code uses <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">.vscode/mcp.json</code>. The list goes on. Each format is slightly different, each path is slightly different, and getting any of them wrong means the agent silently ignores the server.
                </p>
                <p>
                    The <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">@pyrpc/mcp</code> npm package solves this with a single command.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The command</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`npx @pyrpc/mcp mcp`}</code></pre>
                <p>
                    That is it. The CLI detects which agents you have installed, lets you select which ones to configure, and writes the correct MCP server entry into each one. The server URL is always <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">https://mcp.pyrpc.com/mcp</code>. The server name is always <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc-docs</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What it writes</h2>
                <p>
                    For each selected agent, the CLI calls <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">upsertServer</code> from the <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">add-mcp</code> engine. This function knows where each agent stores its MCP config, how to parse the existing file, and how to merge a new server entry without clobbering existing configuration. The CLI does not implement any of this itself. It delegates everything to the maintained tool that already handles the 19-agent matrix.
                </p>
                <p>
                    The result is the same no matter which agent you pick:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`{
  "pyrpc-docs": {
    "type": "http",
    "url": "https://mcp.pyrpc.com/mcp"
  }
}`}</code></pre>
                <p>
                    The format is different for each agent because each agent stores config differently. But the content is the same: a named HTTP server pointing at the remote docs endpoint.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Agent detection</h2>
                <p>
                    The CLI scans two locations: your current project directory and your global config directories. Agents found in either location are pre-selected in the multiselect prompt. If you have Claude Code installed globally and Cursor in your project, both show as &quot;detected&quot; in the selection list. You can override the selection with the <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">--agent</code> flag.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Local vs global scope</h2>
                <p>
                    The CLI asks for install scope. Local writes to the project directory (for example <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">.mcp.json</code> in the repo root). Global writes to your user-level config. Project scope is usually what you want: the MCP server is configured for this repository, and anyone who clones it gets the same setup.
                </p>
                <p>
                    Use <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">--global</code> when you want the docs server available in every project without configuring each one:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`npx @pyrpc/mcp mcp --global`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What the server does</h2>
                <p>
                    The configured server is the remote documentation endpoint at <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">mcp.pyrpc.com/mcp</code>. It provides two tools: <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">search_docs</code> for searching the documentation index, and <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">get_doc</code> for reading a specific page. The server is read-only, requires no authentication, and does not access your code.
                </p>
                <p>
                    This is the documentation server. For code introspection, use the local MCP server instead:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`uv add "pyrpc-core[mcp]"`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Supported agents</h2>
                <p>
                    The CLI supports 19 agents. Run <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">--list</code> to see the full list:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`npx @pyrpc/mcp mcp --list`}</code></pre>
                <p>
                    The list is maintained by the <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">add-mcp</code> project, not by pyRPC. When a new agent ships MCP support, it appears in the list after you update the package.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Skip the interactive prompt</h2>
                <p>
                    For scripting or CI, pass agents directly:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`npx @pyrpc/mcp mcp --agent claude-code cursor --global`}</code></pre>
                <p>
                    This configures Claude Code and Cursor globally without any interactive prompts. The command exits with code 0 on success and code 1 if any agent failed.
                </p>
            </section>
        </article>
    )
}
