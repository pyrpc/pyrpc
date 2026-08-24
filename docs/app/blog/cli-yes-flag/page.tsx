import Link from 'next/link'

export default function CliYesFlagPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 pyrpc dev --yes: non-interactive setup for CI and scripts
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 8, 2026 at 4:00pm</time>
 <span>&middot;</span>
 <span>7 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 Interactive wizards are great for humans and terrible for machines. A CI job, a Docker
 build, or a setup script cannot answer prompts, and a tool that blocks on input in one
 of those contexts is broken. That is why <code>pyrpc dev</code> ships a fully non-interactive
 mode behind a single flag: <code>--yes</code>.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Fully explicit: --yes --module --client
 </h2>
 <p>
 When you supply both values on the command line, nothing is detected and nothing is asked:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`if yes and module and client:
 # Fully non-interactive: all values supplied on the command line.
 cfg = {"module": module, "framework": "Other", "client": client}
 if cfg_path is None:
 cfg_path = _write_config(cfg)
 console.print(f" [green]✓[/green] pyrpc.json created")`}</pre>
 <p>
 This is the deterministic form for CI: <code>pyrpc dev --yes --module main --client
 ../frontend</code>. The same command run a hundred times produces the same config. It writes
 <code>pyrpc.json</code> only if one does not already exist, a pre-existing config is
 respected and read instead.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Auto-detected: --yes alone
 </h2>
 <p>
 With <code>--yes</code> but no explicit flags, the CLI auto-detects everything it can:
 </p>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>Module</strong>, first match of <code>main.py</code>, <code>server.py</code>, <code>app.py</code>, <code>app/main.py</code>.</li>
 <li><strong>Client + framework</strong>, via <code>_find_frontend_projects</code>. Exactly one project &rarr; it is used. Several projects &rarr; hard error listing them and pointing at <code>--client</code>. None &rarr; no client configured, framework <code>"Other"</code>.</li>
 </ul>
 <p>
 The multiple-projects case deserves emphasis. Rather than silently pick the first frontend it
 finds, a guess that would generate types into the wrong app, the CLI refuses and
 tells you exactly how to disambiguate:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`elif len(detected_projects) > 1:
 console.print("[red]✗ Multiple TypeScript projects found.[/red]\\n")
 for p, _ in detected_projects:
 console.print(f" • {p}")
 console.print("\\n[dim]Specify which client to use:[/dim]\\n")
 console.print(" [cyan]pyrpc dev --client <path>[/cyan]\\n")
 raise typer.Exit(1)`}</pre>
 <p>
 Non-interactive mode still refuses to guess in ambiguous situations, it just reports the
 ambiguity in a machine-readable way (a non-zero exit) instead of asking a human.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 The result is a summary line, not a dialog
 </h2>
 <p>
 After detection, <code>--yes</code> prints a compact line that captures the decision:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`if resolved_client is not None:
 console.print(f" [dim]module={cfg['module']} client={cfg['client']}[/dim]")
else:
 console.print(f" [dim]module={cfg['module']} (no client configured)[/dim]")`}</pre>
 <p>
 With no client configured, type generation is skipped at startup and the dev console shows
 <code>○ no clients configured, skipping type generation</code>. This is a legitimate state:
 a pure-API server, or a frontend that will be configured later.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Where non-interactive mode shines
 </h2>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>CI</strong>, regenerate types in a build step with <code>--yes --module main --client ./frontend</code>, deterministic every run.</li>
 <li><strong>Container image builds</strong>, a Dockerfile layer that pre-generates types cannot hang on a prompt; <code>--yes</code> guarantees it cannot.</li>
 <li><strong>Scripted onboarding</strong>, repo setup scripts, devcontainer post-create hooks, and Makefile targets can configure pyRPC without user input.</li>
 </ul>
 <p>
 <code>--yes</code> rounds out the setup matrix: the wizard for humans, explicit flags for the
 deterministic case, and auto-detection for the &ldquo;I just want it to work&rdquo; case. Each
 path ends in the same <code>pyrpc.json</code>.
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
