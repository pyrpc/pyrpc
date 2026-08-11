import Link from 'next/link'

export default function WizardManualEntryPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Manual entry as a first-class wizard action
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 11, 2026 at 3:00pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    v0.11.1 contains a small change with a large consequence for the
                    first-run setup wizard. When <code>pyrpc dev</code> detects more
                    than one frontend project in your repository, it asks how you want
                    to configure clients. In v0.11.0 that question mixed the
                    <code>Enter a client path manually</code> escape hatch into the
                    same checkbox list as the detected projects &mdash; a design that
                    could silently throw away your checked selections. v0.11.1 makes
                    manual entry a first-class action, chosen <em>before</em> the
                    checkbox ever appears, so your selections can never be discarded.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    The multi-project branch of the wizard
                </h2>
                <p>
                    The whole flow lives in <code>_run_wizard</code> in
                    <code>pyrpc_core/cli.py</code>. After you type the entry module,
                    the wizard calls <code>_find_frontend_projects(root)</code>, which
                    walks the directory tree looking for known framework config files
                    and skips <code>node_modules</code>, <code>__pycache__</code>,
                    <code>.venv</code>, <code>venv</code>, <code>env</code>,
                    <code>dist</code>, <code>build</code>, <code>.git</code>,
                    <code>.next</code>, and any dot-directory. The result is a list of
                    <code>(path, framework)</code> pairs &mdash; for example
                    <code>("./frontend", "Next.js")</code> and
                    <code>("./admin", "Vite")</code>.
                </p>
                <p>
                    Three outcomes are possible. If the list is empty, you get a plain
                    text prompt for the client root plus a framework
                    <code>questionary.select</code>. If it contains exactly one
                    project, the text prompt is pre-filled with that path and the
                    framework select is pre-set to the detected framework &mdash; the
                    wizard does the work for you. The interesting case &mdash; and the
                    one v0.11.1 fixes &mdash; is when <em>multiple</em> projects are
                    detected. First the wizard prints what it found:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# _run_wizard — multi-project branch (v0.11.1)
console.print("\n[bold]Detected frontend projects:[/bold]")
for path, fw in detected_projects:
    console.print(f"  • [cyan]{path}[/cyan]  [dim]({fw})[/dim]")

action = questionary.select(
    "How would you like to configure clients?",
    choices=["Select detected projects", "Enter a client path manually"],
).ask()
if action is None:
    raise typer.Exit(code=0)`}</pre>
                <p>
                    The two choices are mutually exclusive modes, not selections.
                    Picking <code>Enter a client path manually</code> skips the
                    checkbox entirely and returns a single-client config:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`if action == "Enter a client path manually":
    client = questionary.text("Client project root", default=".").ask()
    if client is None:
        raise typer.Exit(code=0)
    framework = questionary.select(
        "Frontend framework", choices=_FRAMEWORK_LABELS, default="Next.js"
    ).ask()
    if framework is None:
        raise typer.Exit(code=0)
    return {"module": module, "framework": framework, "client": client}

choices = [f"{path} ({fw})" for path, fw in detected_projects]
while True:
    selections = questionary.checkbox("Select detected projects", choices=choices).ask()
    if selections is None:
        raise typer.Exit(code=0)
    if selections:
        break
    console.print("[yellow]No projects selected — choose at least one or press Ctrl+C to cancel.[/yellow]")`}</pre>
                <p>
                    Note the two config shapes. Manual entry returns a
                    <code>"client"</code> key (a single path); project selection
                    returns a <code>"clients"</code> key (a list of paths). The rest
                    of the CLI never needs to know which path you took:
                    <code>_get_clients(cfg)</code> normalizes both forms into a list,
                    so <code>dev</code>, <code>watch</code>, and the codegen path all
                    consume the same structure.
                </p>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">
                    How checkbox labels become client paths
                </h3>
                <p>
                    The checkbox choices are display strings &mdash; each detected
                    project rendered as <code>path (framework)</code>, e.g.
                    <code>./frontend (Next.js)</code>. Questionary hands back the
                    strings the user checked, so the wizard has to reverse-map them to
                    the bare paths before they reach the config:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`clients = []
