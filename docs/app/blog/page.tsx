import Link from 'next/link'

const posts = [
    {
        slug: 'building-a-full-stack-app-with-pyrpc',
        title: 'Building a full-stack app with pyRPC',
        description: 'A step-by-step tutorial: FastAPI backend, TypeScript React frontend, end-to-end type safety with pyRPC.',
        date: 'May 25, 2026',
        readTime: '10 min',
    },
    {
        slug: 'from-raw-fastapi-to-pyrpc',
        title: 'From raw FastAPI to pyRPC',
        description: 'A before-and-after migration guide showing how to convert a traditional FastAPI application to pyRPC - and why you might want to.',
        date: 'May 25, 2026',
        readTime: '7 min',
    },
    {
        slug: 'why-pyrpc',
        title: 'Why pyRPC?',
        description: 'The philosophy behind pyRPC, what tRPC-style typing means for Python backends, and why we built it.',
        date: 'May 25, 2026',
        readTime: '6 min',
    },
    {
        slug: 'demo-sandbox-design',
        title: 'Inside the Interactive Demo Sandbox',
        description: 'A deep dive into how the pyrpc playground works - design decisions, architecture, and a comparison with the real pyrpc implementation.',
        date: 'May 25, 2026',
        readTime: '8 min',
    },
    {
        slug: 'codegen-refactor-and-dx',
        title: 'Cleaner codegen, one CLI, and a sharper story',
        description: 'Pattern A CLI, lazy pyrpc-core imports, frontend DX simplified to npm install, cross-language positioning, SECURITY.md rewrite, and Windows cp1252 fixes.',
        date: 'May 29, 2026',
        readTime: '8 min',
    },
    {
        slug: 'v0-2-0-type-safety-and-await',
        title: 'v0.2.0 - Type safety, proper async, and @pyrpc/types',
        description: 'The three critical fixes that ship pyRPC v0.2.0: real type generation, working async, and a postinstall-based @pyrpc/types setup.',
        date: 'May 29, 2026',
        readTime: '6 min',
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
                {posts.sort((a, b) => b.date.localeCompare(a.date)).map((post) => (
                    <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        className="block group border border-fd-border rounded-lg p-5 hover:bg-fd-accent/30 transition-colors bg-white/50 dark:bg-white/[0.03]"
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
