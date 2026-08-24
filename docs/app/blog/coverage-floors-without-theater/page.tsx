import Link from 'next/link'

export default function CoverageFloorsPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Coverage floors without theater
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 3:30pm</time>
                    <span>&middot;</span>
                    <span>6 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Coverage numbers are the most gamed metric in software. A floor set by aspiration gets met by
                    tests that execute lines and assert nothing. pyRPC just added a coverage gate anyway, because
                    the failure mode of no measurement is worse: untested code ships indistinguishable from tested
                    code. The design question was how to add the gate without inviting the theater.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Measure first, then pick a number</h2>
                <p>
                    pytest-cov ran against all five Python packages with no threshold. Result: 80 percent across
                    1475 statements. The interesting rows were not the total:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`pyrpc_codegen/ts_codegen.py   66%   (the string-grammar type parser)
pyrpc_core/cli.py             73%   (wizard, watchers, console)
pyrpc_core/bundlers.py        81%
pyrpc_core/config.py          88%
core/procedure.py, models.py  ~100% (protocol heart)`}</pre>
                <p>
                    The shape tells a story: protocol internals are near-perfectly covered because they are pure and
                    easy to test; interactive surfaces lag because they need scaffolding. That is exactly where you
                    want visibility before deciding policy.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The floor is 78, not 80</h2>
                <p>
                    Setting fail-under equal to the current number guarantees an immediate red PR for someone whose
                    change shifts a percentage point by accident. Two points of slack absorb that noise while still
                    catching real regressions like a new module landing at 30 percent. The number came from
                    measurement, not ambition, and CONTRIBUTING.md states the social contract explicitly: raise it
                    when adding code; never lower it to make a PR pass.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What line coverage will never tell you</h2>
                <p>
                    The ts_codegen parser row deserves honesty: its uncovered 42 statements are mostly deep union
                    and generic fallback branches. Line coverage counts them equally with critical paths even though
                    a bug in dict-type rendering matters far more than one in an exotic Set[Tuple] corner. Coverage
                    is a smoke detector, not a fire marshal. It cannot prove the suite asserts the right things;
                    it can only prove which lines nothing touches at all.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Mechanics worth copying</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Coverage runs as its own CI job pinned to one Python version; matrix legs stay fast and coverage stays deterministic.</li>
                    <li>Report uses term-missing so a red job shows exactly which lines are dark, in the log, no artifact hunting.</li>
                    <li>The local command in CONTRIBUTING.md is character-identical to CI. Gates you cannot reproduce locally are gates other people run for you.</li>
                </ul>

                <p>
                    Next step when it earns it: per-module floors so cli.py cannot hide behind procedure.py. Floors,
                    like types, are most useful when they are specific.
                </p>
            </section>
        </article>
    )
}
