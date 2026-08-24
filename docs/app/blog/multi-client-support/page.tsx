import Link from 'next/link'

export default function MultiClientSupportPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 Multi-client support: one Python server, many frontends
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 11, 2026 at 7:00am</time>
 <span>&middot;</span>
 <span>9 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 Up to v0.10.x, <code>pyrpc.json</code> pointed at exactly one output path.
 One Python server, one frontend, one <code>__pyrpc.d.ts</code>. That was fine
 for the tutorial shape of things, but it broke down the moment a real project
 grew a second consumer, a marketing site, an admin panel, a dashboard
 built by a different team.
 </p>
 <p>
 v0.11.0 makes the client a <strong>plural</strong> concept. <code>pyrpc.json</code> now
 stores one or more <em>client project roots</em>, and every command in the CLI
, <code>dev</code>, <code>watch</code>, <code>codegen</code>, and the watcher&rsquo;s
 regen callback, regenerates types for all of them.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 One config field, two shapes
 </h2>
 <p>
 The config can hold a single client or a list. The two shapes are interchangeable,
 and the CLI normalizes them through one function so the rest of the code never has
 to care which one you wrote:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _get_clients(cfg: dict) -> list[str]:
 """Normalizes the configuration to a list of client paths."""
 if "clients" in cfg:
 return cfg["clients"]
 elif "client" in cfg and cfg["client"]:
 return [cfg["client"]]
 return []`}</pre>
 <p>
 A single-frontend project keeps the simple shape:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`{
 "module": "server",
 "framework": "FastAPI",
 "client": "./frontend"
}`}</pre>
 <p>
 A multi-frontend project uses the list form:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`{
 "module": "server",
 "framework": "Mixed",
 "clients": ["./frontend", "./admin"]
}`}</pre>
 <p>
 Note the <code>framework</code> field becomes <code>"Mixed"</code> when the wizard
 configures several clients at once, the value is informational, a record of
 what was detected at setup time, not a decision the CLI enforces later.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 The regen loop became a loop
 </h2>
 <p>
 Previously the CLI had one hard-coded output path threaded through every call site.
 v0.11.0 replaces that with <code>_regenerate_clients</code>: a single loop that owns
 the per-client work of running codegen <em>and</em> configuring each client&rsquo;s
 tsconfig:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _regenerate_clients(module: str, client_dirs: list[str], *, reload: bool = False) -> int:
 """Generate types for every configured client and configure each tsconfig."""
 from pyrpc_core.tsconfig import configure_tsconfig
 n = 0
 for client_dir in client_dirs:
 output_path = os.path.abspath(os.path.join(client_dir, "__pyrpc.d.ts"))
 n = _run_codegen(module, output_path, reload=reload)
 try:
 configure_tsconfig(client_dir)
 except Exception as e:
 console.print(f"[yellow]⚠ Could not configure tsconfig in {client_dir}: {e}[/yellow]")
 return n`}</pre>
 <p>
 Three details here matter. First, the output path is derived from the client root,
 never stored, there is exactly one place that knows the convention
 (<code>&lt;client&gt;/__pyrpc.d.ts</code>). Second, codegen and tsconfig configuration
 travel together, because a client without its <code>@pyrpc/types</code> alias is a client
 that still resolves the published package instead of your generated file. Third, a
 tsconfig failure is a warning, not a crash: a broken <code>tsconfig.json</code> on one
 client should not stop types being generated for the others.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Every caller went through the same door
 </h2>
 <p>
 Three different entry points needed to do the same thing, generate types for all
 clients on startup or change, and they all now call <code>_regenerate_clients</code>:
 </p>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>dev</strong>, after importing the module on startup, and again whenever the debounced regen callback fires on a <code>.py</code> change.</li>
 <li><strong>watch</strong>, once at startup, then through the same regen callback for the lifetime of the process.</li>
 <li><strong>the regen callback</strong>, <code>_do_regen</code>, shared by both of the above.</li>
 </ul>
 <p>
 The startup messages differ slightly by count, <code>types generated (2 procs) &rarr;
 ./frontend</code> for one client versus <code>types generated (2 procs) for 2 clients</code>
 for several, but the work is identical, so behavior can&rsquo;t drift between commands.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Live re-wiring when config changes
 </h2>
 <p>
 Because clients are now a list, the <code>pyrpc.json</code> watcher compares lists rather
 than a single path. When you edit the config to add a third frontend while <code>dev</code>
 is running, the watcher detects <code>new_client_dirs != client_dirs</code>, re-wires the
 regen callback with the new list, and regenerates immediately:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`new_module = new_cfg.get("module", module)
new_client_dirs = _get_clients(new_cfg)

module_changed = new_module != module
output_changed = new_client_dirs != client_dirs

if not module_changed and not output_changed:
 continue

console.print(" [blue]pyrpc.json changed, reloading...[/blue]")

if output_changed:
 client_dirs = new_client_dirs
 console.print(f" [dim]clients → {client_dirs}[/dim]")`}</pre>
 <p>
 No restart required to pick up a new client. The same mechanism already handled module
 changes by restarting uvicorn when pyRPC owns the server; the list form simply extends
 that to arbitrarily many frontends.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 What this unlocks
 </h2>
 <p>
 Multi-client support is the difference between a framework that fits the example repo
 and one that fits a real codebase:
 </p>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>Separate teams, one API</strong>, a backend team ships the same typed contract to a web app and an admin tool without maintaining two configs or two servers.</li>
 <li><strong>Monorepo symmetry</strong>, every frontend in <code>packages/*</code> or <code>apps/*</code> gets its own committed <code>__pyrpc.d.ts</code>, tracked in git like any other source file.</li>
 <li><strong>Consistent CI</strong>, <code>codegen --client</code> and <code>watch --client</code> normalize to the same path convention, so a CI job can regenerate a single client without touching the others.</li>
 </ul>
 <p>
 The model is deliberately simple: a client root is just a directory, and a generated file
 is just <code>__pyrpc.d.ts</code> inside it. Nothing in the system needs to know what
 framework lives there, that was only ever needed to pick an output path, and the
 path is no longer a choice.
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
