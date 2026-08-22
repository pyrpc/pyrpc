import Link from 'next/link'

export default function FailLoudWhenUnconfigurablePage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    When the config is too weird: failing loud
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 1:20pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The bundler tokenizer is not a parser, and it knows it. When a config file's shape does not match what it can safely edit, the right move is not to guess, it is to refuse, and to say so clearly. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">configure_bundler</code> has a two-state return value that exists precisely for this.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The contract</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`def configure_bundler(client_dir: str) -> bool:
    """Returns True on success or when no known config file is present.
    Returns False when a known framework config exists but couldn't be
    edited, so the caller can surface a clear warning."""`}
                </pre>
                <p>
                    Three outcomes collapse into one boolean. <em>No config file</em> and <em>config edited fine</em> both return <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">True</code>, there is nothing to warn about. Only the third case, <em>a known framework exists but the edit failed</em>, returns <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">False</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What can fail</h2>
                <p>
                    The injection functions return <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">None</code> when the expected structure is missing. Concretely: a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">vite.config.ts</code> that never calls <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">defineConfig</code>, a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">next.config.mjs</code> with neither <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">export default</code> nor a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">const nextConfig</code>, or a file where the brace matcher cannot find a balanced object. All of these are legitimate ways to write a config, and none of them are safe to splice.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The caller turns False into a warning</h2>
                <p>
                    The CLI, which runs the generator, does not swallow the boolean:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`if not configure_bundler(client_dir):
    console.print(
        f"[yellow]⚠ Could not auto-configure bundler in {client_dir}, "
        "add a bundler alias '@pyrpc/types' → './__pyrpc.ts' "
        "(Vite/SvelteKit/Next.js Turbopack).[/yellow]"
    )`}
                </pre>
                <p>
                    The hint text is specific and complete, it tells you to add <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"@pyrpc/types" -&gt; "./__pyrpc.ts"</code> so the generated runtime kinds resolve. The developer sees a yellow warning with an exact remediation, not a silent no-op and not a hard crash.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why not throw?</h2>
                <p>
                    A hard exception would be wrong here. The aliasing is an optimization of a safety net, if it is not injected, the throwing placeholder still protects the app by failing loudly at runtime. Warnings are the right severity for "I could not finish the convenience step"; exceptions are reserved for "your project is now broken". Making the failure non-fatal at codegen time pushes the decision to the developer, who may prefer to configure the alias their own way.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The layered failure design</h2>
                <p>
                    pyrpc's failure handling is a stack, each layer louder than the last:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Config edited successfully → no output at all.</li>
                    <li>Config uneditable → yellow warning with the exact fix.</li>
                    <li>Warning ignored, alias missing → the Proxy throws with a full diagnosis.</li>
                </ul>
                <p>
                    The warning is the middle layer: enough signal to fix it proactively, gentle enough not to block work, and backed by a runtime guard that escalates if ignored. That is what "fail loud" means in practice, a calibrated response, not a tantrum.
                </p>
            </section>
        </article>
    )
}
