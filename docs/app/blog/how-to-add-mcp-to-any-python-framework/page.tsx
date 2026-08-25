import Link from 'next/link'

export default function HowToAddMcpToAnyPythonFramework() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    How to add MCP to any Python framework
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 2:30pm</time>
                    <span>&middot;</span>
                    <span>9 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    pyRPC&rsquo;s local MCP server introspects your code at runtime. That means it has to import your routers, which means it needs to know how your application starts. This post walks through adding MCP to FastAPI, Django, Flask, or any ASGI/WSGI application in five concrete steps.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Prerequisites</h2>
                <p>
                    You need a <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc.json</code> with <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">backend.framework</code> and <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">backend.entrypoint</code> set. These tell pyRPC how to discover your procedures. If you ran the setup wizard, these are already populated. If not, add them manually:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`{
  "backend": {
    "framework": "fastapi",
    "entrypoint": "app.main:app"
  }
}`}</code></pre>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 1: add the MCP dependency</h2>
                <p>
                    The MCP SDK is an optional dependency. Add it with the <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">mcp</code> extra:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`uv add "pyrpc-core[mcp]"`}</code></pre>
                <p>
                    This pulls in the MCP Python SDK alongside pyRPC core. No other packages are needed.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 2: register with your agent</h2>
                <p>
                    Each agent has a different config format. The <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc mcp</code> command handles this automatically, but here is what it writes so you understand the surface:
                </p>
                <p>
                    <strong>Claude Code</strong> gets an entry in <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">.claude/settings.json</code> under <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">mcpServers</code>. The command is <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">uv run pyrpc mcp</code> and the transport is stdio.
                </p>
                <p>
                    <strong>Cursor</strong> gets an entry in <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">.cursor/mcp.json</code> with the same command shape.
                </p>
                <p>
                    <strong>VS Code</strong> gets an entry in <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">.vscode/mcp.json</code> with a <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">type: "stdio"</code> field.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 3: verify with introspect_project</h2>
                <p>
                    Once the server is registered, ask your agent to introspect the project. It will call the <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">introspect_project</code> tool, which imports your routers and returns the full procedure tree. If the agent can describe your endpoints without you telling it anything, the integration is working.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 4: validate payloads with check_call</h2>
                <p>
                    Before generating any RPC call, have the agent run <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">check_call</code> against a procedure. This validates the payload against the procedure&rsquo;s pydantic schema without executing anything. It is the safety net that keeps the agent from guessing at types.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 5: regenerate clients with run_codegen</h2>
                <p>
                    When you add or modify procedures, ask the agent to run <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">run_codegen</code>. This regenerates the TypeScript client, hooks, and types to match your current router surface. The agent sees the diff and can update any call sites automatically.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The setup flow</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`
pyrpc.json
  |
  v
import entrypoint
  |
  v
registry discovers routers
  |
  v
MCP server exposes tools
  |
  v
agent reads procedure tree
`}</code></pre>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Framework-specific gotchas</h2>
                <p>
                    <strong>FastAPI</strong> is the simplest case. The entrypoint points to the module containing your <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">app</code> object. Routers are auto-discovered through FastAPI&rsquo;s own router tree. If you use <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">include_router</code>, pyRPC follows the chain.
                </p>
                <p>
                    <strong>Django</strong> requires you to set <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">types_module</code> in pyrpc.json. This is the module whose import side-effects register your procedures with the pyRPC registry. Without it, the server imports the entrypoint but finds zero procedures.
                </p>
                <p>
                    <strong>Flask</strong> works the same way as Django: manual registration is required. Your entrypoint must import the module that calls <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">@pyrpc.procedure</code> decorators. If the registry is empty, check that your import chain actually reaches the decorated functions.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Troubleshooting</h2>
                <p>
                    <strong>&ldquo;No procedures found&rdquo;</strong> means the entrypoint was imported but the registry is empty. For Django and Flask, verify that <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">types_module</code> is set and points to a module that actually imports your procedure decorators. For FastAPI, check that your routers are included in the app tree before the MCP server reads them.
                </p>
                <p>
                    <strong>&ldquo;ModuleNotFoundError&rdquo;</strong> means the entrypoint path is wrong or a dependency is missing. Run <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">uv run python -c "import app.main"</code> to verify the import works standalone.
                </p>
                <p>
                    <strong>&ldquo;MCP SDK not installed&rdquo;</strong> means you forgot the extra. Re-run <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">uv add "pyrpc-core[mcp]"</code> and check that <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">uv pip list | grep mcp</code> shows the SDK.
                </p>
                <p>
                    <strong>&ldquo;Tool call failed&rdquo;</strong> in the agent usually means the stdio process crashed. Check stderr from <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">uv run pyrpc mcp</code> directly. Import errors and missing dependencies are the usual suspects.
                </p>
            </section>
        </article>
    )
}
