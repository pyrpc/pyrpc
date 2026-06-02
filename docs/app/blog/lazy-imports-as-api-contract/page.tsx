import Link from 'next/link'

export default function LazyImportsPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Lazy imports as API contract, not performance hack
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 2, 2026</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Lazy imports have a reputation as a performance trick: defer loading a
                    module until it is actually needed, so your startup time stays low. That
                    is true, but it is the least interesting thing about them.
                </p>
                <p>
                    In pyRPC's CLI, lazy imports serve as <strong>capability boundaries</strong>.
                    They define which commands work under which conditions. They transform an
                    ambiguous "this might work" CLI into a system where each command explicitly
                    declares its dependencies, and the user knows exactly what to expect.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Three tiers of CLI commands</h2>
                <p>
                    The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc</code> CLI (now in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-cli</code>) has six commands. Each
                    falls into one of three tiers based on what it needs at runtime:
                </p>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">Tier 1: No pyrpc-core needed</h3>
                <p>
                    These commands work with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pip install pyrpc-cli</code> alone (or with
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-cli</code> pulled in transitively by <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code>):
                </p>
                <ul className="text-fd-muted-foreground">
                    <li><strong><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc codegen --url</code></strong> &mdash; fetch schema from HTTP, generate TypeScript. No Python introspection needed.</li>
                    <li><strong><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc codegen schema.json</code></strong> &mdash; read schema file, generate TypeScript. Pure file I/O + template rendering.</li>
                    <li><strong><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc shell &lt;url&gt;</code></strong> &mdash; connect to a running server over HTTP. The server handles introspection.</li>
                    <li><strong><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc --version</code></strong> &mdash; print version. No core imports needed.</li>
                </ul>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">Tier 2: Lazy pyrpc-core import</h3>
                <p>
                    These commands need pyrpc-core, but only when the user provides a
                    module path argument. The import happens inside the command handler:
                </p>
                <ul className="text-fd-muted-foreground">
                    <li><strong><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc pull app.main</code></strong> &mdash; import the user's module, walk the registry, save schema. Requires <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc_core.get_registry_schema</code>.</li>
                    <li><strong><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc codegen app.main</code></strong> &mdash; same import mechanism as <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pull</code>, followed by template generation.</li>
                    <li><strong><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc inspect app.main</code></strong> &mdash; import module, print table of procedures.</li>
                </ul>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">Tier 3: pyrpc-core at startup</h3>
                <p>
                    These commands need pyrpc-core immediately. The import happens at the
                    top of the command handler, before any user interaction:
                </p>
                <ul className="text-fd-muted-foreground">
                    <li><strong><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc serve app.main</code></strong> &mdash; start uvicorn with the user's app. Needs <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">PyRPCAsgiApp</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">default_router</code>.</li>
                    <li><strong><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev app.main</code></strong> &mdash; serve + watcher + dev console. Needs core at startup.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The implementation pattern</h2>
                <p>
                    The implementation is straightforward. Each command handler either
                    imports core at the top or calls a lazy import helper:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`# pyrpc_cli/main.py

# Tier 1: no core import at all
@app.command()
def codegen(source: str, ...):
    schema = _load_schema(source)  # file I/O or HTTP fetch
    content = generate_typescript_client(schema)
    save_typescript_client(schema, output)

# Tier 2: lazy import inside the handler
@app.command()
def pull(module_path: str, ...):
    from pyrpc_core import get_registry_schema
    schema = _extract_schema_from_module(module_path)
    ...

# Tier 3: eager import at handler start
@app.command()
def serve(module_path: str, ...):
    from pyrpc_core import ...
    ...`}
                </pre>
                <p>
                    The pattern is so simple it barely deserves the name "pattern." But its
                    implications are significant.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What lazy imports communicate</h2>
                <p>
                    Every lazy import is a statement: <strong>"this command can work without
                    this package."</strong> The absence of a lazy import says: <strong>"this
                    command fundamentally needs this package."</strong> These are API contract
                    signals, not performance hints.
                </p>
                <p>
                    Consider the alternative: eager imports at the top of the module. If
                    pyrpc-cli eagerly imported pyrpc-core at the top of <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">main.py</code>,
                    then every `pyrpc` command would fail if pyrpc-core was not installed.
                    Even <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc --version</code> would crash. The eager import creates a
                    hard coupling that does not actually exist in the domain.
                </p>
                <p>
                    With lazy imports, the coupling is explicit and fine-grained. A user
                    installing pyrpc-cli for frontend-only CI can run <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc codegen --url</code>
                    without ever touching pyrpc-core. The error message for tier 2 commands
                    (if core is missing) is clear: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"This command requires pyrpc-core.
                    Install it with: pip install pyrpc-core"</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The packaging vs code distinction</h2>
                <p>
                    Lazy imports also clarify the distinction between <strong>packaging
                    dependencies</strong> (what pip installs) and <strong>code dependencies</strong>
                    (what Python imports). They are not the same thing.
                </p>
                <p>
                    pyrpc-core declares pyrpc-cli as a packaging dependency. This ensures
                    pyrpc-cli is on disk after <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pip install pyrpc-core</code>. But pyrpc-core
                    never imports pyrpc-cli. The code dependency is in the other direction:
                    pyrpc-cli imports pyrpc-core (lazily) for commands that need it.
                </p>
                <p>
                    This asymmetry is intentional. The packaging graph ensures availability.
                    The import graph ensures functionality. They are two different graphs
                    that happen to share the same vertices. Lazy imports are the bridge
                    between them.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Real-world impact: the CI workflow</h2>
                <p>
                    The lazy import pattern enables a workflow that would otherwise require
                    a full Python backend setup:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`# In your frontend CI pipeline:
# Install just the CLI (transitively via pyrpc-core or directly)
pip install pyrpc-cli

# Generate types from the deployed server
# No Python backend, no module imports, no pyrpc-core
pyrpc codegen https://api.example.com/rpc
# → Writes types.ts with full TypeScript definitions`}
                </pre>
                <p>
                    The same CI pipeline generates types from a staging or production server
                    without ever importing pyrpc-core. The command fetches the schema over
                    HTTP, passes it to pyrpc-codegen's template engine (pure Jinja2), and
                    writes the output file. Zero pyrpc-core imports, zero framework
                    dependencies, zero risk of import errors in CI.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">When not to use lazy imports</h2>
                <p>
                    Lazy imports are not always the right choice. Some cases where we
                    deliberately avoided them:
                </p>
                <ul className="text-fd-muted-foreground">
                    <li><strong>At module level in libraries.</strong> pyrpc-core and pyrpc-codegen never use lazy imports at module level. They import everything eagerly at the top of <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">__init__.py</code>. Library users should get consistent import behavior.</li>
                    <li><strong>When the dependency is always needed.</strong> pyrpc-cli's <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">codegen</code> command eagerly imports pyrpc-codegen because it always calls <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">generate_typescript_client</code>. There is no code path that skips it.</li>
                    <li><strong>In hot code paths.</strong> If a lazy import is inside a function that runs on every keystroke (like the dev console REPL), it should be hoisted outside the loop. We import core once at dev console startup, not on every REPL command.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The principle</h2>
                <p>
                    Think of lazy imports as <strong>explicit dependency declarations at the
                    function level</strong>. A module-level import says "this entire module needs
                    this dependency." A function-level lazy import says "this specific
                    operation needs this dependency." The granularity of the import should
                    match the granularity of the need.
                </p>
                <p>
                    When you treat lazy imports this way, they stop being a performance
                    trick and become a design tool. They help you reason about what depends
                    on what, they make your error messages more precise, and they enable
                    workflows that would otherwise require separate packages or conditional
                    installation.
                </p>
                <p>
                    In pyRPC's case, lazy imports are what make the three-package chain
                    work. Without them, pyrpc-core would have to eagerly import pyrpc-cli
                    (adding startup cost for production deployments) or the CLI would have
                    to be its own separate install target (breaking the one-command UX).
                    Lazy imports split the difference: one install, two import graphs,
                    clear capability boundaries.
                </p>
                <p>
                    All 45 tests pass. The repo is at <a href="https://github.com/pyrpc/pyrpc" className="underline hover:text-fd-foreground">github.com/pyrpc/pyrpc</a>.
                </p>
            </section>
        </article>
    )
}
