import Link from 'next/link'

export default function PackageVersioningPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    How to version, edit, and ship pyRPC’s multi-package surface
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 3:00am</time>
                    <span>&middot;</span>
                    <span>12 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    pyRPC is one product and many packages: Python on PyPI (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code>, framework adapters, codegen) and TypeScript on npm (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/react</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/next</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/vue</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/svelte</code>). Different registries, different version numbers — one release story.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Two version lines</h2>
                <p>
                    <strong>npm <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/*</code></strong> — keep these on a <em>synchronized</em> version (e.g. all 0.8.1) in the npm workspaces under <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">packages/</code>. Peer dependencies pin compatible major/minor of <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code> and TanStack Query.
                </p>
                <p>
                    <strong>PyPI</strong> — <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-fastapi</code>, etc. may diverge slightly, but any schema change that codegen/TS depends on (like procedure <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kind</code>) must ship with a matching codegen + npm bump in the same release train.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How to edit safely</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Transport / protocol</strong> — change <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> + tests first; then adapters if the HTTP contract moved.</li>
                    <li><strong>Generated contract</strong> — change introspection + <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code> templates; regenerate fixtures; update <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> placeholder if the public exports changed.</li>
                    <li><strong>Framework DX</strong> — edit only the relevant <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/react|next|vue|svelte</code> package; do not reimplement fetch.</li>
                    <li><strong>Docs/examples</strong> — same PR when the public API renamed (e.g. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createNextClient</code>).</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">PR standards (recommended)</h2>
                <ol className="list-decimal pl-6 space-y-2">
                    <li>Branch from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">main</code>: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">feat/framework-adapters</code> (or similar).</li>
                    <li>One vertical feature per PR when possible — adapters + kinds + docs + example is one coherent story; avoid mixing unrelated refactors.</li>
                    <li>Keep commits focused; message the <em>why</em> (Conventional Commits works well: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">feat(client): add TanStack adapters</code>).</li>
                    <li>Run: Python tests for touched packages, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npm run build/test</code> for touched workspaces.</li>
                    <li>Open the PR with summary + test plan; do <strong>not</strong> publish npm/PyPI from the PR branch until review lands.</li>
                    <li>After merge: tag release, publish npm packages in lockstep, publish PyPI as needed, then deploy docs.</li>
                </ol>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Pushing this work</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`git checkout -b feat/framework-adapters
git add packages/react packages/next packages/vue packages/svelte \\
        packages/pyrpc-core packages/pyrpc-codegen packages/types \\
        examples/nextjs docs architecture plan.md
git commit -m "feat: TanStack framework adapters, procedure kinds, docs"
git push -u origin HEAD
gh pr create --title "feat: framework adapters + procedure kinds" --body "..."`}
                </pre>
                <p>
                    Prefer a single PR for the feature set reviewers can reason about. If the diff is huge, split as: (1) core kinds + codegen, (2) JS adapters + example, (3) docs/blog — but land (1) before (2).
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Semver guidance while pre-1.0</h2>
                <p>
                    On 0.x, minor bumps can include breaking DX changes — still call them out loudly in the PR and changelog. Schema additions like <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kind</code> with a default of <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">query</code> are backward compatible for existing <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code> users.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Related</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li><Link href="/blog/framework-adapters-deep-dive" className="text-fd-foreground underline underline-offset-2">Adapters deep dive</Link></li>
                    <li><Link href="/blog/better-auth-pattern-for-python" className="text-fd-foreground underline underline-offset-2">Better Auth packaging pattern</Link></li>
                    <li><Link href="/blog/circular-dependency-package-architecture" className="text-fd-foreground underline underline-offset-2">Package architecture history</Link></li>
                </ul>
            </section>
        </article>
    )
}
