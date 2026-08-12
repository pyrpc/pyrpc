import Link from 'next/link'

export default function TypesFromDevDepToRuntimeDepPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    @pyrpc/types: from type-only to runtime dependency
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 3:40pm</time>
                    <span>&middot;</span>
                    <span>6 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    For most of pyRPC's life, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> was what its name suggested: types. It exported interfaces, which compile away to nothing. A type-only dependency. v0.12.0 changed that in one move, and the change is visible in the adapters' <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">package.json</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The change</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// @pyrpc/react package.json
"dependencies": {
  "@pyrpc/client": "^0.12.0",
  "@pyrpc/types": "^0.12.0"    // ← moved here
},
"devDependencies": {
  "@pyrpc/types": "*"          // ← was here (dev-only)}`}
                </pre>
                <p>
                    Moving <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> from devDependencies to dependencies is a one-line diff with a heavy meaning: the package is no longer consumed only by the compiler. The adapter does <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">import &#123; procedureKinds &#125; from '@pyrpc/types'</code> — a value import. Consumers need it installed as a real, runtime-visible dependency.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why npm cares</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">devDependencies</code> are not installed when a package is installed <em>as a dependency</em> of something else — they are for the package's own development. If <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> stayed a devDependency of the adapter, an app that installed <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/react</code> would not get <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> at all. Type-only imports could get away with that (types resolve during the app's own compile). A runtime value import cannot — the specifier must resolve in the app's bundle, so the dependency must be declared where consumers can see it.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The version coupling</h2>
                <p>
                    The dependency is range-pinned: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">^0.12.0</code>. pyRPC releases all packages in lockstep, and the release script sweeps every <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/*</code> dependency range on every bump. The range means the adapter's hooks and the types package can never drift to incompatible majors within a release train — a guarantee that matters more now that the relationship is a runtime contract rather than a compile-time suggestion.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The devDependency stays</h2>
                <p>
                    The adapter keeps <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types: "*"</code> in devDependencies for local development and testing — the workspace-local package. Both declarations coexist deliberately: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">dependencies</code> states what consumers get; <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">devDependencies</code> states what the adapter's own build and test environment uses. The release script keeps both in sync.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The signal</h2>
                <p>
                    Dependency placement is architecture documentation. When a package moves from devDependencies to dependencies, it is announcing: <em>this is no longer erased at compile time — my runtime depends on it.</em> For pyRPC, that single move captures the whole v0.12.0 thesis in the most boring file in the repo.
                </p>
            </section>
        </article>
    )
}
