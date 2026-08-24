import Link from 'next/link'

export default function V060ReleasePost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 v0.6.0 - Client distribution and package standardization
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>June 6, 2026 at 2:00pm</time>
 <span>&middot;</span>
 <span>10 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 v0.6.0 completes the distribution story with a proper client-side CLI
 and cleans up the packaging foundation that&rsquo;s been accumulating
 small debts since the earliest releases. Two branches, one release, the first
 adds new capabilities, the second pays down technical debt.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Client-side distribution: npx pyrpc sync
 </h2>
 <p>
 The distribution model introduced in v0.5.0 defined <em>workspace</em> and
 <em>server</em> modes on the server side. This release completes the picture
 by adding the client-side counterpart, <code>npx pyrpc sync</code>.
 </p>
 <p>
 When a frontend developer installs <code>@pyrpc/client</code>, the postinstall
 script now asks one question:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{"> npm install @pyrpc/client"}{""}
{"? How are types distributed?"}
{" workspace (default) - types in node_modules/@pyrpc/types"}
{" server - types fetched via HTTP"}</pre>
 <p>
 If they choose <code>server</code>, the script prompts for the server URL
 and creates a <code>pyrpc-client.json</code> file in the project root:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`{
 "distribution": "server",
 "server_url": "http://localhost:8000"
}`}</pre>
 <p>
 This file is the client&rsquo;s config. It&rsquo;s checked into version control
 so every developer on the team gets the same setup.
 </p>
 <p>
 With <code>pyrpc-client.json</code> in place, the developer runs:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{"> npx pyrpc sync"}
{" Fetching schema from http://localhost:8000/rpc..."}
{" Regenerating @pyrpc/types..."}
{" Done."}</pre>
 <p>
 The <code>npx pyrpc sync</code> command reads the config, fetches
 <code>GET /rpc</code> from the server, and regenerates
 <code>@pyrpc/types</code> in-place. The client never needs to know
 about the server&rsquo;s file system, it pulls types on demand.
 </p>
 <p>
 This means the full server-mode flow is now:
 </p>
 <ol className="space-y-2">
 <li>Backend: <code>pyrpc dev --distribution server</code></li>
 <li>Frontend: <code>npm install @pyrpc/client</code> (postinstall creates <code>pyrpc-client.json</code>)</li>
 <li>Frontend: <code>npx pyrpc sync</code> (fetches types from server)</li>
 <li>Frontend: Types are ready in <code>@pyrpc/types</code></li>
 </ol>
 <p>
 Previously, server-mode users had to manually copy types or set up
 a separate CI pipeline. Now it&rsquo;s a single command.
 </p>

 <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">
 Why a postinstall prompt instead of pyrpc init?
 </h3>
 <p>
 We considered adding a <code>npx pyrpc init</code> command to prompt
 for the same information, but the postinstall approach is better:
 </p>
 <ul className="space-y-2">
 <li>
 <strong>Zero discoverability problem.</strong> The question appears
 right after <code>npm install</code>, when the developer is already
 thinking about setup. They don&rsquo;t need to know a separate
 command exists.
 </li>
 <li>
 <strong>Config is created atomically.</strong> Every frontend project
 that installs <code>@pyrpc/client</code> gets a
 <code>pyrpc-client.json</code> from the start. No &ldquo;forgot to
 run init&rdquo; bugs.
 </li>
 <li>
 <strong>Workspace mode is silent.</strong> If the developer chooses
 workspace, the postinstall script creates a minimal config and exits.
 No friction for the common case.
 </li>
 </ul>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Package standardization
 </h2>
 <p>
 Alongside the client-side distribution work, we cleaned up several
 packaging issues that had been lingering across the codebase.
 </p>

 <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">
 Tests live with their packages
 </h3>
 <p>
 The root <code>tests/</code> directory has been dismantled. Each Python
 package now owns its tests:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`Before: tests/ After: packages/pyrpc-core/tests/
 tests/test_codegen.py packages/pyrpc-codegen/tests/
 tests/test_fastapi.py packages/pyrpc-fastapi/tests/
 tests/test_flask.py packages/pyrpc-flask/tests/`}</pre>
 <p>
 Tests run via <code>pytest</code> from the workspace root, with
 <code>pyproject.toml</code> pointing <code>testpaths</code> to the
 package-level directories. The change is invisible to CI but makes
 the relationship between test and package explicit, especially
 useful when working on a single package in isolation.
 </p>
 <p>
 We also renamed <code>test_client.py</code> to
 <code>test_python_client.py</code> in pyrpc-core to avoid ambiguity
 with the TypeScript <code>@pyrpc/client</code> test terminology.
 </p>

 <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">
 pyrpc.dev to pyrpc.com
 </h3>
 <p>
 The domain migrated from <code>pyrpc.dev</code> to
 <code>pyrpc.com</code>. Every reference across the codebase, 
 documentation, links, comments, was updated at once rather
 than letting old links accumulate. This affected roughly 30 files.
 </p>

 <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">
 Em dashes and encoding
 </h3>
 <p>
 The codebase had a mix of em dashes (U+2014 ) and regular
 dashes (-). Some files used em dashes in code strings, which caused
 subtle issues on Windows systems with cp1252 encoding. We normalized
 everything to regular dashes. While fixing this, we also repaired
 four files that had been corrupted by cp1252 and UTF-16 LE encoding
 issues, remnants of early development on mixed-platform setups.
 </p>

 <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">
 Package READMEs
 </h3>
 <p>
 Every Python package now has its own README covering what it does,
 who should use it, and how to install it:
 </p>
 <ul className="space-y-2">
 <li>
 <code>pyrpc-core</code>, The runtime, CLI, and codegen.
 One install, everything you need.
 </li>
 <li>
 <code>pyrpc-codegen</code>, The TypeScript generation
 library. Internal dependency, not installed directly.
 </li>
 <li>
 <code>pyrpc-core[fastapi]</code>, FastAPI adapter bundled as an extra.
 </li>
 <li>
 <code>pyrpc-core[flask]</code>, Flask adapter bundled as an extra.
 </li>
 </ul>
 <p>
 The READMEs serve as the entry point on PyPI, npm, and GitHub
 for someone exploring a single package.
 </p>

 <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">
 Framework adapters as extras
 </h3>
 <p>
 <code>pyrpc-core</code> now exposes <code>fastapi</code> and
 <code>flask</code> extras:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`pip install pyrpc-core # runtime + CLI + codegen
pip install pyrpc-core[fastapi] # + FastAPI adapter
pip install pyrpc-core[flask] # + Flask adapter`}</pre>
 <p>
 The adapter code lives inside the pyrpc-core extras, no
 separate packages to discover or version to track. This mirrors the
 pattern we established in v0.3.0 when we merged <code>pyrpc-cli</code>
 back into <code>pyrpc-core</code>: one package, optional extras,
 no unnecessary splits.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 The install story today
 </h2>
 <p>
 After this release, the package landscape is simpler:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`Python:
 pip install pyrpc-core # runtime + CLI + codegen
 pip install pyrpc-core[fastapi] # + FastAPI adapter
 pip install pyrpc-core[flask] # + Flask adapter

TypeScript:
 npm install @pyrpc/client # client + postinstall prompt
 npx pyrpc sync # fetch types from server`}</pre>
 <p>
 Two languages, three commands, one version number across all packages.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 What&rsquo;s next
 </h2>
 <p>
 The distribution story is now complete: workspace mode for monorepos,
 server mode for separate repositories, and the client-side tooling
 that makes both workflows seamless. The packaging cleanup removes
 the friction points that developers hit when browsing individual
 packages or contributing on Windows.
 </p>
 <p>
 Next, we&rsquo;re turning to documentation and examples
, filling in the gaps that new users encounter when they
 first try pyrpc. Read the full
 <Link href="/changelog" className="text-fd-foreground underline"> changelog</Link>
 for the complete list of changes.
 </p>
 </section>
 </article>
 )
}
