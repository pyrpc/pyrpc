import Link from 'next/link'

export default function BrandingTypesWithPyrpcKindPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The _pyrpcKind brand and type-level kind inference
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 10:20am</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The runtime map <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">procedureKinds</code> tells the running adapter which hooks to expose. But your editor needs the same information <em>before</em> anything runs — it has to know that <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">update_user</code> has no <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code>. That is the job of a type-level brand.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The brand, planted by codegen</h2>
                <p>
                    Every generated procedure type is intersected with a branded object literal:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`greet: ((name: string) => Promise<string>) & {
  readonly _pyrpcKind: "query";
};`}
                </pre>
                <p>
                    The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_pyrpcKind</code> property carries the procedure's kind as a <em>literal</em> type. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">readonly</code> modifier stops accidental reassignment, and the whole intersection means the brand travels alongside the callable signature. This is structural branding: the kind is a real property of the type, not a side table.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Reading the brand back out</h2>
                <p>
                    The adapter maps over <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">TProcedures</code> and, for each key, inspects the brand:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`export type InferProcedureKinds<TProcedures extends ProceduresRecord> = {
  [K in keyof TProcedures]: TProcedures[K] extends {
    readonly _pyrpcKind: infer Kind;
  }
    ? Kind extends ProcedureKind
      ? Kind
      : undefined
    : undefined;
};`}
                </pre>
                <p>
                    For each procedure key it does a conditional-type match: does the procedure type have a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_pyrpcKind</code>? If so, is the inferred <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Kind</code> a valid <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"query" | "mutation"</code>? The result is a map like <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&#123; greet: "query"; update_user: "mutation" &#125;</code> — the compile-time twin of the runtime const.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The undefined branch is the safety net</h2>
                <p>
                    The fallback branches yield <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">undefined</code>. Why not "query"? Because a procedure whose kind cannot be proven should not be silently assumed safe — <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">undefined</code> flows into <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ProcedureHooksForKind</code> and resolves to "both hooks" rather than the wrong one. It mirrors the runtime philosophy: when in doubt, expose more rather than guess.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Where inference plugs in</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createReactClient&lt;TProcedures&gt;</code> returns <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ReactClient&lt;TProcedures, InferProcedureKinds&lt;TProcedures&gt;&gt;</code>. The inferred kinds map selects, per procedure, one of three hook bundles:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"mutation"</code> → only <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code></li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"query"</code> → only <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code></li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">undefined</code> → both</li>
                </ul>
                <p>
                    So <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.greet.useMutation</code> is a compile error while <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.update_user.useMutation</code> typechecks — the type system has already read the server's decorators.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why branding beats a separate kind union</h2>
                <p>
                    A parallel <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ProcedureKinds</code> map already exists as a type. But deriving the hooks from the branded <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Types</code> interface means there is exactly one source of truth: the procedure type itself. If codegen ever changes a kind, the hooks signature changes with it automatically, and no second structure can drift out of sync.
                </p>
            </section>
        </article>
    )
}
