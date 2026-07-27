import Link from 'next/link'

export default function CICDPublishPipelinePage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The CI/CD publish pipeline: tag-triggered, chained, OIDC
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 8:15am</time>
                    <span>&middot;</span>
                    <span>12 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.github/workflows/publish.yml</code> file is the entire release automation. One tag push publishes 5 Python packages, 6 npm packages, and creates a GitHub Release. This post explains how.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Trigger</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`on:
  push:
    tags:
      - "v*.*.*"
      - "v*.*.*-*"`}
                </pre>
                <p>
                    Any tag matching <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">v1.2.3</code> or <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">v1.2.3-beta.1</code> triggers the workflow. Pre-release tags get a beta npm tag.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Job chain</h2>
                <p>
                    The six jobs run in dependency order:
                </p>
                <ol className="list-decimal pl-6 space-y-1">
                    <li><strong>publish-pypi</strong> — builds all Python wheels, uploads via OIDC</li>
                    <li><strong>publish-npm-types</strong> — publishes <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code></li>
                    <li><strong>publish-npm-client</strong> — needs types, publishes <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code></li>
                    <li><strong>publish-npm-react</strong> — needs client, publishes <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/react</code></li>
                    <li><strong>publish-npm-adapters</strong> — needs react, publishes <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/next</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">vue</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">svelte</code></li>
                    <li><strong>create-release</strong> — waits for all publish jobs, creates GitHub Release</li>
                </ol>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">PyPI via OIDC</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`permissions:
  id-token: write
  contents: write

steps:
  - uses: pypa/gh-action-pypi-publish@release/v1
    with:
      packages-dir: dist/
      skip-existing: true`}
                </pre>
                <p>
                    No API token. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">id-token: write</code> permission lets GitHub create an OIDC token that PyPI trusts. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">skip-existing</code> prevents errors if a version was already published.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">npm chained publishes</h2>
                <p>
                    Each npm job builds its package before publishing. The chain (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">needs:</code>) ensures:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Types are published first (other packages depend on them)</li>
                    <li>Client is published before React (React imports from client)</li>
                    <li>React is published before Next/Vue/Svelte (adapters import from React)</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Pre-release handling</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{"VERSION=$(echo \"$GITHUB_REF_NAME\" | sed 's/^v//')\nif [[ \"$VERSION\" == *\"-\"* ]]; then\n  TAG=$(echo \"$VERSION\" | awk -F'-' '{print $2}' | awk -F'.' '{print $1}')\n  npm publish --access public --tag \"$TAG\"\nelse\n  npm publish --access public\nfi"}
                </pre>
                <p>
                    If the tag is <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">v0.9.0-beta.1</code>, npm publishes with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--tag beta</code>. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">latest</code> tag stays on the stable release.
                </p>

                <p>
                    <Link href="/blog/how-we-publish" className="text-fd-foreground underline underline-offset-2">How we publish</Link> · <Link href="/blog/package-versioning-and-releases" className="text-fd-foreground underline underline-offset-2">Versioning guide</Link>
                </p>
            </section>
        </article>
    )
}
