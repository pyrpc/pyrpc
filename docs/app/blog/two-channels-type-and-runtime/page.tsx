import Link from 'next/link'

export default function TwoChannelsTypeAndRuntimePage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Two channels: compile-time types and runtime kinds
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 11:20am</time>
                    <span>&middot;</span>
                    <span>6 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The design that anchors everything in v0.12.0 can be stated in one sentence: <strong>type information and runtime capability are two separate channels, and codegen must emit both from a single source of truth.</strong> Everything else — the runtime module, the bundler aliases, the throwing placeholder — is a consequence.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The erasure problem</h2>
                <p>
                    TypeScript erases types. A <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">type &#123; greet: (name: string) =&gt; Promise&lt;string&gt; &#125;</code> gives your editor autocomplete, but the running program has no idea that <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">greet</code> is a query rather than a mutation. The adapters must decide at runtime which hooks to expose. They cannot read a type.
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// Channel 1 — compile time. The compiler's view:
type Types = { greet: (name: string) => Promise<string> }

// Channel 2 — runtime. The program's view:
const procedureKinds = { greet: "query" }`}
                </pre>
                <p>
                    One channel is a description for the compiler. The other is a value for the runtime. They describe the same procedures and must never disagree.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why a single generated module</h2>
                <p>
                    The two channels could live in different files. But keeping them in one emitted module makes a strong guarantee: they are produced by the same template loop over the same <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">schemas</code> dict in the same pass. There is no third artifact that could drift. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">satisfies ProcedureKinds</code> constraint adds a compile-time proof at generation time: the runtime map is typechecked against the declared map before it ever ships.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The stable seam between them</h2>
                <p>
                    The channels meet at <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code>. The compiler channel arrives as the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Types</code> interface; the runtime channel as the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">procedureKinds</code> value. Both are named exports from the same package, which means the adapters import them through the same alias indirection. If the alias is misconfigured, both channels fail together — and the throwing placeholder makes that failure unmistakable.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this matters beyond pyRPC</h2>
                <p>
                    Any codegen system that feeds a UI framework hits this split the moment its types influence behavior. The reusable lesson: do not smuggle runtime meaning into type-only constructs. If a type changes what your program does, emit a value for it, keep that value next to the type, and generate both from one schema. That discipline — not any single feature — is what makes the end-to-end guarantee real.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The payoff</h2>
                <p>
                    Because the channels share one source, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.mutation</code> on the server is simultaneously: an autocomplete rule (type channel), a hook selection rule (runtime channel), and a request-semantics rule (the query keying). One decorator, three guarantees, zero coordination code.
                </p>
            </section>
        </article>
    )
}
