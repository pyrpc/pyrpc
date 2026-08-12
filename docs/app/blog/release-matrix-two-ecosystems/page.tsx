import Link from 'next/link'

export default function ReleaseMatrixTwoEcosystemsPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Eleven packages, two ecosystems
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 5:00pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    A pyRPC release ships eleven packages to two registries. Six go to npm, five to PyPI, and they are not independent — the Python packages depend on each other, the TypeScript packages depend on each other, and the two ecosystems share one version number by contract. Understanding the matrix is understanding the release.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The npm side</h2>
                <p>
                    Six workspaces under <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">packages/</code>, arranged as a dependency chain:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`@pyrpc/types      — the type boundary (placeholder → generated module)
@pyrpc/client     — plain fetch client (Proxy-based procedure dispatch)
@pyrpc/react      — React + TanStack Query hooks
@pyrpc/next       — React hooks + Next.js extras
@pyrpc/vue        — Vue hooks
@pyrpc/svelte     — Svelte hooks`}
                </pre>
                <p>
                    The chain is a DAG: types feeds client, client feeds react, react feeds next. Publishing order matters, which is why the workflow expresses it as a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">needs:</code> graph rather than a flat loop.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The Python side</h2>
                <p>
                    Five packages, three adapters and two core tools:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`pyrpc-core           — router, introspection, CLI, watcher, bundlers
pyrpc-codegen        — the TypeScript emitter (depends on core)
pyrpc-fastapi        — FastAPI adapter (depends on core)
pyrpc-flask          — Flask adapter (depends on core)
pyrpc-django-adapter — Django adapter (depends on core)`}
                </pre>
                <p>
                    All five are built and published in one workflow job with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">python -m build</code> per package, so a single PyPI upload covers the whole Python matrix at once.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The shared version contract</h2>
                <p>
                    Eleven packages share one version number. The release script enforces it mechanically, and the contract has a purpose beyond tidiness: the ecosystem is consumed as a unit. A user installing <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/react@0.12.0</code> alongside <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core==0.12.0</code> gets a pair that is guaranteed to interoperate, because both shipped from the same tag. Version lockstep is the poor man's monorepo release — no code-sharing, but perfect compatibility.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Two package-manager topologies</h2>
                <p>
                    The two sides organize their workspaces differently. npm uses root-level <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">workspaces</code> globbing <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">packages/*</code> (plus examples). uv uses a root <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyproject.toml</code> workspace with the same member directories. Both managers resolve local packages locally — npm through symlinked workspaces, uv through editable installs — so cross-package imports during development hit your working tree, not the registry.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The failure that motivates the matrix</h2>
                <p>
                    Publish half the matrix and the registry is temporarily broken: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/react@0.12.0</code> exists but depends on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client@^0.12.0</code>, which does not. That is why the pipeline is ordered and idempotent — so the window where the matrix is inconsistent is measured in seconds, not until someone notices.
                </p>
            </section>
        </article>
    )
}
