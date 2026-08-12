import Link from 'next/link'

export default function TheKindsOverrideSeamPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The kinds override seam and why tests use it
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 3:00pm</time>
                    <span>&middot;</span>
                    <span>6 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createReactClient</code> accepts a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kinds</code> option — documented as internal, marked with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@internal</code>, and effectively invisible to real apps. Its purpose is not for you. It exists so the adapters can be tested without a generated module.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The seam</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`export type ReactClientOptions = ClientOptions & {
  /**
   * @internal Override generated kinds. Prefer relying on codegen — adapters
   * load \`procedureKinds\` from \`@pyrpc/types\` automatically.
   */
  kinds?: ProcedureKindMap<ProceduresRecord>;
};`}
                </pre>
                <p>
                    A seam that is documented but discouraged. The JSDoc says it plainly: prefer codegen. The option exists as an escape hatch, and its placement in the options object (not a separate test-only constructor) keeps the public API surface small.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why tests need it</h2>
                <p>
                    The adapter imports <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">procedureKinds</code> from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code>. In the published package, that module is the generated <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">__pyrpc.ts</code> — a file that does not exist in the adapter's own test environment, because codegen has not run there. Without the override, every test would have to either generate a module or hit the throwing placeholder.
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`createReactClient<{ greet: (...args: any[]) => Promise<string> }>({
  baseUrl: "http://localhost:8000",
  kinds: { greet: "query" },
})`}
                </pre>
                <p>
                    The test supplies its own kinds, mirroring what codegen would have emitted, and asserts the hook selection behavior — <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code> present, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code> absent — independent of any codegen step. The override converts an integration dependency into a pure unit-test input.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What the tests actually assert</h2>
                <p>
                    Because the kinds map is now an explicit input, the test suite can exercise every branch of the runtime selection logic:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>a query kind yields only <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code></li>
                    <li>a mutation kind yields only <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code></li>
                    <li>a missing kind yields both — the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">undefined</code> fallback</li>
                </ul>
                <p>
                    Each case is a table row, not a bespoke test. The override makes the runtime behavior a pure function of <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">(kind)</code> and therefore exhaustively testable.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The design lesson</h2>
                <p>
                    A test-only seam should be honest about being a seam. Hiding it behind mocks or magic globals would obscure what it is for. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@internal</code> option is a contract with a caveat: you may inject kinds to test, but production relies on codegen, and the throwing placeholder enforces that distinction at runtime. Testability and safety, both intact.
                </p>
            </section>
        </article>
    )
}
