import Link from 'next/link'

export default function ExternalizingTheTypeBoundaryPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Why adapters keep @pyrpc/types external
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 3:20pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The react adapter is bundled with tsup. One line in its build command decides where the type boundary lives:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`tsup src/index.ts --format cjs,esm --dts \\
  --external react \\
  --external @tanstack/react-query \\
  --external @pyrpc/client \\
  --external @pyrpc/types`}
                </pre>
                <p>
                    Four externals, and each one encodes a resolution decision. The two that matter here are <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">External means: the app resolves it</h2>
                <p>
                    Marking a package external tells tsup "do not inline this import; leave the specifier in the output". The consuming app's bundler then resolves it. That is the entire trick of the type-boundary architecture: the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">import &#123; procedureKinds &#125; from '@pyrpc/types'</code> inside the adapter's dist stays a bare specifier, and the app's alias rewrites it to the generated file.
                </p>
                <p>
                    If <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> were bundled into the adapter instead, the generated module could never reach the hooks: the code would be inlined at adapter-build time, fixed to whatever the adapter's own node_modules held (the placeholder), and your app's alias would be powerless to redirect it. Externalizing is what makes runtime substitution possible.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The same logic for react and react-query</h2>
                <p>
                    React and TanStack Query are externals too, but for a different reason: peer-dependency hygiene. Bundling a second copy of React guarantees hook identity bugs and double-instance errors. The app already provides these — the adapter must share the app's single instance. So the build treats them as external for deduplication, and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> as external for <em>substitution</em>. Same mechanism, two distinct goals.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What "external" does not mean</h2>
                <p>
                    External does not mean "not a dependency". <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> sits in the adapter's <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">dependencies</code> (a change v0.12.0 made explicitly) — the package manager must install it so the specifier resolves in the default case. External is about <em>where resolution happens at build time</em>; dependencies is about <em>what gets installed at runtime</em>. The adapter needs both: install the placeholder so imports are satisfiable, keep it external so the app's alias can override it.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The chain stays intact</h2>
                <p>
                    The adapter's dist is also external to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code> — the hook layer re-exports the plain client rather than duplicating it. So the resolution chain is a straight line: <em>your app → @pyrpc/react → @pyrpc/types (aliased to your __pyrpc.ts) and @pyrpc/client</em>. Every hop is external, every specifier survives to the app bundler, and every alias has a chance to redirect. The boundary you define in your config reaches the deepest layer of the adapter.
                </p>
            </section>
        </article>
    )
}
