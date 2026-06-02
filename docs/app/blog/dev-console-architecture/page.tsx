import Link from 'next/link'

export default function DevConsolePost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Designing the pyRPC developer console
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 2, 2026</time>
                    <span>&middot;</span>
                    <span>14 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    When you run <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev app.main</code>, what should happen? A server starts,
                    files are watched, types are regenerated &mdash; but should there be a prompt?
                    Should you be able to type <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">procedures</code> and see every RPC method registered
                    in your running server? Should <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">inspect add</code> show you the parameter types
                    and docstring without curling an endpoint?
                </p>
                <p>
                    These questions turned into a deeper architectural debate than we expected.
                    This post walks through the three designs we considered, the one we built,
                    and the trade-offs that shaped the final implementation.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The problem</h2>
                <p>
                    Before this change, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev</code> started a uvicorn subprocess, watched
                    files, and regenerated TypeScript types &mdash; all silently. There was no
                    way to see what procedures were registered, inspect their signatures, or
                    even confirm the server had picked up the latest changes. The only feedback
                    loop was: edit a file, check the watcher output, then test via curl or the
                    frontend.
                </p>
                <p>
                    The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc shell</code> command existed as a separate network-based REPL &mdash;
                    it connected to a running server over HTTP, fetched the schema, and let you
                    call procedures interactively. But it was a separate process requiring a
                    separate terminal. Developers wanted everything in one session.
                </p>
                <p>
                    We had three design options, each with very different architectures.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Option 1: Separate CLI client</h2>
                <p>
                    The first model is what tools like <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">redis-cli</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">psql</code>, and
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">mongosh</code> use. Two terminals:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`# Terminal 1
pyrpc serve app.main

