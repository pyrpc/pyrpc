import Image from 'next/image'
import Link from 'next/link'

export default function NativeDevServersPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Your framework&rsquo;s dev server, not ours
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 21, 2026 at 2:00pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Until v0.13.0, <code>pyrpc dev</code> had one answer for every backend: uvicorn. FastAPI users
                    shrugged &mdash; that is their normal. Flask users got an ASGI-wrapper detour. Django users were
                    told to run <code>manage.py runserver</code> themselves in a second terminal. PR #141 replaced
                    the one-size launcher with a resolver that launches each framework&rsquo;s <strong>native</strong>{' '}
                    dev server.
                </p>

                <Image src="/blog/native-runners.svg" alt="Diagram: backend.framework routes to uvicorn, flask run, or manage.py runserver" width={880} height={430} className="my-4 w-full h-auto rounded-lg border border-[#26262b]" />

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why native matters</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Django is not just WSGI/ASGI.</strong> Settings loading, app registry initialization, and management commands are framework machinery. Running Django any other way re-implements pieces of <code>runserver</code> badly &mdash; static files handling and autoreload semantics being the classic victims.</li>
                    <li><strong>Flask&rsquo;s dev server already works.</strong> Wrapping a WSGI app in an ASGI bridge to serve it under uvicorn adds a dependency, a thread hop, and a second stack trace format to debug &mdash; to arrive at the same behavior <code>flask run</code> gives you out of the box.</li>
                    <li><strong>Error messages stay familiar.</strong> When your traceback says Flask or Django said something, it is because Flask or Django said it. No translation layer between you and your framework.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">LaunchPlan: commands as data</h2>
                <p>
                    The resolver does not spawn anything. It returns a frozen <code>LaunchPlan</code> &mdash; argv,
                    optional env additions, optional working directory &mdash; and the caller spawns once:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`plan = resolve_launch(spec, host=..., port=..., reload=..., base_cwd=...)
proc = subprocess.Popen(plan.argv, cwd=plan.cwd or cwd, env=env)`}</pre>
                <p>
                    Commands-as-data made the whole matrix unit-testable without mocking processes. Every row of
                    this table is asserted literally in <code>test_runners.py</code>:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`fastapi/asgi -> python -m uvicorn module:app --host H --port P [--reload]
flask        -> python -m flask --app module:app run --host H --port P [--reload]
django       -> python <path>/manage.py runserver H:P [--noreload]  (cwd = manage.py dir)`}</pre>
                <p>
                    Note the asymmetry: for Django the configured entry point is a filesystem path to{' '}
                    <code>manage.py</code>, so the runner resolves it against the config file&rsquo;s directory and
                    sets <code>cwd</code> accordingly &mdash; because <code>manage.py runserver</code> only works
                    from where your project lives.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Restart semantics come free</h2>
                <p>
                    Because launch resolution is pure, the live config watcher reuses it verbatim: edit{' '}
                    <code>backend.framework</code> while the session runs and the watcher diffs the parsed spec,
                    terminates the old process, resolves a fresh plan, and relaunches. Switching{' '}
                    <code>fastapi</code> to <code>flask</code> mid-session genuinely swaps runtimes.
                </p>
                <p>
                    The deeper principle: <strong>a tool should host your stack, not substitute for it.</strong>{' '}
                    pyRPC owns type synchronization; the framework owns serving. v0.13.0 makes ownership lines
                    explicit instead of convenient.
                </p>
            </section>
        </article>
    )
}
