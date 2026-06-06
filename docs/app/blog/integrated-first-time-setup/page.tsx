import Link from 'next/link'

export default function FirstTimeSetupPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    No pyrpc init needed: designing the integrated setup wizard
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 6, 2026 at 9:00am</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Many CLI tools have a separate <code>init</code> or <code>setup</code> command.
                    You run <code>pyrpc init</code>, answer a few questions, and it creates a
                    config file. Then you run <code>pyrpc dev</code> to start working. Two commands,
                    one configuration step, one dev step.
                </p>
                <p>
                    pyrpc doesn&rsquo;t have an <code>init</code> command. The setup wizard is
                    embedded inside <code>pyrpc dev</code>. This was a deliberate design decision
                    with three motivations.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Motivation 1: Reduce context-switching</h2>
                <p>
                    Every command the user runs is a context switch. &ldquo;Which command do I run
                    first?&rdquo; is a question that every new-user tutorial has to answer. When
                    the setup and the dev server are the same command, the tutorial reduces to one
                    step:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# Two commands (traditional approach):
pyrpc init           # "What framework? What module? Where's the client?"
pyrpc dev            # Start the server

# One command (integrated approach):
pyrpc dev            # "First run? Let's set up. Also, server's starting."`}</pre>
                <p>
                    The integrated approach is what <code>npm create</code>, <code>npx create-react-app</code>,
                    and <code>uv init</code> do: they combine scaffolding with first-run experience.
                    pyrpc takes the same philosophy: the first invocation of <code>pyrpc dev</code>
                    detects the missing config, walks through setup, writes the config, starts the
                    server, and generates types &mdash; all in one command.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Motivation 2: The wizard is always accessible via <code>--reconfigure</code></h2>
                <p>
                    If setup and dev are separate commands, what happens when the user needs to
                    change their configuration later? Do they run <code>pyrpc init</code> again?
                    Does it overwrite the existing config? Do they need a separate
                    <code>pyrpc reconfigure</code> command?
                </p>
                <p>
                    With the integrated approach, the <code>--reconfigure</code> flag re-runs the
                    exact same wizard, pre-filled with the current config values as defaults:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`pyrpc dev --reconfigure

# Previously entered values appear as defaults:
# ? Which web framework?  (fastapi)
# ? Python module:  (app.main)
# ? TypeScript client path:  (../frontend)`}</pre>
                <p>
                    The <code>previous</code> parameter flows through the wizard pipeline:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _prompt_for_config(previous=None):
    default_framework = (previous or {}).get("framework", "fastapi")
    default_entry = (previous or {}).get("entrypoint", "main")
    default_client = (previous or {}).get("client_root", "")
    
    framework = questionary.select(..., default=default_framework).ask()
    entry = questionary.text(..., default=default_entry).ask()
    client_root = questionary.text(..., default=default_client).ask()
    
    return {"framework": framework, "entrypoint": entry, "client_root": client_root}`}</pre>
                <p>
                    This means <code>--reconfigure</code> is never destructive. The user enters
                    the wizard, sees their current values, and changes only what they need. If they
                    cancel (Ctrl+C or Escape at any prompt), the config file is untouched.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Motivation 3: CLI flags can skip the wizard entirely</h2>
                <p>
                    What about users who don&rsquo;t want an interactive wizard at all? CI scripts,
                    Dockerfiles, experienced users who know their config values? The integrated
                    design also accepts CLI flags that skip the wizard:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# No wizard, no prompts, no TTY required:
pyrpc dev --framework fastapi --entry main --client-root ../frontend

# Or update just one value without re-answering everything:
pyrpc dev --client-root ../new-client`}</pre>
                <p>
                    The flag-based path writes the config file directly (including a version field)
                    without ever calling <code>questionary</code>. This is how CI scripts will
                    eventually set up pyrpc &mdash; fast, deterministic, non-interactive.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What the wizard asks</h2>
                <p>
                    The wizard has exactly three questions, all required:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`? Which web framework are you using?
  > fastapi
    flask
    asgi

? Python module to scan for @rpc procedures (e.g. main, app.main)
  main_

? Where is your TypeScript client project? (relative path, e.g. ../frontend)
  ../frontend_`}</pre>
                <p>
                    Three questions was the minimum viable set. We considered making
                    <code>client_root</code> optional (for Python-only projects), but that created
                    a fourth &ldquo;do you have a TypeScript client?&rdquo; question which was
                    harder to explain. Three simple required fields, consistently ordered:
                    framework (the &ldquo;how&rdquo;), entrypoint (the &ldquo;what&rdquo;),
                    client_root (the &ldquo;where&rdquo;).
                </p>
                <p>
                    We also considered a &ldquo;skip&rdquo; option for each question. But skips
                    create ambiguity: what does skipping <code>client_root</code> mean? We don&rsquo;t
                    generate types? We generate them somewhere default? Every skipped value is a
                    question we&rsquo;ll have to ask again later. Three required fields, all at
                    once, is simpler.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">KeyboardInterrupt: the silent cancel</h2>
                <p>
                    Every <code>questionary.ask()</code> call can return <code>None</code>. This
                    happens when the user presses Ctrl+C, Escape, or when stdin is closed. pyrpc
                    checks every return value:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`framework = questionary.select(...).ask()
if framework is None:
    return None  # propagates up to _ensure_config → Exit(code=0)`}</pre>
                <p>
                    The <code>None</code> propagation goes through <code>_ensure_config</code>:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _ensure_config(...):
    if not reconfigure:
        config = _read_pyrpc_config()
        if config:
            return config  # existing config → skip wizard
    
    config = _prompt_for_config(...)
    if config is None:
        return None  # user cancelled
    
    _write_pyrpc_config(config)  # only called if config is non-None
    return config`}</pre>
                <p>
                    And finally to the <code>dev</code> command:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`if cfg is None:
    console.print("[yellow]Setup cancelled.[/yellow]")
    raise typer.Exit(code=0)  # clean exit, not an error`}</pre>
                <p>
                    The result: no stack traces, no half-written config files, no confusing state.
                    Just a clean &ldquo;Setup cancelled&rdquo; message and exit code 0 (not an
                    error &mdash; cancellation is a normal user action).
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Design principle: detect, don't require</h2>
                <p>
                    The overarching principle is &ldquo;detect, don&rsquo;t require.&rdquo;
                    <code>pyrpc dev</code> detects whether a config file exists. If it does,
                    it uses it. If it doesn&rsquo;t, it prompts. If flags are provided, it uses
                    them. The wizard is a fallback, not a prerequisite &mdash; it fires exactly
                    when the tool can&rsquo;t proceed without information it doesn&rsquo;t have.
                    This is the same principle that <code>git commit</code> follows (opens editor
                    only if no <code>-m</code> flag), and that <code>apt install</code> follows
                    (prompts for confirmation only in interactive terminals).
                </p>
            </section>
        </article>
    )
}
