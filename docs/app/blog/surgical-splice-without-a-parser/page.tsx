import Link from 'next/link'

export default function SurgicalSpliceWithoutAParserPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Inserting into a config object without parsing it
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 12:40pm</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Once pyrpc knows where the config object starts and ends, the edit itself is a single string splice. It is the smallest change that does the job: prepend the alias as the first property inside the object's braces.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The splice</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`def _insert_before_close(content, open_idx, close_idx, alias):
    inner = content[open_idx + 1:close_idx]
    sep = "" if inner.strip() == "" else ", "
    return content[:close_idx] + sep + alias + content[close_idx:]`}
                </pre>
                <p>
                    Read carefully: the insertion happens <em>at the close brace</em>. The alias line is inserted just before <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&#125;</code>, after whatever is already inside. If the object is empty, no separator is needed; otherwise a comma-space is added first. Every byte before the close brace is untouched.
                </p>
                <p>
                    Inserting as the last property (rather than the first) is a deliberate choice: it avoids inventing a comma that the first property would need, and it is the least likely position to collide with a trailing comma style. The object may already end with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">plugin: [foo()],</code> and the splice produces <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">plugin: [foo()], resolve: &#123; alias: &#123; ... &#125; &#125;</code>, valid, minimal, and formatting-neutral.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The idempotency guard</h2>
                <p>
                    Regeneration happens constantly, every watched procedure edit re-runs codegen. Running the injection again must not produce a duplicate alias:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`def _already_aliased(content):
    return '"@pyrpc/types"' in content and "__pyrpc.ts" in content`}
                </pre>
                <p>
                    Before touching anything, the whole file is scanned for both the package name and the target filename. If either marker is missing, it is safe to assume no alias exists yet. The guard is deliberately loose, a project that already wired the alias manually in some other shape is left alone rather than double-patched.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Write only when changed</h2>
                <p>
                    The final step compares the candidate content to the original and writes the file only if they differ:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`if injected != content:
    with open(path, "w", encoding="utf-8") as f:
        f.write(injected)`}
                </pre>
                <p>
                    This keeps the config file's mtime stable across no-op regenerations, which matters for the dev watcher: a constant stream of rewritten-but-identical config files would trigger needless reloads and editor churn.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The two injection shapes</h2>
                <p>
                    The same splice machinery serves both frameworks via a small difference in the alias snippet:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`_VITE_ALIAS = 'resolve: { alias: { "@pyrpc/types": "./__pyrpc.ts" } }'
_NEXT_ALIAS = 'turbopack: { resolveAlias: { "@pyrpc/types": "./__pyrpc.ts" } }'`}
                </pre>
                <p>
                    Vite nests under <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">resolve.alias</code>; Turbopack under <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">turbopack.resolveAlias</code>. The object is still closed by the same brace logic, so a nested object literal inside the snippet is not a problem, it is opaque text as far as the tokenizer is concerned.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The takeaway</h2>
                <p>
                    Editing config files is a precision task. The winning approach here is minimalism: locate one object boundary with a tokenizer, splice one line at the close brace, guard for idempotency, and write only on change. Every decision (from inserting last to skipping unchanged writes) is in service of one goal: a config edit that is correct the hundredth time it runs, not just the first.
                </p>
            </section>
        </article>
    )
}
