import Link from 'next/link'

export default function WorkspaceFlowPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Workspace mode: what happens when you run pyrpc dev
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 6, 2026 at 1:15pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Workspace mode is the default distribution mode in pyrpc. It assumes the server
                    and client project live on the same filesystem &mdash; a monorepo, or a repo with
                    both <code>server/</code> and <code>client/</code> directories. This is the
                    tRPC-like experience: one command starts everything, types flow automatically.
                </p>
                <p>
                    This post walks through exactly what happens when you run <code>pyrpc dev</code>
                    in workspace mode &mdash; config resolution, path validation, type generation,
                    and the watcher loop.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The config</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`{
  "version": 1,
  "framework": "fastapi",
  "entrypoint": "app.main",
  "distribution": "workspace",
  "client_root": "../frontend"
}`}</pre>
                <p>
                    The key fields for workspace mode are <code>distribution</code> (must be
                    <code>"workspace"</code>) and <code>client_root</code> (a relative or absolute
                    path to the TypeScript client project). Everything else is standard.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 1: Config resolution</h2>
                <p>
                    When <code>pyrpc dev</code> starts, it reads <code>pyrpc.json</code> from the
                    current directory or any parent directory. The <code>client_root</code> path is
                    resolved relative to the config file&rsquo;s directory, not the current working
                    directory:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _resolve_client_root(client_root: str, config_dir: str) -> str:
    p = client_root if os.path.isabs(client_root) \\
        else os.path.join(config_dir, client_root)
    return os.path.normpath(p)`}</pre>
                <p>
                    If <code>pyrpc.json</code> lives at <code>/project/server/pyrpc.json</code> and
                    <code>client_root</code> is <code>"../frontend"</code>, the resolved path is
                    <code>/project/frontend</code>. This is platform-aware &mdash; Windows absolute
                    paths like <code>C:\\frontend</code> are detected even on Linux.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 2: Client root validation</h2>
                <p>
                    Before doing anything else, pyrpc checks that the resolved <code>client_root</code>
                    actually exists:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`if new_client_root and not os.path.isdir(new_client_root):
    console.print("[bold red]Error:[/bold red] Client project not found at:")
    console.print(f"  {new_client_root}")
    console.print()
    console.print("Create it first, then re-run [bold]pyrpc dev[/bold].")
    console.print()
    console.print("  [dim]Examples:[/dim]")
    console.print("    npm create vite@latest frontend -- --template react-ts")
    console.print("    npx create-next-app@latest frontend --typescript")
    console.print("    npx create-react-app frontend --template typescript")
    console.print()
    raise typer.Exit(code=1)`}</pre>
                <p>
                    This prevents a common footgun: running <code>pyrpc dev</code> before setting up
                    the frontend project. pyrpc will not create a client project for you &mdash; that&rsquo;s
                    the job of framework scaffolding tools (Vite, Next.js, etc.). Instead, it tells you
                    exactly what&rsquo;s missing and how to create it.
                </p>
                <p>
                    This follows the same pattern as Prisma, tRPC, and Better Auth: tools that install
                    into existing projects, not tools that create projects.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 3: Migration check</h2>
                <p>
                    If the <code>client_root</code> differs from a previous run, pyrpc handles the
                    migration of existing type files. The logic has three cases:
                </p>
                <ol className="space-y-2">
                    <li><strong>Old exists, new missing:</strong> Prompt to move the file</li>
                    <li><strong>Same SHA256:</strong> Auto-cleanup the old copy</li>
                    <li><strong>Different SHA256:</strong> Prompt: regenerate, keep both, or cancel</li>
                </ol>
                <p>
                    This is covered in detail in the <Link href="/blog/migration-strategy-three-cases" className="text-fd-foreground underline">migration strategy post</Link>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 4: The watcher loop</h2>
                <p>
                    With validation passed and types output path determined, pyrpc starts a file
                    watcher (via the <code>watchfiles</code> library) that monitors all Python files
                    in the project directory:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`watched_dirs = _find_python_dirs(cwd)
def watcher_loop():
    for changes in watch(*watched_dirs, ...):
        if any(f.endswith(".py") for _, f in changes):
            _schedule_regenerate()

def regenerate():
    ok = default_router.reload_module(module)
    schemas = get_registry_schema(default_router)
    save_typescript_client(schemas, types_output)
    console.print(f"Types regenerated ({len(schemas)} procs)")`}</pre>
                <p>
                    When a Python file changes: the router reloads the module, the schema is extracted,
                    and <code>save_typescript_client()</code> writes the generated types to
                    <code>{'{client_root}'}/node_modules/@pyrpc/types/src/index.ts</code>.
                </p>
                <p>
                    The TypeScript client picks up the change automatically &mdash; Vite&rsquo;s HMR,
                    Next.js&rsquo;s Fast Refresh, or a plain <code>tsc --watch</code> all detect the
                    file change and recompile.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 5: The dev server</h2>
                <p>
                    If not running in <code>--types-only</code> mode, a Uvicorn server starts with
                    hot-reload enabled, serving the pyRPC ASGI app. The developer console opens,
                    providing commands like <code>procs</code>, <code>inspect</code>,
                    <code>generate</code>, and <code>types</code>:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{"> pyrpc dev"}
{""}
{"  pyRPC dev server  http://127.0.0.1:8000/rpc"}
{"  Types: C:/project/frontend/node_modules/@pyrpc/types/src/index.ts"}
{""}
{"type help for commands"}
{"pyrpc>"}</pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What about CI?</h2>
                <p>
                    In CI, you typically don&rsquo;t run <code>pyrpc dev</code>. Instead, you run
                    <code>pyrpc dev --types-only</code> (or the upcoming <code>pyrpc codegen</code>)
                    to generate types once. The server startup, watcher, and console are all skipped.
                    This makes workspace mode CI-compatible without any special config.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The complete flow</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`pyrpc dev
  \u2502
  \u251c\u2500 Read pyrpc.json
  \u251c\u2500 Resolve client_root (config-relative)
  \u251c\u2500 Validate client_root exists
  \u251c\u2500 Handle type migration if path changed
  \u251c\u2500 Start file watcher
  \u251c\u2500 Generate initial types
  \u251c\u2500 Start dev server (optional)
  \u2514\u2500 Open developer console

On file change:
  watcher \u2192 reload module \u2192 extract schema \u2192 write types`}</pre>
                <p>
                    That&rsquo;s the workspace mode flow. It&rsquo;s the default for a reason: one
                    command, zero client-side config, end-to-end type safety within a single
                    repository.
                </p>
            </section>
        </article>
    )
}