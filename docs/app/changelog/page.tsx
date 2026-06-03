import Link from 'next/link'

const releases = [
    {
        version: 'v0.3.2',
        date: '2026-06-03',
        tag: 'v0.3.2',
        description: 'Cleaner terminal, smarter setup prompts, entry point simplified — no more :app confusion.',
        sections: [
            {
                title: 'Setup Flow',
                items: [
                    'Framework picker changed from text input to questionary.select() arrow-key menu',
                    'Entry point prompt simplified to "Python module to scan for @rpc procedures (e.g. main, app.main)" with default "main"',
                    'Removed misleading :app convention (dev command never used the variable part)',
                ]
            },
            {
                title: 'Import Path',
                items: [
                    'sys.path.insert(0, os.getcwd()) added in dev() before module import (Uvicorn standard)',
                    '_import_module() changed from sys.path.append to sys.path.insert(0, ...) for consistency',
                    'main now finds main.py in current directory — fixes "No module named main" error',
                ]
            },
            {
                title: 'Terminal DX',
                items: [
                    'Uvicorn subprocess uses --log-level error — 6 lines of reloader/server spam eliminated',
                    'Heavy Panel box replaced with clean 2-line status block',
                    'input() replaced with console.input() so Rich markup renders (fixes raw [cyan] text)',
                    'Removed "Generating initial types" and "Watching X directories" noise lines',
                    'Consistent symbol prefixes: ✓ success, ✗ error, ⚠ warning, ○ in-progress',
                ]
            },
            {
                title: 'Dependencies',
                items: [
                    'Added questionary>=2.0.0 for interactive CLI prompts',
                ]
            },
            {
                title: 'Documentation',
                items: [
                    'Blog post: v0.3.2 — Cleaner terminal, smarter prompts, no more :app confusion',
                    'Help text updated on dev, serve, and pull commands to match new wording',
                ]
            },
        ]
    },
    {
        version: 'v0.3.1',
        date: '2026-06-03',
        tag: 'v0.3.1',
        description: 'Lazy imports: pyrpc_codegen decoupled from CLI, only loaded on codegen/dev commands.',
        sections: [
            {
                title: 'CLI',
                items: [
                    'pyrpc_codegen import moved from top-level to per-command lazy loader',
                    'Commands version, inspect, serve, pull, and --help no longer require the codegen library',
                    'Only codegen and dev commands trigger the pyrpc_codegen import',
                    'All 17 CLI tests pass with updated mock targets',
                ]
            },
        ]
    },
    {
        version: 'v0.3.0',
        date: '2026-06-02',
        tag: 'v0.3.0',
        description: 'Single-install architecture: pyrpc-cli merged back into pyrpc-core, simplified to two packages.',
        sections: [
            {
                title: 'Packaging',
                items: [
                    'pyrpc-cli merged into pyrpc-core  -  no separate CLI package to install',
                    'pip install pyrpc-core now gives you the runtime, CLI, and codegen in one command',
                    'pyrpc-codegen remains a standalone package only for programmatic/CI use',
                    'Dependency chain simplified: pyrpc-core → pyrpc-codegen (3 packages → 2)',
                ]
            },
            {
                title: 'CLI',
                items: [
                    'All CLI subcommands (serve, dev, inspect, codegen, pull, version) live in pyrpc_core.cli',
                    'Entry point: pyrpc = pyrpc_core.cli:app via [project.scripts]',
                    'Lazy imports maintained  -  pyrpc version still starts instantly',
                    'First-run setup prompts for framework and entry point',
                ]
            },
            {
                title: 'Documentation',
                items: [
                    'All docs updated: no more pyrpc-cli references, simplified install instructions',
                    'PYRPC.md, README, CONTRIBUTING, and 5 doc pages rewritten for single-install flow',
                    'System design doc updated: architecture diagram and dependency section reflect 2-package structure',
                    'New blog post: "Why we merged pyrpc-cli back into pyrpc-core"',
                    'New site favicon using pyrpc mark',
                ]
            },
        ]
    },
    {
        version: 'v0.2.0',
        date: '2026-05-29',
        tag: 'v0.2.0',
        description: 'Real type generation, working async dispatch, and postinstall-based @pyrpc/types setup.',
        sections: [
            {
                title: 'Core Engine',
                items: [
                    'RPCCallable.__call__ now detects running event loop  -  returns coroutine in async context, calls sync in sync context',
                    'Sync and async dispatch both tested and working',
                ]
            },
            {
                title: 'Code Generation',
                items: [
                    'Python-to-TypeScript type mapper: int→number, str→string, bool→boolean, Optional[T]→T | null, List[T]→T[], Dict[K,V]→Record<K,V>',
                    'Custom models resolve to class name for future model generation',
                    '--watch flag removed (HTTP polling every 2s was not production-grade)',
                    'pyrpc init replaced by @pyrpc/types postinstall (no separate init command needed)',
                    'DEFAULT_OUTPUT now points to node_modules/@pyrpc/types/src/index.ts',
                    'New pull subcommand: pyrpc pull <module> -o schema.json extracts RPC schema as portable JSON',
                    'pyrpc codegen accepts both file paths (pyrpc codegen schema.json) and URLs (pyrpc codegen http://localhost:8000)',
                    'pyrpc-core made a lazy dependency in pyrpc-codegen - codegen from JSON file does not import pyrpc-core',
                ]
            },
            {
                title: 'TypeScript Client',
                items: [
                    '@pyrpc/types ships a placeholder src/index.ts  -  import resolves immediately even before codegen',
                    'Postinstall script on npm install @pyrpc/client prompts for backend URL, fetches schema, generates types',
                    'PYRPC_URL env var support for non-interactive / CI setups',
                ]
            },
            {
                title: 'Documentation',
                items: [
                    'Blog post: v0.2.0  -  Type safety, proper async, and @pyrpc/types',
                    'Codegen plugin docs updated: no --watch, no pyrpc init, postinstall flow',
                ]
            },
        ]
    },
    {
        version: 'v0.1.0-alpha.3',
        date: '2026-05-29',
        tag: 'v0.1.0-alpha.3',
        description: 'Iterative npm release with @pyrpc/types postinstall setup and cross-language documentation alignment.',
        sections: [
            {
                title: 'TypeScript Packages',
                items: [
                    '@pyrpc/types published to npm as a standalone package with postinstall codegen integration',
                    '@pyrpc/client updated with simplified README  -  pnpm/bun install options, removed auth section',
                ]
            },
            {
                title: 'Documentation',
                items: [
                    'Cross-language positioning: docs updated to remove npx pyrpc references',
                    'Existing blog posts updated for the postinstall workflow',
                ]
            },
        ]
    },
    {
        version: 'v0.1.0-alpha.2',
        date: '2026-05-29',
        tag: 'v0.1.0-alpha.2',
        description: 'Iterative npm release with Pattern A CLI refactor and demo sandbox improvements.',
        sections: [
            {
                title: 'Code Generation',
                items: [
                    'Pattern A CLI refactor: pyrpc pull <module> -o schema.json, pyrpc codegen accepts files and URLs',
                    'Lazy pyrpc-core imports  -  codegen from JSON file does not import pyrpc-core',
                    'Comprehensive test suite for CLI subcommands (pull, codegen URL/file)',
                ]
            },
            {
                title: 'Security & Trust',
                items: [
                    'SECURITY.md with reporting scope and vulnerability disclosure policy',
                    'Trust infrastructure files added: PYRPC.md, ROADMAP.md, CONTRIBUTING.md',
                    'Issue and PR templates created',
                ]
            },
            {
                title: 'Documentation',
                items: [
                    'Blog posts: why pyrpc, migrating from FastAPI, building a full-stack app',
                    'Demo sandbox blog post: deep-dive on the interactive playground architecture',
                    'LICENSE.md (MIT) and CONTRIBUTING.md added',
                    'README updated with contribution and security sections',
                    'npm and PyPI download badges added to README',
                ]
            },
            {
                title: 'Demo Sandbox',
                items: [
                    'Redesigned demo page with mock execution, terminal, and validation',
                    'Monaco createModel approach for live TypeScript type generation',
                    'Client-side Python parser for RPC/model type generation',
                    'Mock sandbox RPC endpoint with param binding and return literal parsing',
                ]
            },
        ]
    },
    {
        version: 'v0.1.0-alpha.1',
        date: '2026-05-25',
        tag: 'v0.1.0-alpha.1',
        description: 'Initial alpha release of pyrpc  -  a type-safe RPC framework bridging Python servers and TypeScript clients.',
        sections: [
            {
                title: 'Core Engine',
                items: [
                    'Python RPC server built on Pydantic v2 with TypeAdapter-based runtime type validation',
                    'JSON-RPC 2.0 protocol with structured error responses (-32600, -32601, -32602, -32603)',
                    'Async and sync procedure support with automatic detection',
                    'Router system with merge support for modular procedure organization',
                    'ASGI transport (PyRPCAsgiApp) for standalone deployment',
                ]
            },
            {
                title: 'Server Adapters',
                items: [
                    'FastAPI adapter: `mount_fastapi(app)` registers RPC routes on an existing FastAPI app',
                    'Flask adapter: `mount_flask(app)` registers RPC routes on an existing Flask app',
                    'Standalone adapter: direct ASGI deployment without a framework',
                ]
            },
            {
                title: 'TypeScript Client',
                items: [
                    'Proxy-based `createClient<Types>()` with full type inference from generated declarations',
                    'Support for positional and named parameter passing matching Python function signatures',
                    'Built-in error handling with `PyRPCError` (code, message, data)',
                    'Automatic request ID generation per call',
                ]
            },
            {
                title: 'Code Generation',
                items: [
                    '`pyrpc` CLI tool for generating TypeScript type declarations from Python server code',
                    'Supports both module-based introspection and URL-based schema fetching',
                    'Maps Python types to TypeScript: `int` → `number`, `str` → `string`, `list[X]` → `X[]`, `Optional[X]` → `X | null`, etc.',
                    'Handles Pydantic model fields, union types, and nested generics',
                ]
            },
            {
                title: 'Interactive Demo Sandbox',
                items: [
                    'Browser-based playground at `/demo` with side-by-side Python/TypeScript editors',
                    'Live TypeScript type generation from `@rpc`/`@model` decorators via Monaco `createModel`',
                    'Mock sandbox execution with return value literal parsing (no Python runtime needed)',
                    'Real-time code validation with Monaco error markers',
                    'Theme-aware terminal with `console.log()` simulation',
                    'Multi-provider templates: Core, FastAPI, and Flask',
                ]
            },
            {
                title: 'Documentation Site',
                items: [
                    'Fumadocs-powered documentation at `/docs` with full search, sidebar navigation, and MDX content',
                    'Getting started guide, architecture deep-dive, protocol specification, and API reference',
                    'Blog at `/blog` with technical deep-dives',
                    'Responsive design with dark/light theme support',
                ]
            },
        ]
    },
]

