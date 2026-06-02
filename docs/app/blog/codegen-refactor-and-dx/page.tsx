import Link from 'next/link'

export default function CodegenRefactorPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Cleaner codegen, one CLI, and a sharper story
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>May 29, 2026 at 10:00am</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    After the v0.2.0 release we stepped back and looked at the developer experience
                    more carefully. The type generation worked, async worked, but the tooling story
                    was fragmented and the messaging was unclear. Over the last week we shipped a
                    series of improvements that reshape how you interact with pyRPC &mdash; especially
                    if you are on the backend side.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Pattern A: one CLI, two subcommands</h2>
                <p>
                    The biggest structural change is how the codegen tooling is organized. We went
                    back and forth between splitting <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-pull</code> into
                    separate packages, but that created more confusion than it solved. One extra
                    pip install, one more thing to remember, one more version to track.
                </p>
                <p>
                    We settled on what we call <strong>Pattern A</strong>: a single <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code> package
                    that ships one CLI with five subcommands. The two you will use most:
                </p>
                <ul className="text-fd-muted-foreground">
                    <li><strong><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc pull</code></strong> &mdash; import a Python module, walk its <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">get_registry_schema()</code>, and save a portable JSON schema file. This is a server-side or CI tool. It pulls the schema <em>out</em> of Python and puts it on disk so codegen can run anywhere.</li>
                    <li><strong><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc codegen</code></strong> &mdash; read a schema file or a URL, generate TypeScript types. That is it.</li>
                </ul>
                <p>
                    This mirrors Prisma&rsquo;s <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">db pull</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">generate</code> split &mdash; one command to extract
                    state from the source of truth, another to produce artifacts from it. The cycle
                    is always: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pull</code>, then <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">codegen</code>. The two steps separate <em>where</em> the
                    schema comes from from <em>what</em> you do with it.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Lazy imports make codegen lightweight</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc codegen</code> accepts both file paths and URLs. If you pass a URL, it fetches the
                    schema over HTTP, transforms it, and writes TypeScript &mdash; all without ever
                    importing <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code>. The heavy framework dependencies (FastAPI, Pydantic, and
                    all their transitive deps) stay on disk. Only <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pull</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">serve</code>, and
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">inspect</code> trigger the lazy import.
                </p>
                <p>
                    This matters for CI pipelines and frontend-only workflows. If you are a
                    TypeScript developer who just needs to regenerate types from a deployed
                    server, you can <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pip install pyrpc-codegen</code> and run <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc codegen</code>
                    with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">PYRPC_URL</code> set &mdash; no Python backend setup required.
                </p>
                <p>
                    The implementation is straightforward: a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_lazy_import_pyrpc_core()</code> function
                    that does a deferred <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">import pyrpc_core</code>, and a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_load_schema()</code> dispatcher
                    that checks for an <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">http://</code> or <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">https://</code> prefix to decide between
                    HTTP fetch or filesystem read. No URL-guessing, no required protocol flag,
                    no accidental network calls on local paths.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Frontend DX: npm install and done</h2>
                <p>
                    The frontend side is now deliberately minimal. TypeScript developers do not
                    need to know about <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc pull</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc codegen</code>, or the CLI at all.
                    The entire setup is:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
                    npm install @pyrpc/client
                </pre>
                <p>
                    The postinstall script prompts for your server URL, fetches <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">GET /rpc</code>,
                    and generates <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">node_modules/@pyrpc/types/src/index.ts</code> with full type
                    definitions. Autocompletion works at compile time, no extra tooling, no
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npx</code>, no backend setup on the frontend machine.
                </p>
                <p>
                    For CI, set the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">PYRPC_URL</code> environment variable and the postinstall
                    runs headlessly:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
                    PYRPC_URL=https://api.example.com npm install @pyrpc/client
                </pre>
                <p>
                    We removed every mention of <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pull</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npx pyrpc</code>, and the CLI from
                    the frontend-facing documentation &mdash; the quickstart, the TypeScript client
                    guide, the installation page. If you are a frontend developer, none of that
                    exists. The only reference to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pull</code> lives in the CLI reference doc
                    where backend and CI developers will find it.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Cross-language story, not tRPC mimicry</h2>
                <p>
                    A recurring theme in early feedback was that pyRPC looked like &ldquo;tRPC, but
                    for Python&rdquo; &mdash; which implied it was a Python-only concept. The real
                    value is the bridge: Python backend, TypeScript frontend, shared types
                    across the language boundary.
                </p>
                <p>
                    We rewrote the home page, the comparison doc, and the CLI help text to lead
                    with this framing. The headline is now <strong>&ldquo;Python backend. TypeScript
                    frontend.&rdquo;</strong> The subtitle explains the rest: shared types, generated
                    clients, no manual API surface maintenance. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">vs tRPC</code> section
                    in the comparison doc now reads: <em>&ldquo;Python backend, TypeScript frontend,
                    shared types. Works across language boundaries.&rdquo;</em>
                </p>
                <p>
                    This is not cosmetic. It changes what developers expect when they evaluate
                    pyRPC. They are not choosing between tRPC and pyRPC for a TypeScript project.
                    They are choosing between manual API types and automatic ones when their
                    backend is Python and their frontend is TypeScript &mdash; which describes a
                    huge portion of full-stack web development.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">SECURITY.md gets the OSS treatment</h2>
                <p>
                    We rewrote <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">SECURITY.md</code> to match the standard that mature open-source
                    projects set. The new version has five clear sections:
                </p>
                <ul className="text-fd-muted-foreground">
                    <li><strong>Reporting</strong> &mdash; GitHub private advisories, what to include, expected response time, credit policy.</li>
                    <li><strong>Supported versions</strong> &mdash; only the latest minor before 1.0.0, no SLA for pre-releases.</li>
                    <li><strong>What is in scope</strong> &mdash; core protocol, adapter boundary, generated code, introspection endpoint, error responses.</li>
                    <li><strong>What is not in scope</strong> &mdash; upstream dependencies, already-compromised machines, old versions.</li>
                    <li><strong>What we do</strong> and <strong>what we cannot promise</strong> &mdash; transparent about the trust boundaries.</li>
                </ul>
                <p>
                    Security docs are rarely read until they are needed. When they are needed,
                    they need to be direct, specific, and practical. The old version was a dry
                    list of rules. The new one tells you exactly what to do, what we cover, and
                    where the responsibility shifts to you.
                </p>
                <p>
                    One notable addition: we explicitly state that pyRPC does not sandbox user
                    code. If you register a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code> procedure that deletes files, that is the
                    procedure author&rsquo;s responsibility. This is an honest boundary &mdash; we
                    do not want users assuming pyRPC provides a security layer it does not.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Windows compatibility fix</h2>
                <p>
                    A small but important fix: we replaced the Unicode checkmark (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[OK]</code> replaced
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[unicode-checkmark]</code>) and em-dashes (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">-</code> replaced <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[em-dash]</code>) in the
                    CLI output and templates. Windows terminals default to cp1252 encoding, which
                    does not support these characters. Running <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc pull</code> on Windows would
                    crash with a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">UnicodeEncodeError</code> before it ever wrote the schema file.
                </p>
                <p>
                    We also codified this in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">CONTRIBUTING.md</code>: no emojis, no em-dashes, no
                    Unicode special characters anywhere in the codebase. It is a strict policy
                    because these bugs are silent on macOS and Linux and only surface on Windows
                    at the worst possible moment.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Naming and conventions</h2>
                <p>
                    We formalized branch naming and PR conventions in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">CONTRIBUTING.md</code>:
                </p>
                <ul className="text-fd-muted-foreground">
                    <li>Branch prefixes: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">feat/</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">fix/</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">chore/</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">docs/</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">perf/</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">security/</code> (kebab-case).</li>
                    <li>PR titles: Conventional Commits with scopes (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">core</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">adapter</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">codegen</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">docs</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">release</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">cli</code>).</li>
                    <li>GitHub issue templates and a PR template now exist for contributor clarity.</li>
                    <li>FAQ section in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">CONTRIBUTING.md</code> mirrors mature OSS project patterns.</li>
                </ul>
                <p>
                    These might seem like overhead for a pre-1.0 project, but they establish
                    the rhythm early. Every PR we merge now follows the same format, which
                    makes the changelog (and the release notes) trivially derivable from the
                    commit history.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What did not change</h2>
                <p>
                    The type generation itself (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_pytype_to_ts</code>) was already solid after
                    the v0.2.0 release &mdash; it maps <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">int</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">str</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">bool</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Optional</code>,
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Union</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">List</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Dict</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Tuple</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Set</code>, and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">None</code>
                    to their TypeScript equivalents. The only case that falls through to
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">any</code> is a type that pyRPC cannot parse at all &mdash; which is increasingly
                    rare as we handle more of the Python type system.
                </p>
                <p>
                    The one remaining gap is Pydantic model generation. Currently, a
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@model</code> class resolves to its class name only (e.g. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">User</code>).
                    The next major codegen improvement will generate full TypeScript
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{'interface User { ... }'}</code> definitions from Pydantic model schema.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What is next</h2>
                <p>
                    The immediate roadmap has three items:
                </p>
                <ol className="text-fd-muted-foreground">
                    <li><strong>React integration patterns</strong> &mdash; a docs page showing <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createClient</code> with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code>/<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code>, auth headers, and error handling.</li>
                    <li><strong>Pydantic model-to-interface generation</strong> &mdash; full TypeScript interfaces from Python model definitions.</li>
                    <li><strong>Compatibility doc</strong> &mdash; what version numbers mean, safe vs breaking changes, rolling upgrade patterns.</li>
                </ol>
                <p>
                    The CLI, the frontend DX, the security policy, and the documentation are in
                    a good state. The remaining work is about depth &mdash; richer type generation,
                    more production examples, and clearer guidance for teams scaling from one
                    developer to many.
                </p>
                <p>
                    All 36 tests pass. The repo is at <a href="https://github.com/pyrpc/pyrpc" className="underline hover:text-fd-foreground">github.com/pyrpc/pyrpc</a>.
                </p>
            </section>
        </article>
    )
}
