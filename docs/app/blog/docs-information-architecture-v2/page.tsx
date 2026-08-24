import Link from 'next/link'

export default function DocsIAPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 Restructuring the docs for adapters, links, and AI
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 23, 2026 at 8:00pm</time>
 <span>&middot;</span>
 <span>5 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 PR #139 reorganized the documentation&rsquo;s information architecture. No new features, 
 just moving ideas to where readers look for them. Here is the reasoning, because IA changes
 are only controversial when the rationale is invisible.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What changed</h2>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>Client adapters got their own section.</strong> React, Next.js, Vue, and Svelte guides were buried among general client pages; they are the pages most visitors actually need, each with installation, provider setup, hook usage, invalidation, and links back to runnable examples.</li>
 <li><strong>A dedicated Links section.</strong> After v0.13.0 introduced terminating links, link configuration stopped being a footnote of client creation, it earned its own overview plus per-link pages.</li>
 <li><strong>A reference area</strong> for FAQ and lookup-style material, separating &ldquo;teach me&rdquo; from &ldquo;settle an argument.&rdquo;</li>
 <li><strong>An AI resources section</strong> collecting llms.txt, MCP integration, and skills, acknowledging that a growing share of &ldquo;readers&rdquo; are agents, and they deserve first-class navigation too.</li>
 <li><strong>Server adapter guides show file names as code-block titles</strong> (<code>title=&quot;main.py&quot;</code>), so multi-file walkthroughs stop requiring prose to track which file you are editing.</li>
 </ul>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The principle: match the mental model, not the org chart</h2>
 <p>
 Users don&rsquo;t think &ldquo;client concepts, then client advanced.&rdquo; They think
 &ldquo;I use Svelte, what do I install?&rdquo; or &ldquo;how does batching work?&rdquo;
 Sections keyed to those questions convert documentation from linear curriculum into lookup
 structure. The old sidebar optimized for writing order; the new one optimizes for arrival
 intent.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Small fixes that compound</h2>
 <p>
 The same PR restored sidebar folder icons that a dependency upgrade had silently broken
 (they rendered invisibly, present, occupying space, painted nothing), removed a stray
 nav title above the search bar, and deduplicated page headings so anchor links stop colliding.
 None of these are interesting individually. Collectively they are the difference between a
 site that feels maintained and one that feels abandoned.
 </p>
 <p>
 If you maintain docs: audit them like UI. Click every anchor. Resize everything. Ask an agent
 to navigate your llms.txt. The bugs live exactly where nobody looks.
 </p>
 </section>
 </article>
 )
}
