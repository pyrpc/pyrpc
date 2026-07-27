import Link from 'next/link'

export default function PublishingPyrpcPackagesPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Publishing guide: npm @pyrpc/* and PyPI
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 5:45am</time>
                    <span>&middot;</span>
                    <span>10 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    pyRPC releases through version sync + git tag. CI publishes PyPI (OIDC) and npm (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">NPM_TOKEN</code>).
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">1. Sync versions</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`node scripts/release.mjs 0.9.0`}
                </pre>
                <p>
                    Updates every <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">packages/*/package.json</code> and Python <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyproject.toml</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">2. Build JS adapters</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`npm install
npm run build --workspace=@pyrpc/types
npm run build --workspace=@pyrpc/client
npm run build --workspace=@pyrpc/react
npm run build --workspace=@pyrpc/next
npm run build --workspace=@pyrpc/vue
npm run build --workspace=@pyrpc/svelte`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">3a. Recommended: tag → GitHub Actions</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`git add -A
git commit -m "chore: release v0.9.0"
git tag v0.9.0
git push origin HEAD
git push origin v0.9.0`}
                </pre>
                <p>
                    Requires repo secret <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">NPM_TOKEN</code> and PyPI trusted publisher for this repo. Workflow: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.github/workflows/publish.yml</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">3b. Manual npm (new packages)</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`npm whoami   # must own @pyrpc org / packages

cd packages/types && npm publish --access public
cd ../client && npm publish --access public
cd ../react && npm publish --access public
cd ../next && npm publish --access public
cd ../vue && npm publish --access public
cd ../svelte && npm publish --access public`}
                </pre>
                <p>
                    Publish order: <strong>types → client → react → next/vue/svelte</strong> (peers).
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">3c. Manual PyPI</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`pip install build twine
mkdir -p dist && rm -rf dist/*
for pkg in pyrpc-codegen pyrpc-core pyrpc-fastapi pyrpc-flask pyrpc-django-adapter; do
  python -m build "packages/$pkg" --outdir dist/
done
twine upload dist/*`}
                </pre>
                <p>
                    Prefer CI OIDC (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">skip-existing: true</code>) over long-lived PyPI tokens when possible. Publish <strong>codegen before core</strong> if versions are tightly coupled.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">New packages checklist</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li>First publish needs <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--access public</code> for scoped npm packages</li>
                    <li>Ensure CI job lists every workspace package (react/next/vue/svelte)</li>
                    <li>Verify: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npm view @pyrpc/react version</code></li>
                </ul>
            </section>
        </article>
    )
}
