import Link from 'next/link'

export default function LocalVsRemoteTrustBoundary() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Local versus remote MCP is a trust boundary, not a menu
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 9:30am</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Before writing a line of the server, we spent a research cycle dissecting how Prisma, Neon, Better Auth, Supabase, Vercel, Cloudflare, Stripe, Sentry, tRPC, and Drizzle structure their AI surfaces. One principle fell out of all of them, and it decides almost everything else.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The split is data residency, not features</h2>
                <p>
                    Prisma runs two servers under one brand. The local one takes a projectCWD argument and writes migration files to your disk. The remote one holds workspace-admin OAuth tokens and manages cloud databases. Their README states the reason plainly: the local server serves developers on a machine, the remote one exists to let platforms give database control to their users. Different audiences, different execution environments, different credential domains.
                </p>
                <p>
                    Neon proves the contrapositive. Everything Neon offers lives behind their API, so they collapsed to a single hosted server and deprecated the local package entirely. When the product is the vendor's cloud, nothing needs to be local.
                </p>
                <p>
                    Better Auth shows the far end of public knowledge: a hosted documentation MCP with exactly two tools and zero authentication, because public static content has no blast radius.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Applying the principle</h2>
                <p>
                    pyRPC's essence is codebase-resident. Introspection must import your routers in your interpreter; no hosted service can do that. So the project server is physically forced to be local stdio. Knowledge, meanwhile, gains nothing from being installed: docs bundled locally go stale between releases, which is why every vendor keeps retrieval hosted or llms.txt-based. Our remote documentation server remains future work, but the boundary is already drawn: your code stays yours, our knowledge stays current.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">One versus many</h2>
                <p>
                    Supabase ships one server because one API and one credential reach everything. Nobody splits management tools from query tools anymore; Neon merged its managed and SQL runner sets back into one categorized surface with runtime scoping. Feature count is never the reason to fork a server. Audience plus environment plus credentials is. For pyRPC today, those three coincide exactly once, so we ship exactly one.
                </p>
            </section>
        </article>
    )
}