# Terminal 2
pyrpc shell --url http://localhost:8000`}
                </pre>
                <p>
                    The shell is a separate process that connects over HTTP, downloads the schema,
                    and lets you call procedures remotely. It works against any server &mdash;
                    localhost, staging, or production &mdash; using the same protocol that frontend
                    clients use.
                </p>
                <p>
                    <strong>Strengths:</strong> works everywhere the protocol works, no special
                    server logic, same tool for all environments. This is how most mature
                    infrastructure tools handle interactive access.
                </p>
                <p>
                    <strong>Weaknesses:</strong> requires a server to already be running, first
                    call is slow (schema fetch over HTTP), can&rsquo;t do compile-time validation,
                    and is unusual for RPC frameworks (tRPC, gRPC, ConnectRPC don&rsquo;t ship shells).
                </p>
                <p>
                    We already had this model working (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc shell</code> was built in the
                    CLI overhaul). But it wasn&rsquo;t what developers were asking for. They wanted
                    something that felt like <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">rails console</code> or <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">django-admin shell</code> &mdash;
                    a developer console attached to the running dev server, not a separate network
                    client.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Option 2: Embedded REPL inside the server process</h2>
                <p>
                    The second model is what Python itself uses (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">python</code>),
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">node</code>, and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">irb</code> &mdash; the REPL lives inside the same process as the
                    application. Direct memory access, zero network calls, instant responses.
                </p>
                <p>
                    <strong>Strengths:</strong> registry is already in memory, no serialization,
                    no HTTP overhead, instant startup.
                </p>
                <p>
                    <strong>Weaknesses:</strong> uvicorn blocks the main thread &mdash; you
                    can&rsquo;t run <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">input()</code> after <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">uvicorn.run()</code>. Server logs and
                    REPL prompts fight over stdout &mdash; imagine <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kubectl logs</code> showing
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[pyrpc] &gt;</code> prompts interleaved with request logs. Cannot connect remotely.
                    Harder to run in Docker (no TTY in background). Doesn&rsquo;t fit cloud deployments.
                </p>
                <p>
                    We rejected this model for one big reason: we don&rsquo;t want production
                    servers to have any concept of a console. The dev server should be a standard
                    uvicorn instance that has no idea a developer is typing commands at it.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Option 3 (chosen): Dev server + interactive console</h2>
                <p>
                    The model we built is a hybrid. The server runs as a subprocess (standard
                    uvicorn, no modifications). The parent process imports the module directly
                    to access the in-memory registry. A file watcher runs in a daemon thread.
                    The main thread runs an interactive console via a simple <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">input()</code> loop.
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`$ pyrpc dev app.main

✓ Dev server for app.main
✓ Endpoint: http://127.0.0.1:8000/rpc
✓ Types: node_modules/@pyrpc/types/src/index.ts
✓ Watching 3 directories for Python changes

pyrpc> procedures
pyrpc> inspect add
pyrpc> generate
pyrpc> exit`}
                </pre>
                <p>
                    <strong>Strengths:</strong> console doesn&rsquo;t compete with server logs
                    (separate stdout), registry access is instant (in-memory, not HTTP), works
                    for local development where developers spend most of their time, doesn&rsquo;t
                    couple production servers to console logic, and clean shutdown via
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">stop_event</code>.
                </p>
                <p>
                    <strong>Weaknesses:</strong> registry can diverge from the server (more on
                    this below), no tab completion yet, can&rsquo;t connect remotely (that&rsquo;s
                    what <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc shell</code> is for).
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Architecture</h2>
                <p>
                    The implementation lives in the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">dev</code> command of <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code>.
                    Three components run concurrently:
                </p>

                <h3 className="text-base font-semibold text-fd-foreground mt-6">1. Server subprocess</h3>
                <p>
                    A standard uvicorn instance started via <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">subprocess.Popen</code> with
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--reload</code>. The parent process generates a temporary Python file that
                    creates <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">PyRPCAsgiApp(default_router)</code> and passes its path to uvicorn.
                    The parent keeps the process handle for <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">terminate()</code> on shutdown and
                    stores the startup args for the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">restart</code> command.
                </p>
                <p>
                    <strong>Why subprocess and not in-process threading?</strong> <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">uvicorn.run()</code>
                    blocks the main thread. Threading uvicorn is possible but the GIL, signal
                    handling, and graceful shutdown become complex. A subprocess gives clean
                    process isolation: kill it, restart it, ignore its stdout.
                </p>

                <h3 className="text-base font-semibold text-fd-foreground mt-6">2. Watcher thread</h3>
                <p>
                    A daemon thread running <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">watchfiles.watch()</code> &mdash; a Rust-backed file
                    watcher using inotify, FSEvents, or ReadDirectoryChangesW under the hood.
                    Passes a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">threading.Event</code> as <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">stop_event</code> so the main thread
                    can signal it to stop on exit. Uses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">yield_on_timeout=True</code> so the
                    loop periodically wakes up to check the stop flag.
                </p>
                <p>
                    On file changes, the watcher calls <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">regenerate()</code> which re-imports the
                    module, refreshes the parent&rsquo;s <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">default_router</code>, and writes updated
                    TypeScript types.
                </p>
                <p>
                    <strong>Why daemon thread?</strong> Daemon threads are automatically killed
                    when the main thread exits. No need to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.join()</code> or cleanly shut down.
                    The thread only does file I/O and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">importlib.reload()</code> &mdash; no
                    resources that need cleanup.
                </p>

                <h3 className="text-base font-semibold text-fd-foreground mt-6">3. Console loop</h3>
                <p>
                    A <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_DevConsole</code> class that runs a simple <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">while True: input()</code>
                    loop in the main thread. Commands are dispatched via a dict &mdash; O(1)
                    lookup, easy to extend. Output is formatted with Rich tables.
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`pyrpc> procedures
┌─────────────────────────────────────────────────────┐
│                 Procedures (3 total)                  │
├─────────┬──────────────────┬─────────┬────────────────┤
│ Name    │ Params           │ Returns │ Doc            │
├─────────┼──────────────────┼─────────┼────────────────┤
│ add     │ a: int, b: int   │ int     │ Add two nums   │
│ greet   │ name: str        │ str     │ Say hello      │
└─────────┴──────────────────┴─────────┴────────────────┘

pyrpc> inspect add
add
  Doc: Add two numbers.
  Returns: int
  Parameters (2):
    a: int
    b: int`}
                </pre>
                <p>
                    The console reads the parent process&rsquo;s <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">default_router</code> directly
                    &mdash; no network calls, no serialization, instant access. This works because
                    the parent process imports the user&rsquo;s module at startup and re-imports
                    it on every file change.
                </p>
                <p>
                    <strong>Why not <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">cmd.Cmd</code> or <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">prompt_toolkit</code>?</strong>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">cmd.Cmd.cmdloop()</code> catches <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">KeyboardInterrupt</code> internally and
                    raises <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">SystemExit</code>, which is awkward with threading.
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">prompt_toolkit</code> would give tab completion and history but adds a dependency.
                    A raw <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">input()</code> loop is zero-dependency and works reliably across platforms.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Threading model</h2>
                <p>
                    The three components run with different thread lifetimes:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`Main Thread                 Watcher (daemon)          Subprocess
─────────────               ────────────────          ──────────
dev() starts
  ├─ import module
  ├─ regenerate()
  ├─ Popen(uvicorn) ───────────────────────────────►  uvicorn runs
  ├─ Thread(watcher) ──────►  watchfiles loop
  │                              ├─ on change
  │                              │  └─ regenerate()
  │                              └─ check stop_event
  ├─ Console.run()
  │  ├─ input() blocks
  │  ├─ user types "exit"
  │  └─ _running = False
  │
  └─ finally:
     ├─ stop_event.set() ────►  thread exits
     ├─ proc.terminate()  ─────────────────────────►  uvicorn killed
     └─ proc.wait()`}
                </pre>
                <p>
                    Key design points:
                </p>
                <ul className="text-fd-muted-foreground">
                    <li><strong>Non-blocking lock:</strong> <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">regenerate()</code> uses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">threading.Lock.acquire(blocking=False)</code> so concurrent calls from the watcher and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">generate</code> command don&rsquo;t race on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">importlib.reload()</code> (which is not thread-safe).</li>
                    <li><strong>Event-driven stop:</strong> <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">threading.Event</code> is passed to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">watchfiles.watch()</code>, which checks it internally in the Rust polling loop. When <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">set()</code> is called from the main thread, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">watch()</code> stops yielding on its next internal check.</li>
                    <li><strong>Daemon thread:</strong> If the main thread crashes, the watcher thread dies automatically. No orphaned threads, no resource leaks.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The reload problem (and how we fixed it)</h2>
                <p>
                    The first version of <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">regenerate()</code> used a double-reload pattern:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`# Old approach — smell
