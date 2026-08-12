import Link from 'next/link'

export default function TheNodeModulesResolutionGapPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The node_modules resolution gap
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 11:40am</time>
                    <span>&middot;</span>
                    <span>9 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    pyRPC's type wiring depends on a single alias: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"@pyrpc/types"</code> pointing at your generated <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">__pyrpc.ts</code>. For TypeScript and some bundlers, a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">tsconfig.json</code> <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">paths</code> entry is enough. For Vite, SvelteKit, and Next.js Turbopack it is not — and the reason is where the import comes from.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The setting</h2>
                <p>
                    The adapters live in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">node_modules/@pyrpc/react</code> (etc.), and inside them the import is <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">import &#123; procedureKinds &#125; from "@pyrpc/types"</code>. At build time the bundler must resolve that specifier to a concrete file. The tsconfig <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">paths</code> alias lives in your project's tsconfig and says "when you see <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code>, use <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">./__pyrpc.ts</code>".
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Who honors paths for node_modules imports</h2>
                <p>
                    TypeScript itself applies <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">paths</code> to every import it compiles, wherever it originates — the type channel was never in doubt. Webpack-based bundlers (Next.js in webpack mode, Create React App) resolve <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">paths</code> through <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">tsconfig-paths-webpack-plugin</code> semantics and apply it uniformly, including for imports issued from inside <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">node_modules</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Who does not</h2>
                <p>
                    Vite, SvelteKit, and Next.js Turbopack resolve <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">paths</code> for your <em>own</em> source files, but deliberately skip tsconfig path rewriting for imports that originate inside <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">node_modules</code>. The rationale is performance and predictability: node_modules is treated as opaque, pre-resolved dependency code. The result is that the adapter's <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> import falls through to the real npm package — the placeholder — instead of your generated module.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why the runtime channel exposed it</h2>
                <p>
                    Before v0.12.0 the adapter was type-only: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">import type &#123; Types &#125;</code> is erased before the bundler ever sees it, so resolution of <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> in node_modules-internal imports simply never mattered. The moment the adapter gained a <em>value</em> import (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">procedureKinds</code>), the bundler had to resolve that specifier — and the gap became visible as a runtime bug: your app got the placeholder instead of the generated kinds.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The two-layer solution</h2>
                <p>
                    The fix is a second, bundler-specific alias. Instead of relying on tsconfig <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">paths</code> to cover every bundler, the bundler gets its own alias configured in its own config file:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// Vite
resolve: { alias: { "@pyrpc/types": "./__pyrpc.ts" } }

// Next.js Turbopack
turbopack: { resolveAlias: { "@pyrpc/types": "./__pyrpc.ts" } }`}
                </pre>
                <p>
                    The compiler keeps the tsconfig path; the bundler gets a native alias. Two tools, two configuration surfaces, one contract. This is what <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc_core.bundlers</code> automates, and why the alias must live in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">vite.config.*</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">next.config.*</code> rather than in tsconfig alone.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The lesson</h2>
                <p>
                    When an import crosses the node_modules boundary at runtime, you cannot assume tsconfig <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">paths</code> reaches it. The gap between "the compiler honors paths" and "the bundler honors paths" is precisely where your dependency's dependency stops resolving to your local file — and the fix is a native alias in the bundler that actually runs your code.
                </p>
            </section>
        </article>
    )
}
