import Link from 'next/link'

export default function NpxDaemon715xSpeedup() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 715x faster type generation with the npx daemon
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>June 14, 2026 at 3:00am</time>
 <span>&middot;</span>
 <span>8 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 v0.8.0 ships a persistent Node.js daemon for JSON Schema to TypeScript
 conversion that drops regeneration time from ~3.3s to ~4.6ms, 
 a <strong>715x speedup</strong>. Here is how it works, why it matters,
 and what we learned along the way.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 The old way: npx on every keystroke
 </h2>
 <p>
 Every time you saved a file in <code>pyrpc dev</code>, pyRPC needed to
 convert your Python-type-annotated schemas into TypeScript interfaces.
 It did this by writing the schema to a temp file, calling
 <code>npx --package=json-schema-to-typescript json2ts</code>,
 reading the output, and deleting the file. Each call cost ~3.3 seconds:
 </p>

 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`~3.3s per regeneration
 ├── 1.6s watchfiles debounce (detect the file change)
 ├── 0.3s pyrpc debounce (wait for more changes)
 ├── 0.5s Python importlib.reload + schema extraction
 ├── 1.0s npx resolve + node spawn + json2ts parse + emit
 └── 0.1s Jinja2 render + file write`}</pre>

 <p>
 The npx subprocess was the dominant cost. Each spawn had to resolve the
 <code>json-schema-to-typescript</code> package, start a fresh
 Node.js process, parse the schema, and emit TypeScript, then
 throw everything away. No caching, no reuse, no incremental builds.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 The daemon: one process, reused
 </h2>
 <p>
 The fix replaces the per-call subprocess with a single long-lived
 Node.js process that keeps <code>json-schema-to-typescript</code>
 loaded in V8&rsquo;s code cache. Python communicates with it over
 stdin/stdout using a JSON-line protocol:
 </p>

 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`Before (each keystroke):
 Python -> tempfile -> npx resolve -> npm install? -> node spawn -> json2ts -> TS -> delete

After (first call):
 Python -> npm install --prefix to ~/.jsonschema-ts/ -> spawn node daemon -> wait

After (subsequent calls):
 Python -> stdin: {schema, options} -> daemon -> compile() -> stdout: TS
 ~4.6ms`}</pre>

 <p>
 The daemon is a standalone Node.js script that loads
 <code>json-schema-to-typescript</code> via
 <code>createRequire()</code> from a local cache directory.
 It reads JSON lines from stdin, calls <code>compile()</code>
 in-memory (no temp files), and writes JSON responses to stdout.
 </p>

 <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">
 Why not npx --package=... node ...?
 </h3>
 <p>
 The first design tried <code>npx --package=json-schema-to-typescript node daemon.js</code>.
 This does not work on any platform: npx adds packages to <code>PATH</code>,
 not <code>NODE_PATH</code>, so <code>require()</code> cannot find them.
 This is a known, unresolved npx limitation
 (<a href="https://github.com/zkat/npx/pull/180" className="underline">open since 2018</a>).
 The <code>createRequire()</code> API avoids NODE_PATH entirely and
 is the standard Node.js approach for loading modules from arbitrary paths.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Benchmarks
 </h2>
 <p>
 Test schema: <code>{`{type: "object", properties: {name: string, age: number, active: boolean}}`}</code>
 <br />
 Environment: Windows, Python 3.12, Node.js 24, npm 11.
 </p>

 <div className="overflow-x-auto">
 <table className="w-full text-xs">
 <thead>
 <tr className="border-b border-fd-border">
 <th className="text-left py-2 pr-4">Scenario</th>
 <th className="text-right py-2 px-4">Time</th>
 <th className="text-right py-2 pl-4">vs subprocess</th>
 </tr>
 </thead>
 <tbody>
 <tr className="border-b border-fd-border/50">
 <td className="py-2 pr-4">Subprocess (old, avg n=5)</td>
 <td className="text-right py-2 px-4 font-mono">3.299s</td>
 <td className="text-right py-2 pl-4 text-fd-muted-foreground">baseline</td>
 </tr>
 <tr className="border-b border-fd-border/50">
 <td className="py-2 pr-4">Daemon cold start (npm install)</td>
 <td className="text-right py-2 px-4 font-mono">5.910s</td>
 <td className="text-right py-2 pl-4 text-fd-muted-foreground">0.6x (one-time)</td>
 </tr>
 <tr className="border-b border-fd-border/50">
 <td className="py-2 pr-4">Daemon warm (first call after cache)</td>
 <td className="text-right py-2 px-4 font-mono">0.323s</td>
 <td className="text-right py-2 pl-4 text-fd-muted-foreground">10x faster</td>
 </tr>
 <tr className="border-b border-fd-border/50">
 <td className="py-2 pr-4">Daemon hot (avg n=10)</td>
 <td className="text-right py-2 px-4 font-mono">0.0046s</td>
 <td className="text-right py-2 pl-4 text-fd-muted-foreground font-bold">715x faster</td>
 </tr>
 <tr>
 <td className="py-2 pr-4">Daemon hot min</td>
 <td className="text-right py-2 px-4 font-mono">0.0029s</td>
 <td className="text-right py-2 pl-4 text-fd-muted-foreground">2.9ms</td>
 </tr>
 <tr>
 <td className="py-2 pr-4">Daemon hot max</td>
 <td className="text-right py-2 px-4 font-mono">0.0074s</td>
 <td className="text-right py-2 pl-4 text-fd-muted-foreground">7.4ms</td>
 </tr>
 </tbody>
 </table>
 </div>

 <p className="mt-4">
 The one-time cold start cost of 5.9s covers the
 <code>npm install</code> of <code>json-schema-to-typescript</code>
 to <code>~/.jsonschema-ts/</code> plus the initial Node.js spawn.
 Subsequent calls hit an already-hot process with all modules cached
 in V8&rsquo;s code cache.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 What about the watchfiles debounce?
 </h2>
 <p>
 Even with the daemon making conversion near-instant, the old file
 watcher used a default 1.6s debounce interval before pyRPC even
 received the change notification. v0.8.0 reduces this to 200ms,
 cutting ~1.4s off the perceived latency.
 </p>
 <p>
 The total time from save to updated TypeScript is now:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`~0.5s total (down from ~3.3s)
 ├── 0.2s watchfiles debounce
 ├── 0.3s pyrpc debounce + importlib.reload
 ├── 0.005s daemon type conversion
 └── 0.1s Jinja2 render + file write`}</pre>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Edge cases handled
 </h2>
 <ul className="space-y-2">
 <li>
 <strong>Daemon crash</strong>, if the Node.js process dies
 (OOM, uncaught exception), the daemon manager detects the exit,
 spawns a replacement, and retries the conversion. If the fresh
 daemon also fails, pyRPC falls back to the original subprocess path.
 </li>
 <li>
 <strong>No npm available</strong>, if <code>npm</code> is not
 found or the install fails, the daemon is skipped and pyRPC uses
 the subprocess path transparently.
 </li>
 <li>
 <strong>Concurrent regeneration</strong>, Python uses a
 threading lock around stdio communication. The daemon queues
 messages in-process, so even rapid saves are handled sequentially.
 </li>
 <li>
 <strong>Clean shutdown</strong>, Python&rsquo;s
 <code>atexit</code> sends <code>SIGTERM</code> to the daemon
 process. If the daemon does not exit within 5 seconds, it is
 killed. The daemon also exits on stdin close.
 </li>
 </ul>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 How to use it
 </h2>
 <p>
 The daemon is enabled by default in <code>jsonschema-ts</code> v0.3.0
 and <code>pyrpc-codegen</code> v0.8.0. Upgrade:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`pip install --upgrade pyrpc-core`}</pre>
 <p>
 No configuration needed. The daemon starts on the first type generation
 and stays alive for the duration of the Python process.
 </p>
 <p>
 If you need to disable the daemon (e.g., in a CI environment without
 Node.js), pass <code>use_daemon=False</code> to the
 <code>JsonschemaTsOptions</code>:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`from jsonschema_ts import Options, convert_all
opts = Options(use_daemon=False)
result = convert_all(defs, opts=opts)`}</pre>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 What&rsquo;s next
 </h2>
 <p>
 The daemon architecture opens the door for further optimizations:
 schema diffing (skip models that have not changed), incremental
 TypeScript emit, and hot module reloading in the browser via
 WebSocket push. For now, the 715x speedup means type generation is
 no longer the bottleneck in the dev loop, reloading your
 Python module is.
 </p>
 <p>
 Read the full
 <Link href="/changelog" className="text-fd-foreground underline"> changelog</Link>
 for the complete list of changes in v0.8.0.
 </p>
 </section>
 </article>
 )
}
