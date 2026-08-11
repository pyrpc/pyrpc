import Link from 'next/link'

export default function TsconfigPathInjectionPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Surgical tsconfig edits: injecting @pyrpc/types with jsonc-edit
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 11, 2026 at 9:00am</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Generated types live at <code>&lt;client&gt;/__pyrpc.d.ts</code>, but the client imports
                    them as <code>import type &#123; Types &#125; from "@pyrpc/types"</code>. Something has to
                    make that import resolve to your file instead of the published package &mdash; and in
                    pyRPC that something is a tsconfig <code>paths</code> alias injected automatically:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`"compilerOptions": {
  "paths": {
    "@pyrpc/types": ["./__pyrpc.d.ts"]
  }
}`}</pre>
                <p>
                    Getting that JSON into place without destroying the file is harder than it looks, which
                    is why v0.11.0 ships a purpose-built module, <code>pyrpc_core/tsconfig.py</code>, backed
                    by <code>jsonc-edit</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    Why not just read, parse, write?
                </h2>
                <p>
                    The naive approach &mdash; <code>json.load</code> the tsconfig, mutate the dict, write it
                    back with <code>json.dump</code> &mdash; destroys anything that is not strict JSON. Real
                    <code>tsconfig.json</code> files routinely contain:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Comments</strong> &mdash; <code>// ...</code> and <code>/* ... */</code> are legal JSONC but illegal JSON, and teams use them to explain <code>paths</code> entries and <code>baseUrl</code> decisions.</li>
                    <li><strong>Trailing commas</strong> &mdash; every frontend toolchain happily accepts them; a round-trip through <code>json.dump</code> silently deletes them, producing noisy one-line diffs for unrelated fields.</li>
                </ul>
                <p>
                    Worse, a rewrite would reorder keys, re-indent the whole file, and touch lines the tool had
                    no business touching. Editing a config file is a <em>surgical</em> operation: change exactly
                    the bytes you mean to change, leave the rest untouched.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    The SENTINEL trick
                </h2>
                <p>
                    <code>jsonc-edit</code>&rsquo;s <code>modify()</code> returns a list of edits, each with an
                    <code>offset</code> and <code>length</code> into the original source. To find out whether a
                    path already exists <em>without mutating anything</em>, <code>tsconfig.py</code> asks for a
                    write of a value that could never collide with real config &mdash; the string
                    <code>"SENTINEL"</code> &mdash; and inspects the edit it would make:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _get_existing_value(source: str, path: list) -> str | None:
    edits = modify(source, path, "SENTINEL")
    if len(edits) == 1 and edits[0].content == '"SENTINEL"':
        return source[edits[0].offset : edits[0].offset + edits[0].length]
    return None`}</pre>
                <p>
                    If <code>modify</code> produces exactly one edit whose content is the sentinel, then the
                    path already exists and that edit is a <em>replacement</em> of the existing value &mdash; the
                    span it covers is the current value, verbatim. If the path does not exist, <code>modify</code>
                    returns either a different edit shape (an insertion) or an empty list, and the function
                    returns <code>None</code>. It&rsquo;s a read implemented with a write function &mdash; a neat
                    trick that avoids maintaining a parallel JSONC parser.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    Idempotency and conflict detection
                </h2>
                <p>
                    Once we know the current value, the decision is straightforward. If the alias is already
                    exactly <code>["./__pyrpc.d.ts"]</code>, there is nothing to do &mdash; a rerun is a no-op.
                    Comparison strips whitespace and comments from the existing value so formatting differences
                    don&rsquo;t count as conflicts:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`existing = _get_existing_value(content, ["compilerOptions", "paths", "@pyrpc/types"])
if existing is not None:
    no_comments = re.sub(r"//.*?\\n|/\\*.*?\\*/", "", existing, flags=re.DOTALL)
    clean_val = re.sub(r"\\s+", "", no_comments)
    if clean_val == '["./__pyrpc.d.ts"]':
        return True
    raise RuntimeError(
        f"@pyrpc/types is already configured to point elsewhere in {path}"
    )`}</pre>
                <p>
                    If the alias points somewhere else &mdash; say a developer previously wired
                    <code>"./src/__pyrpc.d.ts"</code> by hand &mdash; pyRPC does <strong>not</strong> silently
                    override it. Silently repointing a developer&rsquo;s explicit configuration would be a lie;
                    instead the CLI raises, and the calling code turns it into a yellow warning naming the file
                    that needs attention. This is the <em>fail fast on ambiguity</em> principle: an explicit
                    user choice always wins over an automatic one.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    Edge cases the tests pin down
                </h2>
                <p>
                    <code>test_tsconfig.py</code> locks in the behavior the module must keep. The highlights:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Missing <code>compilerOptions</code></strong> &mdash; the edit creates the whole branch and preserves an existing comment.</li>
                    <li><strong>Missing <code>paths</code></strong> &mdash; injects the mapping into existing <code>compilerOptions</code> without disturbing <code>strict</code> or <code>include</code>.</li>
                    <li><strong>Existing paths with comments and trailing commas</strong> &mdash; keeps <code>"~/*"</code>, the <code>// some comment</code>, and <code>/* trailing comma above! */</code> all intact.</li>
                    <li><strong>Already-correct alias</strong> &mdash; the file is returned byte-for-byte unchanged (idempotency).</li>
                    <li><strong>Conflicting alias</strong> &mdash; raises <code>RuntimeError</code> instead of overwriting.</li>
                    <li><strong>No <code>tsconfig.json</code></strong> &mdash; returns <code>True</code> and creates nothing; the file may not exist yet.</li>
                </ul>
                <p>
                    That last case matters more than it looks: <code>configure_tsconfig</code> runs on every
                    regeneration and every startup, so it must be safe against every intermediate state a
                    half-configured project can be in.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    Why the tool carries the contract
                </h2>
                <p>
                    The alias is what makes the whole flow work: your frontend imports
                    <code>"@pyrpc/types"</code>, but TypeScript resolves it to <code>./__pyrpc.d.ts</code>, so
                    the published placeholder package is never even consulted. Keeping injection automatic &
mdash; rather than a documented manual step &mdash; means the source-tree types feature is zero-config by
                    construction, and rerunning <code>pyrpc dev</code> or <code>pyrpc watch</code> re-asserts the
                    contract on every project you touch.
                </p>
                <p>
                    Read the full
                    <Link href="/changelog" className="text-fd-foreground underline"> changelog</Link>
                    for the complete list of changes.
                </p>
            </section>
        </article>
    )
}
