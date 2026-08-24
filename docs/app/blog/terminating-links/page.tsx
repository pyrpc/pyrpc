import Image from 'next/image'
import Link from 'next/link'

export default function TerminatingLinksPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 Terminating links: giving @pyrpc/client a pipeline
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 20, 2026 at 2:00pm</time>
 <span>&middot;</span>
 <span>7 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 Before v0.13.0, <code>createClient</code> took transport options directly, URL, headers,
 batching behavior, all flattened into one options object. Every future feature (retries, auth
 tokens, request logging) would have meant another option, another conditional, another coupling
 between concerns that do not belong together. PR #136 replaced that with the design tRPC and
 urql normalized years ago: a <strong>link pipeline</strong>.
 </p>

 <Image src="/blog/links-pipeline.svg" alt="Diagram: an operation flows through optional auth/retry links into a single terminating link that owns fetch" width={880} height={400} className="my-4 w-full h-auto rounded-lg border border-[#26262b]" />

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">One terminating link, zero or more composable ones</h2>
 <p>
 A link is small on purpose. It sees an operation and either passes it along or ends the chain
 by producing a result:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`export function httpLink(options: HttpLinkOptions): TerminatingLink {
 const url = normalizeUrl(options.url);
 return {
 async request(operation: Operation): Promise<OperationResult> {
 const response = await fetch(url, {
 method: 'POST',
 headers: CONTENT_TYPE,
 body: JSON.stringify(operation),
 });
 return readJson<OperationResult>(response);
 },
 };
}`}</pre>
 <p>
 The client enforces two rules: you must supply links, and <strong>exactly one may terminate</strong>.
 Everything else is composition territory, auth injection, retry with backoff, logging,
 request splitting. None of those belong in pyRPC core; now none of them have to be.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">URL normalization lives at the terminator</h2>
 <p>
 One detail that quietly removed a class of support issues: <code>normalizeUrl</code> accepts{' '}
 <code>&quot;http://localhost:8000&quot;</code>, <code>&quot;http://localhost:8000/&quot;</code>,
 or even a URL already ending in <code>/rpc</code>, and always produces the correct endpoint:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`function normalizeUrl(url: string): string {
 const clean = url.replace(/\\/+$/, '');
 return clean.replace(/\\/rpc$/i, '') + '/rpc';
}`}</pre>
 <p>
 Previously a trailing slash could 404 against some deployments. The rule moved from &ldquo;read
 the docs carefully&rdquo; to &ldquo;cannot be wrong.&rdquo;
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Adapters re-export, so imports stay canonical</h2>
 <p>
 All four framework adapters re-export the terminating links:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`// @pyrpc/react, @pyrpc/next, @pyrpc/vue, @pyrpc/svelte
import { createReactClient, httpBatchLink } from "@pyrpc/react"

const api = createReactClient<Types>({
 links: [httpBatchLink({ url: process.env.API_URL })],
})`}</pre>
 <p>
 Users import everything from their adapter package; <code>@pyrpc/client</code> remains an
 implementation dependency rather than something every tutorial has to explain. The codegen
 template emits exactly this shape, so scaffolded projects start current.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What we deliberately did not build</h2>
 <p>
 No <code>Link</code> base class, no observable machinery, no middleware context objects. The{' '}
 <code>T</code> in tRPC&rsquo;s design is the insight, not the framework around it: a{' '}
 <code>&#123; request(operation) &#125;</code> object composes, serializes trivially, and can be
 understood in one screenful. When non-terminating links arrive as first-class exports, they will
 slot into the pipeline users already have, no migration required.
 </p>
 </section>
 </article>
 )
}
