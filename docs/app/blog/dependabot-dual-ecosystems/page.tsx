import Link from 'next/link'

export default function DependabotDualEcosystemsPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Dependabot across two lockfile ecosystems
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 7:00pm</time>
                    <span>&middot;</span>
                    <span>5 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    pyRPC ships through two package managers, which means dependency staleness compounds in two
                    places: uv.lock for the Python workspace and package-lock.json for the npm packages. Until this
                    week neither was monitored; updates happened when someone noticed a release note elsewhere.
                    Dependabot now covers all four surfaces, and the configuration choices are the interesting part.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Four surfaces, one policy</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`pip           /        uv.lock (workspace + dev group)
npm           /        packages/* via workspaces
npm           /docs    the docs site, isolated on purpose
github-actions /       workflow action pins`}</pre>
                <p>
                    The docs directory gets its own entry rather than riding along with root, because its dependency
                    set (fumadocs, next, shiki tooling) evolves on a different cadence than the client libraries and
                    a grouped PR mixing both would review terribly.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Grouping: fewer PRs, same signal</h2>
                <p>
                    Everything groups minor and patch bumps together per ecosystem. The reasoning is risk-shaped:
                    minor and patch updates are usually safe to evaluate as a batch, while major bumps stay
                    individual PRs so each one gets a real migration conversation. For pyrpc-core that distinction
                    is not academic; a major pydantic bump is an event with changelog reading attached, while six
                    transitive patch bumps are Tuesday.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The interaction with our own versioning</h2>
                <p>
                    One subtlety worth naming: Dependabot manages dependencies of pyRPC, never versions of pyRPC.
                    Package versions remain governed by the lockstep release script, and Dependabot PRs touching
                    only locks cannot drift them. The one place the two worlds meet is meaningful: when a dependency
                    fix matters to users (the jsonc-edit Windows bootstrap fix shipping in 0.2.1), raising the floor
                    in pyproject.toml is a maintainer decision made in a normal reviewed PR, exactly like any other
                    change.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What it catches that humans do not</h2>
                <p>
                    The value case arrived before the config even merged: the Windows CI leg exposed the jsonc-edit
                    bootstrap crash, and the fix reached this repo as an explicit floor bump within hours. Multiply
                    that loop by every dependency across both ecosystems, remove the human noticing step, and that
                    is the entire feature.
                </p>
            </section>
        </article>
    )
}