importlib.reload(mod)
default_router._procedures.clear()
importlib.reload(mod)`}
                </pre>
                <p>
                    Why the double reload? <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Router.register()</code> uses dict assignment, so
                    same-named procedures are overwritten. But procedures removed from the source
                    file persist after reload because nothing removes them. The clear() between
                    two reloads drops the stale entries, then the second reload re-registers only
                    the current ones.
                </p>
                <p>
                    This works but it&rsquo;s fragile. If the module has a syntax error, you&rsquo;ve
                    cleared the registry and can&rsquo;t populate it. The user sees zero procedures.
                </p>
                <p>
                    The fix was <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Router.reload_module()</code> &mdash; a new method on the core
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Router</code> class in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code>:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`def reload_module(self, module_path: str) -> bool:
    old = dict(self._procedures)     # snapshot
    self._procedures.clear()          # clear
    try:
        importlib.reload(mod)         # single reload → @rpc fires on clean slate
    except BaseException:
        self._procedures.update(old)  # rollback on failure
        raise
    if not self._procedures:
        self._procedures.update(old)  # restore if nothing registered
        return False
    return True`}
                </pre>
                <p>
                    One reload, atomic swap, automatic rollback on failure. If the module has a
                    syntax error, the old registry is preserved. If the module exports no
                    procedures, the old registry is preserved. The user never sees an empty
                    procedure list unless they explicitly removed everything.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The registry divergence problem</h2>
                <p>
                    The biggest open architectural concern is <strong>registry divergence</strong>.
                    The parent process and the server subprocess each rebuild their registries
                    through completely different mechanisms:
                </p>
                <ul className="text-fd-muted-foreground">
                    <li><strong>Parent:</strong> <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">importlib.reload()</code> in the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">regenerate()</code> call</li>
                    <li><strong>Server:</strong> fresh Python process started by uvicorn <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--reload</code></li>
                </ul>
                <p>
                    If the parent&rsquo;s reload succeeds but the server&rsquo;s import fails (or
                    vice versa), the two registries diverge. The console&rsquo;s <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">procedures</code>
                    command could show procedures that the HTTP server doesn&rsquo;t actually serve.
                </p>
                <p>
                    We don&rsquo;t eliminate this risk in the current implementation, but we
                    mitigate it in two ways:
                </p>
                <ol className="text-fd-muted-foreground">
                    <li>The parent and server import the exact same module file. If the file compiles, both reloads should succeed. If it doesn&rsquo;t compile, both reloads should fail.</li>
                    <li>The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">reload_module()</code> rollback means a failed parent reload preserves the old registry, which is still consistent with whatever the server is serving.</li>
                </ol>
                <p>
                    A future improvement could verify the registries match after regeneration by
                    calling the server&rsquo;s <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">GET /rpc</code> endpoint and comparing the result
                    against the parent&rsquo;s <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">default_router</code>. A mismatch would print a
                    warning. We may add this once the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">call</code> command (in-console RPC execution)
                    lands, since that command already needs the HTTP client.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Commands reference</h2>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`Command         Description
