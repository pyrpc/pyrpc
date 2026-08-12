import Link from 'next/link'

export default function ReleaseNotesAndNamingPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Auto-generated release notes and the naming fix
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 6:20pm</time>
                    <span>&middot;</span>
                    <span>5 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The last job in the publish workflow creates the GitHub Release. It uses a third-party action, auto-generates the notes from the commit history, and — after a brief naming saga — titles the release with nothing but the tag name.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The action</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`- name: Create GitHub Release
  uses: softprops/action-gh-release@v2
  with:
    generate_release_notes: true
    prerelease: $\{\{ contains(github.ref_name, '-') \}\}
    make_latest: $\{\{ !contains(github.ref_name, '-') \}\}
    name: $\{\{ github.ref_name \}\}`}
                </pre>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">generate_release_notes: true</code> delegates the notes to GitHub's own release-notes generator, which groups merged PRs by conventional-commit categories — Features, Bug Fixes, Documentation. That is why the repo's PR titles follow the convention: they are the release notes, written at merge time instead of release time.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The naming saga</h2>
                <p>
                    The original template read <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">name: pyRPC &#36;&#123; github.ref_name &#125;</code>, producing releases titled "pyRPC v0.12.0". A naming cleanup renamed every existing release to its bare tag and changed the template so future releases match. The change was trivial and the motivation was consistency: the tag is the canonical identifier everywhere else (changelog, docs, npm, PyPI), so the release title now says exactly one thing.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The tiny diff with a review path</h2>
                <p>
                    The fix itself was a one-line workflow change. But main is protected — no direct pushes — so even this diff went through a PR, passed the test workflow, and merged like any other change. This is a small-scale example of the repo's rule: <em>everything lands through review, including CI and release machinery.</em> The release pipeline is itself released.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What make_latest means downstream</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">make_latest: true</code> on the stable tag makes the new release the highlighted "latest" on the releases page. Prereleases opt out automatically. Combined with the auto-notes, the release page becomes: title = tag, body = the PR log, latest = the newest stable — assembled with zero manual content entry.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The takeaway</h2>
                <p>
                    Release notes are an information channel, and the cheapest reliable source of that information is the commit history you already write. Generating notes from PRs, naming releases by tag, and deriving prerelease state from the version string keeps the whole release artifact derivable from facts the repo already knows — nothing to remember, nothing to type.
                </p>
            </section>
        </article>
    )
}
