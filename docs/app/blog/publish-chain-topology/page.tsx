import Link from 'next/link'

export default function PublishChainTopologyPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The publish chain: types to client to react to adapters
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 5:20pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The npm side of the publish workflow is not one job, it is four jobs connected by <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">needs:</code>, forming a strict dependency chain. The chain exists because every package's publish depends on the one below it already being on the registry.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The graph</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`publish-npm-types ──► publish-npm-client ──► publish-npm-react ──► publish-npm-adapters
     (leaf)                (depends on types)     (depends on client)   (next, vue, svelte)`}
                </pre>
                <p>
                    Each arrow is a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">needs:</code> declaration, and each job also lists its <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">on: push: tags</code> trigger. The Python side is a single job building all five packages; the npm side serializes because registry resolution is per-package.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why ordering is a hard requirement</h2>
                <p>
                    Consider the react job. It runs <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npm install</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npm run build --workspace=@pyrpc/client</code> then <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npm run build --workspace=@pyrpc/react</code>. React's package.json declares <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types@^0.12.0</code> as a dependency. During the workspace build, npm resolves that range locally, but at <em>publish</em> time, the registry metadata must already contain 0.12.0, because consumers will resolve it there. Publishing react before types would create a package whose dependency does not exist publicly yet.
                </p>
                <p>
                    The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">needs:</code> chain guarantees the ordering. Types must be live before client publishes, client before react, react before the remaining adapters. GitHub Actions runs the chain serially, each link completing the previous.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why each link rebuilds the whole base</h2>
                <p>
                    The react job does not just build react, it rebuilds client first, and the adapters job rebuilds client, react, and then next/vue/svelte:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`npm run build --workspace=@pyrpc/client
npm run build --workspace=@pyrpc/react
npm run build --workspace=@pyrpc/next
npm run build --workspace=@pyrpc/vue
npm run build --workspace=@pyrpc/svelte`}
                </pre>
                <p>
                    Repetition is deliberate. Each job is a hermetic unit: it checks out the tag, installs, builds its dependency chain from source, and publishes only its own package. There is no shared artifact cache to get stale, and no job depends on another job's files, only on its registry outcome. The cost is redundant builds; the benefit is that any job can be re-run independently.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The terminal node: create-release</h2>
                <p>
                    At the end, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">create-release</code> lists all five jobs in its <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">needs:</code> array, both the Python job and the four npm jobs. The GitHub Release is created only after <em>everything</em> is published. This turns the release into an all-or-nothing commit: a half-published matrix never gets a release page attached to it, and a failed publish never pretends it succeeded.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The takeaway</h2>
                <p>
                    Publishing a dependency chain is a serialization problem wearing a CI costume. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">needs:</code> graph is the dependency graph turned upside down, each package waits for its dependencies, builds hermetically, publishes idempotently, and only then do its dependents proceed.
                </p>
            </section>
        </article>
    )
}
