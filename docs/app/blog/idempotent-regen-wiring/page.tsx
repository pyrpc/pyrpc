import Link from 'next/link'

export default function IdempotentRegenWiringPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Idempotent re-wiring on every regen
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 2:00pm</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Every time <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev</code> regenerates types (on startup, on each procedure edit, on every watched module reload) it also re-runs the wiring. The tsconfig is reconfigured, and the bundler is reconfigured. Doing this on every regen only works because both operations are written to be idempotent: the hundredth run must leave the files byte-identical to the first.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The per-client loop</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`for client_dir in client_dirs:
    output_path = os.path.abspath(os.path.join(client_dir, "__pyrpc.ts"))
    n = _run_codegen(module, output_path, reload=reload)
    try:
        configure_tsconfig(client_dir)
    except Exception as e:
        console.print(f"[yellow]⚠ Could not configure tsconfig in {client_dir}: {e}[/yellow]")
    try:
        if not configure_bundler(client_dir):
            console.print(
                f"[yellow]⚠ Could not auto-configure bundler in {client_dir}, "
                "add a bundler alias '@pyrpc/types' → './__pyrpc.ts' ..."
            )
    except Exception as e:
        console.print(f"[yellow]⚠ Could not configure bundler in {client_dir}: {e}[/yellow]")`}
                </pre>
                <p>
                    Generation and wiring happen in one loop, per client, in a fixed order: write the file, point the compiler at it, point the bundler at it. The two config steps have independent failure handling, a tsconfig problem and a bundler problem surface as separate warnings so a developer can fix them separately.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Tsconfig: read the current value first</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">configure_tsconfig</code> never blindly writes. It probes the existing value of the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">compilerOptions.paths["@pyrpc/types"]</code> key using a sentinel edit:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`existing = _get_existing_value(content, ["compilerOptions", "paths", "@pyrpc/types"])
if existing is not None:
    clean_val = normalize(existing)   # strip comments + whitespace
    if clean_val == '["./__pyrpc.ts"]':
        return True                    # already correct → no write
    raise RuntimeError(
        "@pyrpc/types is already configured to point elsewhere"
    )`}
                </pre>
                <p>
                    If the alias already matches the expected value, the function returns without writing, preserving the file's mtime and avoiding a churn loop. If the alias points somewhere else (the developer deliberately overrode it), it raises instead of fighting the override.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Reading jsonc without a JSON parser</h2>
                <p>
                    The tsconfig is JSON with comments and trailing commas, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jsonc</code>, not JSON. Rather than parsing it, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_get_existing_value</code> uses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jsonc_edit.modify</code> to ask where the key would sit and reads the raw source at that span. It is a read-through-edit: probe with a sentinel value, intercept the returned span, extract the original text. The write path then uses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">apply_edits</code> for a surgical insertion that preserves comments and formatting.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Idempotency is a system property</h2>
                <p>
                    Three separate guards compose into the guarantee:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Tsconfig: the existing-value probe returns early on match.</li>
                    <li>Bundler: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_already_aliased</code> skips injection when the markers exist.</li>
                    <li>Both: writes happen only when the new content differs from the current file.</li>
                </ul>
                <p>
                    Because every regen passes through all three, the config files converge to a fixed point, and stay there. That is what makes running the wiring on every codegen step safe, which in turn is what makes the dev loop feel magical: you never configure, you only edit Python.
                </p>
            </section>
        </article>
    )
}
