import Link from 'next/link'

export default function DevConsoleVsShellPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 Dev console vs shell: two tools, one job, and the line between them
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>June 2, 2026 at 11:30am</time>
 <span>&middot;</span>
 <span>8 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 One of the most debated design decisions in pyRPC's CLI was how the
 interactive development console and the shell REPL relate to each other.
 Both let you call RPC procedures interactively. Both provide introspection.
 Both are used during development. So why are they separate tools?
 </p>
 <p>
 The short answer: they serve different connection models. The dev console
 reads from the <em>parent process</em> (in-process Python object access),
 while the shell connects over <em>HTTP</em> to a remote server. They share
 the same user interface (a Rich-based REPL) but have completely different
 plumbing underneath.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The dev console: in-process introspection</h2>
 <p>
 When you run <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev app.main</code>, pyRPC starts a uvicorn server in a
 subprocess and opens a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_DevConsole</code> in the parent process. The
 console gets the procedure registry directly from the parent's
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">default_router</code> via <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">get_registry_schema(default_router)</code>.
 </p>
 <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`# Parent process (pyrpc dev):
# 1. Imports the user's module (registers @rpc procedures on default_router)
# 2. Starts uvicorn in a subprocess
# 3. Opens _DevConsole in the parent process
# 4. Console reads default_router directly (in-process, no network)
> add(1, 2)
3
> greet(name="World")
"Hello World"`}
 </pre>
 <p>
 The key design constraint: the dev console reads from the <em>parent
 process's registry</em>, not from the running uvicorn server over HTTP.
 This means:
 </p>
 <ul className="text-fd-muted-foreground">
 <li><strong>No HTTP call overhead</strong>, calling a procedure through the console is a direct Python function call, not a round-trip through the network stack.</li>
 <li><strong>Works even if the server fails to start</strong>, the registry was populated during the import phase, which happens before the server starts. If uvicorn crashes, the console still works.</li>
 <li><strong>No serialization-deserialization round-trip</strong>, arguments are passed as Python objects, not JSON strings that get parsed again.</li>
 <li><strong>No HTTP stack dependency</strong>, the console does not need to import httpx or any HTTP client.</li>
 </ul>
 <p>
 This also means the dev console does <em>not</em> need a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">call</code>
 command. There is no HTTP endpoint to call, it calls the Python
 function directly. The console is purely a debugging surface for the
 parent process.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The shell: HTTP-based remote debugging</h2>
 <p>
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc shell http://localhost:8000</code> is the opposite: it connects to a
 running pyrpc server over HTTP, fetches the schema from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">GET /rpc</code>,
 and lets you call procedures by POSTing to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">/rpc</code>.
 </p>
 <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`$ pyrpc shell http://localhost:8000
Connected to http://localhost:8000/rpc
Available procedures: 5

[5 procs] >>> add(1, 2)
3
[5 procs] >>> inspect()
┌──────────────────────────────────────────┐
│ Method Params Returns │
├──────────────────────────────────────────┤
│ add a: int, b: int int │
│ greet name: str str │
└──────────────────────────────────────────┘`}
 </pre>
 <p>
 The shell is designed for <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">docker exec</code>-style debugging: the server
 keeps running while you interact with it. You can connect from a different
 machine, from CI, or from a container. The server does not know about the
 shell, and the shell does not need to be on the same machine.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why the dev console does not call HTTP</h2>
 <p>
 There was a real temptation to simplify by having the dev console call
 its own server over HTTP. The flow would be: start uvicorn, wait for it
 to be ready, then issue HTTP calls to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">localhost:PORT/rpc</code>. The
 shell and the console would share one code path.
 </p>
 <p>
 We decided against this for three reasons:
 </p>
 <ol className="text-fd-muted-foreground">
 <li>
 <strong>Boot order race condition.</strong> The console starts before
 the server is ready. If the console waits for the server, it adds
 latency and complexity. Worse, if the server fails to start, the
 console is useless, you have lost your debugging surface because
 the server crashed.
 </li>
 <li>
 <strong>Serialization overhead for every call.</strong> Every console
 command would serialize Python objects to JSON, POST them to localhost,
 have the server deserialize them, call the function, serialize the
 result, and return JSON. For a local debugging tool, this is wasteful.
 Direct Python function calls are instant.
 </li>
 <li>
 <strong>The port problem.</strong> The console would need to know which
 port the uvicorn server is listening on. In <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--types-only</code> mode,
 there is no server at all. The console would need special-case handling
 for the no-server scenario, which defeats the purpose of a unified
 code path.
 </li>
 </ol>
 <p>
 Instead, the dev console reads the registry from the parent process. It is
 simpler, faster, and works even when the server is down. The shell handles
 the remote case. Two tools, one job, different connection models.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The shared UI layer</h2>
 <p>
 Despite different plumbing, both tools share the same user interface.
 The REPL is built on Python's <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">code.InteractiveConsole</code> with Rich
 rendering for tables and output. Both support:
 </p>
 <ul className="text-fd-muted-foreground">
 <li>Positional and keyword argument syntax (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">add(1, 2)</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">greet(name="World")</code>).</li>
 <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ast.literal_eval</code>-based argument parsing for safe evaluation of strings, numbers, booleans, lists, and dicts.</li>
 <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">inspect()</code> command that prints a Rich table of all available procedures.</li>
 <li>Tab completion via <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">readline</code>.</li>
 </ul>
 <p>
 The separation is at the data-fetching layer, not the UI layer. The
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_DevConsole._schemas()</code> method is the single point of divergence:
 </p>
 <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`class _DevConsole:
 def _schemas(self) -> dict:
 # Dev console: read from parent process registry
 return get_registry_schema(default_router)

class _ShellConsole:
 def _schemas(self) -> dict:
 # Shell: fetch from HTTP
 resp = httpx.get(f"{self.base_url}/rpc")
 return resp.json()`}
 </pre>
 <p>
 Both classes return the same dict format. The rest of the REPL logic
 (argument parsing, procedure dispatch, result formatting, error handling)
 is shared. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">hasattr</code> checks in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_cmd_procedures</code> and
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_cmd_inspect</code> handle both object-format (from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">get_registry_schema</code>)
 and dict-format (from HTTP JSON) transparently.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The config story: pyproject.toml, not pyrpc.json</h2>
 <p>
 Another recurring design debate was where to store pyRPC configuration.
 Options included:
 </p>
 <ul className="text-fd-muted-foreground">
 <li><strong>A dedicated <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc.json</code></strong>, clean separation, follows the ESLint/Prettier pattern.</li>
 <li><strong>A <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyproject.toml</code> <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[tool.pyrpc]</code> section</strong>, follows the Black/ruff/FastAPI pattern, no extra files.</li>
 <li><strong>Environment variables only</strong>, minimal, but poor discoverability.</li>
 </ul>
 <p>
 We chose <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[tool.pyrpc]</code> in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyproject.toml</code>. The reasoning:
 </p>
 <ul className="text-fd-muted-foreground">
 <li><strong>No new files.</strong> The project already has a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyproject.toml</code>. Adding a section is less invasive than creating a new file.</li>
 <li><strong>Tool convention.</strong> Python developers expect tool config in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyproject.toml</code>. Black uses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[tool.black]</code>, ruff uses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[tool.ruff]</code>, FastAPI uses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[tool.fastapi]</code>. No one reads READMEs to find config locations anymore, they look in pyproject.toml.</li>
 <li><strong>Amending, not replacing.</strong> We read the existing file, merge our section, write it back. We do not overwrite or reformat the user's existing config.</li>
 </ul>
 <p>
 The config schema is minimal:
 </p>
 <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`[tool.pyrpc]
framework = "fastapi" # "fastapi" | "flask" | "asgi"
entry = "app/main.py:app" # Python module path with optional app instance`}
 </pre>
 <p>
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">framework</code> tells pyrpc which adapter to use (and which to install).
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">entry</code> tells it where to find the user's application for import and
 introspection. On first run, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev</code> prompts for both values,
 writes them, and proceeds. On subsequent runs, it reads from config and
 skips the prompt. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--reconfigure</code> flag re-prompts and overwrites.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Framework detection: ask, do not guess</h2>
 <p>
 On first run, we could attempt to auto-detect the framework by scanning
 the project's dependencies or looking for <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">from fastapi import</code>
 in Python files. We chose not to.
 </p>
 <p>
 Auto-detection is fragile. What if the project has both FastAPI and Flask
 installed? What if the framework is imported in a non-standard way? What
 if the framework is behind a compatibility shim? These edge cases lead to
 wrong guesses, which lead to cryptic errors, which lead to frustrated
 developers who delete the config file and give up.
 </p>
 <p>
 Instead, we ask. The first-run prompt presents three choices:
 </p>
 <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`$ pyrpc dev
We need to know a few things about your project to get started.

? Framework: (fastapi / flask / asgi)
? Entry point (e.g. app/main.py:app):
> app.main:app

Writing [tool.pyrpc] to pyproject.toml...
Installing pyrpc-core[fastapi]...
Starting dev server...`}
 </pre>
 <p>
 The prompt is interactive (using Rich's <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Prompt.ask</code>) with defaults
 and validation. The framework choice determines which adapter to install.
 The entry point determines the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">importlib.import_module</code> path for
 schema extraction.
 </p>
 <p>
 The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--reconfigure</code> flag forces re-prompting even if config exists.
 This is useful when switching from FastAPI to Flask, or when the entry
 point changes during refactoring. The old adapter is left in place with
 a hint to uninstall it manually, we do not auto-uninstall because
 pip might remove a package the user needs elsewhere.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What this enabled</h2>
 <p>
 The combination of in-process dev console, HTTP-based shell, and
 pyproject.toml config gives us a development workflow that is:
 </p>
 <ul className="text-fd-muted-foreground">
 <li><strong>Zero-config on the happy path</strong>, answer three prompts, done.</li>
 <li><strong>Explicit and predictable</strong>, no auto-detection magic, no guessing.</li>
 <li><strong>Framework-agnostic</strong>, the same CLI commands work for FastAPI, Flask, or raw ASGI.</li>
 <li><strong>Config-as-code</strong>, pyproject.toml is checked into version control, so the whole team gets the same setup.</li>
 </ul>
 <p>
 The line between the dev console and the shell is clear. The dev console
 is a local debugging surface for the parent process. The shell is a remote
 debugging tool for running servers. They share a REPL UI but have different
 plumbing. Developers who only use <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev</code> may never need the shell.
 Developers debugging production-like environments may only use the shell.
 Neither tool compromises the other.
 </p>
 <p>
 All 45 tests pass. The repo is at <a href="https://github.com/pyrpc/pyrpc" className="underline hover:text-fd-foreground">github.com/pyrpc/pyrpc</a>.
 </p>
 </section>
 </article>
 )
}
