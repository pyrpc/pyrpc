import Image from 'next/image'
import Link from 'next/link'

export default function BatchedRpcPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Batched RPC requests, end to end
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 21, 2026 at 9:30am</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    A dashboard that renders five widgets issues five RPC calls. Five HTTP round trips, five
                    connection setups, five chances for one slow request to dominate the waterfall. v0.13.0 ships
                    batching as a transport optimization &mdash; and the phrase is chosen carefully, because the
                    interesting decisions are all about what batching is <strong>not</strong>.
                </p>

                <Image src="/blog/batching-timeline.svg" alt="Timeline diagram: three operations issued in one tick coalesce into a single POST array and resolve independently" width={880} height={420} className="my-4 w-full h-auto rounded-lg border border-[#26262b]" />

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Client: collect the window, flush it</h2>
                <p>
                    <code>httpBatchLink</code> exploits a JavaScript scheduling fact: synchronous code that issues
                    several calls runs inside one event-loop turn. Operations arriving in that window are queued;
                    the first enqueue schedules a <code>setTimeout(0)</code> flush:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`return new Promise<OperationResult>((resolve, reject) => {
  current.pending.push({ operation, resolve, reject });

  if (current.pending.length >= current.maxItems) {
    void flush(current);          // size cap reached
    return;
  }
  if (current.timer === null) {
    current.timer = setTimeout(() => void flush(current), 0);
  }
});`}</pre>
                <p>
                    The result: calls in the same tick share one POST carrying a JSON array; each caller keeps its
                    own promise. A missing slot in the response array rejects <em>that</em> operation with a clear
                    error instead of hanging.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Server: dispatch sequentially, respond in order</h2>
                <p>
                    The interpreter accepts either shape. A dict dispatches exactly as before; a list iterates
                    through the normal single-operation path and collects responses positionally:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`MAX_BATCH_SIZE = 100

if isinstance(payload, list):
    if len(payload) > MAX_BATCH_SIZE:
        return [invalid_request(
            f"Batch too large: {len(payload)} operations (max {MAX_BATCH_SIZE})"
        )]
    return [await handle_single(op, router) for op in payload]`}</pre>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>In order</strong>, so index mapping stays trivial on both sides.</li>
                    <li><strong>Capped at 100</strong>, so an accidental <code>Promise.all</code> over ten thousand rows cannot become one giant request.</li>
                    <li><strong>Per-operation errors</strong>: one failing procedure returns its error object in its slot; siblings are untouched.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What batching deliberately is not</h2>
                <p>
                    The docstring on <code>httpBatchLink</code> spends more words on semantics than mechanics, and
                    that ratio is the design:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Not a transaction.</strong> Nothing rolls back when operation three fails. Batching shares a socket, not a database scope.</li>
                    <li><strong>Not parallel execution.</strong> The server dispatches sequentially. Predictable ordering beats speculative concurrency for state-mutating procedures; if you need isolation or parallelism, issue independent requests.</li>
                    <li><strong>Not a new procedure kind.</strong> No special casing downstream &mdash; auth, validation, and introspection see exactly what they saw before, per operation.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The payoff you actually notice</h2>
                <p>
                    With TanStack Query adapters, a page mounting four queries fires them in one tick &mdash; which
                    now means one request. Latency drops from N&times;RTT toward 1&times;RTT without any API change:
                    no <code>batch()</code> wrapper, no explicit grouping. You write ordinary calls; the transport
                    notices they are neighbors.
                </p>
                <p>
                    That is the test for transport features: invisible when unneeded, automatic when applicable,
                    honest about limits (the size cap exists server-side precisely because client defaults can be
                    wrong). Batching clears all three bars.
                </p>
            </section>
        </article>
    )
}
