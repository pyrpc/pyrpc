import Link from 'next/link'

export default function V0141FastAPIBatchFix() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    pyRPC v0.14.1: Batch requests now work in FastAPI
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 27, 2026</time>
                    <span>&middot;</span>
                    <span>3 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    v0.14.1 is a patch release that fixes batch requests in the FastAPI adapter. If you were using <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">httpBatchLink</code> with a FastAPI backend, your batch requests were being silently rejected before they ever reached pyRPC.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What was broken</h2>
                <p>
                    The FastAPI adapter&apos;s <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">/rpc</code> endpoint annotated its payload as <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">dict[str, Any]</code>. FastAPI uses that annotation for Pydantic validation before your endpoint function runs. When <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">httpBatchLink</code> sends a JSON array of operations, FastAPI sees an array where it expects a dict and returns a 422 error.
                </p>
                <p>
                    The core <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">handle_request</code> function has supported batch requests since v0.13.0. The bug was exclusively in how the FastAPI adapter surfaced the payload.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The fix</h2>
                <p>
                    One line in <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">pyrpc_fastapi/__init__.py</code>:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`# Before (broken for batch):
async def rpc_endpoint(payload: dict[str, Any]):

# After:
async def rpc_endpoint(payload: dict[str, Any] | list[dict[str, Any]]):`}</code></pre>
                <p>
                    FastAPI now accepts both single operations (dict) and batch operations (list of dicts), matching what <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">handle_request</code> actually accepts.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why other adapters were fine</h2>
                <p>
                    Flask, Django, and the ASGI adapter all use raw JSON parsing (<code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">request.get_json()</code>, <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">json.loads(body)</code>). They pass whatever the HTTP body contains directly to <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">handle_request</code> without framework-level type validation. Only FastAPI adds its own validation gate via type annotations.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Upgrade</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`uv add pyrpc-fastapi@0.14.1`}</code></pre>
                <p>
                    No breaking changes. If you were working around this by using <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">httpLink</code> instead of <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">httpBatchLink</code>, you can switch back to batching now.
                </p>
            </section>
        </article>
    )
}
