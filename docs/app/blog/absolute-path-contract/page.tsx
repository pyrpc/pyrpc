import Link from 'next/link'

export default function AbsolutePathContractPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 Why save_typescript_client() refuses relative paths
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>June 6, 2026 at 9:15am</time>
 <span>&middot;</span>
 <span>7 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 One of the smallest changes in the v0.4.0 release was one of the most
 intentional: <code>save_typescript_client()</code> now raises a
 <code>ValueError</code> if you pass a relative path. The function used to
 silently join relative paths with <code>os.getcwd()</code>. That silent
 fallback was the source of a class of bugs that were hard to reproduce,
 harder to debug, and impossible to fully test.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The old behavior</h2>
 <p>
 Here&rsquo;s what the function used to do:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def save_typescript_client(schemas, output_path=DEFAULT_OUTPUT):
 content = generate_typescript_client(schemas)
 if not os.path.isabs(output_path):
 output_path = os.path.join(os.getcwd(), output_path) # silent CWD fallback
 os.makedirs(os.path.dirname(output_path), exist_ok=True)
 with open(output_path, "w", encoding="utf-8") as f:
 f.write(content)`}</pre>
 <p>
 At first glance, this seems helpful. The user passes a relative path, and the
 function resolves it against the current working directory. What could go wrong?
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The bug: CWD is not stable</h2>
 <p>
 The <code>os.getcwd()</code> fallback assumes the caller&rsquo;s CWD is the
 same as pyrpc&rsquo;s CWD. This breaks in any of these scenarios:
 </p>
 <ol className="space-y-2">
 <li>
 <strong>A library calls <code>save_typescript_client</code>.</strong> The
 library&rsquo;s CWD at import time is different from the caller&rsquo;s
 CWD at call time. The relative path resolves to the wrong directory.
 </li>
 <li>
 <strong>The caller changes CWD during execution.</strong> A common pattern
 with <code>os.chdir</code> for temporary directory work. The CWD at write
 time differs from the CWD at planning time.
 </li>
 <li>
 <strong>Multiple threads or processes.</strong> Each thread can have a
 different CWD (on some platforms), or a parent process can change CWD
 before fork. The file ends up in an unpredictable location.
 </li>
 <li>
 <strong>Testing.</strong> Tests that mock <code>os.getcwd</code> or run
 from a temporary directory get different file locations than production.
 The test passes, but the behavior is wrong.
 </li>
 </ol>
 <p>
 The common thread: <strong><code>os.getcwd()</code> is a global variable, not a
 parameter.</strong> A function that depends on a global for its core behavior is
 impure, its output changes based on invisible state. This makes it
 untestable, unpredictable, and inconsistent across call sites.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The new contract</h2>
 <p>
 The fix is to remove the default and reject relative paths:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def save_typescript_client(schemas, output_path):
 if not os.path.isabs(output_path):
 raise ValueError(
 "save_typescript_client requires an absolute path"
 )
 content = generate_typescript_client(schemas)
 os.makedirs(os.path.dirname(output_path), exist_ok=True)
 with open(output_path, "w", encoding="utf-8") as f:
 f.write(content)`}</pre>
 <p>
 Three changes:
 </p>
 <ul className="space-y-2">
 <li><strong>No default value.</strong> <code>output_path</code> is a required argument. The old <code>DEFAULT_OUTPUT</code> constant exists only at the CLI level, not in the API.</li>
 <li><strong>Fail fast.</strong> The check happens before any file I/O. The error message is explicit: &ldquo;requires an absolute path.&rdquo;</li>
 <li><strong>No CWD fallback.</strong> The caller is responsible for resolving paths before calling the function. This forces every call site to think about path resolution explicitly.</li>
 </ul>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The CLI layer handles resolution</h2>
 <p>
 The <code>codegen</code> and <code>dev</code> commands now resolve paths before
 calling <code>save_typescript_client</code>:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# codegen command:
DEFAULT_OUTPUT, save_typescript_client = _lazy_import_codegen()
output = os.path.abspath(DEFAULT_OUTPUT) # ← explicit resolution at CLI level
save_typescript_client(schemas, output)

# dev command - regenerate():
_, save_typescript_client = _lazy_import_codegen()
save_typescript_client(schemas, types_output) # ← types_output is already absolute`}</pre>
 <p>
 In the <code>dev</code> command, <code>types_output</code> is derived from
 <code>client_root</code>, which was resolved against the config file directory
 at startup. It&rsquo;s always absolute by the time it reaches
 <code>save_typescript_client</code>. The resolution pipeline is:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`client_root (from pyrpc.json, possibly relative)
 → _resolve_client_root(client_root, config_dir) → absolute
 → os.path.join(absolute_client_root, "node_modules/@pyrpc/types/src/index.ts")
 → types_output (absolute) → save_typescript_client(...)`}</pre>
 <p>
 Every path in this pipeline is absolute by the time it enters the function.
 There is no point where <code>os.getcwd()</code> is consulted. The config file
 directory is the universe of discourse.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What this means for API consumers</h2>
 <p>
 The <code>save_typescript_client</code> API is part of <code>pyrpc-codegen</code>,
 a separate package that can be installed independently. Users who call it directly
 (e.g., in CI scripts, build tools, or custom workflows) now have an explicit contract:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`from pyrpc_codegen import save_typescript_client
import os

# This works:
save_typescript_client(schemas, "/tmp/types/index.ts")

# This also works (resolved explicitly by caller):
save_typescript_client(schemas, os.path.abspath("generated/types.ts"))

# This fails with a clear error:
save_typescript_client(schemas, "generated/types.ts")
# ValueError: save_typescript_client requires an absolute path`}</pre>
 <p>
 The explicit error is better than a silent wrong-path bug. It tells the caller
 exactly what to fix. The error surfaces at development time, not in production
 when the file doesn&rsquo;t exist where expected.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The pattern: fail fast on global state</h2>
 <p>
 <code>os.getcwd()</code> is not the only global that pyrpc eliminated.
 <code>datetime.now()</code> (for timestamping generated output) was also removed
 in favor of explicit parameters. The pattern is: <strong>a function should not
 depend on mutable global state for its core behavior.</strong> Configuration
 (like the output path) should be passed explicitly. Global state should only
 be used for display, logging, and non-functional concerns.
 </p>
 <p>
 This is a deliberately strict design principle. It makes the API harder to use
 in the simplest cases (you have to type more characters for a relative path),
 but it makes all non-trivial cases correct by construction. The strictness is
 an investment in predictability, and for a tool whose output is a file
 that gets imported by TypeScript, predictability is the entire product.
 </p>
 </section>
 </article>
 )
}
