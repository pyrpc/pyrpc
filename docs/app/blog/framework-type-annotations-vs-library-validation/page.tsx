import Link from 'next/link'

export default function FrameworkTypeAnnotationsVsLibraryValidation() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    When your framework validates before your library does
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 27, 2026</time>
                    <span>&middot;</span>
                    <span>5 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The FastAPI batch bug in pyRPC v0.14.0 is a case study in what happens when a framework&apos;s request validation sits upstream of a library&apos;s own validation. The two layers are solving different problems, but the first one can block the second.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Two layers of validation</h2>
                <p>
                    In the FastAPI adapter, every request passes through two validation stages:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>FastAPI validates first.</strong> The type annotation on the endpoint function tells FastAPI what the request body should look like. <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">payload: dict[str, Any]</code> means &quot;this must be a JSON object.&quot; If it is not, FastAPI returns a 422 error before your code runs.</li>
                    <li><strong>pyRPC validates second.</strong> <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">handle_request</code> parses the payload into an <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">RpcRequest</code> model, checks that the method exists, validates parameters against Pydantic TypeAdapters, and executes the procedure.</li>
                </ul>
                <p>
                    For single requests, this is harmless redundancy. FastAPI loosely checks &quot;is it a dict?&quot; then pyRPC does the real work. For batch requests, it is a hard block: FastAPI rejects the array before pyRPC ever sees it.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this pattern exists</h2>
                <p>
                    FastAPI&apos;s type annotation system is one of its core features. You annotate a parameter, FastAPI parses and validates the incoming request against it, and you get automatic OpenAPI docs. This is idiomatic FastAPI — fighting it would be worse than working with it.
                </p>
                <p>
                    The problem is not that FastAPI validates. The problem is that the adapter declared a type that was too narrow for what the underlying library actually accepts.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How other frameworks handle this</h2>
                <p>
                    Flask and Django do not have framework-level request body type validation. They hand you the raw body and you parse it yourself:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`# Flask — no annotation, no gate
payload = request.get_json(force=True)
response = anyio.run(handle_request, payload, resolved)

# Django — raw parse, no framework validation
body = await request.body
payload = json.loads(body)
response = await handle_request(payload, router=resolved)`}</code></pre>
                <p>
                    These adapters never block batch requests because they never ask the framework to validate the shape of the payload. pyRPC&apos;s own <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">handle_request</code> is the single validation boundary.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The lesson</h2>
                <p>
                    When wrapping a library in a framework adapter, the adapter&apos;s type annotations should match the library&apos;s actual contract — not be a guess at what it might accept. A one-line annotation change from <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">dict[str, Any]</code> to <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">dict[str, Any] | list[dict[str, Any]]</code> fixed the batch bug while keeping FastAPI&apos;s docs and autocomplete accurate.
                </p>
                <p>
                    The alternative — <code className="text-fd-muted-foreground bg-fd-muted/50 px-1.5 py-0.5 rounded text-xs">payload: Any</code> — would also work, but it throws away the OpenAPI documentation benefit that makes FastAPI adapters worth having in the first place.
                </p>
            </section>
        </article>
    )
}
