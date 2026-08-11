import Link from 'next/link'

export default function DebouncedRegenThreadsPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Threads, timers, and the missing import time: how regeneration stays safe
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 11, 2026 at 2:00pm</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Type regeneration looks simple from the outside &mdash; a file changes, types update. Under
                    the hood it is a small concurrency puzzle: a timer that must reset on every change, a lock
                    that must prevent overlapping regeneration, and a thread that must survive being interrupted.
                    And once, it was broken by a single missing import.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    Why a timer at all
                </h2>
                <p>
                    Every save triggers multiple filesystem events, and every event would naively trigger a
                    regeneration. The debounce collapses them: instead of regenerating on the first event, wait
                    300ms and regenerate once, after the burst settles. The canonical implementation:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`_DEBOUNCE_SECONDS = 0.3

def _schedule_regen():
    with _timer_lock:
        if _timer is not None:
            _timer.cancel()
        _timer = threading.Timer(_DEBOUNCE_SECONDS, _do_regen)
        _timer.daemon = True
        _timer.start()`}</pre>
                <p>
                    Each new event cancels the pending timer and starts a fresh one. If saves stop, the last
                    timer fires 300ms later and regeneration runs against the final, complete file &mdash; never
                    against a half-written intermediate state.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    Why a lock on the timer
                </h2>
                <p>
                    <code>schedule_regen</code> is called from two threads &mdash; the file watcher and the
                    <code>pyrpc.json</code> watcher. Without a lock, two threads can interleave:
                    <code>cancel()</code>, then both <code>start()</code>, leaving two timers armed. The lock
                    serializes the read-modify-write on <code>_timer</code>, guaranteeing at most one pending
                    timer exists at any moment.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    Why regeneration needs its own lock
                </h2>
                <p>
                    The debounce guarantees <em>scheduling</em> is serialized, but not <em>execution</em>. The
                    timer callback itself can be slow &mdash; a regeneration imports the module and reads the whole
                    registry. If a regen is in flight when another fires, two threads would write the same
                    <code>__pyrpc.d.ts</code> concurrently. The regen lock makes that impossible:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _do_regen():
    if not _regen_lock.acquire(blocking=False):
        return  # a regen is already running; skip
    try:
        _regenerate_clients(module, client_dirs)
    finally:
        _regen_lock.release()`}</pre>
                <p>
                    The non-blocking acquire is a deliberate choice: if a regen is already running, the newest
                    trigger is dropped rather than queued. That is safe because regeneration is idempotent
                    &mdash; the running regen reads the same latest module state, so dropping the duplicate
                    changes nothing.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    The missing import time
                </h2>
                <p>
                    The 0.10.1 &rarr; 0.11.0 changelog contains a one-line fix that reads like a comedy of
                    errors:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`- fix: import time module in watcher regen callback`}</pre>
                <p>
                    <code>time.time()</code> is called inside <code>_do_regen</code> to stamp the regeneration
                    log line, but the <code>import time</code> lived in another scope of the file. Python&rsquo;s
                    scoping rules turned a missing import into a silent <code>NameError</code> at runtime &mdash;
                    caught by the surrounding exception handler and never shown. The symptom was insidious:
                    types still regenerated, but no <code>regen ✓</code> line appeared, so the tool seemed to
                    have stopped working when it had actually just stopped talking.
                </p>
                <p>
                    The fix was moving the import into the callback scope. The lesson is broader: in Python, an
                    import missing from a nested function is a runtime error, not a compile-time one. If a
                    function uses a module, import it inside that function (or be disciplined about module-level
                    imports) &mdash; silent failure beats no failure only by being detectable.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    The pieces together
                </h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Watch thread</strong> &mdash; produces events, filtered to <code>.py</code> and config changes.</li>
                    <li><strong>Timer (debounced)</strong> &mdash; collapses bursts, guards against half-written files.</li>
                    <li><strong>Timer lock</strong> &mdash; serializes scheduling across threads.</li>
                    <li><strong>Regen lock</strong> &mdash; prevents concurrent writes to the same output file.</li>
                    <li><strong>The log line</strong> &mdash; the only outward signal the loop is alive.</li>
                </ul>
                <p>
                    Individually each piece is trivial. Together they make &ldquo;save, wait, types are fresh&rdquo;
                    safe on any editor, any filesystem, and under real concurrency.
                </p>
                <p>
                    Read the full
                    <Link href="/changelog" className="text-fd-foreground underline"> changelog</Link>
                    for the complete list of changes.
                </p>
            </section>
        </article>
    )
}
