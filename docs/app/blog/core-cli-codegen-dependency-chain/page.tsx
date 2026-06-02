import Link from 'next/link'

export default function CoreCliCodegenPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Core &rarr; CLI &rarr; Codegen: why the dependency direction matters
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 2, 2026 at 1:00pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Every package structure encodes assumptions about how components relate.
                    In pyRPC, the dependency chain is <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core &rarr; pyrpc-cli &rarr; pyrpc-codegen</code>.
                    This was not an accident &mdash; it was the result of working through what each
                    package is, what it needs, and what it should <em>not</em> need.
                </p>
                <p>
                    The direction tells a story: <em>applications depend on core; core depends on
                    CLI; CLI depends on codegen.</em> Each arrow means "this package needs that
                    package to function." Let us unpack why each arrow points where it does.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">pyrpc-core: the runtime, nothing else</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> is what you import in production. It provides:
                </p>
                <ul className="text-fd-muted-foreground">
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Router</code> &mdash; the procedure registry.</li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@model</code> &mdash; decorators for registering procedures and models.</li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">handle_request</code> &mdash; the core RPC interpreter.</li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">PyRPCAsgiApp</code> &mdash; the ASGI transport layer.</li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">RPCClient</code> &mdash; the Python client for calling remote servers.</li>
                    <li>Framework adapters for FastAPI, Flask, and standalone ASGI.</li>
                </ul>
                <p>
                    Core has the strictest dependency requirements: it must be lightweight,
                    stable, and suitable for production deployment. It should <em>not</em> pull
                    in typer, rich, uvicorn, or any other CLI-only dependency.
                </p>
                <p>
                    Core depends on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-cli</code> because we want <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pip install pyrpc-core</code>
                    to install the CLI. But the dependency is purely structural &mdash; core never
                    imports pyrpc-cli at runtime. It is a packaging dependency, not a code
                    dependency. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[project.dependencies]</code> line ensures pip installs
                    pyrpc-cli alongside pyrpc-core, but the Python import graph is flat:
                    importing <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc_core</code> does not trigger <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">import pyrpc_cli</code>.
                </p>
                <p>
                    This is an important distinction. A packaging dependency ensures the
                    package is present on disk. A code dependency (import) ensures it is
                    loaded in memory. They do not need to be the same. By keeping the import
                    lazy, core remains fast to import and free of CLI baggage, while still
                    ensuring the CLI is available when the user types <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">pyrpc-cli: the glue layer</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-cli</code> is the developer-facing surface. It owns:
                </p>
                <ul className="text-fd-muted-foreground">
                    <li>The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc</code> CLI entry point (typer app).</li>
                    <li>All commands: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">dev</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">serve</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">inspect</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">codegen</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pull</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">shell</code>.</li>
                    <li>The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_DevConsole</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_ShellConsole</code> REPL consoles.</li>
                    <li>Config read/write for <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[tool.pyrpc]</code> in pyproject.toml.</li>
                    <li>File watcher integration (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">watchfiles</code>).</li>
                    <li>First-run setup prompts and framework adapter installation.</li>
                </ul>
                <p>
                    CLI depends on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code> directly because the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">codegen</code>
                    command calls <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">generate_typescript_client()</code> from pyrpc-codegen. This
                    is a hard code dependency &mdash; the import happens at CLI startup.
                </p>
                <p>
                    CLI depends on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> lazily because only some commands need it.
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc codegen --url</code> does not import core. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev app.main</code> does.
                    The lazy import pattern means the CLI help text and fast commands are
                    snappy even if core is large.
                </p>
                <p>
                    CLI also brings in the heavy tooling dependencies: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">typer</code>,
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">rich</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">uvicorn</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">watchfiles</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">httpx</code>. These are
                    appropriate here because they are only needed when running the CLI &mdash;
                    not in production, not in library code.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">pyrpc-codegen: the pure library at the bottom</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code> is the simplest package. It takes a Python dict describing
                    RPC procedures and returns a string of TypeScript source code. That is it.
                </p>
                <p>
                    Its dependencies are minimal:
                </p>
                <ul className="text-fd-muted-foreground">
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jinja2</code> &mdash; for rendering TypeScript from templates.</li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jsonschema-ts</code> &mdash; for converting Pydantic model JSON Schema to TypeScript interfaces.</li>
                </ul>
                <p>
                    It has <em>zero</em> pyrpc dependencies. It does not import pyrpc-core,
                    pyrpc-cli, or any other pyrpc package. It can be installed standalone,
                    used in CI pipelines, or embedded in other tools that need to generate
                    TypeScript from Python schema data.
                </p>
                <p>
                    Being at the bottom of the dependency chain means codegen never causes
                    circular dependency problems. No matter how pyrpc-core or pyrpc-cli
                    evolve, codegen stays stable and independent. This is the ideal position
                    for a library: dependents grow downward toward you, you never reach up
                    to them.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What happens when you pip install pyrpc-core</h2>
                <p>
                    Here is the complete resolution chain:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`pip install pyrpc-core
  ├── pyrpc-core 1.0.0
  │   └── requires: pyrpc-cli >=1.0.0
  │       └── pyrpc-cli 1.0.0
  │           ├── requires: pyrpc-codegen >=1.0.0
  │           │   └── pyrpc-codegen 1.0.0
  │           │       ├── requires: jinja2 >=3.0
  │           │       └── requires: jsonschema-ts >=0.1
  │           ├── requires: typer >=0.12
  │           ├── requires: rich >=13.0
  │           ├── requires: uvicorn >=0.29
  │           ├── requires: httpx >=0.27
  │           └── requires: watchfiles >=0.21
  └── (pyrpc-core does NOT import pyrpc-cli at module level)
      → Fast import, no CLI deps loaded until you type "pyrpc"`}
                </pre>
                <p>
                    The user gets everything in one command. The TypeScript codegen, the dev
                    console, the watcher, the shell, the serve command &mdash; all of it is
                    installed. And yet, importing <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc_core</code> in production still takes
                    the same time it always did because the CLI code is on disk but not in
                    memory.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Design principles behind the chain</h2>
                <p>
                    Three principles guided the final structure:
                </p>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">1. Production dependencies must not include development dependencies</h3>
                <p>
                    When you deploy pyRPC to production, you should not install typer, rich,
                    or watchfiles. These are developer tools. The dependency chain ensures
                    that pyrpc-core (the production package) only <em>declares</em> a dependency
                    on pyrpc-cli, but never <em>imports</em> it at runtime. Production deployments
                    that only import pyrpc-core will never trigger the CLI dependency tree.
                </p>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">2. Libraries at the bottom, tools in the middle, applications at the top</h3>
                <p>
                    Layered dependency graphs are easier to reason about than tangled ones.
                    pyrpc-codegen is a pure library &mdash; no side effects, no network calls,
                    no <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[project.scripts]</code>. pyrpc-cli is a tool &mdash; it orchestrates
                    libraries and adds interactivity. pyrpc-core is an application library &mdash;
                    it is the top-level package that users install and import.
                </p>
                <p>
                    The chain flows naturally: applications import core, core ensures CLI is
                    available, CLI orchestrates codegen. No package needs to know about the
                    layer above it.
                </p>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">3. Lazy imports are an API contract, not an optimization</h3>
                <p>
                    The lazy import of pyrpc-core inside pyrpc-cli is a deliberate design
                    choice, not a performance hack. It means pyrpc-cli commands that do not
                    need core (codegen, shell with URL) work without core installed. This
                    enables workflows like:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`# Frontend-only CI: regenerate types from deployed server
pip install pyrpc-cli
pyrpc codegen https://api.example.com/rpc`}
                </pre>
                <p>
                    The lazy import declares: "I can work without core for most of my commands.
                    If you need the full set of commands, install core too or let the dependency
                    chain bring it in." This is an explicit capability boundary, not a hidden
                    optimization.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What is next</h2>
                <p>
                    With the dependency chain clean, the next features build directly on top:
                </p>
                <ul className="text-fd-muted-foreground">
                    <li><strong>First-run setup</strong> &mdash; <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev</code> with no config prompts for framework and entry point, saves to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[tool.pyrpc]</code>, installs adapter.</li>
                    <li><strong>Adapter auto-install</strong> &mdash; <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pip install pyrpc-fastapi</code> (or flask/asgi) based on framework choice.</li>
                    <li><strong><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--reconfigure</code></strong> &mdash; re-run setup prompts to switch frameworks or entry points.</li>
                    <li><strong>Optional <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc shell</code> removal</strong> &mdash; the shell lives entirely in pyrpc-cli and can be deprecated without touching core or codegen.</li>
                </ul>
                <p>
                    All 45 tests pass. The repo is at <a href="https://github.com/pyrpc/pyrpc" className="underline hover:text-fd-foreground">github.com/pyrpc/pyrpc</a>.
                </p>
            </section>
        </article>
    )
}
