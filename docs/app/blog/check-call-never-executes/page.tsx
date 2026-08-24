import Link from 'next/link'

export default function CheckCallNeverExecutes() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    check_call: validation with execution removed from the universe
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 1:00pm</time>
                    <span>&middot;</span>
                    <span>4 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    check_call exists so an agent can ask would this call be valid without risking what a valid call might do. Your procedures write rows, charge cards, send email. Validation must therefore be structurally incapable of invoking them, and structurally is the operative word: no flag, no best effort, no please-do-not.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Extraction, not duplication</h2>
                <p>
                    Procedure.execute always had two phases before the call: bind arguments against the signature, then run each value through its pre-built pydantic TypeAdapter. Those phases are exactly what validation needs, so they became a method. validate_args binds and validates and returns; execute now calls validate_args and then invokes the function. One code path, two consumers, zero drift. If validation ever grows richer, both the hot RPC path and the MCP inherit it simultaneously.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Proving the negative</h2>
                <p>
                    A claim like never executes deserves a test that would fail loudly if it were false. The suite registers a procedure whose body writes a sentinel file, calls check_call against it with valid arguments, asserts the answer is valid, and then asserts the sentinel does not exist. If anyone ever wires execution into validation, this test fails with a sentence that explains itself.
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# check_call must never execute procedures
assert result.structured_content["valid"] is True
assert not sentinel.exists(), "check_call must never execute procedures"`}</pre>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Errors shaped for correction</h2>
                <p>
                    When validation fails, the result is structured: valid false, plus per-parameter entries carrying the field and the pydantic message. An agent that passed a string where an integer belongs reads the exact parameter and constraint, corrects one line, and moves on. That loop, verify, fail specific, fix, re-verify, is the entire productivity argument for the tool, and it only works because errors name parameters instead of gesturing at payloads.
                </p>
            </section>
        </article>
    )
}
