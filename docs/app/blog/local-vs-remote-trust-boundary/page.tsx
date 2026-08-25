import Link from 'next/link'

export default function LocalVsRemoteTrustBoundary() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Local vs Remote: The Trust Boundary That Matters
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026</time>
                    <span>&middot;</span>
                    <span>9 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    pyRPC v0.14.0 ships two MCP servers. One runs on your machine as a stdio subprocess. The other runs on pyRPC infrastructure and serves documentation over HTTP. They are not interchangeable. They are not two flavors of the same thing. They are two servers separated by a trust boundary, and the distinction matters for security, compliance, and agent behavior.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The local server</h2>
                <p>
                    <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc mcp</code> spawns a subprocess inside your client. The subprocess imports your Python backend module in your interpreter, walks your live registry, and returns metadata from your environment. No network calls. No telemetry. No data leaves your machine.
                </p>
                <p>
                    The agent sees your actual routers, your actual schemas, your actual types. Not a generated snapshot, not a documentation approximation, the real thing. This is what makes <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">check_call</code> meaningful: it validates against your real validation logic, including custom validators, pydantic models, and runtime constraints that no schema file can capture.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The remote server</h2>
                <p>
                    The documentation MCP lives at <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">mcp.pyrpc.com/mcp</code>. It serves pyRPC documentation, adapter guides, and procedure reference material. It is read-only, requires no authentication, and carries zero access to any user&rsquo;s codebase.
                </p>
                <p>
                    Launch it with <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">npx @pyrpc/mcp mcp</code>. The agent gets up-to-date documentation without leaving the IDE, and the server gets nothing in return but the query.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The trust boundary</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`  +---------------------------------------------------+
  |  YOUR MACHINE                                     |
  |                                                   |
  |  AI Client (Claude Code / Cursor / VS Code)       |
  |    |                                              |
  |    |-- stdio subprocess                           |
  |    |                                              |
  |    v                                              |
  |  Local MCP Server                                 |
  |    imports YOUR backend module                     |
  |    walks YOUR registry                             |
  |    validates YOUR types                            |
  |    writes YOUR codegen output                      |
  |                                                   |
  |  [zero network egress]                             |
  |                                                   |
  +---------------------------------------------------+
  |  NETWORK BOUNDARY                                 |
  +---------------------------------------------------+
  |                                                   |
  |  Remote MCP Server (mcp.pyrpc.com/mcp)            |
  |    hosted on pyRPC infrastructure                 |
  |    read-only documentation                         |
  |    no authentication required                      |
  |    no access to any user code                      |
  |    managed infrastructure, managed updates         |
  |                                                   |
  +---------------------------------------------------+`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why the distinction matters</h2>
                <p>
                    For security teams, the question is not &ldquo;does this tool do something dangerous?&rdquo; but &ldquo;where does this tool execute, and what can it see?&rdquo; The local server executes in your environment with your permissions. It can see your database models, your authentication logic, your internal API surface. That visibility is the point, and it is also the risk.
                </p>
                <p>
                    The remote server executes in pyRPC&rsquo;s environment with pyRPC&rsquo;s permissions. It can see documentation URLs and adapter names. The blast radius is bounded by design.
                </p>
                <p>
                    Enterprise compliance frameworks ask about data residency, network egress, and credential exposure. The local server has zero network egress and zero credential exposure because it runs on the developer&rsquo;s machine. The remote server has no user data because it never touches user code. Both answers are clean, but for different reasons.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How agents handle both simultaneously</h2>
                <p>
                    A typical agent workflow uses both servers in the same session. The agent calls <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">introspect_project</code> on the local server to understand the user&rsquo;s actual API. It calls the remote server to look up how pyRPC&rsquo;s FastAPI adapter handles middleware. It calls <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">check_call</code> locally to validate the payload. It calls <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">run_codegen</code> to regenerate the client.
                </p>
                <p>
                    The agent does not need to reason about which server to use for which task. The tool names are self-describing: <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">introspect_project</code> is obviously local, <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">search_docs</code> is obviously remote. The boundary is implicit in the tool semantics, not a decision the agent must make.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Claude Desktop and remote server refusal</h2>
                <p>
                    Claude Desktop, by default, refuses to connect to remote MCP servers that require authentication. This is by design, not a bug. The threat model is sound: a remote server with access to user data and write permissions is a lateral movement vector. pyRPC&rsquo;s remote server avoids this entirely because it requires no authentication and has no write permissions. It serves documentation. That is all.
                </p>
                <p>
                    For clients that enforce stricter policies, the local server is always available as the default. The remote server is a convenience, not a requirement. Projects that cannot accept remote connections for compliance reasons use the local server exclusively and lose nothing.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The no procedure execution guarantee</h2>
                <p>
                    Neither server executes procedures. The local server validates arguments against real types but never calls your functions. The remote server does not have access to your functions. There is no tool that triggers a database write, a network call, or any other side effect of your backend.
                </p>
                <p>
                    This is not a policy decision that could change in v0.15.0. It is architectural: the MCP server imports your module to read metadata, not to invoke handlers. Adding execution would require a fundamentally different server design, and we have no plans to build one. The boundary is structural, not aspirational.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this split and not one server</h2>
                <p>
                    Supabase ships one server because one API and one credential reach everything. Prisma ships two because local schema operations and remote database management serve different audiences in different execution environments. Neon collapsed to one because their entire product is cloud-hosted.
                </p>
                <p>
                    pyRPC follows the Prisma pattern because the split is forced by the problem. Introspection must import your routers in your interpreter; no hosted service can do that. Documentation gains nothing from being local; bundled docs go stale between releases. The boundary is not a choice. It is the shape of the problem.
                </p>
            </section>
        </article>
    )
}
