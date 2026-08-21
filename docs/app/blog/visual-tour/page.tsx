import Link from 'next/link'

export default function VisualTourPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    A Visual Tour of pyrpc's Architecture
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 15, 2026 at 12:15pm</time>
                    <span>&middot;</span>
                    <span>10 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Eight diagrams. Seven packages. One framework. Let's walk through pyrpc's architecture from top to bottom, using the LikeC4 diagrams we created.
                </p>
                <p>
                    To follow along, run <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npx likec4 start architecture</code> and open the views as we go.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Level 1: System Landscape</h2>
                <p>
                    The broadest view. Three actors interact with pyrpc:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li><strong>Python Developer</strong> &mdash; writes <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code>-decorated functions and runs the CLI</li>
                    <li><strong>TypeScript Developer</strong> &mdash; consumes the typed client in frontend apps</li>
                    <li><strong>JSON-RPC 2.0 Protocol</strong> &mdash; the wire format pyrpc conforms to</li>
                </ul>
                <p>
                    This view answers: <em>what are the boundaries of our system?</em> The Python developer is inside pyrpc's world (they write the endpoints). The TypeScript developer is outside (they only see generated types and the client library). JSON-RPC 2.0 is a constraint &mdash; pyrpc must speak this language correctly.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Level 2: Container Diagram</h2>
                <p>
                    Zoom into pyrpc. Seven containers (packages) form the system:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`pyrpc
  pyrpc-core, Router, Interpreter, CLI, ASGI, Python client (10 components)
  pyrpc-fastapi, mount_fastapi() adapter (26 lines)
  pyrpc-flask, mount_flask() adapter with anyio.run() sync bridge (33 lines)
  pyrpc-django, mount_django() adapter with native async views (38 lines)
  pyrpc-codegen, Python→TypeScript code generation pipeline (5 components)
  @pyrpc/client, TypeScript Proxy client, CLI sync, postinstall wizard
  @pyrpc/types, Generated TS type definitions (src/index.ts)`}
                </pre>
                <p>
                    The key insight: <strong>pyrpc-core is the center of the universe</strong>. Every adapter, the codegen, and the CLI all talk to core. No container talks to another container directly without going through core. Two config files support the system: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc.json</code> (Python-side config) and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-client.json</code> (TypeScript-side config).
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Level 3a: pyrpc-core Internals</h2>
                <p>
                    The most detailed view. pyrpc-core contains 10 components:
                </p>
                <div className="overflow-x-auto text-[11px]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-fd-border">
                                <th className="text-left py-2 pr-4 font-semibold text-fd-foreground">Component</th>
                                <th className="text-left py-2 pr-4 font-semibold text-fd-foreground">File</th>
                                <th className="text-left py-2 font-semibold text-fd-foreground">Job</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-fd-border/50"><td className="py-2 pr-4">Router</td><td className="py-2 pr-4 font-mono">registry.py</td><td className="py-2">Thread-safe registry of named Procedures. Supports <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">merge()</code> and <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">reload_module()</code> for hot-reload.</td></tr>
                            <tr className="border-b border-fd-border/50"><td className="py-2 pr-4">Procedure</td><td className="py-2 pr-4 font-mono">procedure.py</td><td className="py-2">Compiled handler wrapping a user function. Pre-builds Pydantic TypeAdapters at init time.</td></tr>
                            <tr className="border-b border-fd-border/50"><td className="py-2 pr-4">@rpc decorator</td><td className="py-2 pr-4 font-mono">decorators.py</td><td className="py-2">Alias for <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">default_router.rpc()</code>. Compiles function into Procedure at import time.</td></tr>
                            <tr className="border-b border-fd-border/50"><td className="py-2 pr-4">@model decorator</td><td className="py-2 pr-4 font-mono">decorators.py</td><td className="py-2">Alias for <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">pydantic.dataclasses.dataclass</code>. Marks classes for JSON Schema generation.</td></tr>
                            <tr className="border-b border-fd-border/50"><td className="py-2 pr-4">handle_request()</td><td className="py-2 pr-4 font-mono">interpreter.py</td><td className="py-2">Core dispatcher: validate envelope &rarr; lookup Procedure &rarr; execute &rarr; return response.</td></tr>
                            <tr className="border-b border-fd-border/50"><td className="py-2 pr-4">get_registry_schema()</td><td className="py-2 pr-4 font-mono">introspection.py</td><td className="py-2">Single source of truth for both runtime introspection and TypeScript codegen.</td></tr>
                            <tr className="border-b border-fd-border/50"><td className="py-2 pr-4">RpcRequest / RpcResponse</td><td className="py-2 pr-4 font-mono">models.py</td><td className="py-2">Pydantic v2 models for the JSON-RPC 2.0 envelope.</td></tr>
                            <tr className="border-b border-fd-border/50"><td className="py-2 pr-4">PyRPCAsgiApp</td><td className="py-2 pr-4 font-mono">transport/asgi.py</td><td className="py-2">Standalone ASGI app for POST/GET /rpc with CORS headers.</td></tr>
                            <tr className="border-b border-fd-border/50"><td className="py-2 pr-4">CLI</td><td className="py-2 pr-4 font-mono">cli.py</td><td className="py-2">Typer CLI: <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">dev</code>, <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">serve</code>, <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">inspect</code>, <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">pull</code>, <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">codegen</code>. 764 lines.</td></tr>
                            <tr className="border-b border-fd-border/50"><td className="py-2 pr-4">Python RPCClient</td><td className="py-2 pr-4 font-mono">client/python_client.py</td><td className="py-2">Dynamic Python client using httpx. Auto-fetches schema for method introspection.</td></tr>
                        </tbody>
                    </table>
                </div>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Level 3b: pyrpc-codegen Pipeline</h2>
                <p>
                    The codegen package has a 5-component pipeline: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">generate_typescript_client()</code> collects schemas and orchestrates &rarr; <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_pytype_to_ts()</code> converts Python types to TypeScript &rarr; <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client.ts.j2</code> renders method signatures via Jinja2 &rarr; <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jsonschema_ts</code> converts Pydantic JSON schemas to TS interfaces &rarr; <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">save_typescript_client()</code> writes to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types/src/index.ts</code>.
                </p>
                <p>
                    The @pyrpc/client internals are notable for the Proxy pattern &mdash; <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createClient&lt;Types&gt;()</code> creates a Proxy that intercepts any property access. Calling <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{'client.myMethod({ arg })'}</code> Just Works without any pre-declared method list, because the Proxy dynamically translates the call at runtime into a JSON-RPC 2.0 POST request.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Level 4: Adapter Pattern Comparison</h2>
                <p>
                    This view puts all four adapters side by side:
                </p>
                <div className="overflow-x-auto text-[11px]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-fd-border">
                                <th className="text-left py-2 pr-4 font-semibold text-fd-foreground">Adapter</th>
                                <th className="text-left py-2 pr-4 font-semibold text-fd-foreground">Lines</th>
                                <th className="text-left py-2 font-semibold text-fd-foreground">Async Strategy</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-fd-border/50"><td className="py-2 pr-4 font-mono">PyRPCAsgiApp</td><td className="py-2 pr-4">~80</td><td className="py-2">Native async ASGI</td></tr>
                            <tr className="border-b border-fd-border/50"><td className="py-2 pr-4 font-mono">mount_fastapi()</td><td className="py-2 pr-4">26</td><td className="py-2">Native async (FastAPI)</td></tr>
                            <tr className="border-b border-fd-border/50"><td className="py-2 pr-4 font-mono">mount_flask()</td><td className="py-2 pr-4">33</td><td className="py-2"><code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">anyio.run()</code> sync-to-async bridge</td></tr>
                            <tr className="border-b border-fd-border/50"><td className="py-2 pr-4 font-mono">mount_django()</td><td className="py-2 pr-4">38</td><td className="py-2">Django async views + <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">@csrf_exempt</code></td></tr>
                        </tbody>
                    </table>
                </div>
                <p>
                    Each adapter does exactly two things: POST /rpc calls <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">handle_request()</code>, GET /rpc calls <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">get_registry_schema()</code>. Zero protocol logic. Zero business logic. Just HTTP plumbing. This "thin shell" pattern is why adding a new adapter takes ~30 lines of code.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Dynamic Views: Tracing Workflows</h2>
                <p>
                    Three dynamic views capture the most important sequences:
                </p>
                <p>
                    <strong>RPC Call Flow (7 steps):</strong> Proxy &rarr; HTTP POST &rarr; Adapter &rarr; envelope validation &rarr; Router lookup &rarr; Procedure execution with TypeAdapter validation &rarr; response back. Error path: PyRPCError thrown on client.
                </p>
                <p>
                    <strong>Codegen Flow (10 steps):</strong> <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code> registration &rarr; CLI triggers codegen &rarr; <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">get_registry_schema()</code> &rarr; type conversion &rarr; Jinja2 rendering &rarr; <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jsonschema_ts</code> model generation &rarr; file write.
                </p>
                <p>
                    <strong>Dev Loop Flow (12 steps):</strong> <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev</code> &rarr; read config &rarr; import module &rarr; start watcher + server &rarr; file change detected &rarr; debounce 300ms &rarr; <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">reload_module()</code> &rarr; schema extraction &rarr; type regeneration &rarr; console update.
                </p>
                <p>
                    The next post in this series traces a single RPC call end-to-end, from the TypeScript Proxy through to the Python function and back.
                </p>
            </section>
        </article>
    )
}
