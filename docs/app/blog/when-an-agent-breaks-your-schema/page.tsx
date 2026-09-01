import Link from 'next/link'

export default function WhenAnAgentBreaksYourSchema() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    When an Agent Breaks Your Schema
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    AI agents generate plausible-looking but type-incorrect payloads at a predictable rate. An agent sees a procedure that expects an integer id and sends {`{id: "abc"}`}, a string that passes JSON structural validation but fails at the Python type boundary. Without a validation checkpoint, that error surfaces at runtime, inside your application, possibly after a partial write.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The validation pipeline</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`Agent request
    |
    v
check_call (MCP tool)
    |
    v
JSON Schema structural check  -- is it valid JSON?
    |
    v
Python type coercion          -- can "abc" become int?
    |
    v
pydantic / dataclass / attrs  -- does it pass model validation?
    |
    v
valid: true + result
  OR
valid: false + per-parameter errors`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Per-parameter error messages</h2>
                <p>
                    When validation fails, the result is structured: valid is false, plus per-parameter entries carrying the field name and the pydantic error message. An agent that passed a string where an integer belongs reads Input should be a valid integer, not just invalid. That specificity is the difference between an agent that fixes its mistake in one iteration and one that guesses randomly for five.
                </p>

                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`{
  "valid": false,
  "errors": [
    {
      "field": "id",
      "message": "Input should be a valid integer"
    }
  ]
}`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why JSON Schema alone is not enough</h2>
                <p>
                    JSON Schema validates structure: this field exists, this field is a string, this array has at most 5 items. But Python types carry richer constraints. A pydantic model might validate an email against a regex, cap a string at 50 characters, or enforce that a datetime is in the future. check_call runs against the real Python types, not a generated JSON Schema approximation. The agent gets the same validation the server would apply, minus the execution.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How agents use this</h2>
                <p>
                    The workflow is: call check_call before writing client code, read the errors, fix the payload, re-validate. This is the dry-run-first principle applied to type checking. An agent that validates before calling never hits the runtime type error path, which means no partial writes, no retry storms, and no confusing stack traces. The cost is one extra tool call; the payoff is eliminating an entire class of agent-introduced bugs.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The dry run first principle</h2>
                <p>
                    run_codegen defaults to dry_run=true for the same reason. An agent that wants to check type freshness never mutates a repo by accident. check_call validates without executing for the same reason. Both tools give the agent a way to ask what would happen before making it happen. The pattern generalizes: any tool that touches production state should have a non-mutating mode that returns the same structured information.
                </p>
                <p>
                    The broader point is that agents work better when the feedback loop is fast and specific. A generic error message sends the agent into a guessing loop. A per-parameter validation message gives it exactly the information it needs to fix the problem. Design your validation responses for machine consumption, not human debugging, and the agent productivity gains follow naturally.
                </p>
            </section>
        </article>
    )
}