function TagBadge({ tag }: { tag: string }) {
    return (
        <code className="text-[9px] font-mono bg-fd-muted px-2 py-0.5 rounded border border-edge">
            {tag}
        </code>
    )
}

export default function ChangelogPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-20">
            <h1 className="text-2xl font-bold tracking-tight uppercase font-mono mb-2">Changelog</h1>
            <p className="text-sm text-fd-muted-foreground mb-12">
                Release history for the pyrpc framework.
            </p>

            <div className="space-y-16">
                {releases.map((release) => (
                    <section key={release.version} className="relative pl-8 border-l-2 border-edge">
                        {/* Timeline dot */}
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-fd-foreground border-2 border-background" />

                        <div className="space-y-6">
                            {/* Header */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-lg font-bold tracking-tight font-mono">
                                        {release.version}
                                    </h2>
                                    <TagBadge tag={release.tag} />
                                </div>
                                <div className="text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                                    <time>{release.date}</time>
                                </div>
                                <p className="text-sm text-fd-muted-foreground mt-2">
                                    {release.description}
                                </p>
                            </div>

                            {/* Sections */}
                            <div className="space-y-6">
                                {release.sections.map((section) => (
                                    <div key={section.title}>
                                        <h3 className="text-xs font-bold uppercase tracking-[0.15em] font-mono text-fd-foreground mb-2">
                                            {section.title}
                                        </h3>
                                        <ul className="space-y-1.5">
                                            {section.items.map((item, i) => (
                                                <li key={i} className="text-sm text-fd-muted-foreground pl-4 relative">
                                                    <span className="absolute left-0 top-[0.45em] w-1.5 h-1.5 rounded-full bg-fd-muted-foreground/30" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                ))}
            </div>

            <footer className="mt-16 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                <Link href="/docs" className="hover:text-fd-foreground transition-colors">
                    View full documentation &rarr;
                </Link>
            </footer>
        </div>
    )
}
