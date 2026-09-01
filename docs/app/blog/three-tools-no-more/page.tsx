import Link from 'next/link'

export default function ThreeToolsNoMore() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Three Tools, No More
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The pyRPC local MCP server exposes exactly three tools. Not four, not six, three. This is not a shipping deadline that cut the backlog short. Each tool was prototyped, tested against real agent workflows, and either earned its place or got cut. The test for inclusion was simple: could a competent model accomplish this some other way? If yes, the tool does not exist.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">introspect_project</h2>
                <p>
                    This is the one thing grep cannot reconstruct. The tool reads <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc.json</code>, imports your backend module, walks the live registry, and returns every registered procedure with kind (query or mutation), parameter names, types, requiredness, defaults, docstrings, and full input/output JSON Schemas.
                </p>
                <p>
                    Static parsing cannot resolve conditional registration, decorator metadata, or runtime-computed defaults. The tool gives the agent the same view of your API that the code generator sees, which is the only view that matters for writing correct client code.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">check_call</h2>
                <p>
                    Answers the question: would these arguments be accepted? The tool validates hypothetical arguments against real Python types, including pydantic models, dataclasses, attrs classes, and manual validation logic, without executing anything. It returns structured per-parameter errors that an agent can act on immediately.
                </p>
                <p>
                    Without this tool, an agent guesses at the argument shape, writes client code, and waits for CI to tell it the guess was wrong. With it, the agent validates before writing, and the first attempt at client code is usually correct.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">run_codegen</h2>
                <p>
                    Wraps the existing code generation pipeline because regeneration is genuinely stateful work. The tool imports the module, renders templates, compares output against existing files, and writes only when the bytes differ. <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">dry_run=true</code> by default, so the agent can ask &ldquo;is the TypeScript current?&rdquo; without touching any files.
                </p>
                <p>
                    An agent doing this by hand would re-implement the CLI badly. The tool exists because the pipeline is complex enough that reimplementing it in-context costs more tokens than calling it.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The pipeline</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`  introspect_project
       |
       v
  [agent sees full registry with types, kinds, defaults]
       |
       v
  check_call (with hypothetical arguments)
       |
       v
  [agent validates payload before writing code]
       |
       v
  run_codegen (dry_run=true, then dry_run=false)
       |
       v
  [client TypeScript is generated and up to date]`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why each tool is read-only or safe-dry-first</h2>
                <p>
                    <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">introspect_project</code> reads files and imports modules. It never writes, never executes procedures, and never makes network calls. <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">check_call</code> validates arguments in-memory and discards them. No side effects, no database queries, no HTTP requests.
                </p>
                <p>
                    <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">run_codegen</code> is the only tool that writes files, and it defaults to dry run. The agent must explicitly set <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">dry_run=false</code> to modify anything. Even then, it only touches files under the configured codegen output directory. The write scope is narrow and predictable.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The anti-pattern of too many tools</h2>
                <p>
                    Every tool name, description, and parameter schema lands in the model&rsquo;s context window on every request. More tools means more tokens, more ambiguity, and more opportunities for the agent to pick the wrong one. The failure mode is quiet: the model does not crash, it just makes worse decisions as the tool list grows.
                </p>
                <p>
                    We prototyped six additional tools during development: project diagnostics, link inspection, configuration linting, procedure execution, schema export, and client scaffolding. Each would be easy to add and hard to remove once agents depend on them. Each was cut because the existing three tools, composed correctly, cover the same ground.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How this compares</h2>
                <p>
                    The industry&rsquo;s most disciplined MCP servers converge on two to four tools:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Better Auth</strong> exposes exactly two tools. Public documentation, zero authentication.</li>
                    <li><strong>Prisma</strong> ships two tools: one for schema operations, one for query execution.</li>
                    <li><strong>pyRPC</strong> ships three: inspect, validate, generate. The middle tool (validate) is what most servers skip, and it is the one that prevents the most CI failures.</li>
                </ul>
                <p>
                    Three is a statement about restraint. Restraint is a feature agents can feel, even if they cannot name it.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Annotations carry the policy</h2>
                <p>
                    Every tool declares MCP ToolAnnotations. The two read-only tools set <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">readOnlyHint</code> true and <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">openWorldHint</code> false. Codegen sets <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">readOnlyHint</code> false with <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">destructiveHint</code> false and <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">idempotentHint</code> true, because running it twice converges to the same bytes. These are hints, not security boundaries. The real guarantee for the read tools is architectural: they never call your function. The real limit for codegen is the dry_run default plus the narrow file scope.
                </p>
            </section>
        </article>
    )
}