for sel in selections:
    for p, f in detected_projects:
        if sel == f"{p} ({f})":
            clients.append(p)
            break
return {"module": module, "framework": "Mixed", "clients": clients}`}</pre>
                <p>
                    This mapping is a good example of why the checkbox now contains
                    <em>only</em> detected projects: the reverse lookup works because
                    every choice is a real <code>(path, framework)</code> pair. If a
                    non-path label had slipped in as a choice, it would either fail to
                    match anything (and vanish silently) or worse, be appended to
                    <code>clients</code> verbatim as garbage. Both were failure modes
                    of the v0.11.0 design. Note also the framework value: when you
                    pick several projects, no single framework label fits, so the
                    wizard records <code>"Mixed"</code> and the per-client framework
                    that matters &mdash; Next.js, Vite, and so on &mdash; lives on
                    each client&rsquo;s own side of the tree.
                </p>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">
                    What changed in v0.11.1
                </h3>
                <p>
                    In v0.11.0, manual entry was offered as an item <em>inside</em> the
                    checkbox list, right next to the detected projects. The failure
                    mode is the classic one for mixing a meta-action into a data list:
                    the two cannot be reconciled. Choose manual entry and your
                    detected-project selections are thrown away; choose it alongside
                    the projects and the config is handed a value that is not a real
                    path. Either way, the wizard silently ignored part of what you
                    told it &mdash; the exact kind of quiet data loss that setup flows
                    must never have.
                </p>
                <p>
                    v0.11.1 splits the concern. A <code>questionary.select</code> asks
                    the mode question first. The checkbox that follows only ever
                    contains detected projects, one per line, so every checked value
                    is guaranteed to be a real client root.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    A select is a mode, a checkbox is a data set
                </h2>
                <p>
                    The change encodes an interaction-design principle worth stating
                    explicitly: <strong>don&rsquo;t let a secondary action destroy
                    primary selections</strong>. A <code>questionary.select</code> is a
                    mutually exclusive choice between modes &mdash; &ldquo;how should I
                    configure clients?&rdquo; A <code>questionary.checkbox</code> is a
                    multi-select of values <em>within</em> a single mode &mdash;
                    &ldquo;which of these detected projects?&rdquo; Putting a mode
                    switch inside a value list blurs that boundary.
                </p>
                <p>
                    When a control is simultaneously a value and a command, the user
                    cannot express &ldquo;both&rdquo;, so the tool must pick one meaning
                    and the other is lost. The user&rsquo;s mental model is that a
                    checkbox collects things; discovering that one of the items was
                    actually a redirect &mdash; and that checking it erased the other
                    selections &mdash; is exactly the kind of surprise that erodes
                    trust in a setup tool. By promoting manual entry to a
                    <em>mode</em>, the two concerns become orthogonal: you first decide
                    <em>how</em> to configure clients, then you supply the data for
                    that mode. A mode can never erase data you haven&rsquo;t chosen
                    yet, and selections made in one mode never leak into the other.
                </p>
                <p>
                    The principle generalizes well beyond wizards. Toolbars that mix
                    commands into a list of items, menus where a menu item doubles as
                    a setting toggle, config forms where a checkbox both enables a
                    feature and selects its sub-options &mdash; all share the same
                    structural flaw: one control, two incompatible meanings. The
                    rule of thumb is to keep <em>modes</em> (exclusive, whole-flow
                    decisions) in a select or segmented control, and to keep
                    <em>values</em> (additive, per-item decisions) in a checkbox.
                    Anything that changes what the <em>rest</em> of the form means is
                    a mode, and modes should be decided before values are collected,
                    never inside the value collector.
                </p>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">
                    The empty-selection loop
                </h3>
                <p>
                    The other half of the fix guards the checkbox itself.
                    <code>questionary.checkbox</code> returns an empty list when you
                    confirm with nothing checked &mdash; and all options start
                    unchecked by default. In v0.11.0, an empty selection flowed
                    straight into the config as <code>"clients": []</code>, and
                    <code>dev</code> later printed <code>○ no clients configured
                    &mdash; skipping type generation</code>: no error, no retry, just a
                    quietly empty configuration. The wizard had asked a question, the
                    user had (accidentally) answered &ldquo;none&rdquo;, and the tool
                    accepted it.
                </p>
                <p>
                    Now the checkbox lives in a <code>while True</code> loop. A
                    confirmed empty selection re-asks instead of proceeding, printing
                    the yellow hint <code>No projects selected &mdash; choose at least
                    one or press Ctrl+C to cancel.</code>                     The message is deliberately
                    actionable: it tells you both how to fix the situation and how to
                    escape it. The only ways out of the loop are a non-empty selection
                    or cancellation.
                </p>
                <p>
                    There is a subtle reason this retry lives in the wizard and
                    nowhere else. A non-interactive command like <code>pyrpc dev
                    --yes</code> or a CI job must never block on a loop &mdash; it
                    either succeeds or fails loudly. But the wizard is the one place
                    where a human is actively looking at the screen, so a retry costs
                    nothing and a silent empty config costs a whole debugging session
                    later. The loop is the interactive counterpart to the
                    non-interactive failure: the wizard refuses to produce a config
                    that means &ldquo;nothing&rdquo;, just as <code>--yes</code>
                    refuses to guess when it can&rsquo;t detect a unique client.
                </p>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">
                    Ctrl+C is always the escape
                </h3>
                <p>
                    Every <code>questionary</code> prompt in the wizard returns
                    <code>None</code> when cancelled with Ctrl+C, and every call is
                    checked immediately: <code>if selections is None: raise
                    typer.Exit(code=0)</code>. Cancellation is a first-class exit path
                    everywhere &mdash; never a crash, never a swallowed
                    <code>KeyboardInterrupt</code>. The re-prompt loop is deliberately
                    the <em>only</em> place that behaves differently: a cancelled
                    prompt still aborts cleanly, while an empty-but-confirmed
                    selection is re-asked. That distinction matters. Ctrl+C is
                    unambiguous user intent (&ldquo;stop&rdquo;); pressing Enter on an
                    empty checkbox is almost always an accident (&ldquo;I meant to pick
                    something&rdquo;). Only the latter deserves a second chance.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    What the fix protects
                </h2>
                <p>
                    The setup wizard is the first thing a new user touches, and it
                    runs exactly once &mdash; the resulting <code>pyrpc.json</code>
                    drives every later command. A configuration error here is a
                    configuration error everywhere, silently: the wrong client list
                    means the wrong <code>__pyrpc.d.ts</code> files get written, or
                    none at all. The deeper lesson is that in a setup flow, every
                    prompt is a chance to lose user data. Selections are the primary
                    thing a user produces; escape hatches (manual entry, cancellation)
                    are secondary. Secondary actions should never be able to erase
                    primary selections.
                </p>
                <p>
                    v0.11.1 also ships regression tests covering the manual-entry
                    branch of the wizard, so the split stays split: manual entry as a
                    separate action, checkbox selections as pure data, and an
                    empty-selection loop that refuses to produce a
                    <code>"clients": []</code> config. If you&rsquo;re curious how the
                    rest of the multi-client config flows through the system, the
                    <Link href="/blog/pyrpc-json-lifecycle" className="text-fd-foreground underline">pyrpc.json lifecycle post</Link>
                    traces it end to end, and the
                    <Link href="/docs/get-started/quickstart" className="text-fd-foreground underline">quickstart</Link>
                    shows the wizard from the outside.
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
