'use client';

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/cn'
import { releases } from '@/lib/changelog-data'

function formatDate(dateStr: string) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(month, 10) - 1;
    const formattedMonth = months[monthIndex] || month;
    return `${formattedMonth} ${parseInt(day, 10)}, ${year}`;
}

function ReleaseRow({ release }: { release: typeof releases[number] }) {
    const [expanded, setExpanded] = useState(false);
    const totalItems = release.sections.reduce((sum, section) => sum + section.items.length, 0);
    const isLong = release.description.length > 600 || totalItems > 5;

    return (
        <section className="relative pl-8 border-l-2 border-edge">
            {/* Timeline dot */}
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-fd-foreground border-2 border-background" />

            <div className="space-y-4">
                {/* Header */}
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold tracking-tight font-mono">
                            {release.version}
                        </h2>
                        <code className="text-[9px] font-mono bg-fd-muted px-2 py-0.5 rounded border border-edge">
                            {release.tag}
                        </code>
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                        <time>{formatDate(release.date)}</time>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className={cn(
                        "relative",
                        !expanded && isLong && "max-h-[300px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]"
                    )}>
                        <p className="text-sm text-fd-muted-foreground leading-relaxed">
                            {release.description}
                        </p>

                        {/* Sections */}
                        {release.sections.length > 0 && (
                            <div className="space-y-6 pt-4 transition-all">
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
                        )}
                    </div>

                    {isLong && !expanded && (
                        <button
                            onClick={() => setExpanded(true)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-fd-primary hover:underline cursor-pointer transition-colors mt-2"
                        >
                            <ChevronDown className="h-3 w-3" /> Expand release
                        </button>
                    )}
                    
                    {isLong && expanded && (
                        <button
                            onClick={() => setExpanded(false)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-fd-primary hover:underline cursor-pointer transition-colors mt-4"
                        >
                            <ChevronUp className="h-3 w-3" /> Collapse release
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}

export default function ChangelogPage() {
    return (
        <div className="relative min-h-[calc(100svh-6.5rem)] pt-14 md:pt-24 pb-20">
            <div className="relative max-w-[1200px] mx-auto px-6">
                <div className="mb-16">
                    <h1 className="text-2xl font-semibold tracking-tight leading-tight text-fd-foreground">
                        Changelog
                    </h1>
                    <p className="mt-4 text-sm text-fd-muted-foreground leading-relaxed max-w-xl">
                        Release history for the pyRPC framework.
                    </p>
                </div>

            <div className="space-y-16">
                {releases.map((release) => (
                    <ReleaseRow key={release.version} release={release} />
                ))}
            </div>

            <footer className="mt-16 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                <Link href="/docs" className="hover:text-fd-foreground transition-colors">
                    View full documentation &rarr;
                </Link>
            </footer>
            </div>
        </div>
    )
}
