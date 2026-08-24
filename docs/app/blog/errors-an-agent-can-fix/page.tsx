import Link from 'next/link'

export default function ErrorsAnAgentCanFix() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Errors an agent can fix: the ToolError discipline
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 3:00pm</time>
                    <span>&middot;</span>
                    <span>5 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Most MCP servers treat errors as an afterthought: raise something, let the framework stringify it. But the consumer of a local development server is a model deciding what to do next, and the difference between progress and abandonment is usually one actionable sentence.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The taxonomy we adopted</h2>
                <p>
                    The official SDK draws the line we wanted. Raising ToolError returns is_error true with your message in content: the request succeeded, the tool failed, the model reads why. Anything unexpected becomes a sanitized crash with the traceback confined to logs. The deciding question, straight from the SDK's own guidance: could a smarter model have avoided this? In a development-tool domain, the answer is almost always yes, because the fix is editing a file the agent can edit.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Every error names the exit</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>No pyrpc.json found</strong> states the directory searched and prints a minimal valid config inline, plus the pyrpc init alternative.</li>
                    <li><strong>Missing backend section</strong> lists the valid frameworks, includes entrypoint syntax per framework, and reports what marker-sniffing detected as a hint, never a selection.</li>
                    <li><strong>Django without types_module</strong> quotes the field, explains why manage.py cannot register procedures, and suggests the views module.</li>
                    <li><strong>Failed backend import</strong> names the module, the exception class and message, and reminds the agent the process runs in the project environment it was launched from.</li>
                    <li><strong>Unknown procedure</strong> enumerates every registered name so the next attempt is spelled correctly.</li>
                </ul>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Sniffing as a hint, never a decision</h2>
                <p>
                    The wizard in pyrpc init confirms interactive choices; the MCP has no interactively reachable human, so detection degrades to prose. The error may say markers suggest fastapi, and stops there. Silent fallbacks produce confident wrong introspection, which is the worst outcome an agent can be handed. Deterministic resolution plus explicit failure is the contract, and it matches how pyrpc dev --yes already behaves outside the MCP.
                </p>
            </section>
        </article>
    )
}
