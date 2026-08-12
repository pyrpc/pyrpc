import Link from 'next/link'

export default function ChangelogAsStructuredDataPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The changelog as structured data
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 7:00pm</time>
                    <span>&middot;</span>
                    <span>6 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The docs site has a changelog page, but the changelog is not written as Markdown. It is a TypeScript module — <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">docs/lib/changelog-data.ts</code> — exporting a structured array of releases. The choice of format is the design.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The shape</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`{
  version: 'v0.12.0',
  date: '2026-08-12',
  tag: 'v0.12.0',
  description: 'Generated types become a real runtime module...',
  sections: [
    { title: 'Features', items: ['...', '...'] },
    { title: 'Bug Fixes', items: ['...'] },
  ],
}`}
                </pre>
                <p>
                    Each release is an object: a version string, a date, the matching git tag, a one-paragraph description, and categorized bullet lists. The renderer in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">docs/app/changelog/page.tsx</code> simply maps over the array — grouping by section, stamping a tag badge, printing the date.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why structured beats prose</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Rendered consistently.</strong> The tag badge, date, and section grouping are decided once in the renderer, not re-typed in every release.</li>
                    <li><strong>Typechecked.</strong> This is a TS file in a TS codebase — a malformed release object fails the build instead of rendering broken.</li>
                    <li><strong>Programmable.</strong> The array is importable. Future features — an RSS feed, an "unreleased" block, a diff view between versions — read the same data.</li>
                    <li><strong>Git-friendly.</strong> A release entry is a small, reviewable diff appended to a data file, exactly like the version bump it documents.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The version string is not for humans</h2>
                <p>
                    Note the two formats in one entry: the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">version</code>/<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">tag</code> fields use the tag form (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">v0.12.0</code>), matching the GitHub tag exactly, while the prose says <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">0.12.0</code>. The tag field is data — it exists to link or compare against git and GitHub. Keeping it byte-identical to the real tag is what makes the changelog a reliable index of the repo's release history.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The release ritual includes the changelog</h2>
                <p>
                    The changelog entry is part of the release PR, sitting next to the version bump and the lockfile sync. The discipline: <em>a version without a changelog entry is not released.</em> Since the GitHub Release auto-generates notes from PR titles, and the changelog is curated prose, the two complement each other — GitHub notes say what merged; the changelog says what it means.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The lesson</h2>
                <p>
                    A changelog is documentation, but it is also data about releases. Modeling it as data — version, date, tag, sections, items — costs a little upfront structure and pays off in rendering consistency, type safety, and future tooling. When content has a stable schema, store it as a schema, not as prose.
                </p>
            </section>
        </article>
    )
}
