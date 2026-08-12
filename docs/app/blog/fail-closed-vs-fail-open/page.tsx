import Link from 'next/link'

export default function FailClosedVsFailOpenPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Fail closed: why the placeholder throws
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 11:00am</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The v0.9.0 placeholder was an empty const: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">export const procedureKinds = &#123;&#125; as const satisfies ProcedureKinds</code>. Read it and you got <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">undefined</code>. v0.12.0 replaced it with a throwing Proxy. The change is a shift in failure philosophy — from fail-open to fail-closed — and this post is the reasoning behind it.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The failure mode of fail-open</h2>
                <p>
                    In the old design, when a bundler failed to resolve the alias and the adapter read <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kinds[procedure]</code>, it got <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">undefined</code>. The adapter's hook-selection code treated <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">undefined</code> as "show both hooks". Nothing crashed. Nothing logged. The app ran.
                </p>
                <p>
                    That is the seduction and the poison of fail-open. On the surface everything works: both hooks render, calls go out. But every procedure silently gets both <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code>, the exact API you designed the kinds system to prevent. And the type-level inference is quietly wrong too, because the placeholder's <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ProcedureKinds = Record&lt;string, never&gt;</code> gives every key an <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">undefined</code> kind. The wrongness is distributed across the whole app, invisible in any single call site.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The cost of the silent path</h2>
                <p>
                    A query/mutation mismatch is not a cosmetic issue. Calling a mutation through <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code> means the client sends a POST as a GET-cached query — the mutation may run twice, or be deduplicated away by TanStack Query's cache keyed on the input. The hook shape you use determines request semantics. Exposing the wrong one when codegen never ran is not a graceful degradation; it is a live bug wearing a mask.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Fail-closed: the throw is the feature</h2>
                <p>
                    The Proxy design flips the default. If the generated module is not resolved, reading kinds throws with a message that names the exact fix. The failure is:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Early</strong> — at module load, not at a random interaction on page 3.</li>
                    <li><strong>Loud</strong> — a red stack trace instead of a greyed-out hook.</li>
                    <li><strong>Actionable</strong> — the error tells you to run <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev</code> and verify the alias.</li>
                    <li><strong>Local</strong> — it points at the exact mechanism that broke (resolution), not at a symptom.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The tradeoff, stated honestly</h2>
                <p>
                    Fail-closed has a cost: a genuinely unconfigured project now refuses to run, where before it limped along. But for a developer setting up pyRPC, a crash with a fix-it message is a better experience than a mysterious cache bug three days later. And the window where you hit the throw is tiny — codegen configures the tsconfig and bundler alias automatically, so the throw is the canary for "your tooling and my aliases disagreed".
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The general rule</h2>
                <p>
                    Placeholders are for types, not for behavior. A missing value that changes request semantics is a hard failure by design. v0.12.0's placeholder is the line in the sand: if the type machinery is not in place, you will know — loudly — instead of shipping hooks that were never meant to exist.
                </p>
            </section>
        </article>
    )
}
