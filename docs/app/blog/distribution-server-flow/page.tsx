import Link from 'next/link'

export default function ServerFlowPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Server mode: type distribution across repositories
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 6, 2026 at 1:30pm</time>
                    <span>&middot;</span>
                    <span>9 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Server mode is for setups where the Python backend and TypeScript frontend live
                    in separate repositories. In this mode, pyrpc never touches the client&rsquo;s
                    filesystem. Instead, it exposes the current schema over HTTP and lets the client
                    fetch it on demand via <code>npx pyrpc sync</code>.
                </p>
                <p>
                    This post covers how server mode works on the server side: what changes, what
                    doesn&rsquo;t, and how to think about the deployment architecture.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The config</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`{
  "version": 1,
  "framework": "fastapi",
  "entrypoint": "app.main",
  "distribution": "server"
}`}</pre>
                <p>
                    Notice what&rsquo;s <strong>not</strong> here: <code>client_root</code>. In server
                    mode, pyrpc has no client path to write to. It doesn&rsquo;t need one. The config is
                    smaller because the server&rsquo;s responsibility is narrower &mdash; serve the
                    schema, don&rsquo;t distribute it.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What stays the same</h2>
                <p>
                    In server mode, most of <code>pyrpc dev</code> behaves identically:
                </p>
                <ul className="space-y-2">
                    <li>The file watcher still monitors Python files for changes</li>
                    <li>The router still reloads modules on change</li>
                    <li>The <code>GET /rpc</code> introspection endpoint still serves the schema</li>
                    <li>The dev server still starts (unless <code>--types-only</code>)</li>
                    <li>The developer console still works with <code>procs</code>, <code>inspect</code>, etc.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What changes</h2>
                <p>
                    The difference is in the <code>regenerate()</code> callback:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def regenerate():
    if not _regenerate_lock.acquire(blocking=False):
        return
    try:
        ok = default_router.reload_module(module)
        if not ok:
            console.print("No procedures found ...")
            return
        schemas = get_registry_schema(default_router)
        if resolved_distribution == "server":
            console.print(f"Server mode \u2014 "
                f"schema updated ({len(schemas)} procs)")
        else:
            _, save_typescript_client = _lazy_import_codegen()
            save_typescript_client(schemas, types_output)
            console.print(f"Types regenerated ({len(schemas)} procs)")
    except Exception as e:
        console.print(f"Types: {e}")
    finally:
        _regenerate_lock.release()`}</pre>
                <p>
                    In server mode, pyrpc still reloads the router and extracts the schema &mdash;
                    but it never calls <code>save_typescript_client()</code>. The <code>lazy_import_codegen</code>
                    isn&rsquo;t even invoked. The in-memory registry is the source of truth; the
                    <code>GET /rpc</code> endpoint reads from it directly.
                </p>
                <p>
                    The console output reflects this:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{"> pyrpc dev --distribution server"}
{""}
{"  pyRPC dev server  http://127.0.0.1:8000/rpc"}
{"  Distribution: server (clients fetch via npx pyrpc sync)"}
{""}
{"type help for commands"}
{"pyrpc>"}</pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The schema endpoint</h2>
                <p>
                    The schema is served at <code>GET /rpc</code>, the same endpoint used for
                    introspection since the earliest versions of pyrpc:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`async def handle_introspection(self, send):
    schemas = get_registry_schema(self.router)
    data = {
        name: schema.model_dump() \\
            if hasattr(schema, "model_dump") \\
            else schema
        for name, schema in schemas.items()
    }
    await self.send_response(send, 200, data)`}</pre>
                <p>
                    The response is a JSON object mapping procedure names to their schemas, including
                    parameters, types, docs, and return types. The existing <code>pyrpc codegen http://localhost:8000</code>
                    command already fetches from this endpoint. The upcoming client-side <code>npx pyrpc sync</code>
                    will do the same, but from the TypeScript side.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The developer console in server mode</h2>
                <p>
                    The <code>types</code> command in the developer console shows a different message
                    in server mode:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{"> types"}
{"Server mode \u2014 clients fetch types via HTTP."}
{"  GET /rpc returns the current schema"}
{"  Run npx pyrpc sync on the client to regenerate types"}</pre>
                <p>
                    And the <code>generate</code> command says &ldquo;Regenerating schema&rdquo;
                    instead of &ldquo;Regenerating TypeScript types,&rdquo; since no files are written.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why not just always write types?</h2>
                <p>
                    It would be simpler to always write types, even in server mode &mdash; just omit
                    <code>client_root</code> and write to a default location. Three reasons not to:
                </p>
                <ol className="space-y-2">
                    <li>
                        <strong>The server should not assume client filesystem access.</strong> In
                        production, the server and client are different machines. Writing types to
                        a path implies the path is meaningful, but in a deployment it&rsquo;s not.
                    </li>
                    <li>
                        <strong>Separation of concerns.</strong> The server&rsquo;s job is to serve
                        RPC requests and expose its schema. The client&rsquo;s job is to consume
                        types. Writing types to the server&rsquo;s filesystem is a monorepo
                        convenience, not an architectural requirement.
                    </li>
                    <li>
                        <strong>The client controls when to update.</strong> In server mode, the
                        client decides when to fetch new types &mdash; on deploy, on demand, on a
                        schedule. The server doesn&rsquo;t push types; the client pulls them.
                    </li>
                </ol>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The client side</h2>
                <p>
                    For the client to consume types in server mode, it needs two things:
                </p>
                <ol className="space-y-2">
                    <li>
                        <strong>A <code>pyrpc-client.json</code> file</strong> in the project root,
                        created during <code>npm install @pyrpc/client</code>. This file stores
                        the distribution mode and, for server mode, the server URL.
                    </li>
                    <li>
                        <strong><code>npx pyrpc sync</code></strong>, which reads
                        <code>pyrpc-client.json</code>, fetches <code>GET {'{server_url}'}/rpc</code>,
                        and regenerates <code>@pyrpc/types</code>.
                    </li>
                </ol>
                <p>
                    The client-side implementation lives in the <code>@pyrpc/client</code> npm package,
                    which is a separate release track.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Deployment architectures</h2>
                <p>
                    Server mode supports two deployment patterns:
                </p>
                <ul className="space-y-2">
                    <li>
                        <strong>Separate repositories:</strong> The backend repo runs <code>pyrpc dev</code>
                        in server mode. The frontend repo installs <code>@pyrpc/client</code> and uses
                        <code>npx pyrpc sync</code> to pull types. No shared filesystem.
                    </li>
                    <li>
                        <strong>Published npm package:</strong> In CI, after deploying the server, run
                        <code>npx pyrpc sync --server-url https://api.example.com</code> and publish
                        the resulting <code>@pyrpc/types</code> to npm. Consumers install the package
                        without needing server access.
                    </li>
                </ul>
                <p>
                    These are covered in more detail in the <Link href="/blog/three-deployment-architectures" className="text-fd-foreground underline">three deployment architectures post</Link>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The complete flow</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`Server:
  pyrpc dev --distribution server
    \u2502
    \u251c\u2500 Read pyrpc.json
    \u251c\u2500 Skip client_root entirely
    \u251c\u2500 Start file watcher
    \u251c\u2500 Start dev server with GET /rpc
    \u2514\u2500 Open developer console

  On file change:
    watcher \u2192 reload module \u2192 update in-memory schema

Client:
  npm install @pyrpc/client
    \u2502
    \u2514\u2500 postinstall: prompt distribution, create pyrpc-client.json

  npx pyrpc sync
    \u2502
    \u2514\u2500 Read pyrpc-client.json \u2192 fetch GET /rpc \u2192 regenerate types`}</pre>
                <p>
                    Server mode decouples the server from the client filesystem. It&rsquo;s more
                    work to set up than workspace mode (you need <code>pyrpc-client.json</code> and
                    <code>npx pyrpc sync</code>), but it&rsquo;s the right choice when your backend
                    and frontend are maintained independently.
                </p>
            </section>
        </article>
    )
}