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
        description: 'Threads, subprocesses, and an embedded interactive console — how pyrpc dev combines a dev server, file watcher, type generator, and CLI into one terminal session.',
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
        description: 'How we discovered and solved the circular dependency between pyrpc-core and pyrpc-codegen by extracting pyrpc-cli — with three alternative strategies evaluated and a step-by-step extraction guide.',
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
        description: 'Why pyrpc-core \u2192 pyrpc-cli \u2192 pyrpc-codegen is the right dependency direction — and three principles for designing package chains that never tangle.',
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
]

export default function BlogPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-20">
            <h1 className="text-2xl font-bold tracking-tight uppercase font-mono mb-2">Blog</h1>
            <p className="text-sm text-fd-muted-foreground mb-12">
                Design notes, deep dives, and updates from the pyrpc team.
            </p>
            <div className="space-y-6">
                {posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((post) => (
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
