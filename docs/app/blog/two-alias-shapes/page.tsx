import Link from 'next/link'

export default function TwoAliasShapesPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Two alias shapes: Vite resolve.alias vs Turbopack resolveAlias
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 1:00pm</time>
                    <span>&middot;</span>
                    <span>6 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The alias that fixes the node_modules resolution gap is nearly identical across Vite and Next.js Turbopack — but "nearly" hides a real design difference. The two bundlers express the same concept in different homes, and pyrpc has to speak both dialects.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The two forms, side by side</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// Vite — lives under resolve
resolve: {
  alias: { "@pyrpc/types": "./__pyrpc.ts" }
}

// Next.js Turbopack — lives under turbopack
turbopack: {
  resolveAlias: { "@pyrpc/types": "./__pyrpc.ts" }
}`}
                </pre>
                <p>
                    Both map a bare specifier to a file. But their placement reflects each bundler's mental model of what an alias <em>is</em>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Vite: aliases are a resolution concern</h2>
                <p>
                    Vite treats aliasing as part of module resolution, grouped with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">extensions</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">dedupe</code> under <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">resolve</code>. Vite's alias also accepts object shorthand where the value may be a string or an <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&#123; find, replacement &#125;</code> pair for regex-based matching. The simple string form pyrpc emits is the object shorthand — one package name, one target.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Turbopack: aliases are a bundler feature</h2>
                <p>
                    Next.js's Turbopack mode scopes the alias under a top-level <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">turbopack</code> key, because Turbopack is one of several runtimes a single <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">next.config.js</code> can target. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">resolveAlias</code> key is Turbopack's own name for the same idea — webpack's <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">resolve.alias</code> counterpart, namespaced so webpack mode and Turbopack mode can coexist in one config.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What this means for codegen</h2>
                <p>
                    Because the two dialects have different parent keys, the injection logic must branch on the detected framework — which is exactly why <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_inject_vite</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_inject_next</code> are separate functions sharing the same splice machinery. The shared part is the hard-won generality: both still reduce to <em>find the config object, append a property</em>. The divergent part is just the snippet text.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The general lesson</h2>
                <p>
                    Cross-tool automation is a Rosetta stone problem: the same semantic (alias this package to this file) has a different syntax in every tool. The pragmatic structure is a shared mechanical core plus a per-tool snippet table. When a new bundler arrives, you add an entry to the signature map, write one snippet, and reuse the splice — the table grows, the machinery does not.
                </p>
            </section>
        </article>
    )
}
