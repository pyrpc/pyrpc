import Link from 'next/link'

export default function RuffAdoptionPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Adopting ruff into a codebase with 374 violations
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 10:30am</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The config was already perfect. <code>[tool.ruff]</code> sat in pyproject.toml with a sensible
                    rule selection: E, F, B, I, TCH, SIM, UP, YTT. The only problem was that ruff had never been
                    installed, never run, and never enforced. The first honest invocation reported 374 errors. This
                    post is the playbook for turning that number into a green gate without a monster diff or a gutted
                    rule set.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step one: let the machine do the boring part</h2>
                <p>
                    167 of the violations were safe autofixes: import sorting (53), PEP 585 and 604 annotation
                    modernization (62), unused imports. One command cleared them. Two lessons from that pass are
                    worth the price of admission:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Autofixers do not understand re-export intent.</strong> The fixer stripped <code>from pydantic.dataclasses import dataclass as model</code> out of core decorators because nothing in that module referenced it. It was the public re-export surface. Restored with an explicit <code>__all__</code>, which both silences F401 and documents the API.</li>
                    <li><strong>The linter polices its operator.</strong> A blanket rename I applied for B007 hit two loops; one used the variable. F821 caught my mistake before CI did. That is the tool earning trust in its first hour.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step two: hand-fix what teaches something</h2>
                <p>
                    Thirty-two violations remained after autofix, and every category repaid attention:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>B904, three raise-without-from sites</strong> inside Procedure validation. Adding <code>from ve</code> chains validation errors properly instead of silently swallowing context.</li>
                    <li><strong>B023, loop-variable capture</strong> in the dev console&rsquo;s command fallback lambda. Bound as a default argument (<code>lambda _, c=cmd</code>), the classic closure fix.</li>
                    <li><strong>SIM115</strong> open-without-context in tests became with-blocks; one intentional temp-file case got an inline noqa with a written reason: uvicorn reload needs the path to outlive the write.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step three: encode accepted style as documented config</h2>
                <p>
                    200 of the original findings were line length and single-line compound statements, concentrated
                    in CLI code where <code>if x: raise typer.Exit(1)</code> is house style. Mass-rewriting 200
                    lines would produce a noisy diff that reviews worse than it reads. Instead:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`ignore = ["E501", "E701", "E702", "SIM108", "SIM117"]`}</pre>
                <p>
                    With comments explaining each choice. The distinction matters: an ignore list nobody can explain
                    is rot, but a deliberate, commented acceptance of current style is exactly how enforcement should
                    start. Tighten later if a formatter lands.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step four: make it someone else&rsquo;s problem forever</h2>
                <p>
                    A ruff job in CI now runs the exact local command. Green means the next 374 cannot accumulate
                    quietly. Combined with Dependabot keeping the tool itself fresh, the standard finally exists in
                    the only place standards are real: the merge path.
                </p>

                <p>
                    Final tally: zero violations, 176 tests passing, and three small bugs caught on day one. The
                    config barely changed. The behavior changed completely.
                </p>
            </section>
        </article>
    )
}
