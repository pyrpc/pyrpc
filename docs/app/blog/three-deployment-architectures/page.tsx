import Link from 'next/link'

export default function ThreeArchitecturesPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Three deployment architectures for pyrpc
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 6, 2026 at 8:45am</time>
                    <span>&middot;</span>
                    <span>9 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    pyrpc is designed to work across three fundamentally different project
                    structures. Each structure has different constraints, different workflows,
                    and different expectations about how types flow from the Python server to
                    the TypeScript client. Getting all three right meant designing the config
                    system, type generation, and migration logic to handle each case without
                    special-casing any of them.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Architecture 1: Monorepo</h2>
                <p>
                    This is the most common pyrpc setup. The Python server and TypeScript client
                    live in the same repository, usually in adjacent directories:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`my-app/
  server/
    main.py
    pyrpc.json         # client_root: "../client"
  client/
    package.json       # depends on @pyrpc/client, @pyrpc/types
    src/
      client.ts
    node_modules/
      @pyrpc/types/src/index.ts  ← generated here`}</pre>
                <p>
                    In this architecture, <code>pyrpc dev</code> runs from the server directory
                    (or the root, if <code>pyrpc.json</code> is there). The config file points
                    <code>client_root</code> at the client directory. Types are written directly
                    into <code>node_modules/@pyrpc/types/src/index.ts</code> inside the client
                    project.
                </p>
                <p>
                    The key advantage: <strong>everything runs from one command.</strong>
                    <code>pyrpc dev</code> starts the server, watches files, regenerates types on
                    changes, and provides an interactive console &mdash; all in a single terminal
                    session. The frontend developer runs their dev server separately (Vite, Next.js,
                    etc.) and imports the types that are kept up to date automatically.
                </p>
                <p>
                    This is the &ldquo;tRPC experience&rdquo; for Python backends &mdash; the
                    workflow that inspired pyrpc. It&rsquo;s the fastest feedback loop: change a
                    Python function, save the file, and the TypeScript types update within 300ms
                    (the watcher debounce).
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Architecture 2: Separate repositories</h2>
                <p>
                    Many teams work with separate repos for the backend and frontend. This is
                    common in larger organizations, or when the backend is consumed by multiple
                    frontend projects:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`backend/
  main.py
  pyrpc.json           # client_root: not set - no frontend in this repo

frontend/
  package.json         # depends on @pyrpc/client, @pyrpc/types
  src/
    client.ts
  node_modules/
    @pyrpc/types/src/index.ts  ← generated via pyrpc codegen`}</pre>
                <p>
                    In this architecture, the frontend cannot directly access the backend&rsquo;s
                    file system &mdash; at least not in CI. The workflow becomes:
                </p>
                <ol className="space-y-2">
                    <li>Backend developer runs <code>pyrpc pull</code> to extract the schema as JSON</li>
                    <li>The JSON schema file is checked into a shared location (another repo, an artifact registry, or a Git submodule)</li>
                    <li>Frontend CI runs <code>pyrpc codegen schema.json</code> to generate types</li>
                </ol>
                <p>
                    The <code>pull</code> and <code>codegen</code> commands are designed for exactly
                    this decoupled workflow. <code>pyrpc pull</code> serializes the schema without
                    starting a server; <code>pyrpc codegen</code> can read from a file, a URL, or
                    a Python module. The two-step split means the backend CI can commit a schema
                    file, and the frontend CI can generate types without needing Python installed.
                </p>
                <p>
                    <strong>What&rsquo;s not built yet:</strong> The client-side <code>npx pyrpc types</code>
                    commands (<code>init</code>, <code>pull</code>, <code>watch</code>) that would
                    make this workflow as smooth as the monorepo case. Currently, the frontend setup
                    requires manual <code>pyrpc codegen</code> calls or a CI script. A future release
                    will add <code>npx pyrpc types init</code> to configure the server URL and
                    <code>npx pyrpc types watch</code> to poll for schema changes.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Architecture 3: Published npm package (<code>@pyrpc/types</code> as a published artifact)</h2>
                <p>
                    In the most mature setup, the generated TypeScript types are published as an
                    npm package. Multiple frontend projects consume the same types without needing
                    access to the backend or its CI artifacts:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`backend/
  main.py
  pyrpc.json

# CI/CD pipeline:
# 1. Run pyrpc pull → schema.json
# 2. Run pyrpc codegen schema.json --output /tmp/types/index.ts
# 3. Publish /tmp/types as @my-org/my-api-types@1.2.3

frontend-a/
  package.json         # depends on @my-org/my-api-types
  src/
    client.ts          # import type { Types } from "@my-org/my-api-types"

frontend-b/
  package.json         # depends on @my-org/my-api-types
  src/
    client.ts          # same types, same version`}</pre>
                <p>
                    This architecture is for teams that want strict versioning of the API contract.
                    The types are published with semver, and frontend projects opt into updates by
                    bumping their dependency version. It&rsquo;s the slowest feedback loop (changes
                    flow through CI/CD on every push) but the most controlled.
                </p>
                <p>
                    pyrpc&rsquo;s <code>save_typescript_client()</code> function is the right API
                    for this workflow &mdash; it takes a schema dict and an output path, generates
                    the file, and returns. CI scripts call it programmatically, not through the CLI.
                    The fact that it requires an absolute path is a feature here: CI environments
                    have well-known working directories, and the absolute path requirement prevents
                    &ldquo;where did my file go?&rdquo; confusion in headless environments.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How the config system supports all three</h2>
                <p>
                    The <code>pyrpc.json</code> config system was designed with all three architectures
                    in mind:
                </p>
                <ul className="space-y-2">
                    <li>
                        <strong><code>client_root</code> is required</strong> &mdash; even in
                        architectures 2 and 3, the config file stores the local client path during
                        development. It&rsquo;s only in CI that <code>client_root</code> might be
                        overridden or ignored.
                    </li>
                    <li>
                        <strong>Path resolution is config-relative</strong> &mdash; this matters
                        most in monorepos (architecture 1) where pyrpc might be run from a
                        subdirectory. In separate-repo and published-npm setups, the config file
                        is usually at the repo root, so CWD-relative and config-relative produce
                        the same result.
                    </li>
                    <li>
                        <strong>No pyproject.toml dependency</strong> &mdash; <code>pyrpc.json</code>
                        is a standalone file. In architecture 2, the frontend repo doesn&rsquo;t
                        even have a <code>pyproject.toml</code> (it&rsquo;s JavaScript-only). A
                        TOML-based config would fail to parse there. A JSON-based config file is
                        language-agnostic.
                    </li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why we built server-side codegen first</h2>
                <p>
                    Architecture 1 (monorepo) covers the majority of pyrpc users. It&rsquo;s also
                    the hardest to get right &mdash; it needs file watching, debounced regeneration,
                    path resolution, and migration handling. By solving the hardest case first, we
                    built a foundation that works for all three architectures. The future
                    <code>npx pyrpc types</code> client-side CLI is additive &mdash; it will call
                    the same <code>pyrpc codegen</code> endpoint, just from the frontend instead of
                    the backend.
                </p>
                <p>
                    Each architecture serves a different stage of team maturity. Start with monorepo
                    (fastest iteration). Split into separate repos when team boundaries demand it.
                    Publish an npm package when you need strict versioning for multiple consumers.
                    pyrpc supports all three without branching config paths or conditional logic.
                </p>
            </section>
        </article>
    )
}
