import Link from 'next/link'

export default function IdempotentPublishingPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    skip-existing and the npm guard: idempotent publishing
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 5:40pm</time>
                    <span>&middot;</span>
                    <span>6 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The publish workflow can run more than once for the same tag. A re-triggered run, a manual re-run after a transient failure, a retry of one job, all of these will try to upload versions that already exist. Registries reject duplicate uploads. The workflow's answer to that is idempotency: detect what is already published and skip it.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The Python side: skip-existing</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`- name: Publish to PyPI
  uses: pypa/gh-action-pypi-publish@release/v1
  with:
    packages-dir: dist/
    skip-existing: true
    password: $\{\{ secrets.PYPI_API_TOKEN \}\}`}
                </pre>
                <p>
                    The action uploads five built packages. If <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core-0.12.0</code> already exists but <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-fastapi-0.12.0</code> does not, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">skip-existing: true</code> makes the action treat the duplicate as success and continue with the rest. Without it, the whole job would fail on the first duplicate, even though the only real problem was "this already shipped".
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The npm side: check-then-publish</h2>
                <p>
                    npm has no skip-existing flag, so each npm job implements the guard by hand:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`VERSION=$(node -p "require('./package.json').version")
EXISTING=$(npm view @pyrpc/types@$VERSION version 2>/dev/null || echo "")
if [ "$EXISTING" = "$VERSION" ]; then
  echo "@pyrpc/types@$VERSION already published, skipping."
  exit 0
fi
npm publish --access public`}
                </pre>
                <p>
                    Three lines of shell encode the idempotency contract: read the version from the manifest (the source of truth), query the registry, and skip cleanly if the exact version is already there. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">2&gt;/dev/null || echo ""</code> handles the "package not found" case, which would otherwise make <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npm view</code> exit non-zero and trip the shell's <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">-e</code> flag.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why idempotency matters here specifically</h2>
                <p>
                    The chain topology makes partial failures likely: if react publishes but the adapters job fails, the natural recovery is to re-run the failed job, or the whole workflow. Without the guards, that re-run would collide with react's existing 0.12.0 and fail again, turning a transient blip into a permanently stuck release. With the guards, re-running is safe: everything already published is skipped, everything missing is published, and the release completes.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The boundaries of the guard</h2>
                <p>
                    Idempotency skips exact-version matches. It does not detect a <em>wrong</em> build of the same version, a corrupted wheel uploaded once stays, because the version matches. This is an accepted limitation; package managers are built on the assumption that a published version is immutable. The guards make re-runs safe, not all failure modes elegant.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The pattern</h2>
                <p>
                    Any publish pipeline that can be re-triggered should be idempotent by default. The two registries demanded two different implementations (a flag on one, a manual guard on the other) but the principle is identical: <em>publishing is a reconciliation, not a mandate.</em> The workflow brings the registry up to the desired state and stops, rather than demanding the registry be empty first.
                </p>
            </section>
        </article>
    )
}
