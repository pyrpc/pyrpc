import Link from 'next/link'

export default function ZeroCodegenStepPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 The zero-codegen workflow: save, wait 300ms, types are fresh
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 8, 2026 at 3:00pm</time>
 <span>&middot;</span>
 <span>8 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 There is no codegen command in the happy path. You run <code>pyrpc dev</code> (or
 <code>pyrpc watch</code>) once, and from then on every save of a Python file ends with
 fresh TypeScript declarations a few hundred milliseconds later. The whole loop lives in
 <code>cli.py</code>, and it has four stages: pick the directories to watch, batch file
 events, debounce them, and regenerate. This post walks each stage and the constants that
 tune it, <code>_DEBOUNCE_SECONDS = 0.3</code>, the 200ms watchfiles batch, and the
 <code>schedule()</code> &rarr; <code>_do_regen</code> handoff.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Four stages of a save
 </h2>
 <p>
 The pipeline is deliberately small. <code>_find_python_dirs</code> answers
 &ldquo;where do we listen?&rdquo;; watchfiles&rsquo; <code>watch</code> with
 <code>debounce=200</code> and <code>yield_on_timeout=True</code> answers &ldquo;when has a
 save settled?&rdquo;; <code>schedule()</code> owns the 300ms resetting
 <code>threading.Timer</code>; and <code>_do_regen</code> actually regenerates, reloading
 your module so the output reflects the edit. Each stage is a few lines, and none of them
 involve you typing a command.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Which directories get watched
 </h2>
 <p>
 <code>_find_python_dirs(root)</code> returns the project root plus its immediate
 subdirectories, deliberately not a recursive walk:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`_skip = {"node_modules", "__pycache__", ".venv", "venv", "env",
 "dist", "build", ".git", ".next"}

def _find_python_dirs(root: str) -> list[str]:
 _skip = {"node_modules", "__pycache__", ".venv", "venv", "env",
 "dist", "build", ".git", ".next"}
 dirs = [root]
 try:
 for entry in os.scandir(root):
 if entry.is_dir() and entry.name not in _skip and not entry.name.startswith("."):
 dirs.append(entry.path)
 except PermissionError:
 pass
 return dirs`}</pre>
 <p>
 Why not recurse into every nested directory? Two reasons. First, the type pipeline only
 cares about the entry module and the modules it imports, the schema is rebuilt by
 reloading the module, not by scanning files, so watching every nested package
 directory buys nothing. Second, a flat one-level scan with an explicit skip list is cheap
 and predictable: no walking into <code>node_modules</code>, and no accidental watching of
 build output that churns every time types are regenerated. The skip set matches
 <code>_find_frontend_projects</code>, so the same noise directories are excluded everywhere.
 </p>
 <p>
 The <code>PermissionError</code> guard matters in real monorepos: a sibling directory can
 be owned by another user or mounted from a container, and one unwatchable path shouldn&rsquo;t
 take down the whole watcher. The root is always included, so even a
 <code>main.py</code> at the top level is covered.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 watchfiles: batching bursts of changes
 </h2>
 <p>
 With the directory list in hand, a daemon thread feeds it to watchfiles:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _py_watcher():
 for changes in watch(
 *_find_python_dirs(cwd),
 stop_event=stop,
 yield_on_timeout=True,
 debounce=200,
 ):
 if stop.is_set():
 break
 if any(f.endswith(".py") for _, f in changes):
 schedule()`}</pre>
 <p>
 Two parameters deserve attention. <code>debounce=200</code> tells watchfiles to coalesce
 the burst of events a single editor save produces, editors typically create,
 truncate, write, and rename files, generating several events in a few milliseconds. The
 200ms window folds them into one batch. <code>yield_on_timeout=True</code> changes the
 semantics of the generator: when nothing has changed, it yields an empty list periodically
 instead of blocking forever, which is what lets the <code>stop</code> event interrupt the
 loop cleanly on Ctrl+C.
 </p>
 <p>
 The filter is explicit about what counts: <code>any(f.endswith(".py") ...)</code>. A
 <code>.pyc</code> file, a stray JSON write, or the <code>__pyrpc.d.ts</code> file itself
 being rewritten does not trigger regeneration. Only Python source changes do. That last
 one is subtle and important, the client directories often live inside the watched
 tree, and without the <code>.py</code> filter the watcher would loop forever regenerating
 itself.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 The 300ms debounce timer
 </h2>
 <p>
 The watchfiles batch is still not the final debounce. A save has two debounce layers:
 watchfiles&rsquo; 200ms batching, then a <code>threading.Timer</code> of
 <code>_DEBOUNCE_SECONDS = 0.3</code> inside <code>_make_regen_callback</code>. The second
 layer exists because regeneration itself, importing the module, building the schema,
 writing files, should not start until the file has settled. The pattern matches
 webpack&rsquo;s <code>aggregateTimeout</code> and nodemon&rsquo;s <code>--delay</code>:
 regenerate once, after the last change stops.
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`_DEBOUNCE_SECONDS = 0.3

