import Link from 'next/link'

export default function CliOverhaulPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 CLI overhaul, model interfaces, and the dev tools we built
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>June 2, 2026 at 9:45am</time>
 <span>&middot;</span>
 <span>12 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 After the last release we took a hard look at the CLI and developer tooling.
 The codegen worked, the client worked, but there were sharp edges everywhere:
 a broken <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">serve</code> command, a confusing split between <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pull</code> and
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">codegen</code>, no model interface generation, and the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client.rpc.add()</code> syntax
 silently returned <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">undefined</code> instead of a helpful error.
 </p>
 <p>
 Over the last week we shipped six improvements that reshape the developer
 experience. This post documents the decisions behind each one.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">1. The .rpc prefix now throws a clear error</h2>
 <p>
 The old <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createClient</code> proxy returned <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">undefined</code> when someone accessed
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client.rpc</code>. This was an intentional decision to prevent the old
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client.rpc.method()</code> pattern (which we removed for a cleaner API). But
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">undefined</code> is a terrible error signal, it produces a confusing
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">TypeError: Cannot read properties of undefined</code> with no indication of
 what went wrong or how to fix it.
 </p>
 <p>
 The fix is a redirecting proxy that catches every property access on
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client.rpc</code> and throws a message that tells you exactly what to do:
 </p>
 <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
 {`Use client.add() instead of client.rpc.add().
The .rpc prefix was removed for a cleaner API.`}
 </pre>
 <p>
 This pattern, a proxy that throws helpful errors instead of silently
 failing, is something we are applying across the client surface area.
 Every breaking change should produce an error message that tells you the
 new way to do it.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">2. Model interfaces via jsonschema-ts</h2>
 <p>
 The biggest gap in the old codegen was Pydantic model support. If you defined
 a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@model</code> class, the generated TypeScript would only output the class name
 (e.g. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">User</code>), no interface definition, no property types, no
 autocompletion on the frontend. The user had to manually maintain the
 TypeScript definitions.
 </p>
 <p>
 We evaluated three approaches:
 </p>
 <ul className="text-fd-muted-foreground">
 <li><strong>Ship a Python reimplementation</strong> of JSON Schema to TypeScript, months of work to handle allOf, anyOf, oneOf, $ref, $defs, enums, tuples, circular refs.</li>
 <li><strong>Inline Jinja2 templates</strong> to walk schema properties, fragile, would need constant updates as JSON Schema evolves.</li>
 <li><strong>Delegate to json-schema-to-typescript</strong> (npm, 3.3k stars, 705 dependents, used by Microsoft/Amazon/Expo/Webpack), mature, tested, handles every edge case.</li>
 </ul>
 <p>
 We chose option three and built <a href="https://github.com/pyrpc/jsonschema-ts" className="underline hover:text-fd-foreground">jsonschema-ts</a>, a thin Python
 orchestration layer that calls <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npx json2ts</code> under the hood. It is
 zero-dependency Python stdlib, the only requirement is Node.js 18+
 with npx available.
 </p>
 <p>
 The API is three functions:
 </p>
 <ul className="text-fd-muted-foreground">
 <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">collect_defs(*schemas)</code>, extracts and merges <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">$defs</code> from Pydantic JSON Schema output.</li>
 <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">convert_all(defs)</code>, converts all definitions to TypeScript interfaces in a single npx call.</li>
 <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">assemble(models, procedures)</code>, combines model and procedure types into the final output file.</li>
 </ul>
 <p>
 The generated output now has two sections:
 </p>
 <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`// ── Models ──────────────────────────────────────
export interface User {
 id: number;
 name: string;
 email: string;
}

// ── Procedures ──────────────────────────────────
export interface Types {
 createUser(user: User): Promise<User>;
}`}
 </pre>
 <p>
 One important design constraint: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jsonschema-ts</code> is a standalone
 package on PyPI. It does not depend on pyrpc-core, pyrpc-codegen, or any
 other pyrpc package. You can use it directly with any Pydantic project:
 </p>
 <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
 pip install jsonschema-ts
 </pre>
 <p>
 This separation means the JSON Schema to TypeScript conversion is useful
 beyond pyrpc. Any Python project with Pydantic models can generate
 TypeScript interfaces without adopting the full pyrpc stack.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">3. Merging pull into codegen</h2>
 <p>
 The old CLI had two separate commands: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc pull app.main</code> extracted
 schemas to a JSON file, and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc codegen pyrpc-schema.json</code> read the
 file and generated TypeScript. The two-step workflow was confusing, 
 developers expected one command to go from Python module to TypeScript types.
 </p>
 <p>
 We merged <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pull</code> into <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">codegen</code>. Now:
 </p>
 <ul className="text-fd-muted-foreground">
 <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc codegen app.main</code>, import a Python module, extract schemas, generate TypeScript. One command end-to-end.</li>
 <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc codegen pyrpc-schema.json</code>, read a schema file, generate TypeScript. Same behavior as before.</li>
 <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc codegen http://localhost:8000</code>, fetch schema from a running server, generate TypeScript. Same behavior as before.</li>
 </ul>
 <p>
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc pull</code> still exists as a standalone command for CI workflows where
 you want to save the intermediate schema file. The internal
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_extract_schema_from_module()</code> function now includes the Pydantic schema data
 (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">schema_</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">return_schema</code>) that was previously dropped during
 serialization, the serialization gap that made model interfaces
 impossible.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">4. Fixing pyrpc serve</h2>
 <p>
 The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc serve</code> command had a subtle bug: it started uvicorn with
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">uvicorn.run("pyrpc:asgi_app")</code>, which tells uvicorn to import the
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc</code> package and use the module-level <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">asgi_app</code> instance. But
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc</code> was not a real pip package, the ASGI app lived in
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc_core.transport.asgi</code>, and the module-level <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">app</code> instance was
 created with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">router=None</code>. Importing the user&rsquo;s module registered
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code> procedures on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">default_router</code>, but the ASGI app never
 received it. Every <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">GET /rpc</code> call would crash with a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">NoneType</code> error
 because <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">self.router</code> was <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">None</code>.
 </p>
 <p>
 The fix is straightforward: import <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">PyRPCAsgiApp</code> directly and create
 the app instance with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">default_router</code>:
 </p>
 <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`from pyrpc_core.transport.asgi import PyRPCAsgiApp
app_instance = PyRPCAsgiApp(default_router)
uvicorn.run(app_instance, host=host, port=port)`}
 </pre>
 <p>
 For <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--reload</code> mode, uvicorn requires a string module path, not an instance.
 We generate a temporary Python file that creates the app with the correct
 router and pass that path to uvicorn.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">5. pyrpc dev: the watcher</h2>
 <p>
 One of the most common development patterns is editing a Python backend
 file and wanting the TypeScript types to update automatically. The
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev app.main</code> command combines a file watcher, a dev server, and
 automatic type regeneration into a single terminal session.
 </p>
 <p>
 Behind the scenes it uses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">watchfiles</code> (a Rust-backed file watcher with
 zero Python dependencies) to monitor project directories for <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.py</code>
 changes. When a change is detected:
 </p>
 <ol className="text-fd-muted-foreground">
 <li>Re-import the user&rsquo;s module (using <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">importlib.reload</code> with registry clearing).</li>
 <li>Re-extract the schema from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">get_registry_schema()</code>.</li>
 <li>Regenerate the TypeScript types in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">node_modules/@pyrpc/types/src/index.ts</code>.</li>
 </ol>
 <p>
 The TypeScript file is written to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">node_modules/@pyrpc/types/src/index.ts</code>,
 which means any bundler (Vite, webpack, Next.js with Turbopack) that watches
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">node_modules</code> will automatically hot-reload the new types. No browser
 refresh needed.
 </p>
 <p>
 The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--types-only</code> flag skips the server startup entirely, which is useful
 when you are running the server separately (in a debugger, inside a Docker
 container, or on a remote machine) and just want the type regeneration.
 </p>
 <p>
 We chose <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">watchfiles</code> over <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">watchdog</code> because it uses the OS-native
 file notification APIs (inotify on Linux, FSEvents on macOS, ReadDirectoryChangesW
 on Windows) through a Rust binding, which means no polling overhead and
 near-instant change detection even on large projects.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-muted-foreground mt-10">6. pyrpc shell: debugging like docker exec</h2>
 <p>
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc shell http://localhost:8000</code> opens an interactive REPL connected to
 a running pyrpc server. It fetches the schema from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">GET /rpc</code> and lets
 you call any procedure as if it were a local function:
 </p>
 <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`$ pyrpc shell http://localhost:8000
Connected to http://localhost:8000/rpc
Available procedures: 5

[5 procs] >>> add(1, 2)
3
[5 procs] >>> greet(name="World")
"Hello World"
[5 procs] >>> inspect()
┌──────────────────────────────────────────┐
│ Method Params Returns │
├──────────────────────────────────────────┤
│ add a: int, b: int int │
│ greet name: str str │
└──────────────────────────────────────────┘
[5 procs] >>> exit`}
 </pre>
 <p>
 The design was inspired by <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">docker exec</code>, the server keeps running
 while you interact with it. But the closer analogy is <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">redis-cli</code>
 or <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">psql</code>: you connect to a running server and issue commands through an
 application-aware REPL. The server does not need to know about the shell,
 and the shell does not need to be on the same machine.
 </p>
 <p>
 For the argument parsing we use Python&rsquo;s <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ast.literal_eval</code> to safely
 evaluate argument literals. This means you can pass strings (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&quot;hello&quot;</code>),
 numbers (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">42</code>), booleans (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">True</code>/<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">False</code>), lists (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[1, 2, 3]</code>),
 and dicts (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{'{'}&quot;key&quot;: &quot;value&quot;{'}'}</code>) with full safety, no code execution
 risk. Both positional and keyword argument syntax are supported.
 </p>
 <p>
 We consider this a debugging tool, not a production monitoring interface.
 The shell should not be exposed on production servers or used in automated
 pipelines. It is meant for the same use case as <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">docker exec</code>:
 a developer debugging a running service during development.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this approach vs alternatives</h2>
 <p>
 We evaluated how tRPC, better-auth, Prisma, and Docker handle their CLI
 experiences:
 </p>
 <ul className="text-fd-muted-foreground">
 <li><strong>tRPC</strong> has no CLI at all, types flow through <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">import type</code> at compile time. This works because tRPC is single-language (TypeScript). pyrpc bridges Python and TypeScript, which is a different problem.</li>
 <li><strong>better-auth</strong> has a CLI for codegen and configuration, but no interactive mode. It generates types from server definitions, similar to our <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">codegen</code> command.</li>
 <li><strong>Prisma</strong> has <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">prisma studio</code> (GUI) and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">prisma generate</code>, but no interactive query REPL. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pull</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">generate</code> split inspired our original two-step workflow before we merged it.</li>
 <li><strong>Docker exec</strong> is a system-level shell inside a container, not an application REPL. But the UX pattern, server runs in background, exec into it for debugging, directly inspired <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc shell</code>.</li>
 </ul>
 <p>
 The closest analogue is <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">redis-cli</code> or <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">psql</code>: you have a running server,
 you connect a CLI client, and you issue commands through an application-aware
 REPL. This pattern is well-established and developers already know how to use
 it. The difference is that pyrpc commands are your own RPC procedures, not a
 fixed set of database operations.
 </p>
 <p>
 We are considering making <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc</code> (no subcommand) default to the shell
 when a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">PYRPC_URL</code> environment variable is set or a server is detected at
 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">localhost:8000</code>. This would make the workflow even tighter: install pyrpc,
 start a server, and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc</code> drops you into a shell automatically, no
 subcommand, no flags, no learning curve.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What is next</h2>
 <p>
 The immediate roadmap:
 </p>
 <ol className="text-fd-muted-foreground">
 <li><strong>pyrpc init</strong>, framework-aware scaffolding that detects FastAPI, Flask, or raw pyRPC and generates project structure.</li>
 <li><strong>pyrpc shell as default</strong>, running <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc</code> with no args opens the shell if a server is detected.</li>
 <li><strong>Tab completion</strong> in the shell for procedure names and parameter hints.</li>
 <li><strong>Streaming responses</strong> in the shell for async generator endpoints.</li>
 </ol>
 <p>
 All 12 CLI tests pass. The client tests pass. The repo is at
 <a href="https://github.com/pyrpc/pyrpc" className="underline hover:text-fd-foreground">github.com/pyrpc/pyrpc</a>.
 </p>
 </section>
 </article>
 )
}
