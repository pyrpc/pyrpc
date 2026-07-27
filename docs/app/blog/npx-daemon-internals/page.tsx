import Link from 'next/link'

export default function NpxDaemonInternalsPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The npx daemon: 715× faster type generation
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 6:45am</time>
                    <span>&middot;</span>
                    <span>10 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Before v0.8.0, every codegen run called <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npx json-schema-to-typescript</code> as a subprocess. That took 3.3 seconds per call. With a file watcher regenerating types on every save, that was unacceptable. The fix: keep <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npx</code> running in the background.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The problem</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npx</code> is a Node.js wrapper that resolves packages, downloads them if needed, and runs the binary. Every invocation pays the startup cost: resolve the package, load V8, parse <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">json-schema-to-typescript</code>, compile TypeScript schemas. That is 3.3 seconds on a cold start.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The solution: a persistent process</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jsonschema-ts</code> v0.3.0 spawns a single Node.js process that stays alive. It loads <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">json-schema-to-typescript</code> once and keeps it in V8's code cache. Subsequent conversions read from stdin, write to stdout:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# First call (cold): 3.3s
# Second call (warm): 4.6ms
# 715× faster`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How it works in pyrpc</h2>
                <p>
                    The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev</code> file watcher triggers codegen on Python file changes. The codegen step calls <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jsonschema-ts</code> to convert Pydantic models to TypeScript interfaces. With the daemon:
                </p>
                <ol className="list-decimal pl-6 space-y-1">
                    <li>First save: 3.3s (daemon starts, cold load)</li>
                    <li>Every save after: ~4.6ms (warm, daemon is alive)</li>
                </ol>
                <p>
                    The daemon is shared across <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc codegen</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev</code>, and the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> postinstall script. One process, many callers.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Windows fix</h2>
                <p>
                    On Windows, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npx</code> is a script file, not an executable. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">subprocess.run(["npx", ...])</code> fails with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[WinError 2]</code>. The fix in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jsonschema-ts</code> v0.2.1: use <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"npx.cmd"</code> when <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">os.name == "nt"</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">File watcher debounce</h2>
                <p>
                    Alongside the daemon, the file watcher debounce dropped from 1.6s to 200ms. Combined, the feedback loop from saving a Python file to seeing updated TypeScript types is now sub-second.
                </p>

                <p>
                    <Link href="/blog/codegen-template-internals" className="text-fd-foreground underline underline-offset-2">Codegen template internals</Link> · <Link href="/docs/client/overview" className="text-fd-foreground underline underline-offset-2">Client docs</Link>
                </p>
            </section>
        </article>
    )
}
