import Link from 'next/link'

export default function LinksMigrationPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 Migrating your client to the links API
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 23, 2026 at 11:00am</time>
 <span>&middot;</span>
 <span>6 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 If you created your client before v0.13.0, this is the entire migration. It is mechanical:
 constructor options became a one-element <code>links</code> array. Ten minutes, no behavior
 changes beyond batching (if you opt into it).
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Before and after</h2>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`// BEFORE (pre-0.13.0)
const api = createClient<Types>({ url: "http://localhost:8000" })`}</pre>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`// AFTER (v0.13.0)
import { createClient, httpBatchLink } from "@pyrpc/client"

const api = createClient<Types>({
 links: [httpBatchLink({ url: "http://localhost:8000" })],
})`}</pre>
 <p>
 Prefer strictly one-request-per-call? Use <code>httpLink</code> instead of{' '}
 <code>httpBatchLink</code>. Everything else about your client, procedure calls, types,
 error shapes, is unchanged.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Framework adapters</h2>
 <p>
 Adapters re-export the links, so keep imports canonical to your adapter package:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`// React / Next.js / Vue / Svelte, same shape everywhere
import { createReactClient, httpBatchLink } from "@pyrpc/react"

export const api = createReactClient<Types>({
 links: [httpBatchLink({ url: import.meta.env.VITE_API_URL ?? "http://localhost:8000" })],
})`}</pre>
 <p>
 The terminating link must come last in the array; today it must also be the only element.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">URL rules got looser, not stricter</h2>
 <ul className="list-disc pl-5 space-y-2">
 <li><code>&quot;http://localhost:8000&quot;</code> works.</li>
 <li><code>&quot;http://localhost:8000/&quot;</code> works (trailing slash stripped).</li>
 <li><code>&quot;http://localhost:8000/rpc&quot;</code> works too (idempotent normalization).</li>
 </ul>
 <p>
 The endpoint always resolves to <code>&lt;origin&gt;/rpc</code>, so copy-pasting base URLs from
 environment configs can no longer produce a 404.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Checklist</h2>
 <ul className="list-disc pl-5 space-y-2">
 <li>Replace flat client options with a <code>links</code> array containing exactly one terminating link.</li>
 <li>Bump adapter packages to <code>^0.13.0</code> (or re-run <code>pyrpc dev</code>, which regenerates the template file for new setups).</li>
 <li>Regenerated types land at <code>&lt;client&gt;/__pyrpc.ts</code>; make sure your editor picks up the tsconfig paths alias (automatic via pyRPC tooling).</li>
 <li>Search for old option names (<code>url:</code> directly on <code>createClient</code>), TypeScript will flag these as type errors immediately.</li>
 </ul>
 <p>
 That last point is the migration strategy in miniature: the compiler finds every call site.
 Fix them until it compiles; run your app; done.
 </p>
 </section>
 </article>
 )
}
