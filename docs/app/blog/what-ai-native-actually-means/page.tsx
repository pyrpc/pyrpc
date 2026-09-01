import Link from 'next/link'

export default function WhatAiNativeActuallyMeans() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    What AI-Native Actually Means
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    &quot;AI-native&quot; gets thrown around as a marketing term. Every framework that adds an MCP endpoint or a Copilot integration claims it. Most of them are adding AI as a feature on top of a codebase designed for humans. pyRPC took a different approach: it was designed from the start to be consumed by agents, and the human experience is the side effect.
                </p>
                <p>
                    Here is what that means concretely.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Introspection is a first-class output</h2>
                <p>
                    Most frameworks treat type information as a build artifact. You run the compiler, it generates a schema file, and that file sits in a directory until someone reads it. pyRPC treats introspection as a runtime surface. The local MCP server imports your live module, walks the registry, and returns metadata that reflects your actual code, not a snapshot from last Tuesday.
                </p>
                <p>
                    This is the difference between giving an agent a README and giving it a live API explorer. The agent does not have to guess what your types look like. It asks, and the server answers with what the types actually are.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Validation without execution</h2>
                <p>
                    The <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">check_call</code> tool validates arguments against real Python types without calling your functions. This is a design constraint, not an implementation shortcut. An agent that can validate payloads before writing code avoids an entire class of trial-and-error loops. An agent that has to execute code to learn whether a payload is valid is dangerous.
                </p>
                <p>
                    The guarantee is structural: the MCP server does not import your handler functions, does not register them as callable, and has no mechanism to invoke them. There is no policy that could change in a future release. The boundary is in the architecture.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Two surfaces, two trust levels</h2>
                <p>
                    pyRPC ships two MCP servers. The local server handles code introspection. The remote server handles documentation. This is not redundancy. It is a trust boundary.
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`Local (stdio)
  - imports YOUR module
  - walks YOUR registry
  - validates YOUR types
  - writes YOUR codegen output
  - zero network egress

Remote (HTTP)
  - serves documentation
  - search_docs
  - get_doc
  - read-only, no auth
  - no access to any user code`}</code></pre>
                <p>
                    An agent that can introspect your code should not be able to read framework documentation from a remote server in the same breath. The two capabilities have different risk profiles, different trust requirements, and different failure modes. Keeping them separate is not just cleaner architecture. It is how security teams can reason about what the agent can do.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Codegen is agent-driven, not agent-assisted</h2>
                <p>
                    The <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">run_codegen</code> tool runs with <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">dry_run=true</code> by default. The agent gets the generated output without writing files. It inspects the result, decides whether to proceed, and only then applies the codegen. This is the opposite of &quot;AI writes your code and you review it.&quot; It is &quot;AI proposes, you decide.&quot;
                </p>
                <p>
                    The dry-run default is deliberate. Speculative codegen is useful. Unreviewed codegen is a liability. The tool makes the safe path the default path and requires explicit action to write files.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The distribution layer</h2>
                <p>
                    Making an MCP server available is not the same as making it useful. The <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">@pyrpc/mcp</code> npm package wraps the configuration step. A single command writes the correct MCP entry into every agent the user has installed. The user does not need to know where each agent stores its config or what format it expects. The CLI handles it.
                </p>
                <p>
                    This is the unsexy part of AI-native. The protocol matters, but the distribution matters more. If configuring the server takes longer than reading the docs manually, the server loses.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Structured output, not text dumps</h2>
                <p>
                    Every MCP tool returns structured data. <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">introspect_project</code> returns a list of procedures with typed parameters. <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">check_call</code> returns per-parameter errors with error codes. The remote tools return markdown. The format matches what the tool does: structured data for code operations, readable text for documentation.
                </p>
                <p>
                    This is not a small detail. An agent parsing structured JSON is more reliable than an agent parsing freeform text. The fewer assumptions the agent has to make about format, the fewer mistakes it makes.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">No telemetry, no auth, no lock-in</h2>
                <p>
                    The local MCP server has zero network calls. No telemetry endpoints, no usage reporting, no phone-home. The remote server has no authentication because the data is public documentation. Neither server ties you to pyRPC infrastructure. The local server runs on your machine. The remote server serves docs that are also available as static pages. The MCP surface is a convenience, not a lock-in mechanism.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The test suite proves it</h2>
                <p>
                    The MCP server has its own test suite that exercises all three tools against a real FastAPI project with registered procedures. The tests verify that <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">check_call</code> catches type mismatches, that <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">introspect_project</code> returns complete metadata, and that the stdio transport handles malformed JSON. The remote endpoint tests verify the full SSE round-trip including protocol initialization, tool discovery, and tool invocation.
                </p>
                <p>
                    AI-native is not a claim. It is a test result.
                </p>
            </section>
        </article>
    )
}
