import Link from 'next/link'

export default function V032Post() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 v0.3.2 - Cleaner terminal, smarter prompts, no more :app confusion
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>June 3, 2026 at 6:00pm</time>
 <span>&middot;</span>
 <span>6 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 v0.3.2 is a UX-focused release. No new features, no breaking changes, 
 just the kind of polish that makes a tool feel like it was built for people.
 Three areas got attention: the first-run setup flow, the terminal output,
 and the import path handling.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The setup flow: from text input to arrow keys</h2>
 <p>
 The old framework prompt used <code>rich.prompt.Prompt.ask()</code>, which
 showed the choices but required you to <em>type</em> the name. A small friction,
 but friction at the very first impression sets the tone.
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`Before:
 Which web framework are you using? (fastapi/flask/asgi): _

After:
 ? Which web framework are you using?
 > fastapi
 flask
 asgi`}</pre>
 <p>
 Now powered by <code>questionary</code>, the framework picker is an
 arrow-key select menu, the same pattern you see in Better Auth,
 Prisma, and every modern CLI. One keypress instead of typing.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Entry point: what does :app even mean?</h2>
 <p>
 The old prompt read <code>Entry point (e.g. app.main:app)</code> with a
 default of <code>app.main:app</code>. This looks like Uvicorn&rsquo;s
 <code>module:variable</code> convention, but pyrpc&rsquo;s
 <code>dev</code> command <strong>never used the <code>:app</code> part</strong>.
 It just imports the module to trigger <code>@rpc</code> decorator registration.
 The <code>app</code> variable is created internally.
 </p>
 <p>
 The prompt now says <code>Python module to scan for @rpc procedures (e.g. main, app.main)</code>
 with a default of <code>main</code>. No more colon syntax. No more confusion
 about what variable name to use. Just the module path.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why <code>main</code> gave &ldquo;No module named &lsquo;main&rsquo;&rdquo;</h2>
 <p>
 This was the bug that triggered the whole release. A user ran <code>pyrpc dev</code>,
 entered <code>main</code> at the prompt, and got:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">Error regenerating types: No module named 'main'</pre>
 <p>
 The problem: <code>reload_module()</code> calls <code>importlib.import_module("main")</code>
 but never ensured the current working directory was on <code>sys.path</code>.
 The <code>serve</code> command&rsquo;s <code>_import_module()</code> helper
 <em>did</em> add it (<code>sys.path.append(os.getcwd())</code>), but the
 dev command&rsquo;s <code>regenerate()</code> went straight to
 <code>reload_module()</code> without it.
 </p>
 <p>
 The fix follows Uvicorn&rsquo;s standard: <code>sys.path.insert(0, os.getcwd())</code>
 before any user module import. We also changed <code>_import_module()</code>
 from <code>append</code> to <code>insert(0, ...)</code> for consistency.
 Now <code>main</code> finds <code>main.py</code> in the current directory,
 just like <code>uvicorn main:app</code> does.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Terminal output: less noise, more signal</h2>
 <p>
 The old <code>pyrpc dev</code> terminal was loud:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`Generating initial TypeScript types...
 (big Panel box)
 Watching 1 directories for Python changes...
 pyrpc> type help for commands
 INFO: Will watch for changes in these directories: [...]
 INFO: Started reloader process [21332] using WatchFiles
 INFO: Started server process [14932]
 INFO: Waiting for application startup.
 INFO: Application startup complete.`}</pre>
 <p>
 The new output:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{` âœ“ Types regenerated (3 procs)

 pyRPC dev server http://127.0.0.1:8000/rpc
 Types: node_modules/@pyrpc/types/src/index.ts

type help for commands
pyrpc>`}</pre>
 <p>
 Specific changes:
 </p>
 <ul className="space-y-2">
 <li><strong>Uvicorn logs suppressed</strong>, <code>--log-level error</code> on the subprocess kills 6 lines of reloader/server spam.</li>
 <li><strong>Panel box gone</strong>, replaced with a clean 2-line status block. No borders, no padding, just what you need.</li>
 <li><strong><code>pyrpc&gt;</code> prompt actually renders</strong>, was using raw <code>input()</code> which showed <code>[cyan]pyrpc&gt;[/cyan]</code> as literal text. Now uses <code>console.input()</code>.</li>
 <li><strong>No &ldquo;Generating initial types&rdquo;</strong>, types generate silently on startup.</li>
 <li><strong>No &ldquo;Watching X directories&rdquo;</strong>, the user doesn&rsquo;t need to know.</li>
 <li><strong>Consistent symbol prefixes</strong>, <code>âœ“</code> for success, <code>âœ-</code> for error, <code>âš </code> for warning, <code>â-‹</code> for in-progress. Borrowed from the pattern Next.js, tRPC, and Better Auth use, scannable at a glance.</li>
 </ul>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Help text updated everywhere</h2>
 <p>
 Every command argument that referenced the old <code>app.main</code> convention
 was updated to match the new wording: <code>Python module to scan for @rpc procedures (e.g. main, app.main)</code>.
 Consistent across <code>dev</code>, <code>serve</code>, and <code>pull</code>.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Full changelog</h2>
 <ul className="space-y-2">
 <li><strong>Dependencies:</strong> Added <code>questionary&gt;=2.0.0</code> for interactive CLI prompts.</li>
 <li><strong>Setup flow:</strong> Framework picker changed from <code>rich.prompt.Prompt.ask</code> (text input) to <code>questionary.select</code> (arrow-key menu). Entry point prompt simplified to <code>Python module to scan for @rpc procedures (e.g. main, app.main)</code> with default <code>main</code>.</li>
 <li><strong>Import path:</strong> <code>sys.path.insert(0, os.getcwd())</code> added in <code>dev()</code> before module import. <code>_import_module()</code> changed from <code>sys.path.append</code> to <code>sys.path.insert(0, ...)</code>. Now matches Uvicorn&rsquo;s standard <code>--app-dir</code> behavior.</li>
 <li><strong>Terminal DX:</strong> Uvicorn subprocess uses <code>--log-level error</code>. Panel box replaced with minimal status lines. <code>input()</code> replaced with <code>console.input()</code> so Rich markup renders. Removed &ldquo;Generating initial types&rdquo;, &ldquo;Watching X directories&rdquo;, and &ldquo;Types regenerated&rdquo; verbose lines. Error/success messages use consistent <code>âœ“</code>, <code>âœ-</code>, <code>âš </code>, <code>â-‹</code> symbol prefixes.</li>
 <li><strong>Help text:</strong> Updated <code>dev</code>, <code>serve</code>, and <code>pull</code> argument descriptions to match new wording.</li>
 </ul>

 <p className="mt-8">
 See the <Link href="/changelog" className="underline underline-offset-2 hover:text-fd-foreground transition-colors">full changelog</Link> for details.
 </p>
 </section>
 </article>
 )
}
