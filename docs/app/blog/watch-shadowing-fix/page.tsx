import Link from 'next/link'

export default function WatchShadowingFixPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 A crash hiding in plain sight: when `watch` shadows `watchfiles.watch`
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 20, 2026 at 9:00am</time>
 <span>&middot;</span>
 <span>5 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 The most embarrassing bugs are the ones that work in every code path you tested and fail
 instantly in the one you did not. PR #135 fixed exactly that kind of bug in <code>pyrpc watch</code>:
 a name collision so ordinary, a function called <code>watch()</code> shadowing
 <code>from watchfiles import watch</code>, that it survived several releases.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The collision</h2>
 <p>
 <code>cli.py</code> imports watchfiles&rsquo;s <code>watch</code> at module scope. Later, the
 watch command grew its own local helper also named <code>watch</code>. Python resolves names at
 runtime, so inside that command the local binding won, and calling what looked like the
 watcher invoked the helper instead, which raised a <code>TypeError</code> the moment the command ran:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# module scope
from watchfiles import watch

def watch_command(...):
 ...
 for changes in watch( # <- resolves to the local helper, not watchfiles
 ...):`}</pre>
 <p>
 The failure mode is worth naming. Nothing was wrong with the import, the arguments, or the
 watcher loop, the <strong>symbol table</strong> was wrong. Static analyzers flag this only
 if configured to care about shadowed imports, and the tests mocked <code>watchfiles.watch</code>{' '}
 at the module boundary, which conveniently bypassed the broken resolution entirely.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The fix is four lines; the guard is ten</h2>
 <p>
 Renaming the local helper restores the intended resolution. But the regression test matters more
 than the rename. It invokes the watch command end-to-end and asserts the real watcher receives a
 sane call, so any future shadowing fails loudly in CI instead of silently at a user&rsquo;s terminal:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def strict_watch(*args, **kwargs):
 assert "stop_event" not in kwargs, "watch() got stop_event - not portable"
 return iter([])`}</pre>
 <p>
 That assertion does double duty: it pins the #135 fix (the symbol must resolve to watchfiles)
 and the #132 contract (<code>stop_event</code> is unsupported by every watchfiles release, so
 pyRPC signals shutdown via <code>stop</code> events and <code>yield_on_timeout</code> instead).
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The general lesson</h2>
 <p>
 Three habits would have caught this earlier, and all three are cheap:
 </p>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>Import modules, not symbols</strong>, when the symbol name is generic: <code>import watchfiles</code> then <code>watchfiles.watch(...)</code>. Shadowing becomes impossible.</li>
 <li><strong>Never mock the thing you are testing through.</strong> Mocking at the module boundary made every test pass while the production call path was broken. Mock one level deeper or assert on the resolved callable.</li>
 <li><strong>Test commands by invoking them</strong>, not by unit-testing their internals. The bug lived in the wiring between the two.</li>
 </ul>
 <p>
 It shipped in v0.13.0 as a one-commit fix. Most of engineering is avoiding clever architecture;
 some of it is remembering that <code>watch</code> is a very popular name.
 </p>
 </section>
 </article>
 )
}
