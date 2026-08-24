import Link from 'next/link'

export default function PyrpcWatchCommandPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 pyrpc watch: type generation without the server
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 8, 2026 at 2:00pm</time>
 <span>&middot;</span>
 <span>7 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 The <code>watch</code> command is the type-watcher half of
 <code>pyrpc dev</code> with the server management removed. It reads your
 <code>pyrpc.json</code>, generates types once for every configured client, then watches
 your Python files and regenerates them on every save. No uvicorn, no port probing, no
 interactive console, just types, kept fresh in the background. If you prefer to own
 your server process, this is the command you run in terminal two.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Two commands, one regeneration pipeline
 </h2>
 <p>
 <code>pyrpc dev</code> and <code>pyrpc watch</code> are two front doors to the same
 machinery. The docstrings in <code>cli.py</code> say it plainly: <code>dev</code> is
 &ldquo;Start the dev server and keep TypeScript types in sync,&rdquo; while
 <code>watch</code> is &ldquo;Watch for Python changes and regenerate TypeScript types. No
 server started.&rdquo; The difference is what each command adds around the type pipeline.
 </p>
 <p>
 Both commands build their regen machinery from the same primitives.
 <code>_find_python_dirs</code> decides which directories to watch.
 <code>_make_regen_callback</code> returns the debounced regen pair, 
 <code>_do_regen</code> and <code>schedule</code>, that turn file events into fresh
 types. <code>_regenerate_clients</code> does the actual work of writing
 <code>&lt;client&gt;/__pyrpc.d.ts</code> for every client and configuring each
 <code>tsconfig.json</code>. <code>dev</code> adds uvicorn management, server detection, a
 <code>pyrpc.json</code> watcher, and the interactive <code>_DevConsole</code>;
 <code>watch</code> adds none of those. That contrast is the whole point of the command.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Reading pyrpc.json and applying the --client override
 </h2>
 <p>
 <code>watch</code> takes two inputs: an optional positional <code>module</code> and an
 optional <code>--client</code> flag. Because both are optional, the command leans on the
 config file for everything that isn&rsquo;t passed explicitly:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`@app.command()
def watch(
 module: str = typer.Argument(None, help="Module to watch (reads pyrpc.json if omitted)"),
 client: str = typer.Option(None, "--client", "-c", help="Client project root"),
):
 """Watch for Python changes and regenerate TypeScript types. No server started."""
 cwd = os.getcwd()
 cfg = _read_config() or {}
 module = module or cfg.get("module")

 if client:
 client_dirs = [client]
 else:
 client_dirs = _get_clients(cfg)`}</pre>
 <p>
 The config resolution reuses the same helpers as every other command.
 <code>_find_config()</code> walks up from the current directory looking for
 <code>pyrpc.json</code>, and <code>_read_config()</code> parses it, returning
 <code>None</code> when the file is missing or unparseable, never crashing. The positional
 <code>module</code> falls back to <code>cfg.get("module")</code>. For clients, an explicit
 <code>--client</code> flag wins and becomes a single-element list; otherwise
 <code>_get_clients(cfg)</code> normalizes the config&rsquo;s <code>client</code> (single
 path) or <code>clients</code> (list) fields into one list shape.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Clear errors, not silent defaults
 </h2>
 <p>
 This is where <code>watch</code> is stricter than you might expect. Both
 <code>module</code> and <code>client_dirs</code> must resolve to something, and if either
 is empty the command exits with code 1 rather than guessing:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`if not module:
 console.print("[red]No module specified. Run pyrpc dev first to create pyrpc.json.[/red]")
 raise typer.Exit(1)
if not client_dirs:
 console.print("[red]No clients configured. Specify --client or configure in pyrpc.json.[/red]")
 raise typer.Exit(1)`}</pre>
 <p>
 The temptation is to fall back to something sensible, import <code>main</code>,
 write to the current directory. A silent default is worse than an error: it would generate
 types against the wrong module, or drop a <code>__pyrpc.d.ts</code> into a directory that
 isn&rsquo;t a TypeScript project, and you&rsquo;d only notice when your editor showed stale
 or missing types. Because <code>watch</code> has no server and no interactive console,
 there is no later moment to catch the mistake. Exiting with a clear message at startup is
 the only honest failure mode.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 The initial regeneration
 </h2>
 <p>
 Before it starts watching, <code>watch</code> does a one-shot regeneration.
 <code>_regenerate_clients(module, client_dirs)</code> is called with
 <code>reload=False</code>, which means <code>_import_module</code> performs a fresh import
 of the entry module, re-firing all the <code>@rpc</code> decorators into
 <code>default_router</code>, builds the schema via <code>get_registry_schema</code>,
 and writes one <code>&lt;client&gt;/__pyrpc.d.ts</code> per client. The success line
 adapts to how many clients are configured:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`$ pyrpc watch
 ✓ types generated (3 procs) → ./frontend
 watching... (Ctrl+C to stop)`}</pre>
 <p>
 With several clients it reads &ldquo;<code>types generated (3 procs) for 2 clients</code>
 .&rdquo; This initial run matters: a fresh checkout is fully typed before you touch a file,
 without waiting for the first save.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 The watch loop
 </h2>
 <p>
 From there <code>watch</code> enters the same loop <code>dev</code> uses, minus the
 server. A daemon thread feeds the directories to watchfiles:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`_do, schedule = _make_regen_callback(module, client_dirs)
stop = threading.Event()
def _w():
 for changes in watch(*_find_python_dirs(cwd), stop_event=stop, yield_on_timeout=True, debounce=200):
 if stop.is_set(): break
 if any(f.endswith(".py") for _, f in changes): schedule()
t = threading.Thread(target=_w, daemon=True); t.start()
try: t.join()
except KeyboardInterrupt: stop.set(); console.print("\\n [dim]stopped[/dim]")`}</pre>
 <p>
 Each batch of <code>.py</code> changes calls <code>schedule()</code>, which (re)starts a
 <code>threading.Timer</code> of <code>_DEBOUNCE_SECONDS = 0.3</code>. When the timer fires,
 <code>_do_regen</code> runs
 <code>_regenerate_clients(module, client_dirs, reload=True)</code>. The
 <code>reload=True</code> flag matters: it routes through
 <code>default_router.reload_module</code>, which clears the router, re-imports the module
 so edited procedures register, and restores the previous procedures if the reload fails or
 exports none. Without it, a plain re-import would return the cached module and regenerate
 stale types, the exact bug fixed in v0.11.1.
 </p>
 <p>
 <code>watch</code> has no dev console, no <code>restart</code> command, and no config
 watcher. It is a long-running process that does exactly one thing, and Ctrl+C stops it
 cleanly through the shared <code>stop</code> event. That single-responsibility shape is
 what makes it composable: you can run it next to a manually started uvicorn, a Docker
 container, or a server running on another machine entirely.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 A realistic transcript
 </h2>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# Terminal 1, your server, your flags
