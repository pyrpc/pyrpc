import Link from 'next/link'

export default function CircularDependencyPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The circular dependency problem and how pyrpc-cli solved it
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 2, 2026</time>
                    <span>&middot;</span>
                    <span>10 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Package architecture is one of those problems you do not think about until
                    it blocks your deploy. For the first few months of pyRPC we had a simple
                    two-package layout: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> for the runtime (Router, RPC handler,
                    ASGI adapter, decorators) and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code> for the CLI and
                    TypeScript generation. The CLI commands needed <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> to
                    import modules and introspect schemas, so <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code> declared
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> as a dependency. It worked.
                </p>
                <p>
                    Then we wanted <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pip install pyrpc-core</code> to give users everything
                    they needed &mdash; the runtime, the CLI, and the codegen &mdash; in one
                    command. That meant <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> needed to depend on
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code>. But <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code> already depended on
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code>. That is a circular dependency. Python packaging tools
                    (pip, uv, poetry) cannot resolve cycles. You get <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ResolutionImpossible</code>
                    or silently broken installs.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The original layout</h2>
                <p>
                    Here is what we started with:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`pyrpc-codegen
  ├── depends on: pyrpc-core   (for module introspection)
  ├── ships: CLI (typer, rich), codegen (jinja2)
  └── installed via: pip install pyrpc-codegen

pyrpc-core
  ├── depends on: nothing pyRPC-specific
  ├── ships: Router, decorators, ASGI/Flask/FastAPI adapters
  └── installed via: pip install pyrpc-core`}
                </pre>
                <p>
                    This worked if you knew to install both packages. But new users install
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> first (it is the main package, the runtime), then discover
                    they also need the CLI. The two-package story was confusing: "Do I install
                    pyrpc-core or pyrpc-codegen? Both? What is the difference?"
                </p>
                <p>
                    We wanted one install command. Every major framework works this way:
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pip install fastapi</code> gives you the runtime, the CLI (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">uvicorn</code>),
                    and everything needed to run. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pip install django</code> gives you the
                    runtime, the admin panel, the ORM, and the management CLI. One package,
                    one install, one version to track.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The three options we evaluated</h2>
                <p>
                    We went back and forth across three approaches before landing on the solution:
                </p>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">Option A: Merge everything into one package</h3>
                <p>
                    The simplest option: put everything in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> &mdash; runtime,
                    CLI, codegen, all in one package. No circular dependency because there is
                    only one package.
                </p>
                <p>
                    <strong>Problem:</strong> <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code> has heavy transitive dependencies.
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">typer</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">rich</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">uvicorn</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">watchfiles</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">httpx</code> &mdash; these are
                    CLI dependencies that should not be required if you are just using pyRPC
                    as an ASGI middleware in production. A user running <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">gunicorn</code> in
                    production does not need <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">typer</code> installed.
                </p>
                <p>
                    We rejected this because it violates the principle of minimal dependencies.
                    Your production server should not install developer tooling.
                </p>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">Option B: Make pyrpc-core depend on pyrpc-codegen, break the cycle by removing pyrpc-core from pyrpc-codegen</h3>
                <p>
                    If we could remove <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code>'s dependencies,
                    the cycle would disappear. The CLI would still need <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> at
                    runtime (for module introspection), but it could lazy-import it instead of
                    declaring it as a hard dependency.
                </p>
                <p>
                    <strong>Problem:</strong> This makes <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code> a partially-functional
                    package. If you install it alone and try <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc pull</code> (which needs
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code>), it crashes with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ModuleNotFoundError</code>. That is a bad
                    user experience &mdash; your CLI installs successfully but half the commands
                    fail at runtime.
                </p>
                <p>
                    It also blurs the packaging boundary: what is <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code>? Is
                    it a CLI package or a library package? The answer depends on which command
                    you run, which changes based on what else you have installed.
                </p>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">Option C: Extract the CLI into its own package (the winner)</h3>
                <p>
                    Create a third package <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-cli</code> that owns the CLI and depends on
                    both <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code>. Then <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code>
                    depends on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-cli</code>, which depends on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code>.
                    Chain: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core &rarr; pyrpc-cli &rarr; pyrpc-codegen</code> (no cycles).
                </p>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code> becomes a pure library &mdash; no CLI, no typer, no
                    uvicorn. Just <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jinja2</code> + <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jsonschema-ts</code>, taking a schema dict and
                    returning a TypeScript string. It no longer depends on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code>
                    at all.
                </p>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-cli</code> owns all CLI commands: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">dev</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">serve</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">inspect</code>,
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">codegen</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pull</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">shell</code>. It depends on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code>
                    (for TypeScript generation) and lazily imports <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> at
                    runtime only for commands that need module introspection (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pull</code>,
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">serve</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">inspect</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">dev</code>).
                </p>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> declares <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-cli</code> as a dependency. When a user runs
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pip install pyrpc-core</code>, pip resolves the chain and installs all three
                    packages. The CLI entry point (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc</code>) is registered by
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-cli</code>, so it is available immediately.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How the extraction worked</h2>
                <p>
                    The actual migration was mechanical but had to be done carefully:
                </p>
                <ol className="text-fd-muted-foreground">
                    <li>
                        <strong>Create <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">packages/pyrpc-cli/</code></strong> with its own <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyproject.toml</code>.
                        Dependencies: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">typer</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">rich</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">uvicorn</code>,
                        <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">httpx</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">watchfiles</code>.
                    </li>
                    <li>
                        <strong>Move <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">main.py</code></strong> from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code> to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-cli</code>,
                        along with the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[project.scripts]</code> entry point.
                    </li>
                    <li>
                        <strong>Strip <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code></strong>: remove the CLI code, remove the
                        <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> dependency, remove typer/rich/uvicorn/watchfiles from
                        its dependencies. It now only has <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jinja2</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jsonschema-ts</code>.
                    </li>
                    <li>
                        <strong>Update <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code></strong>: add <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-cli</code> as a dependency.
                    </li>
                    <li>
                        <strong>Update the workspace</strong>: add <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">packages/pyrpc-cli</code> to the
                        workspace members in the root <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyproject.toml</code>.
                    </li>
                    <li>
                        <strong>Fix imports</strong>: update 13 test files and inline imports across
                        the CLI code to point to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc_cli.main</code> instead of
                        <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc_codegen.main</code>.
                    </li>
                </ol>
                <p>
                    The most delicate part was the lazy import pattern. Commands like
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc codegen --url</code> do not need <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> at all &mdash; they
                    fetch the schema over HTTP and pass it to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code>'s template
                    engine. Commands like <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc pull app.main</code> need <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> to
                    import the user's module and call <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">get_registry_schema()</code>. The lazy
                    import keeps the fast path fast and only pays the cost when needed.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The dependency graph after</h2>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`pyrpc-core (runtime)
  └── depends on: pyrpc-cli

pyrpc-cli (CLI)
  ├── depends on: pyrpc-codegen (hard dep)
  ├── depends on: pyrpc-core (lazy import at runtime)
  ├── depends on: typer, rich, uvicorn, httpx, watchfiles
  └── ships: [project.scripts] pyrpc → pyrpc_cli.main:app

pyrpc-codegen (pure library)
  ├── depends on: jinja2, jsonschema-ts
  └── NO pyrpc deps at all

pip install pyrpc-core
  → installs: pyrpc-core + pyrpc-cli + pyrpc-codegen
  → 1 command, everything works`}
                </pre>
                <p>
                    No circular dependency. Every package has a clear responsibility.
                    The dependency direction is always downward: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">core &rarr; cli &rarr; codegen</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this matters beyond pyrpc</h2>
                <p>
                    Circular dependencies between packages are a smell. They indicate that
                    two concepts that should be separate have become entangled. In pyrpc's case,
                    the entanglement was between <em>the thing that provides the API</em> (core)
                    and <em>the thing that consumes the API to produce developer tooling</em> (CLI).
                </p>
                <p>
                    The fix was to introduce a third package that owns the consumer role
                    explicitly, leaving the core and the codegen library free of each other.
                    This is the same pattern you see in well-structured monorepos: a
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">cli</code> package that depends on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">core</code> + <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">utils</code>, never
                    the other way.
                </p>
                <p>
                    If you are designing a multi-package Python project and hit a
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ResolutionImpossible</code> error from pip, step back and ask: "What is each
                    package's single responsibility? Are these responsibilities truly distinct,
                    or have I accidentally merged two concerns into one package boundary?"
                    The answer is usually to extract the overlapping concern into its own
                    package.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What it enabled</h2>
                <p>
                    With the clean dependency chain in place, we can now add features that
                    were blocked before:
                </p>
                <ul className="text-fd-muted-foreground">
                    <li><strong>First-run setup prompts</strong> in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev</code> &mdash; detect framework, prompt for entry point, write <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[tool.pyrpc]</code> to pyproject.toml, install the adapter. All the CLI logic lives in pyrpc-cli, no circular deps.</li>
                    <li><strong>Framework adapter auto-install</strong> &mdash; <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pip install fastapi</code> on first run if the user chooses FastAPI.</li>
                    <li><strong><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--reconfigure</code></strong> &mdash; re-run the setup prompts and overwrite <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[tool.pyrpc]</code>.</li>
                    <li><strong>Optional <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc shell</code> removal</strong> &mdash; the shell lives in pyrpc-cli and can be removed without touching core or codegen.</li>
                </ul>
                <p>
                    All 45 tests pass. The repo is at <a href="https://github.com/pyrpc/pyrpc" className="underline hover:text-fd-foreground">github.com/pyrpc/pyrpc</a>.
                </p>
            </section>
        </article>
    )
}
