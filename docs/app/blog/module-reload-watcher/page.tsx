import Link from 'next/link'

export default function ModuleReloadWatcherPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Reloading modules in the watcher: import vs reload
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 11, 2026 at 12:00pm</time>
                    <span>&middot;</span>
                    <span>9 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    v0.11.1 fixes a bug that quietly undermined the entire zero-codegen promise. The watcher
                    regenerated types on every save &mdash; but the types were sometimes stale, reflecting the
                    <em>previous</em> version of your procedures. The root cause was a single word:
                    <code>import</code> vs <code>reload</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    The cached-module trap
                </h2>
                <p>
                    Python&rsquo;s <code>importlib.import_module</code> does not re-execute a module that is
                    already in <code>sys.modules</code>. It returns the cached object. For a one-shot CLI like
                    <code>pyrpc codegen</code> that is exactly right &mdash; but the watcher runs inside a
                    long-lived process, and it needs to regenerate against the <em>newest</em> version of the
                    entry module after every edit.
                </p>
                <p>
                    Before the fix, the regen path did:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# wrong: re-importing returns the cached module
_import_module(module)
schemas = get_registry_schema(default_router)`}</pre>
                <p>
                    The first run imported <code>main</code>, its <code>@rpc</code> decorators fired, and
                    <code>default_router</code> filled up. Every save after that re-imported the same cached
                    module: the decorators never re-fired, the router kept its original procedure list, and the
                    regenerated <code>__pyrpc.d.ts</code> never saw your edits. Save, wait 300ms, types
                    regenerate &mdash; identical to the last time.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    reload_module: a transactional swap
                </h2>
                <p>
                    The fix routes the watcher through <code>Router.reload_module</code>, which is designed for
                    exactly this case:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def reload_module(self, module_path: str) -> bool:
    import importlib

    mod = importlib.import_module(module_path)
    with self._lock:
        old = dict(self._procedures)
        self._procedures.clear()

    try:
        importlib.reload(mod)
    except BaseException:
        with self._lock:
            self._procedures.update(old)
        raise

    with self._lock:
        if not self._procedures:
            self._procedures.update(old)
            return False
        return True`}</pre>
                <p>
                    Three properties make it safe for a live process:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Atomic swap</strong> &mdash; old procedures are snapshotted and the router is cleared before <code>importlib.reload</code> re-runs the module, which re-fires every <code>@rpc</code> decorator and repopulates the router.</li>
                    <li><strong>Rollback on failure</strong> &mdash; if the module raises during reload (a syntax error, a missing import, a runtime error at module scope), the old procedures are restored and the exception propagates. A broken save never leaves you with an empty router.</li>
                    <li><strong>Empty-guard</strong> &mdash; if the reloaded module exports no procedures (you deleted the last <code>@rpc</code>, or the module&rsquo;s decorator is bound to a different router), the old set is restored and <code>False</code> is returned.</li>
                </ul>
                <p>
                    Note the decorator-binding caveat in the docstring: this only works when the module&rsquo;s
                    <code>@rpc</code> is the global <code>from pyrpc_core import rpc</code>, which is bound to
                    <code>default_router</code>. A module that constructs its own <code>Router()</code> instance
                    registers into <em>that</em> router, and reloading it leaves <code>default_router</code>
                    empty &mdash; hence the guard.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    The reload flag in _run_codegen
                </h2>
                <p>
                    <code>_run_codegen</code> now takes a <code>reload</code> flag that picks the right import
                    strategy per call site:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _run_codegen(module: str, output_path: str, *, reload: bool = False) -> int:
    _lazy_core()
    from pyrpc_core import default_router, get_registry_schema
    if reload:
        if not default_router.reload_module(module):
            console.print("  [yellow]⚠[/yellow]  no procedures after reload")
            return 0
    else:
        _import_module(module)
    schemas = get_registry_schema(default_router)
    save = _lazy_codegen()
    save(schemas, output_path)
    return len(schemas)`}</pre>
                <p>
                    <code>reload=False</code> &mdash; used by <code>dev</code> and <code>watch</code> at
                    startup, and by one-shot <code>codegen</code> &mdash; does a normal import: the process is
                    fresh, nothing is cached, an import is correct. <code>reload=True</code> &mdash; used by the
                    debounced regen callback after a save &mdash; goes through <code>reload_module</code>, with
                    a friendly warning (and a skip) when the reloaded module yields no procedures.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    Why this was worth a release
                </h2>
                <p>
                    A watcher that regenerates stale types is worse than no watcher: it looks like it works
                    until the day a rename doesn&rsquo;t show up and you start chasing ghosts in a
                    <code>__pyrpc.d.ts</code> that was never updated. The distinction between import and reload
                    is a one-word fix with a big contract &mdash; <em>save, wait 300ms, types reflect exactly
                    what you wrote</em> &mdash; and it restores the core promise of the zero-codegen workflow.
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
