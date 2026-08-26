import Link from 'next/link'

export default function BatchRequestsInPyrpc() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Batch requests in pyRPC: how they work and when to use them
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 27, 2026</time>
                    <span>&middot;</span>
                    <span>4 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    pyRPC supports batching since v0.13.0. A batch request sends multiple RPC operations in a single HTTP call, reducing network overhead and latency. With v0.14.1, batch requests now work correctly across all adapters including FastAPI.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What a batch request looks like</h2>
                <p>
                    Instead of sending one JSON-RPC object, you send an array of them:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`POST /rpc
Content-Type: application/json

[
  {"id": 1, "method": "add", "params": {"a": 10, "b": 5}},
  {"id": 2, "method": "greet", "params": {"user": {"name": "Alice", "age": 30}}}
]`}</code></pre>
                <p>
                    The server processes each operation and returns an array of responses:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`[
  {"id": 1, "result": 15},
  {"id": 2, "result": "Hello, Alice!"}
]`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Using httpBatchLink</h2>
                <p>
                    On the TypeScript side, swap <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">httpLink</code> for <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">httpBatchLink</code>:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`import { createClient, httpBatchLink } from "@pyrpc/client"
import type { Types } from "@pyrpc/types"

const api = createClient<Types>({
  links: [
    httpBatchLink({
      url: "http://localhost:8000",
    }),
  ],
})

// These two calls are sent as a single HTTP request
const result = await api.add(10, 5)
const message = await api.greet({ name: "Alice", age: 30 })`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How the server handles batches</h2>
                <p>
                    Inside <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">handle_request</code>, a batch is processed sequentially:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`if isinstance(payload, list):
    if len(payload) > MAX_BATCH_SIZE:
        return {"error": "Batch too large"}
    return [_handle_single(op, router) for op in payload]`}</code></pre>
                <p>
                    Each operation goes through the same validation and execution path as a single request. The <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">MAX_BATCH_SIZE</code> limit (100 operations) guards against abuse.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">When to batch</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Page loads that need multiple data sources.</strong> Instead of 5 sequential HTTP calls for user data, posts, comments, notifications, and settings, send one batch.</li>
                    <li><strong>Form submissions with side effects.</strong> A mutation that creates an order and a query that fetches the updated cart can run in the same request.</li>
                    <li><strong>Dashboard initial loads.</strong> Charts, tables, and summary cards often need different procedures — batch them.</li>
                </ul>
                <p>
                    Batching is not always better. If operations depend on each other&apos;s results, sequential single requests are clearer. If you are sending one operation, <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">httpLink</code> is simpler.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Adapter compatibility</h2>
                <p>
                    All four adapters now support batch requests:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>FastAPI</strong> — fixed in v0.14.1 (payload annotation widened)</li>
                    <li><strong>Flask</strong> — always worked (raw JSON parse)</li>
                    <li><strong>Django</strong> — always worked (raw JSON parse)</li>
                    <li><strong>ASGI</strong> — always worked (raw JSON parse)</li>
                </ul>
            </section>
        </article>
    )
}
