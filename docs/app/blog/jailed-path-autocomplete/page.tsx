import Image from 'next/image'
import Link from 'next/link'

export default function JailedAutocompletePost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 A filesystem prompt that can&rsquo;t escape its jail
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 22, 2026 at 5:30pm</time>
 <span>&middot;</span>
 <span>7 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 The wizard&rsquo;s client-root question used to be a bare text input. You typed a path, hoped it
 existed, and discovered typos after codegen wrote files somewhere unexpected. v0.13.0 swaps in{' '}
 <code>questionary.path</code>: live directory completion, Tab to accept, and a security
 boundary that turned out to be the interesting part.
 </p>

 <Image src="/blog/autocomplete-jail.svg" alt="Diagram: the project root jail filters node_modules, dot dirs and symlink escapes; accepted suggestions appear in the prompt" width={880} height={430} className="my-4 w-full h-auto rounded-lg border border-[#26262b]" />

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The jail is a filter, not a sandbox</h2>
 <p>
 The completer supports a <code>file_filter</code> callback receiving each candidate path.
 Ours enforces three rules:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _visible(full_name: str) -> bool:
 if not os.path.isdir(full_name):
 return False
 name = os.path.basename(full_name.rstrip(os.sep))
 if not name or name.startswith(".") or name in _SKIP_DIRS:
 return False
 real = os.path.realpath(full_name) # symlinks resolved
 return real == root_abs or real.startswith(root_abs + os.sep)`}</pre>
 <p>
 The third rule is the whole game. A symlink{' '}
 <code>client -&gt; /home/you/other-project</code> looks innocent as text but resolves outside
 the tree; <code>os.path.realpath</code> exposes it, and the containment prefix-check rejects
 it. Suggestions can never point outside the project root, even when the filesystem lies about
 geography.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Typed input is a different problem</h2>
 <p>
 Here is the design decision worth stealing: the filter governs <strong>suggestions only</strong>.
 What you type is not filtered, you may absolutely write <code>../shared-client</code>,
 because monorepos are real and siblings are legitimate client roots. The submit gate is a
 separate validator that checks existence and nothing else:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _exists(path: str):
 if os.path.isdir(os.path.abspath(path)):
 return True
 return "Directory does not exist"`}</pre>
 <p>
 Conflating the two would produce either a broken prompt (can&rsquo;t leave the root, ever) or a
 fake one (jail that evaporates on keystroke). Separating them gives good defaults with honest
 escape hatches.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Testing an interactive component headlessly</h2>
 <p>
 Nothing here needs a TTY. prompt_toolkit ships <code>GreatUXPathCompleter</code> (the engine
 behind questionary&rsquo;s path prompt), which accepts plain strings and documents:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`completer = GreatUXPathCompleter(
 get_paths=lambda: [str(root)],
 only_directories=True,
 file_filter=cli._client_visible_filter(str(root)),
)
out = [c.display[0][1] for c in completer.get_completions(
 Document("src/a"), CompleteEvent())]
assert out == ["api/", "app/"] # node_modules never appears anywhere`}</pre>
 <p>
 The suite covers: junk hidden at the root, nested prefix completion, nonexistent prefixes
 returning empty, <code>../</code> navigation yielding only in-jail entries (the parent lists
 your own project back, correct!), absolute escapes like <code>/etc</code>, and the
 symlink case end-to-end. Interactive UX with CI-grade confidence, zero new dependencies.
 </p>
 </section>
 </article>
 )
}
