import Link from 'next/link'

export default function ZeroConfigPromiseRevisitedPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Reconciling zero-config with a runtime module
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 7:20pm</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    There is a tension at the heart of v0.12.0. The release makes generated types a <em>runtime</em> module, which requires real configuration: a tsconfig <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">paths</code> alias, and for many bundlers a second alias in the bundler's own config. Yet pyRPC's promise is zero-config. How can a release that demands more configuration be a release toward less?
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The two readings of "zero config"</h2>
                <p>
                    There is config-you-write and config-the-tool-manages. pyRPC's promise is the former, not the latter. You should never have to write <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">paths</code> entries or alias lines by hand. The tool may absolutely <em>maintain</em> config (writing it into your files, idempotently, on every regeneration) as long as it does so invisibly and correctly.
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// The developer never writes this:
"paths": { "@pyrpc/types": ["./__pyrpc.ts"] }
// or this:
turbopack: { resolveAlias: { "@pyrpc/types": "./__pyrpc.ts" } }
// pyrpc dev injects both, and keeps them correct.`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The cost of the runtime pivot</h2>
                <p>
                    When types were compile-time only, one configuration surface (tsconfig <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">paths</code>) was enough, and even that was only needed because the adapter imported a type. The moment the adapter imports a <em>value</em>, every tool that resolves imports at runtime must know the alias. That multiplies the configuration surface: tsconfig for the compiler, and bundler aliases for Vite, SvelteKit, Turbopack.
                </p>
                <p>
                    Left to a human, that is a worse experience, more places to configure, more ways to get it subtly wrong. The release's answer is not to ask less of configuration; it is to take ownership of more of it.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How ownership is earned</h2>
                <p>
                    Taking ownership of config files is only acceptable if the edits are trustworthy. v0.12.0's wiring layer was built to that standard:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Surgical.</strong> A tokenizer finds the config object and splices one line; it never reformats your file.</li>
                    <li><strong>Idempotent.</strong> Re-runs converge; no-op regens leave files byte-identical.</li>
                    <li><strong>Non-destructive.</strong> A config it cannot safely edit is left alone with a warning, not mangled.</li>
                    <li><strong>Fail-closed.</strong> If the wiring never happened, the throwing placeholder makes the gap obvious.</li>
                </ul>
                <p>
                    Each of these properties is what turns "the tool edits my config" from a horror story into a non-event. Zero-config is not magic, it is automation that has earned trust.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The shifting line</h2>
                <p>
                    As pyRPC's feature set grows, the line between "you configure" and "we configure" keeps moving. What used to require a tsconfig edit now requires nothing but running the dev server. The recurring lesson is the same: <em>move configuration into the tool, then make the tool's edits provably safe.</em> Safety mechanisms (idempotency, surgical edits, loud failures) are the price of admission for every configuration surface a tool takes over.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The paradox resolved</h2>
                <p>
                    v0.12.0 introduced a second alias surface, and by doing so it moved the project <em>closer</em> to zero-config: the surface the developer must understand manually now sits behind a tool that manages it. Zero-config, honestly, means "config that maintains itself", and a runtime module is simply a sharper test of whether the automation actually does.
                </p>
            </section>
        </article>
    )
}
