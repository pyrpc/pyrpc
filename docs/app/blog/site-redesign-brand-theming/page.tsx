import Image from 'next/image'
import Link from 'next/link'

export default function SiteRedesignPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 Redesigning the site around the code
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 23, 2026 at 6:30pm</time>
 <span>&middot;</span>
 <span>6 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 PRs #137 and #138 rebuilt the website&rsquo;s visual system: new brand assets, a redesigned
 landing page, unified light/dark theming, and, the part engineers actually notice
, one syntax palette shared by every code block on the site. This is a retrospective on
 why a docs site deserved that much attention.
 </p>

 <Image src="/blog/site-theming-tokens.svg" alt="Diagram: one palette of brand tokens feeding landing, docs, and playground surfaces with matching Shiki themes" width={880} height={300} className="my-4 w-full h-auto rounded-lg border border-[#26262b]" />

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The problem: three code renderers, three palettes</h2>
 <p>
 The site renders Python and TypeScript in three places, marketing page, docs content,
 interactive playground, and each had accumulated its own highlighting setup. The same{' '}
 <code>@rpc.query</code> decorator could be green in docs and amber in the playground. For a
 product whose entire pitch is <strong>one source of truth</strong>, that inconsistency was a
 contradiction in the first five seconds.
 </p>
 <p>
 The fix is boring and correct: shared Shiki theme definitions consumed by all three surfaces,
 with paired light/dark token mappings so switching themes never changes semantics, only
 luminance.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Theming as tokens, not pages</h2>
 <p>
 Alongside the palette work, the app migrated to fumadocs 16.12&rsquo;s token names and a
 better-auth-style light/dark system: semantic variables (<code>--fd-background</code>,{' '}
 <code>--fd-muted-foreground</code> and friends) instead of per-component hex codes. Two
 consequences:
 </p>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>New pages are correct by default.</strong> A blog post written today picks up both themes without a single dark-mode media query.</li>
 <li><strong>The demo/playground matched for free.</strong> Editor chrome now uses the same tokens; the sandbox stopped looking like an embedded third-party widget.</li>
 </ul>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Landing page: subtraction</h2>
 <p>
 The redesign removed more than it added, wave backgrounds, decorative gradients,
 redundant hero copy. What stayed: the wordmark, one honest sentence about what pyRPC does, the
 install command, and the demo GIF. Developer tools earn trust by being legible, not by being
 decorated.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The meta-lesson</h2>
 <p>
 Docs sites rot when they are treated as content plus CSS. Treating them as <strong>a product
 with its own design system</strong>, tokens, themes, shared syntax definitions, 
 means every future page inherits quality instead of re-deciding it. The site should feel like
 it was generated from the same discipline as the library, because it was.
 </p>
 </section>
 </article>
 )
}
