import Link from 'next/link'

export default function PyrpcDevWizardDesignPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 Designing the pyrpc dev setup wizard: two questions, zero friction
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 8, 2026 at 8:00am</time>
 <span>&middot;</span>
 <span>8 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 Most CLIs that need configuration make you answer ten questions before they let you work.
 pyRPC&rsquo;s first-run wizard asks the minimum that cannot be guessed, and guesses
 everything else. The result: a <code>pyrpc.json</code> that appears after two prompts and
 never asks again.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Question one: the entry module
 </h2>
 <p>
 The first question is the one thing pyRPC genuinely cannot infer: which Python module contains
 your <code>@rpc</code> procedures and your <code>mount_fastapi</code>/<code>mount_flask</code>
 call? The wizard does narrow it down, though. It checks the conventional filenames
, <code>main.py</code>, <code>server.py</code>, <code>app.py</code>, <code>app/main.py</code>
, and pre-fills the first hit:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`default_module = "main"
for candidate in ["main.py", "server.py", "app.py", "app/main.py"]:
 if (Path(root) / candidate).exists():
 default_module = candidate.replace(".py", "").replace("/", ".")
 break

module = questionary.text(
 "Entry module",
 default=default_module,
 instruction="(e.g. main, app.server, the file that calls mount_fastapi/mount_flask)",
).ask()`}</pre>
 <p>
 Accepting the default is one keystroke. The candidate list encodes the platform&rsquo;s
 conventions, so the prompt is almost always pre-answered correctly before you see it.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Question two: where do your clients live?
 </h2>
 <p>
 The second question has three shapes depending on what the tree-walk found. That&rsquo;s the
 interesting part, the wizard branches on evidence before it asks:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`detected_projects = _find_frontend_projects(root)

if not detected_projects:
 # ask client root + framework directly
 ...
if len(detected_projects) == 1:
 # pre-fill client root and framework from the detection
 ...
# multiple: list them, then select or enter manually`}</pre>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>Nothing detected</strong>, asks for a client root (default <code>.</code>) and a framework from the menu (<code>Next.js, Nuxt, Svelte, Vite, Astro, Other</code>).</li>
 <li><strong>Exactly one project detected</strong>, both fields come pre-filled from the detection; you confirm and move on.</li>
 <li><strong>Several projects detected</strong>, prints the list, then lets you multi-select the ones to wire up, writing <code>clients</code> and <code>framework: "Mixed"</code>.</li>
 </ul>
 <p>
 In every branch the number of <em>new</em> prompts stays tiny, because detection does the
 work of memory. The wizard&rsquo;s job is confirmation, not interrogation.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Runs once, by construction
 </h2>
 <p>
 The wizard only fires when there is no <code>pyrpc.json</code> to read. In <code>dev</code>,
 the config lookup happens first; the wizard is the fallback:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`cfg_path = _find_config()

elif cfg_path is None or reconfigure:
 cfg = _run_wizard(cwd)
 cfg_path = _write_config(cfg)
 console.print(f" [green]✓[/green] pyrpc.json created")
else:
 with open(cfg_path) as f:
 cfg = json.load(f)`}</pre>
 <p>
 The second run reads the file, asks nothing, and starts the server. And when the wizard has
 to run again, via <code>--reconfigure</code>, it always writes a fresh config
 rather than merging, so re-running setup never leaves half-updated state behind.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Design principles
 </h2>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>Ask only what cannot be guessed.</strong> Framework and client root are detectable from config files; the entry module is a guess you confirm. Never prompt for answers the filesystem already knows.</li>
 <li><strong>Pre-fill from convention.</strong> The default is always the most likely answer, so the fast path is <code>Enter</code> &times; 2.</li>
 <li><strong>Write once, read forever.</strong> The config is durable, committed, and re-read by <code>dev</code>, <code>watch</code>, and <code>codegen</code>, the wizard is a one-time cost.</li>
 <li><strong>Graceful exits.</strong> <code>None</code> from any prompt (Ctrl+C) raises <code>typer.Exit(code=0)</code>, canceling setup is a clean no-op, not an error.</li>
 </ul>
 <p>
 The wizard exists to disappear. After the first run it is a line in a config file, and the
 <code>--yes</code> flag can skip even that.
 </p>
 <p>
 Read the full
 <Link href="/changelog" className="text-fd-foreground underline"> changelog</Link>
 for the complete list of changes.
 </p>
 </section>
 </article>
 )
}
