import Link from 'next/link'

export default function BundlerConfigDetectionPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Detecting the bundler by config filename
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 12:00pm</time>
                    <span>&middot;</span>
                    <span>6 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Before pyrpc can inject a bundler alias, it has to know which bundler you use. It never reads your package.json <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">devDependencies</code>, never executes your config, and never asks. It looks for files.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The signature map</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`_FRAMEWORK_SIGNATURES = {
  "vite.config.ts": "vite",
  "vite.config.js": "vite",
  "vite.config.mjs": "vite",
  "next.config.ts": "next",
  "next.config.js": "next",
  "next.config.mjs": "next",
}`}
                </pre>
                <p>
                    Six filenames, two frameworks, three extensions each. The detection is deliberately crude: a config file on disk is treated as proof the framework is in use. SvelteKit is covered because SvelteKit is Vite under the hood — a SvelteKit project has a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">vite.config.*</code>, so the Vite path handles it with no extra entry.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The walk</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_detect_bundler</code> iterates the map in insertion order and returns the first existing file. Ordering encodes a deliberate preference: TypeScript configs (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.ts</code>) beat JavaScript ones, and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">vite.config.ts</code> would be found before <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">vite.config.js</code>. If you keep both files around, the TypeScript one wins.
                </p>
                <p>
                    If no signature matches, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">None</code> is returned and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">configure_bundler</code> reports success without touching anything — an unknown bundler is not an error, it is an unknown that the throwing placeholder will safely police.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why filename detection is the right tool</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Zero execution.</strong> Reading <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">package.json</code> would tell you the framework is installed, not that it is configured. The config file is the source of truth for the bundler.</li>
                    <li><strong>Zero import cost.</strong> No config file is loaded, so config files that are not even JavaScript (e.g. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">next.config.mjs</code> that imports stuff) are safe to detect.</li>
                    <li><strong>Stateless and predictable.</strong> The same client directory always yields the same answer; a test can assert it without mocking a bundler.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What it cannot see</h2>
                <p>
                    Filename detection has blind spots: a custom config name, a bundler configured inside a monorepo root config, or a future framework that uses a different file. When that happens the code takes the "no known config" path and leaves your setup alone, with the placeholder standing by as the loud failure mode. Detection is best-effort by design — correctness comes from the alias contract, not from perfect tooling coverage.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The takeaway</h2>
                <p>
                    Heuristics work best when their failure is safe. Detecting a bundler by filename is fast, deterministic, and wrong only in ways that degrade gracefully. That is the pattern: use the cheapest reliable signal, and make the fallback loud rather than magical.
                </p>
            </section>
        </article>
    )
}
