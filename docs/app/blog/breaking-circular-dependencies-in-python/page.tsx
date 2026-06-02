import Link from 'next/link'

export default function BreakingCircularDepsPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    How to break a circular dependency in Python packaging
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 2, 2026</time>
                    <span>&middot;</span>
                    <span>11 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Circular dependencies between Python packages are one of those problems
                    that sounds theoretical until pip hands you a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ResolutionImpossible</code>
                    error and you realize you cannot deploy.
                </p>
                <p>
                    This post is a practical guide to breaking circular dependencies in
                    Python packaging, using pyRPC's real-world restructuring as a case study.
                    We will cover the four strategies we evaluated, the one we chose, and
                    the step-by-step process for extracting a package from an existing
                    monolith.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The problem</h2>
                <p>
                    You have two packages that each need the other. In our case:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`pyrpc-codegen (CLI + TypeScript codegen)
  └── depends on: pyrpc-core (for module introspection)

Want: pip install pyrpc-core to give everything
  └── pyrpc-core now needs to depend on pyrpc-codegen
  └── CIRCULAR DEPENDENCY detected by pip
  └── ResolutionImpossible`}
                </pre>
                <p>
                    Pip (and uv, poetry, and every other Python package manager) builds a
                    directed acyclic graph of dependencies. If package A requires B and B
                    requires A, the resolver cannot determine which to install first. It
                    fails with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ResolutionImpossible</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Strategy 1: Merge the packages</h2>
                <p>
                    Put everything in one package. No cycle because there is only one node
                    in the graph.
                </p>
                <p>
                    <strong>When it works:</strong> When the two packages are conceptually
                    inseparable and have compatible dependency requirements. If both packages
                    are always installed together and never used independently, merging is
                    the simplest fix.
                </p>
                <p>
                    <strong>When it fails:</strong> When the packages have different dependency
                    profiles. pyrpc-codegen needs <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">typer</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">rich</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">uvicorn</code>,
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">watchfiles</code>, and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">httpx</code>. pyrpc-core should not require any of
                    those in production. Merging would force every production deployment to
                    install developer tooling. That is a violation of the principle of
                    minimal production dependencies.
                </p>
                <p>
                    <strong>Verdict: Rejected.</strong> Merging solves the packaging problem
                    but creates a dependency hygiene problem. Production servers should not
                    install typer.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Strategy 2: Remove the backward dependency</h2>
                <p>
                    Make pyrpc-codegen <em>not</em> depend on pyrpc-core. Use lazy imports
                    inside pyrpc-codegen instead of declaring the dependency in
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyproject.toml</code>.
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`# pyrpc-codegen: remove pyrpc-core from [project.dependencies]
# Use lazy import inside commands that need it
def _cmd_pull(module_path):
    from pyrpc_core import get_registry_schema  # lazy import
    ...`}
                </pre>
                <p>
                    <strong>When it works:</strong> When the backward dependency is narrow
                    (one function call) and the dependent package is meaningful without it.
                    For example, a CLI tool that can generate types from a URL without ever
                    touching the runtime.
                </p>
                <p>
                    <strong>When it fails:</strong> When the backward dependency is broad
                    (many imports across many modules) or when the dependent package's
                    identity is unclear. Is pyrpc-codegen a CLI package or a library package?
                    If half its commands crash without pyrpc-core, the user experience is
                    terrible &mdash; the package installs successfully, but most commands
                    fail at runtime with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ModuleNotFoundError</code>.
                </p>
                <p>
                    <strong>Verdict: Rejected.</strong> pyrpc-codegen was both a CLI and a
                    library. Making it partially functional depending on what else was
                    installed would be confusing. A package should either work or not work,
                    not work-sometimes.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Strategy 3: Invert the dependency direction</h2>
                <p>
                    Instead of pyrpc-codegen depending on pyrpc-core, make pyrpc-core
                    depend on pyrpc-codegen. Then extract the overlapping code (module
                    introspection) into a shared utility package that neither depends on.
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`pyrpc-core → pyrpc-codegen
         ↘
          pyrpc-utils (shared introspection code)
         ↗
pyrpc-codegen`}
                </pre>
                <p>
                    <strong>When it works:</strong> When the overlapping code is a clean,
                    standalone concern that can be extracted into its own package. Utility
                    functions, type definitions, and shared constants are good candidates.
                </p>
                <p>
                    <strong>When it fails:</strong> When the overlapping code is deeply
                    entangled with the runtime. Introspection in pyRPC is not a utility
                    function &mdash; it calls <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">get_registry_schema(default_router)</code>,
                    which imports Router, which imports the procedure registry, which is
                    the core of pyrpc-core. Extracting this would mean copying half of
                    pyrpc-core into pyrpc-utils, which defeats the purpose.
                </p>
                <p>
                    <strong>Verdict: Rejected.</strong> The introspection code is too
                    entangled with pyrpc-core to extract cleanly. A pyrpc-utils package
                    would be pyrpc-core with a different name.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Strategy 4: Introduce an intermediary package (the winner)</h2>
                <p>
                    Create a third package that owns the overlapping concern. In our case,
                    the overlapping concern was <strong>the CLI itself</strong>. The CLI is
                    the thing that needs both pyrpc-core (for introspection) and
                    pyrpc-codegen (for TypeScript generation). Extract it into its own
                    package.
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`Before:
  pyrpc-codegen → pyrpc-core  (cycle when pyrpc-core ← pyrpc-codegen)

After:
  pyrpc-core → pyrpc-cli → pyrpc-codegen
  (no cycles, each has one responsibility)`}
                </pre>
                <p>
                    <strong>When it works:</strong> When the overlapping concern is a
                    distinct architectural layer. In pyRPC's case, the CLI is a distinct
                    layer &mdash; it is developer tooling that orchestrates the runtime and
                    the codegen. It is not part of the runtime (pyrpc-core) and not part
                    of the code generation library (pyrpc-codegen). It is its own thing.
                </p>
                <p>
                    <strong>When it fails:</strong> When there is no clean separation
                    between the overlapping concern and the existing packages. If you
                    extract a package that is just a thin facade over two existing packages,
                    you have added complexity without solving the underlying entanglement.
                </p>
                <p>
                    <strong>Verdict: Chosen.</strong> The CLI is a clear architectural
                    boundary. It has its own dependencies (typer, rich, uvicorn, watchfiles,
                    httpx), its own entry point (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[project.scripts]</code>), and its own
                    lifecycle (only used during development, never in production).
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step-by-step: extracting a package</h2>
                <p>
                    Here is the exact process we followed to extract pyrpc-cli from
                    pyrpc-codegen. The same steps apply to any package extraction:
                </p>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">Step 1: Create the new package structure</h3>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`packages/pyrpc-cli/
  pyproject.toml
  src/
    pyrpc_cli/
      __init__.py        # empty or with version
      main.py            # all CLI commands move here`}
                </pre>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">Step 2: Write pyproject.toml with the right dependencies</h3>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`[project]
