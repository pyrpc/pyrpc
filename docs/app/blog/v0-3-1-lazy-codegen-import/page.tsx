import Link from 'next/link'

export default function V031Post() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 v0.3.1 - Lazy imports, pyrpc_codegen decoupled from CLI
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>June 3, 2026 at 10:30am</time>
 <span>&middot;</span>
 <span>4 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 v0.3.1 is a small patch with one structural change: the <code>pyrpc_codegen</code>
 library is no longer loaded when you run <code>pyrpc version</code>, <code>pyrpc inspect</code>,
 <code>pyrpc serve</code>, <code>pyrpc pull</code>, or <code>pyrpc --help</code>.
 Only <code>pyrpc codegen</code> and <code>pyrpc dev</code> actually need it.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The bug that led here</h2>
 <p>
 After the v0.3.0 merge (pyrpc-cli into pyrpc-core), a user ran <code>pyrpc dev</code> on a fresh install and hit:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`ModuleNotFoundError: No module named 'pyrpc_codegen.main'`}</pre>
 <p>
 The error came from a stale <code>pyrpc.exe</code> shim left behind by the old <code>pyrpc-cli</code>
 package. The shim pointed to a module that no longer existed. The root cause wasn't
 just the stale shim, it was that <strong>every CLI command required <code>pyrpc_codegen</code></strong>.
 Even <code>version</code> and <code>--help</code> imported it at the top of <code>cli.py</code>.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What changed</h2>
 <p>
 We moved the <code>from pyrpc_codegen import ...</code> from a top-level module import
 into a lazy loader, only called inside the commands that actually generate TypeScript:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`Before (top-level in cli.py):
 from pyrpc_codegen import DEFAULT_OUTPUT, save_typescript_client
 # Loaded for EVERY command: version, inspect, serve, pull, help...

After (lazy, per-command):
 def _lazy_import_codegen():
 from pyrpc_codegen import DEFAULT_OUTPUT, save_typescript_client
 return DEFAULT_OUTPUT, save_typescript_client
 # Only loaded inside codegen() and dev()`}</pre>
 <p>
 Now a stale shim only matters if you actually run a codegen command. Commands that
 don't need the codegen library work with a correctly-installed <code>pyrpc-core</code> alone.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">This is capability boundaries, not performance</h2>
 <p>
 The lazy import isn't about shaving milliseconds off startup time. It's about
 <strong>decoupling what the CLI needs from what individual commands need</strong>.
 A quick table of which commands require what:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`Command Needs pyrpc_codegen? Needs pyrpc_core?
─────────────── ─────────────────── ───────────────
version No No
--help No No
inspect No Yes (lazy)
serve No Yes (lazy)
pull No Yes (lazy)
codegen Yes (lazy) Yes (lazy)
dev Yes (lazy) Yes (lazy)`}</pre>
 <p>
 Every command that needs a dependency imports it inside the handler, not at module
 level. This means you can install <code>pyrpc-core</code> partially and still get
 <code>version</code> and <code>--help</code> to work, useful for CI scripts
 and minimal environments.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">A note on backward compatibility</h2>
 <p>
 The initial fix added a forwarding module at the old
 <code>pyrpc_codegen.main</code> path that re-exported from <code>pyrpc_core.cli</code>.
 But this created a circular dependency (pyrpc-core &rarr; pyrpc-codegen &larr; pyrpc_core)
 and we have no users with stale shims yet. We removed it.
 </p>
 <p>
 If you hit the stale shim error, the fix is simple:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{'pip uninstall pyrpc-cli\npip install --upgrade pyrpc-core'}</pre>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Full changelog</h2>
 <ul className="space-y-2">
 <li><strong>CLI:</strong> <code>pyrpc_codegen</code> import moved from top-level to per-command lazy loader. Commands <code>version</code>, <code>inspect</code>, <code>serve</code>, <code>pull</code>, and <code>--help</code> no longer require the codegen library.</li>
 <li><strong>Tests:</strong> Mock targets updated to match lazy import pattern. All 17 tests pass.</li>
 </ul>

 <p className="mt-8">
 See the <Link href="/changelog" className="underline underline-offset-2 hover:text-fd-foreground transition-colors">full changelog</Link> for details.
 </p>
 </section>
 </article>
 )
}
