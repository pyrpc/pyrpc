import Link from 'next/link'

export default function ExecutableDocsPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Docs and examples as executable truth
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 5:00pm</time>
                    <span>&middot;</span>
                    <span>6 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Two categories of code in this repo are never imported by anything that runs in CI: the twelve
                    example applications and every fenced code block in the documentation. Both exist to be copied
                    by users, which makes their correctness load-bearing and their rot invisible until someone pastes
                    a broken snippet and blames themselves. Two new scripts bring both into the gate set.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Examples: import is the test</h2>
                <p>
                    The insight behind scripts/verify_examples.py is that an example server&rsquo;s whole job happens
                    at module scope. Importing main.py executes decorators, mounts routes, and resolves imports;
                    if any of that broke, the import fails. So each framework example gets exactly one check:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# fastapi/flask examples
python -c "import main"          # cwd = examples/<name>/server

# django examples: check imports the URLconf,
# which executes the views chain that registers @rpc
python manage.py check`}</pre>
                <p>
                    Fifteen checks run per pass: eight servers plus syntax validation of the standalone scripts
                    (which perform network work when actually run, so parse-only is deliberately the right depth).
                    First execution caught an environment drift immediately: pyrpc-flask was missing from the dev
                    dependency group, so plain uv sync produced an env where flask examples could not import even
                    though CI passed. Fixed at the source.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Docs fences: parse everything, execute what earns it</h2>
                <p>
                    Documentation snippets are mostly fragments: they reference variables defined in prose or rely
                    on surrounding context. Blindly executing all of them produces false failures nobody trusts.
                    The design instead layers enforcement by intent:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Every ```python fence must parse.</strong> ast.parse catches renamed functions, changed signatures, drift after refactors. Sixty-three fences checked today; zero exemptions needed.</li>
                    <li><strong>Fences marked ```python test get executed</strong> in a fresh namespace and must be self-contained. Two complete server definitions from quickstart and installation carry the tag so far.</li>
                    <li><strong>Pseudo-code opts out explicitly</strong> via ```python nocheck. Opt-outs are greppable and reviewable, unlike silent breakage.</li>
                </ul>
                <p>
                    The convention matters more than the count: when someone edits a documented API, CI tells them
                    which doc page just went stale, in the same red X as failing tests.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Honest edges</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Example frontends are not installed in CI yet; twelve npm installs would dominate the pipeline. The Python side covers the pyRPC contract surface.</li>
                    <li>TypeScript fences are counted (forty today) but not compiled. Same layering rationale: value first, noise never.</li>
                </ul>

                <p>
                    Docs that compile and examples that import stop being aspirational writing and become what they
                    should have been all along: part of the test suite that happens to teach.
                </p>
            </section>
        </article>
    )
}
