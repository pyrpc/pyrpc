import Link from 'next/link'

export default function TwelveExamplesPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 Twelve examples, one conformance bar
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 24, 2026 at 9:00am</time>
 <span>&middot;</span>
 <span>6 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 The examples directory ships twelve combinations: three Python backends (FastAPI, Flask,
 Django) times four TypeScript frontends (Next.js, React/Vite, Vue, Svelte). PR #140 aligned
 every one of them to the same standard, because an example that almost works teaches
 the wrong lesson with great confidence.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What conformance means here</h2>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>Current client API.</strong> Every client uses the links API (<code>httpBatchLink</code> from its adapter package), no stale constructor options surviving in any corner.</li>
 <li><strong>Correct provider scope.</strong> CRA clients had a subtle bug: the QueryClient was instantiated inside a component that re-rendered, resetting cache state. Providers now own exactly one client per app lifetime.</li>
 <li><strong>Working inputs.</strong> The Svelte examples had broken controlled inputs and procedures that didn&rsquo;t round-trip; every interactive element now actually mutates or fetches what it claims.</li>
 <li><strong>Framework-idiomatic hooks.</strong> Vue clients call <code>useQuery</code>/<code>useMutation</code> properly instead of imitating React patterns; Svelte uses stores with reactive getters for arguments.</li>
 <li><strong>Complete file sets.</strong> flask-nextjs&rsquo;s missing <code>next.config.ts</code> (needed for the Turbopack alias) is back; dependency versions are pinned to a coherent set across all twelve.</li>
 </ul>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The matrix is the test</h2>
 <p>
 Twelve combinations multiply small inconsistencies into large trust problems. A user hitting the
 Flask+Vue example after a smooth FastAPI+React experience assumes the difference they see is
 meaningful. Usually it is drift, an example updated in May and not in August.
 Conformance work is mostly archaeology followed by discipline:
 </p>
 <ul className="list-disc pl-5 space-y-2">
 <li><code>examples/verification.md</code> doubles as a manual QA script: first-run wizard transcript, hot-reload timing, server-detection attach path, watcher-only mode, each check executable by hand against any example.</li>
 <li>Shared structure (same procedure names, same page layout, same branding) makes cross-example diffs meaningful: when two examples differ, one of them is wrong.</li>
 <li>The top-level README now shows the single-command workflow that v0.13.0 enables, instead of per-framework workarounds.</li>
 </ul>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this belongs in release notes</h2>
 <p>
 Examples are documentation that executes. When the links API shipped, twelve codebases had to
 migrate in lockstep or the docs site would have contradicted itself twelve times over. Keeping
 the matrix green is how pyRPC makes claims like &ldquo;works with your stack&rdquo;
 falsifiable, there are twelve repos in-tree that prove it, and they all build.
 </p>
 </section>
 </article>
 )
}
