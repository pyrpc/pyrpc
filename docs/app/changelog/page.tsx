import Link from 'next/link'
import { releases } from '@/lib/changelog-data'

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
