import Link from 'next/link'

export default function TypeCheckingPyrpcPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Type checking a library whose product is types
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 12:00pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    pyRPC&rsquo;s entire promise is that TypeScript types derived from Python survive the network
                    boundary without drifting. Until last week, nothing verified the Python side of that promise
                    statically: no mypy, no pyright, nothing. The TypeScript packages at least compiled through
                    tsup builds, but no explicit gate failed when types broke. Both gaps are closed now, and both
                    found real problems immediately.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The find: a transport lying about its contract</h2>
                <p>
                    mypy&rsquo;s first run over the five Python packages produced exactly thirteen errors in twenty-one
                    files, and one of them was gold:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`asgi.py:90: Argument 3 to "send_response" has incompatible type
  "dict[str, Any] | list[dict[str, Any]]"; expected "dict[str, Any]"`}</pre>
                <p>
                    v0.13 introduced batched requests: <code>handle_request</code> accepts a list and returns one
                    response per element. The ASGI transport passes the result straight to its serializer, which
                    still declared dict-only. Python does not care (json.dumps is happy either way), so tests
                    passed. But the annotation documented a contract that batching had silently broken. Widened to
                    the union, with the comment trail pointing at the feature that changed it.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Fixing honestly instead of silencing</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Lazy globals.</strong> cli.py declared <code>default_router = None</code> placeholders for deferred imports. Replaced with annotation-only declarations carrying real types; the runtime assignments fill them in.</li>
                    <li><strong>The _cwd stash.</strong> The dev server process carried its working directory as a dynamic attribute (<code>proc._cwd = ...</code>) for config-triggered restarts. mypy rightly refused. Now there is a tiny <code>_ServerProcess(Popen[bytes])</code> subclass with a typed <code>cwd</code>, and the console reads it defensively for externally attached processes.</li>
                    <li><strong>Invariants mypy cannot see.</strong> After the config block in dev(), spec and cfg_path are guaranteed non-None by construction. Two asserts with comments now state that invariant where the type system needs it. Asserts are runtime-checked honesty, not suppression.</li>
                    <li><strong>Untyped third parties</strong> (jsonc_edit, jsonschema_ts, django) get per-module ignore_missing_imports overrides rather than a global blindfold.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The TypeScript side</h2>
                <p>
                    Each of the six npm packages gained a <code>typecheck</code> script running <code>tsc --noEmit</code>,
                    aggregated by a root script and executed in CI after builds. All six passed on day one, which
                    tracks with strict mode already being on; the value is that this stays true automatically.
                    tsup emitting declarations during builds had been quietly serving as a weak proxy for this gate,
                    and proxies erode.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Scope, stated plainly</h2>
                <p>
                    Sources are covered; tests are not yet. That is a deliberate line drawn so the first gate ships
                    fast and meaningful rather than slow and noisy. It is written down in CONTRIBUTING.md as a
                    follow-up, because a scope you do not publish is a scope people assume is infinite.
                </p>

                <p>
                    For a framework whose debugging story begins with the phrase the types are generated from your
                    Python signatures, checking our own types was overdue by exactly one shipped contract drift.
                </p>
            </section>
        </article>
    )
}