name = "pyrpc-cli"
dependencies = [
    "pyrpc-codegen>=1.0.0",  # hard dep for codegen
    "typer>=0.12.0",
    "rich>=13.0.0",
    "uvicorn>=0.29.0",
    "httpx>=0.27.0",
    "watchfiles>=0.21.0",
]
# Note: pyrpc-core is NOT a declared dependency
# It is lazy-imported at runtime

[project.scripts]
pyrpc = "pyrpc_cli.main:app"`}
                </pre>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">Step 3: Move the code</h3>
                <p>
                    Copy the existing CLI code from the old package to the new one. For
                    pyRPC, this meant moving the entire <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">main.py</code> (581 lines) and
                    its <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[project.scripts]</code> entry point.
                </p>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">Step 4: Strip the old package</h3>
                <p>
                    Remove the CLI code from the old package. Remove its CLI-related
                    dependencies. Remove its <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[project.scripts]</code> entry point. The
                    old package is now a pure library.
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`# pyrpc-codegen/pyproject.toml (after stripping)
[project]
name = "pyrpc-codegen"
dependencies = [
    "jinja2>=3.0.0",
    "jsonschema-ts>=0.1.0",
]
# No [project.scripts] section
# No pyrpc-core dependency
# No typer, rich, uvicorn, httpx, watchfiles`}
                </pre>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">Step 5: Update the production package</h3>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`# pyrpc-core/pyproject.toml (updated)
[project]
name = "pyrpc-core"
dependencies = [
    "pyrpc-cli>=1.0.0",      # new: brings CLI on pip install
    ...existing deps...
]`}
                </pre>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">Step 6: Update the workspace</h3>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`# Root pyproject.toml
[tool.uv.sources]
pyrpc-cli = { workspace = true }
pyrpc-codegen = { workspace = true }
pyrpc-core = { workspace = true }

