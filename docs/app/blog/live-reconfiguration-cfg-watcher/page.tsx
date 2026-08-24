import Image from 'next/image'
import Link from 'next/link'

export default function LiveReconfigPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 Editing pyrpc.json while the server runs
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 23, 2026 at 10:00am</time>
 <span>&middot;</span>
 <span>8 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 Restarting a dev session to change config is friction pretending to be safety. v0.13.0&rsquo;s
 config watcher treats <code>pyrpc.json</code> as live state: save the file, and the session
 re-wires itself, including swapping the backend runtime entirely.
 </p>

 <Image src="/blog/cfg-watcher-restart.svg" alt="Flow diagram: file event -> parse BackendSpec -> diff -> restart backend or rewire codegen without restart" width={880} height={420} className="my-4 w-full h-auto rounded-lg border border-[#26262b]" />

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Diff parsed specs, not file bytes</h2>
 <p>
 The naive approach compares file contents. That fires on formatting churn, comment edits,
 editor atomic-save shims, all noise. Instead the watcher parses the new JSON into the
 same frozen dataclass used everywhere else and compares values:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`new_spec = parse_backend(new_cfg) or spec
new_clients = [c["root"] for c in clients_from_config(new_cfg)]

backend_changed = new_spec != spec # dataclass eq, precise
output_changed = new_client_dirs != client_dirs`}</pre>
 <p>
 Reordering keys, adding whitespace, fixing a typo in a comment: nothing happens. Changing{' '}
 <code>entrypoint</code>: restart. Adding a client root: codegen callback re-points, no restart.
 The distinction falls out of comparing the right representation.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Restart means resolve again</h2>
 <p>
 On backend change the watcher imports the new types module (failing loudly but keeping the old
 spec alive if resolution fails), then, only if pyRPC owns the process, terminate,
 wait, and relaunch through the same pure resolver used at startup. Attaching to an
 externally-run server? Config changes still re-wire codegen; we just never pretend to manage a
 process we don&rsquo;t own.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The test was harder than the feature</h2>
 <p>
 Threads plus mocked generators plus shutdown sequencing is where tests go flaky. Three races
 surfaced while testing this feature, and each got a structural answer rather than a sleep:
 </p>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>Two watchers, one writer.</strong> Both the Python-file and config watchers consume <code>watch()</code>; a scripted generator mutating the fixture from both contexts corrupted the JSON mid-read. Fix: dispatch on watched paths so exactly one generator writes.</li>
 <li><strong>Shutdown eating the batch.</strong> If <code>stop</code> set before the watcher processed its first yield, the change vanished. Fix: the fake keeps yielding batches forever, like watchfiles polling does, a dropped tick no longer loses the edit.</li>
 <li><strong>Detection vs teardown ordering.</strong> Fix: the mocked console blocks until the restart is observed, making session lifetime deterministic instead of racing thread scheduling.</li>
 </ul>
 <p>
 The result passes across repeated full-suite runs with zero timing sensitivity. Flaky tests are
 rarely about the code under test, they are about unowned nondeterminism in the harness.
 Own it explicitly, or delete the test.
 </p>
 </section>
 </article>
 )
}
