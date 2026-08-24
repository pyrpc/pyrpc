import Link from 'next/link'

export default function ServerDetectionProbePost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 Probing the server: how pyrpc dev knows uvicorn is already running
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 8, 2026 at 12:00pm</time>
 <span>&middot;</span>
 <span>6 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 <code>pyrpc dev</code> does two jobs: it keeps TypeScript types in sync, and it runs your
 server. Sometimes your server is already running, you started it yourself, or you&rsquo;re
 on a second terminal and you only want the type watcher. How does <code>dev</code> know not to
 start a second uvicorn?
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 One HTTP probe
 </h2>
 <p>
 The answer is a single request with a short timeout:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _server_is_running(host: str, port: int) -> bool:
 try:
 import httpx
 resp = httpx.get(f"http://{host}:{port}/rpc", timeout=1.0)
 return resp.status_code < 500
 except Exception:
 return False`}</pre>
 <p>
 GET <code>/rpc</code> is the introspection endpoint that every pyRPC adapter exposes, so a
 successful response is a reliable &ldquo;yes, a pyRPC server is alive here&rdquo;. The
 <code>&lt; 500</code> check treats any server-side response, even a 404 from a
 non-pyRPC app on that port, as &ldquo;something is listening, don&rsquo;t bind the port
 again&rdquo;. The <code>except Exception</code> blanket covers connection refused, timeouts,
 DNS failures, and anything else; any of those means nothing usable is there.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Why a probe, not a bind test
 </h2>
 <p>
 The obvious alternative, try to bind the port and see if it fails, has a real
 flaw: binding is not the same as running your app. A port can be occupied by an unrelated
 process, or your OS can briefly refuse a bind for reasons that have nothing to do with your
 server. The HTTP probe tests the property we actually care about: <em>is the pyRPC API
 reachable at this address?</em> A port can also be free while your server is mid-restart
 (uvicorn&rsquo;s reloader closes the socket between processes), and a probe handles that
 transient state gracefully too.
 </p>
 <p>
 The 1-second timeout keeps the probe from stalling startup on a dead or slow network path.
 A single retry is deliberately not performed, if the first probe fails, starting uvicorn
 is the safe fallback either way.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Attach mode
 </h2>
 <p>
 When the probe succeeds, <code>dev</code> prints a status line and skips uvicorn entirely:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`if _server_is_running(host, port):
 console.print(
 f" [dim]○[/dim] server already running at "
 f"http://{host}:{port}/rpc, skipping uvicorn"
 )
else:
 server_proc = _start_uvicorn(module)
 server_managed = True
 console.print(f" [bold]pyRPC dev[/bold] http://{host}:{port}/rpc")`}</pre>
 <p>
 The <code>server_managed</code> flag matters downstream: it gates whether the interactive
 console&rsquo;s <code>restart</code> command is allowed to touch the process, and whether
 <code>dev</code> terminates anything on exit. When the server was already running, pyRPC is a
 guest, it attaches, regenerates types, watches files, and leaves your process alone.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 The workflow it enables
 </h2>
 <p>
 This single probe is what makes the tool feel non-possessive:
 </p>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>Two terminals, one server.</strong> Start the app with your debugger, then run <code>pyrpc dev</code> in another terminal purely for type regeneration.</li>
 <li><strong>Docker-in-the-loop.</strong> The server runs in a container; <code>dev</code> on your host detects it over HTTP and stays out of the way.</li>
 <li><strong>Safe re-runs.</strong> Accidentally running <code>pyrpc dev</code> twice never results in a port conflict, the second invocation attaches.</li>
 </ul>
 <p>
 Detection is intentionally narrow and fast. It is a hello, not an audit: one GET, one-second
 budget, and a decision about ownership that the rest of the CLI respects.
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
