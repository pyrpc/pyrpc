import Link from 'next/link'

export default function DistributionModesPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 Distribution: workspace or server, and why explicit is better than implicit
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>June 6, 2026 at 1:00pm</time>
 <span>&middot;</span>
 <span>8 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 pyrpc introduces a single new field to <code>pyrpc.json</code>
 that changes how the server thinks about type distribution: <code>distribution</code>.
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`{
 "version": 1,
 "framework": "fastapi",
 "entrypoint": "app.main",
 "distribution": "workspace",
 "client_root": "../frontend"
}`}</pre>
 <p>
 Two values: <code>"workspace"</code> and <code>"server"</code>. That&rsquo;s it.
 But this distinction was hiding in the architecture from the beginning, silently
 implied by whether <code>client_root</code> was present. Making it explicit was the
 right thing to do, and it forced us to think clearly about what pyrpc actually does.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What was wrong before?</h2>
 <p>
 Previously, pyrpc had an implicit model: if you set <code>client_root</code> in
 <code>pyrpc.json</code>, types got written to that path. If you didn&rsquo;t, types
 weren&rsquo;t written anywhere. The behavior was inferred from which fields happened
 to exist in the config.
 </p>
 <p>
 This worked for the simple case (monorepo with a frontend folder), but it broke down
 when users asked: &ldquo;How do I run pyrpc without a frontend project?&rdquo; or
 &ldquo;How does this work with separate repositories?&rdquo; The answer was
 different for every user, because there was no explicit contract.
 </p>
 <p>
 GPT said it best during a design review:
 </p>
 <blockquote className="border-l-2 border-fd-muted-foreground/30 pl-4 italic">
 Heuristics that infer intent from whether a field happens to exist are not obvious,
 not explicit, and don&rsquo;t scale. The field should be required.
 </blockquote>
 <p>
 So we made <code>distribution</code> required. If you upgrade from an older config
 that lacks it, <code>pyrpc dev</code> detects the missing field and runs the setup
 wizard. One question, asked once, then it&rsquo;s stored forever.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Workspace mode</h2>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`{
 "distribution": "workspace",
 "client_root": "../frontend"
}`}</pre>
 <p>
 Workspace mode is the tRPC-like experience. The server writes TypeScript types
 directly to a client project on the same filesystem. The flow:
 </p>
 <ol className="space-y-2">
 <li><code>pyrpc dev</code> reads config, resolves <code>client_root</code>, validates it exists</li>
 <li>Watcher reloads the router on file changes</li>
 <li>After each reload, regenerates types and writes to <code>client_root/node_modules/@pyrpc/types</code></li>
 <li>The client imports types without any network request</li>
 </ol>
 <p>
 This is the mode most users will use, monorepo or same-repo setups where the
 server and client share a filesystem. It&rsquo;s fast, simple, and requires zero
 client-side configuration.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Server mode</h2>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`{
 "distribution": "server"
}`}</pre>
 <p>
 Server mode is for separate-repository setups. The server never touches the client&rsquo;s
 filesystem. Instead, it exposes the schema at <code>GET /rpc</code> (which the ASGI
 transport already did for introspection). The watcher reloads the router and updates the
 in-memory registry, but <strong>does not write types anywhere</strong>.
 </p>
 <p>
 The client fetches types on demand via <code>npx pyrpc sync</code>, which reads
 a <code>pyrpc-client.json</code> file (created during <code>npm install</code>),
 fetches the schema from the server URL, and regenerates <code>@pyrpc/types</code>.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why required and not inferred?</h2>
 <p>
 Three reasons:
 </p>
 <ol className="space-y-2">
 <li>
 <strong>Explicit config is self-documenting.</strong> Reading <code>distribution: "server"</code>
 tells you more about the deployment than the absence of <code>client_root</code>.
 The config file becomes a readable description of the architecture.
 </li>
 <li>
 <strong>No silent defaults.</strong> If someone accidentally deletes
 <code>client_root</code> from their config, the behavior changes silently.
 With a required <code>distribution</code> field, pyrpc refuses to guess.
 </li>
 <li>
 <strong>The wizard is the migration path.</strong> Old configs without
 <code>distribution</code> trigger the setup wizard. The user sees the
 distribution question exactly once, makes a choice, and never thinks about
 it again. No heuristics, no surprises.
 </li>
 </ol>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The wizard flow</h2>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`pyRPC Setup
Let's configure pyRPC for your project.

Which web framework are you using?
 fastapi (default) flask asgi

Python module to scan for @rpc procedures (e.g. main, app.main)
 app.main

How are types distributed to the client?
 workspace (default) server

(If workspace) Where is your TypeScript client project?
 ../frontend`}</pre>
 <p>
 The distribution question is always asked during first-time setup. If you choose
 <code>workspace</code>, the wizard additionally prompts for <code>client_root</code>.
 If you choose <code>server</code>, the <code>client_root</code> prompt is skipped
 entirely, it would be meaningless.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">CLI flags</h2>
 <p>
 Like other config fields, <code>--distribution</code> is available as a flag:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`pyrpc dev --distribution server
pyrpc dev --distribution workspace --client-root ../frontend-v2
pyrpc dev --reconfigure # includes distribution question`}</pre>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The bottom line</h2>
 <p>
 A single required field, two possible values, one question in the wizard, and the
 entire type distribution model becomes explicit. No heuristics, no inference, no
 &ldquo;it depends on whether this other field exists.&rdquo; This is the kind of
 boring, explicit config that scales from a monorepo side project to an
 organization with separate frontend and backend repositories.
 </p>
 </section>
 </article>
 )
}