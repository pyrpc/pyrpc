import Link from 'next/link'

export default function EnforcedGatesPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    From paper standards to enforced gates
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 9:00am</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    An audit of pyRPC&rsquo;s engineering practices produced a humbling conclusion: every standard
                    we claimed already existed somewhere in the repo, and none of them were enforced. Ruff was
                    configured but not installed. Types were the entire value proposition, yet nothing type-checked
                    anything. Examples demonstrated correctness that nothing verified. The gaps were all
                    enforcement, never presence. This post is the map of how each gap got closed, and what the
                    closing surfaced.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The audit</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Ruff:</strong> a complete <code>[tool.ruff]</code> section in pyproject.toml, zero installations, zero runs. Running it locally failed because it was not a dependency.</li>
                    <li><strong>Type checking:</strong> no mypy or pyright for Python; no tsc gate for any package.</li>
                    <li><strong>ESLint:</strong> covered the docs site only. The published TypeScript packages had no lint config at all.</li>
                    <li><strong>Coverage:</strong> pytest ran blind; no measurement, no threshold.</li>
                    <li><strong>Dependencies:</strong> no Dependabot or Renovate over either lockfile.</li>
                    <li><strong>Matrix:</strong> one Python version, one operating system.</li>
                    <li><strong>Docs and examples:</strong> twelve example apps plus dozens of code blocks, none executed by anything.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The rule we applied</h2>
                <p>
                    Every gate had to satisfy three properties before it could merge. First, it must pass honestly
                    on day one: no blanket ignores to make numbers look clean, no skipping the work. Second,
                    whatever current style we chose to accept gets encoded as documented configuration rather than
                    silent exception. Third, the local command and the CI command must be identical, because gates
                    that only exist in CI get discovered last, by whoever is furthest from their desk.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What enforcement immediately caught</h2>
                <p>
                    The strongest argument for this work is what fell out in the first days:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Ruff&rsquo;s very first autofix pass broke a re-export in core decorators, and then its F821 check caught the mistake in my own hand-fix minutes later. Linters guard the linter&rsquo;s operator too.</li>
                    <li>mypy&rsquo;s first run flagged the ASGI transport claiming dict-only payloads while v0.13 batching returns lists. A real contract drift shipped one release earlier.</li>
                    <li>The Windows CI legs crashed on first-run tsconfig bootstrap, exposing an npm.cmd execution bug in jsonc-edit. Fixed upstream in 0.2.1 within the hour.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The shape of the solution</h2>
                <p>
                    Seven new or changed pieces now compose the gate set: a ruff job, a mypy job over all five
                    Python packages&rsquo; sources, per-package tsc via new typecheck scripts, ESLint flat config
                    over packages, pytest-cov with a hard floor at 78 percent against a measured 80, Dependabot
                    across pip, npm, docs, and Actions, and a nine-leg OS x version matrix. Two new scripts bring
                    examples and documentation into CI as executable checks. CONTRIBUTING.md now lists the local
                    equivalent of every gate so nobody discovers them in a red X.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Deliberately deferred</h2>
                <p>
                    Type checking tests (src only today), compiling docs TypeScript blocks, and linting the twelve
                    examples are all known follow-ups. Naming them matters: deferred work should be visible, not
                    forgotten. The alternative, pretending the gates cover everything, would poison trust in the
                    gates themselves.
                </p>

                <p>
                    The deeper lesson generalizes beyond this repo: a standard that nothing enforces is a rumor you
                    tell contributors. Rumors drift; gates do not.
                </p>
            </section>
        </article>
    )
}
