import Link from 'next/link'

export default function TheLockfileDancePage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The lockfile dance after a version bump
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 4:40pm</time>
                    <span>&middot;</span>
                    <span>6 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">scripts/release.mjs</code> rewrites the manifest files, but it deliberately does not touch the lockfiles. Bumping versions and syncing lockfiles are two separate steps, and keeping them separate is what makes each one reviewable. This is the dance that follows every bump.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Two lockfiles, two package managers</h2>
                <p>
                    The repo is a polyglot workspace. npm owns the TypeScript side via root <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">package.json</code> workspaces; uv owns the Python side via a root <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyproject.toml</code>. Each manager resolves its own lockfile:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# Python side, workspace member versions live here
uv lock

# npm side: workspace @pyrpc/* ranges live here
npm install`}
                </pre>
                <p>
                    Neither lockfile records the package versions directly for workspace members the way you might expect, but both record <em>resolutions</em> that change when versions change.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">uv.lock: workspace membership</h2>
                <p>
                    uv lockfile entries for workspace members carry their version, and workspace members also declare <em>dependencies on each other</em> by version. After the bump script rewrites <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyproject.toml</code> files, the lockfile's recorded versions are stale. Running <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">uv lock</code> regenerates them. The result is a lockfile diff that is mostly mechanical, but it has to exist, or CI's <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--locked</code> checks fail.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">package-lock: workspace ranges</h2>
                <p>
                    On the npm side, the bump script rewrites every <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/*</code> range in every package.json. The lockfile mirrors those ranges at the workspace link level, so <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npm install</code> must re-run to refresh it. Failing to do so produces a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">package-lock.json</code> that disagrees with the manifests, the classic "your lockfile is out of date" CI error that always happens on release day.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why not fold it into the script?</h2>
                <p>
                    The release script could shell out to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">uv lock</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npm install</code>. It deliberately does not. Lockfile regeneration can pull in unrelated resolution changes (a transitive bump, a hoist reshuffle), and those deserve their own review. Keeping the bump and the sync as separate commits lets a reviewer see "versions changed" and "resolutions refreshed" as two clean diffs instead of one noisy blob.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The discipline</h2>
                <p>
                    The release flow is a strict sequence: run the bump script, run the lock sync, verify the lockfile diffs are mechanical, then commit. The lockfile dance is not bureaucracy, it is the difference between a release that CI accepts and one that fails at the first <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--locked</code> gate.
                </p>
            </section>
        </article>
    )
}
