import Link from 'next/link'

export default function AiNativeDevelopmentWhatWeLearnedBuildingPyRpcMcp() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    AI-native development: what we learned building pyRPC&rsquo;s MCP
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 4:00pm</time>
                    <span>&middot;</span>
                    <span>10 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Building pyRPC&rsquo;s MCP surface taught us more about AI-native development than we expected. Not because MCP is complicated, but because designing tools for agents forces you to confront assumptions about interfaces, trust, and what &ldquo;automation&rdquo; actually means.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The trust boundary insight</h2>
                <p>
                    AI agents need ground truth, not guesses. An agent that hallucinates a procedure signature produces code that looks right and fails at runtime. An agent that calls <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">introspect_project</code> and reads the actual registry produces code that matches reality. The trust boundary is the MCP server: it is the one place where your code is read deterministically, not inferred from context.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The read-only-first principle</h2>
                <p>
                    Every tool we exposed first went through a read-only phase. <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">introspect_project</code> reads the registry. <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">check_call</code> validates without executing. Only <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">run_codegen</code> writes files, and it does so through the same pipeline the CLI uses. The principle is simple: validate before execute, never execute through the agent. The agent proposes, the tool validates, the human approves.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The thin-server pattern</h2>
                <p>
                    Each tool does one thing. <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">introspect_project</code> returns the procedure tree. <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">check_call</code> validates one payload. <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">run_codegen</code> regenerates clients. The agent composes these tools into workflows. We do not build a &ldquo;generate a full RPC client for my app&rdquo; mega-tool because the agent can do that composition itself. Thin servers are easier to test, easier to reason about, and less likely to surprise.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The two-server architecture</h2>
                <p>
                    Local servers handle code. Remote servers handle documentation. This split is not arbitrary: it follows the data residency boundary. Your code lives on your machine and must be imported by your interpreter. Framework docs are public knowledge that benefits from centralized hosting. Mixing these into one server creates trust and availability problems that the split avoids entirely.
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`
agent
  |
  +---> local stdio (code introspection)
  |       imports your routers
  |       validates your payloads
  |       generates your clients
  |
  +---> remote HTTP (framework knowledge)
          serves current docs
          config patterns
          API references
          |
          v
      ground truth -> agent -> corrected code
`}</code></pre>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The protocol-is-the-interface lesson</h2>
                <p>
                    MCP is the standard layer. Not REST, not gRPC, not a custom protocol. MCP gives us JSON-RPC with structured tool definitions that every major agent already speaks. By building on MCP, we inherited an ecosystem: Claude Code, Cursor, VS Code, and dozens of other clients all understand the same wire format. The protocol is the interface, and the interface is already deployed.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What did not work</h2>
                <p>
                    We tried exposing too many tools early on. A &ldquo;manage project&rdquo; tool, a &ldquo;scaffold app&rdquo; tool, a &ldquo;deploy&rdquo; tool. Agents ignored most of them because the tool descriptions were ambiguous and the return shapes were complex. We also tried to be a general AI assistant, offering chat-style help through the MCP surface. That duplicated what the agent already does well and added latency without value.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What worked</h2>
                <p>
                    Focused tools with precise descriptions. <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">introspect_project</code> does not describe what it returns in vague terms. It returns a tree with names, kinds, parameters, and types. Structured errors that name the parameter that failed and the constraint that was violated. Dry-run-first defaults where every write operation has a read counterpart. These patterns made the tools predictable, which made the agent effective.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The ecosystem observation</h2>
                <p>
                    The adoption pattern across the ecosystem is revealing. <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">add-mcp</code> is becoming the standard installation verb. Agents now number in the dozens, with 19 or more supporting MCP natively. Community-driven config formats are converging on a small set of conventions: stdio for local, HTTP for remote, JSON config files with tool lists. The protocol is eating the interface layer, and the interface layer is where the value compounds.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The development loop</h2>
                <p>
                    The AI-native loop looks like this: the agent proposes code, the MCP server provides ground truth, the agent corrects itself. This loop only works if the ground truth is fast, structured, and deterministic. Latency kills the loop. Ambiguity kills the loop. Non-deterministic responses kill the loop. Everything we built was in service of making this loop tight: fast local servers, structured JSON responses, validation that always returns the same result for the same input.
                </p>
                <p>
                    The broader lesson is that AI-native development is not about adding AI to existing tools. It is about designing tools whose primary consumer is an agent, not a human. That changes what interfaces look like, what errors contain, and what &ldquo;user experience&rdquo; means. The human still approves. The agent still proposes. But the tools belong to the agent.
                </p>
            </section>
        </article>
    )
}
