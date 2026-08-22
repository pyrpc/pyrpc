import Link from 'next/link'

export default function TagDrivenReleasesPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    A tag is a release trigger
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 6:00pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The entire release pipeline (publish to PyPI, publish to npm, create the GitHub Release) is triggered by nothing more than a git tag matching a pattern. The tag is the release. Everything downstream is ceremony.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The trigger</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`on:
  push:
    tags:
      - "v*.*.*"
      - "v*.*.*-*"`}
                </pre>
                <p>
                    Two glob patterns cover stable and prerelease tags: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">v0.12.0</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">v0.12.0-beta.1</code>. A push of either fires the whole workflow. No manual "run release" button, no secret ritual, a tag push is the whole ceremony.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The tag encodes release metadata</h2>
                <p>
                    The workflow never needs an input parameter for "is this a prerelease?", it derives it from the tag name:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`prerelease: $\{\{ contains(github.ref_name, '-') \}\}
make_latest: $\{\{ !contains(github.ref_name, '-') \}\}`}
                </pre>
                <p>
                    A hyphen in the tag (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">v0.12.0-beta.1</code>) marks the GitHub Release as a prerelease and excludes it from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">latest</code>. A clean tag (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">v0.12.0</code>) is a full release and becomes the latest. The versioning scheme and the workflow metadata are the same string.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">npm's prerelease dist-tags mirror the same rule</h2>
                <p>
                    The npm publish steps do the identical dance with npm's dist-tag system:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`if [[ "$VERSION" == *"-"* ]]; then
  TAG=$(echo "$VERSION" | awk -F'-' '{print $2}' | awk -F'.' '{print $1}')
  npm publish --access public --tag "$TAG"
else
  npm publish --access public
fi`}
                </pre>
                <p>
                    A prerelease version (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">0.12.0-beta.1</code>) extracts the first hyphen segment (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">beta</code>) and publishes under that dist-tag (so <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npm i @pyrpc/react@beta</code> works without ever disturbing the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">latest</code> tag. Stable versions publish plain, becoming <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">latest</code>. The prerelease signal travels from git tag, to GitHub Release, to npm dist-tag) one source of truth, three registries honoring it.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why tag-based triggers win here</h2>
                <p>
                    A tag is a git-native, immutable, auditable object. It names a specific commit, so a release is provably built from a known tree. It is also push-friendly: the release flow becomes <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">git tag v0.12.0 &#38;&#38; git push origin v0.12.0</code>, two commands a human can reason about. The tag is the single point of entry for the entire pipeline, which keeps the "how do I release?" question answerable in one sentence.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The risk and the guard</h2>
                <p>
                    The danger of tag-triggered publishing is a misfired tag. The workflow's countermeasure is the release PR flow upstream: the version bump lands on main first, CI runs, and the tag is created only after review. The tag is the last step of a reviewed process, not a footgun anyone can trip accidentally. That ordering (review, merge, then tag) is what makes a single-command trigger safe.
                </p>
            </section>
        </article>
    )
}
