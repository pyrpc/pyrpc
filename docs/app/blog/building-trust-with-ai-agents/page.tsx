import Link from 'next/link'

export default function BuildingTrustWithAiAgents() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Building Trust With AI Agents: The pyRPC Approach
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The hardest part of letting an AI agent near your codebase is not getting it to write code. It is trusting that the code it writes will not delete your database, charge the wrong amount, or send an email to the wrong person. pyRPC was designed with this problem in mind, and the trust model is not an afterthought. It is baked into the architecture.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The trust triangle</h2>
                <p>
                    Three participants interact in every MCP session: you the developer, the MCP server, and the agent. Each edge of that triangle has a clear boundary:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`  Developer
    |
    | writes code, registers procedures
    v
  MCP Server                      Agent
    |                               |
    | imports YOUR code             | calls MCP tools
    | returns schemas              | generates code
    | validates calls              | checks with check_call
    | NEVER executes               | executes only when YOU approve
    |                               |
    +-------------------------------+

  Boundaries:
  - MCP server: read-only access to registry, write access to nothing
  - Agent: can ask questions, cannot invoke procedures without human approval
  - Developer: controls both the code and the approval step`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The never-execute guarantee</h2>
                <p>
                    The local MCP server that ships with pyRPC validates calls but never executes them. This is not a configuration option. It is the only mode. The introspection tool reads your registry and returns schemas. The check_call tool validates arguments against those schemas. Neither tool can invoke your procedures. An agent can ask "would this call work?" and receive a definitive answer, but it cannot ask "make this call happen" through the MCP.
                </p>
                <p>
                    This means the agent can validate code endlessly without risk. It can try every combination of parameters, catch every validation error, and refine its output until check_call returns valid, all without touching your database, your API, or your file system.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The dry-run-first pattern</h2>
                <p>
                    When the agent uses code generation, pyRPC defaults to dry_run=true. The agent sees exactly what files would change, what code would be written, and what imports would be added. Nothing touches disk until the developer approves. The generated code appears in the agent's context, the developer reviews it, and only then does it get written. This is the same pattern that makes CI/CD safe, applied to AI-generated code.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Structured errors, not vague failures</h2>
                <p>
                    When check_call validates a call and finds problems, it returns per-parameter errors. Each error names the parameter, states the constraint that was violated, and provides the pydantic message. The agent does not receive "invalid input" or "something went wrong." It receives:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`{
  "valid": false,
  "errors": [
    {
      "parameter": "amount",
      "message": "Input should be greater than 0"
    },
    {
      "parameter": "currency",
      "message": "Input should be 'USD', 'EUR', or 'GBP'"
    }
  ]
}`}</code></pre>
                <p>
                    The agent reads these, corrects the two parameters, and re-validates. The entire loop takes seconds. No human debugging, no log diving, no guessing.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Transparent discovery</h2>
                <p>
                    The MCP server does not filter, summarize, or hide procedures. When an agent calls introspect_project, it receives the full list of every registered procedure with every detail. There is no black box. The developer can inspect what the agent sees by running the same tool themselves. This transparency builds trust because you can verify exactly what information the agent is working with.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The real scenario</h2>
                <p>
                    An agent needs to add a procedure call to a frontend component. The sequence looks like this: the agent calls introspect_project to see what procedures exist. It finds create_user. It reads the schema and sees the required email parameter and optional role parameter. It generates a client call with the right types. It calls check_call with the generated arguments. check_call returns valid. The agent writes the code. If check_call had returned invalid, the agent would have read the per-parameter errors, corrected the code, and re-validated. At no point did the agent execute the procedure. At no point could it.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The audit trail</h2>
                <p>
                    Every MCP call is a tool invocation that the agent framework logs. The developer can review which tools the agent called, what arguments it passed, and what results it received. Every validation is explicit and recorded. If something goes wrong later, you can trace exactly what the agent knew and what it did with that knowledge. This is not surveillance. It is the same audit capability you would want from any automated system that touches production code.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this matters for production</h2>
                <p>
                    The question is not whether AI agents can write useful code. They can. The question is whether you can trust that code in production. pyRPC's answer is to give the agent maximum information and zero execution power. The agent sees your full API surface, validates every call against your real schemas, and generates code that passes type checking. But it cannot call your procedures, it cannot write files without approval, and every action is logged. Trust is not about hoping the agent behaves. It is about making misbehavior structurally impossible.
                </p>
            </section>
        </article>
    )
}