$ uvicorn main:app --reload --host 0.0.0.0 --port 8080 --log-level debug

# Terminal 2: types, and nothing else
$ pyrpc watch
 ✓ types generated (3 procs) → ./frontend
 watching... (Ctrl+C to stop)

# you add a procedure to app/main.py and save
14:22:33 types regenerated (4 procs) for 1 clients

# another save a minute later
14:23:41 types regenerated (5 procs) for 1 clients

^C
 stopped`}</pre>
 <p>
 The regeneration lines carry a timestamp prefix, the callback prints
 <code>time.strftime(&rsquo;%H:%M:%S&rsquo;)</code> before the proc count, so you can
 see, at a glance, that types refreshed when your code changed.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 When to reach for watch
 </h2>
 <p>
 Reach for <code>watch</code> whenever <code>pyrpc dev</code>&rsquo;s server management is
 in the way. Three concrete cases: you run uvicorn with custom flags that <code>dev</code>
 doesn&rsquo;t expose; your server runs under Docker Compose or a process manager that
 pyRPC shouldn&rsquo;t own; or you already have a server running and simply want types
, <code>dev</code> would also work there thanks to
 <code>_server_is_running</code> detection, but <code>watch</code> communicates the intent
 more clearly in scripts and Makefiles.
 </p>
 <p>
 <code>dev</code> remains the default because it makes the opinionated choice for you: one
 command, server plus types, zero coordination. <code>watch</code> is the escape hatch for
 everyone whose server lifecycle lives outside pyRPC. See the
 <Link href="/docs/get-started/quickstart" className="text-fd-foreground underline"> quickstart</Link>
 for the full workflow.
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
