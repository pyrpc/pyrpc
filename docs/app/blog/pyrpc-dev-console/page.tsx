import Link from 'next/link'

export default function PyrpcDevConsolePost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The dev console: a control panel, not a shell
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 11, 2026 at 4:00pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    When <code>pyrpc dev</code> starts a server, you get more than a log stream. The terminal
                    also hosts a small interactive console &mdash; a handful of commands for inspecting and
                    steering the dev loop while it runs. It is deliberately not a Python REPL: it is a control
                    panel for the tool itself.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    The command surface
                </h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`Commands:
  help              Show this help
  procedures        List all registered RPC procedures
  inspect <name>    Show details for a single procedure
  generate          Force a type regeneration
  restart           Restart the dev server
  exit              Stop the dev server and exit`}</pre>
                <p>
                    Six commands. That is the whole interface. Anything beyond these &mdash; mutating the
                    registry, editing config, calling procedures &mdash; is out of scope, because the console
                    exists to answer three questions, not to be a terminal.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    Question one: what is registered?
                </h2>
                <p>
                    <code>procedures</code> and <code>inspect</code> read the same schema that drives type
                    generation, through the module&rsquo;s <code>get_registry_schema</code>:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _get_procedures(module: str) -> list[dict]:
    import importlib
    importlib.import_module(module)
    from pyrpc_core import default_router
    schema = default_router.get_registry_schema()
    return schema["procedures"]`}</pre>
                <p>
                    The list shows name, kind (query/mutation), and a summary; <code>inspect</code> adds params,
                    return type, and docstring for one procedure. Because both console and codegen read from
                    <code>default_router</code>, what the console reports and what <code>__pyrpc.d.ts</code>
                    contains can never disagree &mdash; they are two views of the same data.
                </p>
                <p>
                    The import is inside the function, not at module level &mdash; the same discipline that
                    fixed the <code>time</code> import bug. It also means each invocation re-imports the module,
                    so <code>procedures</code> reflects freshly edited code, not a stale snapshot.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    Question two: are my types fresh?
                </h2>
                <p>
                    <code>generate</code> triggers the same regeneration the watcher runs, sharing the same
                    lock and debounce:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def cmd_generate(args):
    _do_regen()`}</pre>
                <p>
                    One line &mdash; because the debounced, locked, idempotent regen already exists; the console
                    command is just another caller. There is no separate codegen path for the console to drift
                    from the watcher&rsquo;s.
                </p>
                <p>
                    A missing piece to note: the console prints the generated file&rsquo;s location as part of
                    <code>dev</code> startup, and regeneration output (including the timestamped
                    <code>regen ✓</code> line) streams into the same view. So &ldquo;are types fresh?&rdquo; is
                    answerable by glancing at the log even without the console.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    Question three: is the server healthy?
                </h2>
                <p>
                    <code>restart</code> stops and starts the managed uvicorn process. It only applies when
                    pyRPC owns the server; when <code>dev</code> attached to an already-running one, the command
                    explains itself:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`restart: server not managed by pyrpc (external server detected)`}</pre>
                <p>
                    The ownership distinction from the probe (see our post on server detection) carries through
                    to the console: pyRPC restarts what it started, and leaves alone what it found.
                </p>
                <p>
                    <code>exit</code> stops the dev loop cleanly, terminating the server if owned and letting the
                    watcher threads shut down via the stop event.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    Why not a REPL?
                </h2>
                <p>
                    A REPL invites you to hold state, poke at internals, and run arbitrary code against a live
                    server &mdash; a surface that would need safety rails, a security story, and constant
                    maintenance. The console does not go there. It exposes the few operations that are <em>part
                    of the dev loop</em> and nothing else. That restraint is the design: small enough to trust,
                    honest enough to be useful.
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
