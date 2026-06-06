import Link from 'next/link'

const posts = [
    {
        slug: 'building-a-full-stack-app-with-pyrpc',
        title: 'Building a full-stack app with pyRPC',
        description: 'A step-by-step tutorial: FastAPI backend, TypeScript React frontend, end-to-end type safety with pyRPC.',
        date: 'May 25, 2026 at 9:00am',
        readTime: '10 min',
    },
    {
        slug: 'from-raw-fastapi-to-pyrpc',
        title: 'From raw FastAPI to pyRPC',
        description: 'A before-and-after migration guide showing how to convert a traditional FastAPI application to pyRPC - and why you might want to.',
        date: 'May 25, 2026 at 10:30am',
        readTime: '7 min',
    },
    {
        slug: 'why-pyrpc',
        title: 'Why pyRPC?',
        description: 'The philosophy behind pyRPC, what tRPC-style typing means for Python backends, and why we built it.',
        date: 'May 25, 2026 at 1:00pm',
        readTime: '6 min',
    },
    {
        slug: 'demo-sandbox-design',
        title: 'Inside the Interactive Demo Sandbox',
        description: 'A deep dive into how the pyrpc playground works - design decisions, architecture, and a comparison with the real pyrpc implementation.',
        date: 'May 25, 2026 at 3:00pm',
        readTime: '8 min',
    },
    {
        slug: 'codegen-refactor-and-dx',
        title: 'Cleaner codegen, one CLI, and a sharper story',
        description: 'Pattern A CLI, lazy pyrpc-core imports, frontend DX simplified to npm install, cross-language positioning, SECURITY.md rewrite, and Windows cp1252 fixes.',
        date: 'May 29, 2026 at 10:00am',
        readTime: '8 min',
    },
    {
        slug: 'v0-2-0-type-safety-and-await',
        title: 'v0.2.0 - Type safety, proper async, and @pyrpc/types',
        description: 'The three critical fixes that ship pyRPC v0.2.0: real type generation, working async, and a postinstall-based @pyrpc/types setup.',
        date: 'May 29, 2026 at 2:00pm',
        readTime: '6 min',
    },
    {
        slug: 'dev-console-architecture',
        title: 'Designing the pyrpc developer console',
        description: 'Threads, subprocesses, and an embedded interactive console - how pyrpc dev combines a dev server, file watcher, type generator, and CLI into one terminal session.',
        date: 'June 2, 2026 at 8:30am',
        readTime: '14 min',
    },
    {
        slug: 'cli-overhaul-and-dev-tools',
        title: 'CLI overhaul, model interfaces, and the dev tools we built',
        description: 'Merging pull into codegen, fixing serve, adding the dev watcher and shell REPL, and integrating jsonschema-ts for Pydantic model interfaces.',
        date: 'June 2, 2026 at 9:45am',
        readTime: '12 min',
    },
    {
        slug: 'circular-dependency-package-architecture',
        title: 'The circular dependency problem and how pyrpc-cli solved it',
        description: 'How we discovered and solved the circular dependency between pyrpc-core and pyrpc-codegen by extracting pyrpc-cli - with three alternative strategies evaluated and a step-by-step extraction guide.',
        date: 'June 2, 2026 at 10:15am',
        readTime: '10 min',
    },
    {
        slug: 'dev-console-vs-shell-design-decisions',
        title: 'Dev console vs shell: two tools, one job, and the line between them',
        description: 'Why the dev console reads from the parent process (not HTTP), how the shell connects remotely, and the shared REPL UI that bridges them.',
        date: 'June 2, 2026 at 11:30am',
        readTime: '8 min',
    },
    {
        slug: 'core-cli-codegen-dependency-chain',
        title: 'Core \u2192 CLI \u2192 Codegen: why the dependency direction matters',
        description: 'Why pyrpc-core \u2192 pyrpc-cli \u2192 pyrpc-codegen is the right dependency direction - and three principles for designing package chains that never tangle.',
        date: 'June 2, 2026 at 1:00pm',
        readTime: '7 min',
    },
    {
        slug: 'better-auth-pattern-for-python',
        title: 'The Better Auth meta-package pattern, adapted for Python',
        description: 'How Better Auth\u2019s npm meta-package inspired pyrpc\u2019s package architecture, and how we adapted it for Python\u2019s packaging constraints.',
        date: 'June 2, 2026 at 2:15pm',
        readTime: '9 min',
    },
    {
        slug: 'lazy-imports-as-api-contract',
        title: 'Lazy imports as API contract, not performance hack',
        description: 'Three tiers of CLI commands, the packaging-vs-code dependency distinction, and why lazy imports define capability boundaries \u2014 not just startup time.',
        date: 'June 2, 2026 at 3:00pm',
        readTime: '8 min',
    },
    {
        slug: 'windows-compatibility-in-python-oss',
        title: 'Windows compatibility in a Python OSS project: what we learned',
        description: 'Unicode crashes on cp1252, LF/CRLF git warnings, path separators, file watcher quirks, and a no-special-chars policy for cross-platform Python OSS.',
        date: 'June 2, 2026 at 4:00pm',
        readTime: '7 min',
    },
    {
        slug: 'breaking-circular-dependencies-in-python',
        title: 'How to break a circular dependency in Python packaging',
        description: 'Four strategies for breaking circular package dependencies in Python, evaluated through pyrpc\u2019s real-world restructuring \u2014 with a step-by-step extraction guide.',
        date: 'June 2, 2026 at 5:30pm',
        readTime: '11 min',
    },
    {
        slug: 'merging-cli-back-into-core',
        title: 'Why we merged pyrpc-cli back into pyrpc-core',
        description: 'How the circular dependency that motivated a three-package split disappeared - and why we simplified back to two packages for a single-install experience.',
        date: 'June 2, 2026 at 6:30pm',
        readTime: '7 min',
    },
    {
        slug: 'v0-3-0-single-install',
        title: 'v0.3.0 - pyrpc-cli merged into core, one-command install',
        description: 'pip install pyrpc-core now gives you the runtime, CLI, and codegen in a single command - no separate packages, no extra steps.',
        date: 'June 2, 2026 at 10:15pm',
        readTime: '5 min',
    },
    {
        slug: 'v0-3-1-lazy-codegen-import',
        title: 'v0.3.1 - Lazy imports, pyrpc_codegen decoupled from CLI',
        description: 'pyrpc_codegen is no longer loaded for version, inspect, serve, pull, or help - only codegen and dev need it. A patch triggered by a stale shim bug.',
        date: 'June 3, 2026 at 10:30am',
        readTime: '4 min',
    },
    {
        slug: 'v0-3-2-clean-ux-and-terminal',
        title: 'v0.3.2 - Cleaner terminal, smarter prompts, no more :app confusion',
        description: 'Interactive framework picker, simplified entry point, CWD import path fix, and a terminal that shows what matters - no Uvicorn spam, no raw [cyan] markup, no giant Panel boxes.',
        date: 'June 3, 2026 at 6:00pm',
        readTime: '6 min',
    },
    {
        slug: 'v0-3-3-client-and-watcher-fixes',
        title: 'v0.3.3 - Cleaner types, no more /rpc/rpc, quieter watcher, CORS included',
        description: 'TypeScript autocomplete no longer suggests .rpc, URL normalization prevents double /rpc/rpc, file watcher debounced to 300ms, and the ASGI dev server now sends CORS headers - all following reference patterns from tRPC, Better Auth, FastAPI, webpack, and nodemon.',
        date: 'June 3, 2026 at 9:30pm',
        readTime: '8 min',
    },
    {
        slug: 'pyrpc-json-config',
        title: 'pyrpc.json: why we left pyproject.toml behind',
        description: 'Three problems with [tool.pyrpc] in pyproject.toml - fragile writing, ambiguous file ownership, and unclear path semantics - and why a dedicated pyrpc.json file with JSON, not TOML, was the right answer.',
        date: 'June 6, 2026 at 8:00am',
        readTime: '9 min',
    },
    {
        slug: 'path-resolution-config-relative',
        title: 'Path resolution in pyrpc: config-relative, not CWD-relative',
        description: 'Why resolving paths against pyrpc.json\'s directory (not os.getcwd()) is the only correct approach, how the pipeline produces absolute paths everywhere, and why save_typescript_client() enforces the contract at the boundary.',
        date: 'June 6, 2026 at 8:15am',
        readTime: '8 min',
    },
    {
        slug: 'migration-strategy-three-cases',
        title: 'Three cases, zero data loss: pyrpc\'s types migration strategy',
        description: 'What happens when you change client_root in pyrpc.json? Three cases with SHA256 comparison, interactive prompts only when needed, and a clean KeyboardInterrupt path that never leaves half-migrated state.',
        date: 'June 6, 2026 at 8:30am',
        readTime: '10 min',
    },
    {
        slug: 'three-deployment-architectures',
        title: 'Three deployment architectures for pyrpc',
        description: 'Monorepo, separate repos, and published npm package - how pyrpc\'s config system and type generation handle all three workflows, and why server-side codegen was built before the client-side npx CLI.',
        date: 'June 6, 2026 at 8:45am',
        readTime: '9 min',
    },
    {
        slug: 'integrated-first-time-setup',
        title: 'No pyrpc init needed: designing the integrated setup wizard',
        description: 'Why pyrpc embeds setup inside pyrpc dev instead of a separate init command: fewer context switches, --reconfigure pre-fills defaults, CLI flags skip the wizard entirely, and KeyboardInterrupt exits cleanly.',
        date: 'June 6, 2026 at 9:00am',
        readTime: '8 min',
    },
    {
        slug: 'absolute-path-contract',
        title: 'Why save_typescript_client() refuses relative paths',
        description: 'The hidden bug in os.getcwd() fallback paths - why a silent default is worse than a hard error, how the CLI layer resolves paths before calling the API, and the "fail fast on global state" design principle.',
        date: 'June 6, 2026 at 9:15am',
        readTime: '7 min',
    },
    {
        slug: 'distribution-modes',
        title: 'Distribution modes: workspace and server',
        description: 'Two distribution modes for pyrpc: workspace (monorepo, types written directly to client) and server (separate repos, types fetched via HTTP). When to use each and how they work under the hood.',
        date: 'June 6, 2026 at 1:00pm',
        readTime: '8 min',
    },
    {
        slug: 'distribution-workspace-flow',
        title: 'Workspace mode: what happens when you run pyrpc dev',
        description: 'A step-by-step walkthrough of workspace mode: config resolution, client root validation, migration checks, file watcher loop, dev server startup, and CI compatibility.',
        date: 'June 6, 2026 at 1:15pm',
        readTime: '7 min',
    },
    {
        slug: 'distribution-server-flow',
        title: 'Server mode: type distribution across repositories',
        description: 'How server mode works: the schema endpoint stays in memory, pyrpc never writes to the client filesystem, and the client fetches types on demand via npx pyrpc sync.',
        date: 'June 6, 2026 at 1:30pm',
        readTime: '9 min',
    },
    {
        slug: 'client-distribution-and-package-standardization',
        title: 'Client distribution and package standardization',
        description: 'Completing the distribution story with npx pyrpc sync, a postinstall prompt for @pyrpc/client, and packaging cleanup: tests in packages, domain migration, framework extras, and package READMEs.',
        date: 'June 6, 2026 at 2:00pm',
        readTime: '10 min',
    },
]

export default function BlogPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-20">
            <h1 className="text-2xl font-bold tracking-tight uppercase font-mono mb-2">Blog</h1>
            <p className="text-sm text-fd-muted-foreground mb-12">
                Design notes, deep dives, and updates from the pyrpc team.
            </p>
            <div className="space-y-6">
                {[...posts].reverse().map((post) => (
                    <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        className="block group border border-edge rounded-lg p-5 hover:bg-fd-accent/30 transition-colors"
                    >
                        <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground mb-2">
                            <time>{post.date}</time>
                            <span>&middot;</span>
                            <span>{post.readTime}</span>
                        </div>
                        <h2 className="text-base font-semibold group-hover:text-fd-foreground transition-colors mb-1">
                            {post.title}
                        </h2>
                        <p className="text-sm text-fd-muted-foreground leading-relaxed">
                            {post.description}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    )
}
