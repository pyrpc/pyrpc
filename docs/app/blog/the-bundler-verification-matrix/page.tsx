import Link from 'next/link'

export default function TheBundlerVerificationMatrixPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    How we checked every bundler: the verification matrix
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 8:00pm</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The bundler wiring rests on a specific claim: <em>tsconfig <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">paths</code> is enough for TypeScript and webpack, but not for Vite, SvelteKit, or Next.js Turbopack.</em> Before shipping the alias injection we had to prove that claim — not just assert it. This post is the proof: how we checked each tool, what the test suite pins down, and why the wiring is per client project rather than per framework.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The claim, as a matrix</h2>
                <p>
                    The deciding variable is not the bundler alone — it is the bundler <em>and</em> where the import originates. A project&rsquo;s own source files get path-rewritten almost everywhere. The interesting row is the last one: an import issued from inside <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">node_modules</code>, which is exactly where the adapters live.
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`                 import from YOUR source          import from node_modules
                                                 (the adapter packages)

TypeScript       ✓ paths honored                 ✓ paths honored — then erased
                                                 (type-only, no runtime resolution)

webpack-based    ✓ paths honored                 ✓ paths honored
(Next webpack    (No alias needed)               (Next webpack mode, CRA)
 mode, CRA)

Vite             ✓ paths honored                 ✗ skipped → resolve.alias
SvelteKit        ✓ paths honored                 ✗ skipped → resolve.alias (Vite)
Next Turbopack   ✓ paths honored                 ✗ skipped → resolveAlias`}
                </pre>
                <p>
                    The webpack row is the one that reads counter-intuitively. Vite and Turbopack deliberately treat <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">node_modules</code> as opaque, pre-resolved code and skip tsconfig rewriting there for performance and predictability. Webpack-based tooling applies the paths mapping uniformly, including to imports issued from inside dependencies — so Next.js in webpack mode and Create React App need no alias at all.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How we checked the mechanics: the unit suite</h2>
                <p>
                    The matrix is a design claim. The splice itself is a mechanical claim: <em>given this config file text, the injection inserts exactly the alias, leaves everything else intact, and is a no-op on re-run.</em> That is what <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">test_bundlers.py</code> pins down, one failure mode per test:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`test_no_config_file_is_a_noop                 → True, nothing written
test_vite_defineconfig_gets_alias             → alias inserted, plugins preserved
test_vite_config_with_braces_in_strings       → strings never mistaken for objects
test_vite_already_aliased_is_idempotent       → re-run leaves the file untouched
test_vite_without_defineconfig_returns_false  → warning path, file untouched
test_next_export_default_gets_alias           → resolveAlias into nextConfig
test_next_const_object_gets_alias             → const nextConfig = { ... } form too
test_next_module_exports_object_returns_false → unsupported shape, warning path
test_next_already_aliased_is_idempotent       → re-run is a no-op
test_ts_config_takes_precedence_over_js       → next.config.ts wins over .js`}
                </pre>
                <p>
                    Three of these are worth calling out. The braces-in-strings test feeds a config containing <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{'{"x": 1}'}</code> and a proxy string, and asserts the mini tokenizer never mistakes a brace inside a string for the config object — the exact bug class <Link href="/blog/a-mini-js-parser-for-config-edit" className="text-fd-foreground underline underline-offset-2">the parser post</Link> digs into. The idempotency tests assert that regenerating a hundred times produces the same file as the first time. And the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.ts</code>-over-<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.js</code> precedence test mirrors what Next.js itself does when both config files exist.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How we checked the matrix: the example apps</h2>
                <p>
                    Unit tests prove the splice; they do not prove the matrix. For that, the repo carries twelve example applications — FastAPI, Django, and Flask, each paired with Next.js, React (Vite), Vue (Vite), and SvelteKit:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`server         client
----------------------------------------------
FastAPI        Next.js · React · Vue · Svelte
Django         Next.js · React · Vue · Svelte
Flask          Next.js · React · Vue · Svelte`}
                </pre>
                <p>
                    Each example is a real client directory. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev</code> generates <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">__pyrpc.ts</code>, writes the tsconfig <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">paths</code> entry, and injects the bundler alias where the matrix says one is needed. Building each client is then a live check of one matrix cell: the Vite/SvelteKit/Turbopack projects only link if the alias landed, and the Next.js webpack-mode build only works if the <em>absence</em> of an alias is harmless.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">We did it for the adapters too — because it had to be</h2>
                <p>
                    The wiring is not a per-framework special case. It is per client project, and the reason is where the unresolved import actually lives. The adapter packages (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/react</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/next</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/vue</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/svelte</code>) sit inside <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">node_modules</code> and import <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> as a <em>value</em>. Every consumer project — vanilla, React, Vue, SvelteKit, or Next.js — is a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client_dir</code> that goes through the same code path in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">cli.py</code>: generate, configure tsconfig, configure bundler. So the four adapter projects in the matrix above are not extra work; they are the same loop running on four different config shapes — which is exactly why the loop exists.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The safety net under the whole check</h2>
                <p>
                    The matrix has a fourth row hidden underneath: <em>unconfigured</em>. If no known config file exists, or a known one cannot be edited, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">configure_bundler</code> returns <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">False</code> and the CLI prints an exact remediation hint instead of failing silently — the fail-loud contract described in <Link href="/blog/fail-loud-when-unconfigurable" className="text-fd-foreground underline underline-offset-2">fail loud when unconfigurable</Link>. The verification matrix is not the only thing standing between a developer and a broken build; it is the thing that makes the failure message trustworthy.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Further reading</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li><Link href="/blog/the-node-modules-resolution-gap" className="text-fd-foreground underline underline-offset-2">The node_modules resolution gap</Link> — why the gap exists in the first place</li>
                    <li><Link href="/blog/two-alias-shapes" className="text-fd-foreground underline underline-offset-2">Two alias shapes</Link> — Vite <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">resolve.alias</code> vs Turbopack <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">resolveAlias</code></li>
                    <li><Link href="/blog/surgical-splice-without-a-parser" className="text-fd-foreground underline underline-offset-2">Surgical splice without a parser</Link> — the splice machinery the tests exercise</li>
                    <li><a href="https://vite.dev/config/shared-options#resolve-alias" className="text-fd-foreground underline underline-offset-2">Vite: resolve.alias</a></li>
                    <li><a href="https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack" className="text-fd-foreground underline underline-offset-2">Next.js: Turbopack config</a></li>
                    <li><a href="https://webpack.js.org/configuration/resolve/#resolvealias" className="text-fd-foreground underline underline-offset-2">webpack: resolve.alias</a></li>
                    <li><a href="https://www.typescriptlang.org/tsconfig/#paths" className="text-fd-foreground underline underline-offset-2">TypeScript: paths</a></li>
                </ul>
            </section>
        </article>
    )
}
