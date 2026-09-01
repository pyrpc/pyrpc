import Link from 'next/link'

export default function V0140ReleaseNotes() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    pyRPC v0.14.0: The MCP Release
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026</time>
                    <span>&middot;</span>
                    <span>5 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    v0.14.0 is the release that turns pyRPC from a code-generation framework into an AI-native surface. Two MCP servers, a distribution CLI, 17 bug fixes, and a test suite that now covers 197 cases at 91%.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Local project MCP</h2>
                <p>
                    Running <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc mcp</code> inside your project spawns a local MCP server over stdio. It imports your configured backend module, walks the live registry, and exposes three tools:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>introspect_project</strong> returns every registered procedure with kind, parameter names, types, requiredness, defaults, docstrings, and full input/output JSON Schemas.</li>
                    <li><strong>check_call</strong> validates hypothetical arguments against real Python types without executing anything, returning structured per-parameter errors an agent can act on immediately.</li>
                    <li><strong>run_codegen</strong> regenerates client TypeScript through the same pipeline as <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc codegen</code>. dry_run=true by default, safe to invoke speculatively.</li>
                </ul>
                <p>
                    The server is local-only stdio with no telemetry and no network egress. Agents see your actual routers, schemas, and types, not a generated snapshot.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Remote documentation MCP</h2>
                <p>
                    A second server lives at <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">mcp.pyrpc.com/mcp</code> and serves pyRPC documentation. Launch it with <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">npx @pyrpc/mcp mcp</code>. It is read-only, requires no authentication, and carries zero access to your project. The agent gets up-to-date docs without leaving the IDE.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Architecture</h2>
                <p>
                    The two servers serve different purposes and operate under different trust models:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`  AI Coding Client (Claude Code / Cursor / VS Code / OpenCode)
  |
  |-- stdio subprocess (local)          HTTP SSE (remote)
  |                                     |
  v                                     v
+----------------------------+    +------------------------+
| Local MCP Server           |    | Remote MCP Server      |
| (pyrpc mcp)                |    | (mcp.pyrpc.com/mcp)   |
|                            |    |                        |
| YOUR machine               |    | pyRPC infrastructure   |
| YOUR Python environment    |    | Read-only docs         |
| YOUR backend module        |    | No auth required       |
| YOUR registry              |    | No access to code      |
|                            |    |                        |
| Tools:                     |    | Tools:                 |
|  introspect_project        |    |  search_docs            |
|  check_call                |    |  get_procedure_ref      |
|  run_codegen               |    |  get_adapter_guide      |
+----------------------------+    +------------------------+`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Distribution CLI</h2>
                <p>
                    The npm package <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc</code> wraps the MCP setup process. A single <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">npx pyrpc add-mcp</code> writes the correct configuration to your MCP client config file, whether that is Claude Desktop, Cursor, VS Code, or OpenCode. No manual JSON editing.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Bug fixes and polish</h2>
                <p>
                    17 bug fixes shipped in this cycle. Highlights include corrected codegen output for optional parameters with complex union types, a fix for the watch command not detecting changes to imported modules, and improved error messages when the backend module cannot be imported. Full details in the changelog.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Test suite</h2>
                <p>
                    197 tests, 91% line coverage. The MCP server has its own test suite that exercises all three tools against a real FastAPI project with 12 registered procedures. Integration tests verify that the stdio transport handles malformed JSON gracefully and that the server exits cleanly when the parent process disconnects.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Upgrade path</h2>
                <p>
                    No breaking changes. Bump to v0.14.0, add the MCP extra where you want agent integration, and point your client at <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">uv run pyrpc mcp</code>. The docs gained a dedicated MCP page with copy-paste configuration for every major client.
                </p>
            </section>
        </article>
    )
}
