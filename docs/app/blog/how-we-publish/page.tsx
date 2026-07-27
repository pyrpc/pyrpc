import Link from 'next/link'

export default function HowWePublishPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    How we publish: from git tag to npm and PyPI
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 8:00am</time>
                    <span>&middot;</span>
                    <span>10 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    pyRPC ships on two registries: npm (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/*</code>) and PyPI (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-*</code>). Publishing is triggered by a single <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">git tag</code>. Here is the full flow.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 1: release.mjs</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`node scripts/release.mjs 0.9.0`}
                </pre>
                <p>
                    This script bumps all <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">package.json</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyproject.toml</code> versions, builds JS workspaces, and commits the changes.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 2: tag and push</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`git commit -m "chore: release v0.9.0"
git tag v0.9.0
git push origin HEAD && git push origin v0.9.0`}
                </pre>
                <p>
                    The tag push triggers <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.github/workflows/publish.yml</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 3: CI publishes everything</h2>
                <p>
                    The workflow has a chain of jobs that depend on each other:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`publish-pypi          (Python packages, OIDC)
    ↓
publish-npm-types    (@pyrpc/types)
    ↓
publish-npm-client   (@pyrpc/client)
    ↓
publish-npm-react    (@pyrpc/react)
    ↓
publish-npm-adapters (@pyrpc/next, vue, svelte)
    ↓
create-release       (GitHub Release)`}
                </pre>
                <p>
                    Each npm job builds and publishes one package. The chain ensures dependencies are published first. The PyPI job builds all Python wheels and uploads them via OIDC (no token needed in CI).
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why OIDC for PyPI</h2>
                <p>
                    OpenID Connect publishing means GitHub Actions proves its identity to PyPI directly. No API token stored as a secret. PyPI trusts the GitHub workflow's identity. This is the recommended approach for open-source projects.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Manual publishing (fallback)</h2>
                <p>
                    If CI fails or you need to publish locally:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# PyPI
$env:TWINE_USERNAME = "__token__"
$env:TWINE_PASSWORD = "pypi-AgE..."
twine upload dist/*

# npm
npm publish --access public  # in each package directory`}
                </pre>
                <p>
                    The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--skip-existing</code> flag on twine prevents errors if packages are already published.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The build order matters</h2>
                <p>
                    Python packages must be built in dependency order: codegen first, then core, then adapters. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> depends on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code>. Adapters depend on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code>. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">dist/</code> directory ends up with all wheels and sdists.
                </p>

                <p>
                    <Link href="/blog/publishing-pyrpc-packages" className="text-fd-foreground underline underline-offset-2">Publishing guide</Link> · <Link href="/blog/package-versioning-and-releases" className="text-fd-foreground underline underline-offset-2">Versioning guide</Link>
                </p>
            </section>
        </article>
    )
}