─────────────────────────────────────────────────────
help            Show available commands and usage
procedures      List all registered RPC procedures
procs           Alias for procedures
inspect <name>  Show details for a specific procedure
generate        Manually trigger type regeneration
types           Show path to generated TypeScript types
restart         Kill and restart the dev server
exit / quit     Stop the dev server and console`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Known limitations</h2>
                <ul className="text-fd-muted-foreground">
                    <li><strong>No tab completion.</strong> The console uses raw <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">input()</code> &mdash; no autocomplete for procedure names or argument hints. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">prompt_toolkit</code> would solve this but adds a dependency we haven&rsquo;t committed to yet.</li>
                    <li><strong>Redundant watch loops.</strong> Both the watcher thread and uvicorn&rsquo;s <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--reload</code> watch for file changes. A future optimization could unify them: the watcher signals uvicorn to restart instead of relying on a second watch loop.</li>
                    <li><strong><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">restart</code> is no-op in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--types-only</code> mode.</strong> If the server wasn&rsquo;t started, there&rsquo;s nothing to restart.</li>
                    <li><strong>No cross-platform stdin handling.</strong> <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">input()</code> with Rich ANSI codes works on Windows Terminal and VS Code terminal but may have issues with PowerShell ISE or old <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">cmd.exe</code>.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What&rsquo;s next</h2>
                <p>
                    The immediate roadmap:
                </p>
                <ol className="text-fd-muted-foreground">
                    <li><strong>In-console RPC calls.</strong> Type <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">call add(1, 2)</code> and get the result displayed in the console. Uses HTTP to the running server.</li>
                    <li><strong>Tab completion.</strong> <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">prompt_toolkit</code> integration for procedure names, argument hints, and command history.</li>
                    <li><strong>Registry verification.</strong> Compare parent and server registries after reload and warn on mismatch.</li>
                    <li><strong>Unified watch loop.</strong> One watcher that triggers both type regeneration and server restart, eliminating the redundant <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--reload</code> dependency.</li>
                </ol>
                <p>
                    The full implementation is on the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">feat/dev-console</code> branch.
                    All 45 Python tests pass.
                </p>
            </section>
        </article>
    )
}
