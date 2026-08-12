import Link from 'next/link'

export default function RelativeAliasDefaultPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Why the alias is relative
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 1:40pm</time>
                    <span>&middot;</span>
                    <span>5 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Every alias pyrpc injects points at <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"./__pyrpc.ts"</code> — a path that starts with a dot. That dot is doing real work, and its absence would be a quiet correctness bug waiting to happen.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What the dot means</h2>
                <p>
                    A leading <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">./</code> makes the target a relative path: resolved against the <em>config file's directory</em>. The generated <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">__pyrpc.ts</code> lives in the client directory, the same directory that holds <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">vite.config.ts</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">next.config.*</code>. The dot pins the alias to that guaranteed relationship.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What happens without it</h2>
                <p>
                    Drop the dot and you get <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"@pyrpc/types": "__pyrpc.ts"</code>. Now the semantics change: an extensionless, non-dotted string in an alias is treated as a <em>package-style specifier</em>. Vite and Turbopack would attempt to resolve it like a bare import — walking up node_modules looking for a package called <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">__pyrpc.ts</code>. That package does not exist, so the alias silently fails to match and the resolution falls through to the real placeholder. The symptom would be identical to no alias at all — the throwing Proxy — but the error message would point you in the wrong direction.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Relative vs absolute</h2>
                <p>
                    An absolute path (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">/home/you/project/__pyrpc.ts</code>) would also resolve — but it would be wrong in a subtler way. The generated file is a build artifact tied to the client directory. An absolute path hardcodes a machine-specific location into a file that typically gets committed, so it breaks every other developer's checkout and every CI machine. The relative form is portable: it survives moving the repo, cloning to a new path, and running in Docker.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The tsconfig side does the same</h2>
                <p>
                    The tsconfig <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">paths</code> alias mirrors the choice: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"./__pyrpc.ts"</code>, resolved relative to the tsconfig's directory — which is also the client directory. Both layers agree on the same relative target, so the compiler and the bundler converge on the same file without any absolute coordinates.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The rule of thumb</h2>
                <p>
                    When an alias targets a file that is a sibling of the config doing the aliasing, express it relative to that config. It is the only form that is simultaneously correct for resolution, portable across machines, and robust to repo moves. The leading dot is not style — it is the difference between "a sibling file" and "a package that was never published".
                </p>
            </section>
        </article>
    )
}