def _make_regen_callback(module: str, client_dirs: list[str]):
 _lock = threading.Lock()
 _timer: list[threading.Timer | None] = [None]
 _timer_lock = threading.Lock()

 def _do_regen():
 if not _lock.acquire(blocking=False):
 return
 try:
 n = _regenerate_clients(module, client_dirs, reload=True)
 console.print(
 f"[dim]{time.strftime('%H:%M:%S')} types regenerated "
 f"({n} procs) for {len(client_dirs)} clients[/dim]"
 )
 except Exception as e:
 console.print(f"[red]Error regenerating types:[/red] {e}")
 finally:
 _lock.release()

 def schedule():
 with _timer_lock:
 if _timer[0] is not None:
 _timer[0].cancel()
 t = threading.Timer(_DEBOUNCE_SECONDS, _do_regen)
 t.daemon = True
 t.start()
 _timer[0] = t

 return _do_regen, schedule`}</pre>
 <p>
 <code>schedule()</code> is resettable: each new event cancels the pending timer and starts
 a fresh one. Save three times in quick succession and the timer keeps restarting, so
 regeneration fires once, 300ms after the last save, not three times. The
 regeneration itself is guarded by a non-blocking lock: if a regen is already running when
 the timer fires, the new call returns immediately rather than stacking a second concurrent
 regen. Types are never generated twice for the same burst, and two overlapping runs can
 never race each other on the output file.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Regeneration that reflects the edit
 </h2>
 <p>
 The timer calls <code>_do_regen</code>, which calls
 <code>_regenerate_clients(module, client_dirs, reload=True)</code>. The
 <code>reload=True</code> flag routes through <code>_run_codegen</code> into
 <code>default_router.reload_module</code>. A plain re-import would return the
 already-cached module and regenerate stale types; <code>reload_module</code> clears the
 router, calls <code>importlib.reload</code> (which re-fires the <code>@rpc</code>
 decorators and re-registers procedures), and, critically, restores the old
 procedure set if the reload fails or the module exports no procedures. A broken edit does
 not wipe your types; you keep the last good set until the next successful save. This
 reload-on-regen behavior shipped in v0.11.1.
 </p>
 <p>
 The same <code>reload=True</code> path is what makes the workflow genuinely
 zero-manual: because the watcher reloads the module in-process, newly added, removed, or
 renamed procedures show up in <code>__pyrpc.d.ts</code> without any step on your side.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 The full timeline
 </h2>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`14:22:30.000 you save app/main.py
14:22:30.002 editor writes the file → watchfiles sees create/write/rename events
14:22:30.202 watchfiles debounce (200ms) folds them into one batch
14:22:30.203 .py filter matches → schedule() starts a 300ms timer
14:22:30.504 (the timer keeps resetting if you save again before it fires)
14:22:30.505 _do_regen → reload_module → schema → __pyrpc.d.ts written
14:22:30.510 "14:22:30 types regenerated (4 procs) for 1 clients"`}</pre>
 <p>
 From save to fresh types is on the order of half a second, and it is entirely automatic.
 The manual <code>codegen</code> command still exists for CI and one-off generation from a
 schema file or URL, but in the development loop you never type it, the watcher
 <em>is</em> the workflow.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Why zero-codegen is the right default
 </h2>
 <p>
 Explicit codegen commands fail in exactly the situation they claim to solve: you forget to
 run them. The generated file silently goes stale, and the first signal is a type error in
 your editor pointing at code you didn&rsquo;t change. Tying generation to the save event
 removes that failure mode entirely. It is the same reasoning that moved webpack and Vite
 from manual build steps to watch mode by default: the thing that must always happen should
 not depend on the developer remembering to do it. The debounce constants
 (<code>_DEBOUNCE_SECONDS = 0.3</code>, the 200ms batch) are the tuning knobs that keep the
 loop fast without wasting work, fresh types within half a second, exactly one
 regeneration per settled save.
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
