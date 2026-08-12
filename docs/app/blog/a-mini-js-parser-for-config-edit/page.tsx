import Link from 'next/link'

export default function AMiniJsParserForConfigEditPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    A mini JS tokenizer for safe config editing
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 12:20pm</time>
                    <span>&middot;</span>
                    <span>10 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    To inject an alias into <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">vite.config.ts</code> or <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">next.config.mjs</code>, pyrpc does not parse the file into an AST and pretty-print it back. That would reformat your carefully indented config and stomp comments. Instead it runs a hand-rolled tokenizer that knows just enough about JS strings and comments to find the right place and splice one line in.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The core primitive: skipping strings and comments</h2>
                <p>
                    Everything builds on one function. Given an index into the source, it asks: <em>am I at the start of a string or comment?</em> If yes, it advances past the whole thing and returns the new index:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`def _skip_strings_and_comments(content, index):
    c = content[index]
    if c in ('"', "'"):
        # walk to the matching close quote, honoring backslash escapes
    if c == "\`":
        # template literal — must also handle nested \${...}
    if c == "/" and next is "/":  # line comment → skip to newline
    if c == "/" and next is "*":  # block comment → skip to */`}
                </pre>
                <p>
                    The deceptively hard part is the backtick branch. A template literal can contain <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&#36;&#123; ... &#125;</code> interpolations, and inside those, more strings. The implementation recurses: when it hits <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&#36;&#123;</code>, it jumps past the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&#123;</code> and calls itself to skip whatever the interpolation contains. That is a mini-parser, and it exists for one reason: a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&#123;</code> inside a string must never be mistaken for an object brace.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Finding the config object</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`def _find_object_after(content, start):
    # advance while skipping strings/comments; return the first '{'`}
                </pre>
                <p>
                    After locating <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">defineConfig(</code> or <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">export default</code>, this finds the first top-level <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&#123;</code> that is not inside a string or comment. For Vite that is the options object passed to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">defineConfig</code>. For Next.js it is the object after <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">export default</code> or after <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">const nextConfig</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Matching braces without an AST</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_match_braces</code> walks from the opening brace, maintaining a depth counter. Strings and comments are skipped via the tokenizer, so a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&#123;</code> or <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&#125;</code> inside a string never disturbs the count. The function returns the index of the matching close brace. This is the entire secret: you do not need a full parser to edit a config if all you do is locate one object boundary by balanced braces.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why not a real parser</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Output preservation.</strong> Parsing and re-printing reformats. A splice preserves every byte you did not touch — your formatting, comments, and weird spacing survive.</li>
                    <li><strong>Dependency surface.</strong> A full JS parser in Python (or a Node subprocess) is heavy for a tool whose core job is RPC type generation.</li>
                    <li><strong>Failure is checkable.</strong> If the mini-parser cannot find a matching structure, it returns <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">None</code>, and the caller surfaces a warning instead of corrupting the file.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The boundary of the approach</h2>
                <p>
                    The tokenizer understands strings, comments, and balanced braces. It does not understand arrow functions, TypeScript generics, or object spread — it does not need to. Its contract is narrower: <em>find the outermost object literal belonging to the config export and report where its braces sit.</em> Staying inside that contract is what keeps the edit safe, and refusing outside it is what keeps it honest.
                </p>
            </section>
        </article>
    )
}
