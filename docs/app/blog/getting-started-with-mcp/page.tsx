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
                    pyRPC has two MCP surfaces: a remote server that provides documentation to agents, and a local server that provides your project's API to agents. This guide walks through setting up both, then combining them.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Prerequisites</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`Python 3.11+
Node.js 18+
uv (https://docs.astral.sh/uv/getting-started/installation/)`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Part 1: Remote Documentation MCP (5 minutes)</h2>
                <p>
                    The remote MCP server provides pyRPC documentation to your agent. No project setup required.
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`# Step 1: Start the remote MCP server
npx pyrpc mcp

# The CLI will prompt you to select an agent.
# Choose your agent (Claude, Cursor, VS Code, etc.)
# and it will configure the MCP server automatically.`}</code></pre>
                <p>
                    Verify the connection by asking your agent to search for something. Try:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`"Search the pyRPC docs for FastAPI integration"

# The agent should return results from the documentation,
# including relevant guide pages and code examples.`}</code></pre>
                <p>
                    That is it. Your agent now has access to the full pyRPC documentation. It can search for topics, read pages, and answer questions about pyRPC without leaving your editor.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Part 2: Local Project MCP (15 minutes)</h2>
                <p>
                    The local MCP server provides your project's actual API to your agent. This is where the real power is.
                </p>

                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`# Step 1: Create a pyRPC project (skip if you have one)
mkdir my-project && cd my-project
pyrpc init

# Step 2: Add MCP support to your project
uv add "pyrpc-core[mcp]"

# Step 3: Register the local MCP with your agent
# This adds the local server to your agent's config
npx pyrpc mcp --local`}</code></pre>

                <p>
                    Now try the three core tools:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`# Tool 1: introspect_project
# Ask your agent: "What procedures does my project expose?"
# The agent calls introspect_project and sees every registered
# procedure with full parameter schemas.

# Tool 2: check_call
# Ask your agent: "Would calling create_user with email=test@example.com work?"
# The agent calls check_call and gets back:
# { "valid": true } or per-parameter errors if something is wrong.

# Tool 3: run_codegen
# Ask your agent: "Generate a React hook for create_user"
# The agent calls run_codegen with dry_run=true, sees the output,
# and writes it only after approval.`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Part 3: Both together</h2>
                <p>
                    Configure both servers in the same agent. This gives your agent two capabilities: understanding your project and understanding pyRPC.
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`# Your agent config (e.g., .claude/config.json)
{
  "mcpServers": {
    "pyrpc-docs": {
      "command": "npx",
      "args": ["pyrpc", "mcp"],
      "description": "pyRPC documentation server"
    },
    "pyrpc-project": {
      "command": "npx",
      "args": ["pyrpc", "mcp", "--local"],
      "description": "Local project API server"
    }
  }
}`}</code></pre>
                <p>
                    Now the agent can answer "how do I add authentication?" using the remote docs server, and "what procedures does my app expose?" using the local server. It switches between them based on context.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Setup checklist</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`  Remote Documentation MCP
  [x] Node.js 18+ installed
  [x] npx pyrpc mcp run
  [x] Agent selected and configured
  [x] Tested: search for a topic
  [x] Verified: agent reads doc pages

  Local Project MCP
  [x] Python 3.11+ installed
  [x] uv installed
  [x] pyRPC project exists (pyrpc init)
  [x] pyrpc-core[mcp] added to dependencies
  [x] Local MCP registered with agent
  [x] Tested: introspect_project
  [x] Tested: check_call
  [x] Tested: run_codegen (dry run)

  Both Together
  [x] Both servers in agent config
  [x] Verified: agent uses docs for questions
  [x] Verified: agent uses local for your code`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Troubleshooting</h2>

                <p>
                    <strong>1. "npx pyrpc mcp" hangs or times out</strong>
                </p>
                <p>
                    The MCP server communicates over stdio. Make sure your agent is configured to use stdio transport, not HTTP. If you see a timeout, check that Node.js 18+ is installed by running node --version.
                </p>

                <p>
                    <strong>2. introspect_project returns "no config found"</strong>
                </p>
                <p>
                    The local MCP server looks for pyrpc.json in your project root. Make sure you are running npx pyrpc mcp --local from the directory that contains pyrpc.json. If you have not created one yet, run pyrpc init.
                </p>

                <p>
                    <strong>3. check_call says "procedure not found"</strong>
                </p>
                <p>
                    The procedure name must match exactly, including the namespace. If your procedure is registered under users.create_user, call it as users.create_user, not create_user. Run introspect_project to see the full qualified names.
                </p>

                <p>
                    <strong>4. Agent does not see the MCP tools</strong>
                </p>
                <p>
                    Restart your agent after adding the MCP server to its config. Most agents only read MCP configuration at startup. If the tools still do not appear, check the agent's MCP logs for connection errors.
                </p>

                <p>
                    <strong>5. "uv add" fails with dependency conflict</strong>
                </p>
                <p>
                    Make sure your project uses a compatible pyrpc version. Run uv pip list | grep pyrpc to check. If you need to update, run uv add "pyrpc-core&gt;=0.13.0" to get the version that includes MCP support.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Next steps</h2>
                <p>
                    With both MCP servers running, explore the full documentation at pyrpc.dev, join the community to ask questions and share what you build, or contribute to the project itself. The two-server pattern scales: add more MCP servers for your database, your deployment platform, or any other tool your agent needs to understand.
                </p>
            </section>
        </article>
    )
}
