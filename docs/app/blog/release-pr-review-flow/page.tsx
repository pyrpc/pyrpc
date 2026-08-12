import Link from 'next/link'

export default function ReleasePrReviewFlowPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The release PR: how a version bump goes to review
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 7:40pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Releasing pyRPC is a pull request. The version bump, the lockfile sync, and the changelog entry ride a branch through the same review pipeline as any feature — because main rejects direct pushes. The release is a merge, and only then does a tag turn it into a publication.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why a PR for a version bump</h2>
                <p>
                    The protection on main is the load-bearing wall of the release process. It forces every change — including release machinery itself — through review and through CI. For a release, that means:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>The bump is inspected: eleven versions, every internal range, two lockfiles, the changelog.</li>
                    <li>CI runs the <em>test</em> workflow on the bumped tree, proving the release candidate passes before it can be tagged.</li>
                    <li>The merge history records the release as a first-class event — <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Merge pull request #118 from pyrpc/release/v0.12.0</code> — searchable and attributable.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The branch name is the plan</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`git checkout -b release/v0.12.0
node scripts/release.mjs 0.12.0
uv lock          # refresh uv.lock
npm install      # refresh package-lock.json
# add changelog entry
# run the test suites
git push -u origin release/v0.12.0
gh pr create ...`}
                </pre>
                <p>
                    The branch name encodes the intent, the script does the mechanical work, the lockfile sync closes the resolution gap, and the changelog documents the user-facing meaning. The ordering matters: scripts before locks, locks before commit, tests before push.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The two-commit shape</h2>
                <p>
                    The release branch typically lands as two commits with distinct concerns: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">chore: bump all packages to v0.12.0</code> for the mechanical version work, and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">docs(release): add v0.12.0 changelog entry</code> for the prose. Separating them keeps the diff reviewable: a reviewer can verify the bump is purely mechanical and the changelog is purely editorial, each in isolation.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">After merge: the tag</h2>
                <p>
                    Merging the release PR does not publish anything. The act that triggers publication is the tag, pushed <em>after</em> main contains the bump:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`git tag v0.12.0 origin/main
git push origin v0.12.0   # fires the publish workflow`}
                </pre>
                <p>
                    The tag is pinned to the merged commit, so the pipeline builds exactly what was reviewed. The review gate and the publish trigger are separated in time and mechanism — you can merge without publishing, but you cannot publish without merging. That asymmetry is the safety property.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this scales beyond releases</h2>
                <p>
                    Treating publication as "the tail of a reviewed merge" works because it needs no special permissions, no manual deploy step, and no human-in-the-loop at publish time — only at review time, where humans belong. Any project that publishes from tags inherits the same property: the review gate is where thought happens, and the trigger is where trust happens.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The takeaway</h2>
                <p>
                    A release is two events, deliberately decoupled: a merge that changes the repository state, and a tag that announces it. The PR review sits on the first; the pipeline runs on the second. Version bumps deserve review not because they are complex, but because they are irreversible — and a reviewable release is a reversible mistake.
                </p>
            </section>
        </article>
    )
}
