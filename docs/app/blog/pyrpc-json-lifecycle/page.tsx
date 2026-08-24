import Link from 'next/link'

export default function PyrpcJsonLifecyclePost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 The life of pyrpc.json: from wizard to watcher to CI
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 11, 2026 at 5:00pm</time>
 <span>&middot;</span>
 <span>9 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 Everything pyRPC needs to know about your project, which module to scan, which
 frontends to feed, lives in one small JSON file. Tracing that file through the system is
 the fastest way to understand the whole CLI, because every command either reads it, writes it,
 or watches it.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Born in the wizard
 </h2>
 <p>
 The file is created on the first run of <code>pyrpc dev</code>, when no config exists. The
 wizard produces a dict and it is written with a stable shape:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _write_config(config: dict, path: Path | None = None) -> Path:
 if path is None:
 path = Path.cwd() / CONFIG_FILE
 with open(path, "w") as f:
 json.dump(config, f, indent=2)
 f.write("\\n")
 return path`}</pre>
 <p>
 Two details: <code>indent=2</code> for human-readable diffs, and an explicit trailing newline
, details that keep the file pleasant in pull requests. The result looks like:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`{
 "module": "server",
 "framework": "FastAPI",
 "clients": ["./frontend", "./admin"]
}`}</pre>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Found from anywhere
 </h2>
 <p>
 You will usually run <code>pyrpc</code> from the project root, but not always. The lookup
 walks up the directory tree until it finds a <code>pyrpc.json</code>:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _find_config() -> Path | None:
 """Walk up from cwd to find pyrpc.json."""
 p = Path.cwd()
 for parent in [p] + list(p.parents):
 candidate = parent / CONFIG_FILE
 if candidate.is_file():
 return candidate
 return None`}</pre>
 <p>
 That means <code>pyrpc dev</code> from <code>app/</code> behaves identically to running it from
 the repo root, as long as a config exists somewhere above. The config is a property of the
 project, not of your terminal location.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Read by every command
 </h2>
 <p>
 The read is centralized and tolerant:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _read_config() -> dict | None:
 path = _find_config()
 if not path:
 return None
 try:
 with open(path) as f:
 return json.load(f)
 except Exception:
 return None`}</pre>
 <p>
 A malformed config returns <code>None</code> rather than crashing; callers fall back to the
 wizard or to explicit flags. Consumers:
 </p>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>dev</strong>, reads <code>module</code> and <code>client</code>/<code>clients</code>, imports the module, generates types, starts the server.</li>
 <li><strong>watch</strong>, reads the same fields; the whole command is &ldquo;read config, then do the dev type-loop without a server.&rdquo;</li>
 <li><strong>codegen</strong>, uses <code>--client</code> (or the config&rsquo;s clients when invoked through dev), so a CI regenerate honors the same layout.</li>
 <li><strong>_get_clients</strong>, normalizes <code>client</code> or <code>clients</code> into one list, so downstream code never branches.</li>
 </ul>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Watched while dev is running
 </h2>
 <p>
 The interesting part of the file&rsquo;s life is that it is <em>live</em>. A dedicated watcher
 thread monitors the config&rsquo;s parent directory and reacts to changes while
 <code>dev</code> runs:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`new_module = new_cfg.get("module", module)
new_client_dirs = _get_clients(new_cfg)

module_changed = new_module != module
output_changed = new_client_dirs != client_dirs

if not module_changed and not output_changed:
 continue

console.print(" [blue]pyrpc.json changed, reloading...[/blue]")
# re-wire regen callback, restart uvicorn if module changed and owned, regen now`}</pre>
 <p>
 Add a client, switch modules, and the running session adapts, no Ctrl+C, no restart.
 When the module changes and pyRPC owns the server, uvicorn is restarted with the new module;
 when only clients change, the regen callback is re-pointed and types regenerate immediately.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Why a file, not flags
 </h2>
 <p>
 Config-as-file wins for three reasons:
 </p>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>Repeatability</strong>, the same project behaves the same way across <code>dev</code>, <code>watch</code>, CI, and every teammate&rsquo;s machine.</li>
 <li><strong>Reviewability</strong>, moving a client root is a one-line diff that shows up in a PR, not a secret flag you carry in a Makefile.</li>
 <li><strong>Live behavior</strong>, a file can be watched; a command-line invocation cannot. The watcher turns config edits into running-system changes.</li>
 </ul>
 <p>
 From a wizard prompt to a file being hot-reloaded by a running watcher, <code>pyrpc.json</code>
 is the spine of the CLI. Every feature, multi-client, zero-codegen, non-interactive
 setup, is really a rule about how this file is born, read, and kept in sync.
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
