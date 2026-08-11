import Link from 'next/link'

export default function UvicornReloadDefaultPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    uvicorn --reload by default: how pyrpc dev manages the server
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 8, 2026 at 8:00am</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    When <code>pyrpc dev</code> starts the server, it doesn&rsquo;t wrap uvicorn in a Python
                    API call or a temp file. It spawns uvicorn as a real subprocess with a command line
                    you&rsquo;d recognize &mdash; and by default that command line ends with
                    <code>--reload</code>. This post walks <code>_start_uvicorn</code>, the two independent
                    reload paths, the <code>restart</code> command, and when you&rsquo;d want
                    <code>--no-reload</code> instead.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    The command dev builds
                </h2>
                <p>
                    Everything happens in <code>_start_uvicorn</code>:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _start_uvicorn(mod: str) -> subprocess.Popen:
    """Start uvicorn for module, return the Popen object."""
    app_var = "app"
    cmd = [
        sys.executable, "-m", "uvicorn",
        f"{mod}:{app_var}",
        "--host", host,
        "--port", str(port),
        "--log-level", "error",
    ]
    if reload:
        cmd.append("--reload")
    env = os.environ.copy()
    env.setdefault("PYTHONPATH", cwd)
    proc = subprocess.Popen(cmd, cwd=cwd, env=env)
    proc._cwd = cwd  # stash for restart
    return proc`}</pre>
                <p>
                    Three choices are worth unpacking. First, the app variable is hardcoded to
                    <code>app</code>: uvicorn is asked to run <code>mod:app</code>, the conventional ASGI
                    variable name &mdash; no <code>:other</code> guessing, because <code>_import_module</code>
                    and uvicorn are kept on the same contract. Second, <code>PYTHONPATH</code> is set to the
                    working directory via <code>env.setdefault</code>, the same guarantee
                    <code>_import_module</code> gives when it does <code>sys.path.insert(0, os.getcwd())</code>,
                    so uvicorn can find your entry module regardless of how pyRPC was installed. Third, the
                    process is spawned with <code>cwd=cwd</code> and the working directory is stashed on the
                    <code>Popen</code> object as <code>_cwd</code>, because a later restart needs to reproduce
                    the exact same execution context.
                </p>
                <p>
                    <code>--log-level error</code> keeps the terminal quiet &mdash; the same reason the early
                    release notes cited &ldquo;6 lines of reloader/server spam eliminated.&rdquo; You see the
                    pyRPC status line, not uvicorn&rsquo;s banner.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    Why reload is on by default
                </h2>
                <p>
                    <code>dev</code> declares the reload flag with an explicit
                    <code>--reload/--no-reload</code> pair defaulting to <code>True</code>:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`reload: bool = typer.Option(True, "--reload/--no-reload", help="Uvicorn auto-reload")`}</pre>
                <p>
                    Starting uvicorn with <code>--reload</code> mirrors what you&rsquo;d do running uvicorn
                    directly during development. But there&rsquo;s a subtlety worth understanding: pyRPC has
                    <em>two</em> independent reload paths, and they solve different problems. The debounced
                    regen callback reloads your module in-process via
                    <code>default_router.reload_module</code> purely to rebuild the TypeScript schema &mdash;
                    it updates <code>&lt;client&gt;/__pyrpc.d.ts</code> and never touches the running server.
                    uvicorn <code>--reload</code>, meanwhile, restarts the actual server process when imported
                    Python files change, so a new import, a changed module attribute, or a decorator applied
                    at import time takes effect in the serving process. Neither can replace the other: the
                    schema refresh keeps types fresh without bouncing connections, while the server restart
                    picks up code that only matters at process start.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    Attach or start
                </h2>
                <p>
                    Before starting anything, <code>dev</code> probes the port. <code>_server_is_running</code>
                    does an <code>httpx</code> GET on <code>{'http://{host}:{port}/rpc'}</code> with a 1-second
                    timeout and treats any response below HTTP 500 as a running server. If a server answers,
                    <code>dev</code> skips uvicorn entirely and runs the type watcher only, with
                    <code>server_managed</code> left <code>False</code>. That flag is what gates the
                    interactive console&rsquo;s <code>restart</code> command:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`$ pyrpc dev
  ✓  types generated (3 procs) → ../frontend
  ○  server already running at http://127.0.0.1:8000/rpc — skipping uvicorn
  pyrpc> restart
  ○  server not managed by pyrpc`}</pre>
                <p>
                    When <code>dev</code> does start the server, <code>server_managed</code> is
                    <code>True</code>, and that managed process is terminated on shutdown &mdash; Ctrl+C in
                    the dev console stops the subprocess before exiting.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    The restart path
                </h2>
                <p>
                    <code>_DevConsole._restart</code> is the manual escape hatch:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _restart(self, _=""):
    if not self.server_managed or not self.server_proc:
        console.print("  [yellow]○[/yellow]  server not managed by pyrpc"); return
    console.print("[yellow]Restarting...[/yellow]")
    self.server_proc.terminate(); self.server_proc.wait()
    self.server_proc = subprocess.Popen(
        self.server_proc.args,
        cwd=getattr(self.server_proc, "_cwd", None),
    )
    console.print("[green]Restarted[/green]")`}</pre>
                <p>
                    <code>terminate()</code> sends SIGTERM; <code>wait()</code> ensures the process is
                    actually gone before the port is reused &mdash; otherwise the restart would race
                    uvicorn&rsquo;s socket teardown. Then a new <code>Popen</code> is built from
                    <code>self.server_proc.args</code>. Reusing <code>.args</code> is deliberate: the command
                    line was built once in <code>_start_uvicorn</code>, and replaying it guarantees the
                    restarted server uses the same module, host, port, and <code>--reload</code> flag. The
                    stashed <code>_cwd</code> is re-applied because <code>.args</code> alone wouldn&rsquo;t
                    carry the working directory.
                </p>
                <p>
                    The same terminate-wait-restart sequence runs automatically when the config watcher
                    notices <code>module</code> changed in <code>pyrpc.json</code>: it kills the managed
                    uvicorn and calls <code>_start_uvicorn(new_module)</code> &mdash; but only when
                    <code>server_managed</code> is true. If you attached to a server pyRPC doesn&rsquo;t own,
                    a module change just re-wires the type watcher, leaving the running server alone.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    When to disable reload
                </h2>
                <p>
                    <code>--reload</code> is the right default for a dev loop, but there are legitimate
                    reasons to turn it off:
                </p>
                <ul>
                    <li>You work in a large codebase and uvicorn&rsquo;s reloader &mdash; which stat-polls the files it watches &mdash; adds visible churn, or restarts the server for files it doesn&rsquo;t even import.</li>
                    <li>You already run your own reloader on top (Docker Compose <code>watch</code>, a file-sync tool, a hot-reload framework), and two reloaders double-restart or fight each other.</li>
                    <li>You only edit frontend code and want the server to stay up across saves; the type watcher keeps working either way, and without <code>--reload</code> nothing disturbs the running process.</li>
                </ul>
                <p>
                    <code>pyrpc dev --no-reload</code> leaves the type pipeline untouched: <code>.py</code>
                    saves still regenerate types through the debounced callback; only the server process stops
                    auto-restarting. When it does need to restart, the console&rsquo;s <code>restart</code>
                    command &mdash; or a module change in <code>pyrpc.json</code> &mdash; still works, because
                    that path never depended on <code>--reload</code> in the first place.
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