[tool.uv.workspace]
members = [
    "packages/pyrpc-core",
    "packages/pyrpc-codegen",
    "packages/pyrpc-cli",    # new
]`}
                </pre>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">Step 7: Fix imports</h3>
                <p>
                    Every import that referred to the old package's CLI module needs to
                    point to the new one. For pyRPC, this was 13 import paths across tests
                    and internal code:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`# Before
from pyrpc_codegen.main import _load_schema, _DevConsole

# After
from pyrpc_cli.main import _load_schema, _DevConsole`}
                </pre>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">Step 8: Add lazy imports</h3>
                <p>
                    The new package needs pyrpc-core for some commands. Instead of declaring
                    it as a hard dependency, use lazy imports inside the command handlers:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`# pyrpc_cli/main.py
@app.command()
def pull(module_path: str):
    from pyrpc_core import get_registry_schema  # lazy
    ...

@app.command()
def serve(module_path: str, host: str, port: int):
    from pyrpc_core import default_router  # lazy
    from pyrpc_core.transport.asgi import PyRPCAsgiApp  # lazy
    ...`}
                </pre>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">Step 9: Run the tests</h3>
                <p>
                    Run the full test suite. Fix any remaining import paths or mock targets.
                    In pyRPC's case, one test file (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">test_codegen.py</code>) imported
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_load_schema</code> from the old path. One line change, all 45 tests pass.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The decision matrix</h2>
                <table className="w-full text-[10px] font-mono border-collapse [&_td]:border [&_td]:border-fd-muted [&_td]:px-3 [&_td]:py-2">
                    <thead>
                        <tr className="bg-fd-muted">
                            <th className="border border-fd-muted px-3 py-2 text-left">Strategy</th>
                            <th className="border border-fd-muted px-3 py-2 text-left">Effort</th>
                            <th className="border border-fd-muted px-3 py-2 text-left">Production deps clean?</th>
                            <th className="border border-fd-muted px-3 py-2 text-left">Clear responsibilities?</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-fd-muted px-3 py-2">Merge</td>
                            <td className="border border-fd-muted px-3 py-2">Low</td>
                            <td className="border border-fd-muted px-3 py-2">No</td>
                            <td className="border border-fd-muted px-3 py-2">No</td>
                        </tr>
                        <tr>
                            <td className="border border-fd-muted px-3 py-2">Remove backward dep</td>
                            <td className="border border-fd-muted px-3 py-2">Medium</td>
                            <td className="border border-fd-muted px-3 py-2">Yes</td>
                            <td className="border border-fd-muted px-3 py-2">No (broken CLI)</td>
                        </tr>
                        <tr>
                            <td className="border border-fd-muted px-3 py-2">Invert + shared utils</td>
                            <td className="border border-fd-muted px-3 py-2">High</td>
                            <td className="border border-fd-muted px-3 py-2">Yes</td>
                            <td className="border border-fd-muted px-3 py-2">Partial</td>
                        </tr>
                        <tr>
                            <td className="border border-fd-muted px-3 py-2"><strong>Extract intermediary</strong></td>
                            <td className="border border-fd-muted px-3 py-2"><strong>Medium</strong></td>
                            <td className="border border-fd-muted px-3 py-2"><strong>Yes</strong></td>
                            <td className="border border-fd-muted px-3 py-2"><strong>Yes</strong></td>
                        </tr>
                    </tbody>
                </table>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">When to reach for each strategy</h2>
                <ul className="text-fd-muted-foreground">
                    <li><strong>Merge</strong> &mdash; when the packages are never used independently and have similar dependency profiles. Example: a library and its type stubs.</li>
                    <li><strong>Remove backward dep</strong> &mdash; when the backward dependency is a single function call and the package is meaningful without it. Example: a CLI tool that has a "use local" vs "use remote" mode.</li>
                    <li><strong>Invert + shared utils</strong> &mdash; when the overlapping code is a clean, extractable concern. Example: shared validation logic between a server and a client package.</li>
                    <li><strong>Extract intermediary</strong> &mdash; when the overlapping concern is a distinct architectural layer. Example: a CLI that orchestrates a runtime and a code generator.</li>
                </ul>
                <p>
                    The key insight: circular dependencies in packaging are almost always a
                    sign that a third concept has been hiding inside an existing package.
                    Find that concept, extract it, and the cycle disappears.
                </p>
                <p>
                    All 45 tests pass. The repo is at <a href="https://github.com/pyrpc/pyrpc" className="underline hover:text-fd-foreground">github.com/pyrpc/pyrpc</a>.
                </p>
            </section>
        </article>
    )
}
