import Link from 'next/link'

export default function V013ReleasePost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 pyRPC v0.13.0: explicit backends and native dev servers
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 24, 2026 at 12:00pm</time>
 <span>&middot;</span>
 <span>6 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 v0.13.0 is the release where pyRPC stopped inferring and started asking. Your backend
 framework, entry point, and registration module are now declared configuration; the dev server
 launches each framework natively; and the TypeScript client grew tRPC-style links with request
 batching. Here is the tour.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">1. Declared backends</h2>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`{
 "backend": { "framework": "flask", "entrypoint": "main:app" },
 "clients": [{ "framework": "Next.js", "root": "../frontend" }]
}`}</pre>
 <p>
 The wizard asks the framework first, sniffing only preselects, Enter confirms.{' '}
 <code>--yes</code> sniffs or errors; it never guesses. Django additionally requires a{' '}
 <code>types_module</code> (the module where your <code>@rpc</code> decorators live), which
 also fixes stale-type regeneration for split-module layouts. Existing flat configs are
 rewritten in place on your next run, that is the whole migration.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">2. Native dev servers</h2>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`fastapi/asgi -> python -m uvicorn module:app --reload
flask -> python -m flask --app module:app run --reload
django -> python manage.py runserver 127.0.0.1:8000`}</pre>
 <p>
 No WSGI bridges, no ASGI wrappers around WSGI apps. Flask runs under Flask; Django under{' '}
 <code>runserver</code>; tracebacks stay native. And because launch resolution returns data
 rather than spawning processes, editing the framework in <code>pyrpc.json</code> live-swaps
 the runtime mid-session.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">3. Links and batching</h2>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`const api = createClient<Types>({
 links: [httpBatchLink({ url: "http://localhost:8000" })],
})`}</pre>
 <p>
 One terminating link owns transport (<code>httpLink</code> or <code>httpBatchLink</code>);
 composable links can sit in front later. Batching coalesces operations issued in the same tick
 into one POST array, dispatched sequentially server-side, capped at 100, each operation
 resolving independently. All four adapters re-export the links.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">4. Quality-of-life</h2>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>Client-root autocomplete</strong>: live directory completion jailed to the project root (symlinks and dot dirs filtered), Tab to accept.</li>
 <li><strong><code>pyrpc watch --module X</code></strong> works without a config file again, and the watchfiles shadowing crash is gone.</li>
 <li><strong>Actionable import errors</strong> carried forward: failures point at your file and line.</li>
 </ul>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">5. Site and docs</h2>
 <p>
 A visual redesign unified branding, light/dark theming, and syntax highlighting across landing,
 docs, and playground. The sidebar now matches how people arrive, adapters first, links
 documented properly, AI resources (llms.txt, MCP) promoted to a section of their own. All
 twelve examples were brought up to the same conformance bar.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Upgrading</h2>
 <ul className="list-disc pl-5 space-y-2">
 <li>Rerun <code>pyrpc dev</code> once to rewrite legacy configs (the wizard preselects detected values).</li>
 <li>Migrate client constructors to the <code>links</code> array, see the migration post; TypeScript flags every call site.</li>
 <li>Bump packages: <code>pyrpc-core==0.13.0</code>, adapters <code>^0.13.0</code>.</li>
 </ul>
 <p>
 Full details live in the changelog; deep dives on each feature are linked from the blog index.
 </p>
 </section>
 </article>
 )
}
