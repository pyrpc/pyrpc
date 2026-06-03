import Link from 'next/link'

export default function V033Post() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    v0.3.3  &mdash;  Cleaner types, no more /rpc/rpc, quieter watcher, CORS included
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 3, 2026 at 9:30pm</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    v0.3.3 fixes four issues that made the first &ldquo;hello world&rdquo; experience
                    bumpier than it should be. No new features, no breaking changes &mdash; just
                    the kind of polish that turns a promising tool into something you can hand
                    to someone and say &ldquo;try it.&rdquo;
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The four bugs</h2>
                <p>
                    A user tried pyrpc for the first time. They installed the package, wrote a
                    <code>main.py</code> with <code>@rpc</code> and <code>@model</code>, ran
                    <code>pyrpc dev</code>, and ran into four separate issues:
                </p>
                <ol className="space-y-2">
                    <li>
                        <strong>Autocomplete showed <code>rpc</code> as a method.</strong>
                        Typing <code>client.</code> in VS Code suggested <code>rpc</code> alongside
                        their procedures &mdash; even though accessing <code>client.rpc</code> throws
                        a runtime error that says &ldquo;Use client.method() instead.&rdquo; The
                        type system was lying.
                    </li>
                    <li>
                        <strong>The client made requests to <code>/rpc/rpc</code>.</strong>
                        The server output displays <code>http://127.0.0.1:8000/rpc</code>. The user
                        naturally copied that as the <code>baseUrl</code> &mdash; but the client
                        already appends <code>/rpc</code> internally, so requests went to
                        <code>http://127.0.0.1:8000/rpc/rpc</code> and returned 404.
                    </li>
                    <li>
                        <strong>The file watcher flooded the terminal on every save.</strong>
                        Every IDE auto-save triggered a regeneration. If the file was caught
                        mid-write, Python&rsquo;s parser threw syntax errors &mdash; and the
                        watcher printed every single one. A single Ctrl+S could produce ten lines
                        of red <code>✗ Types: invalid syntax</code> before the green
                        <code>✓ Types regenerated</code>.
                    </li>
                    <li>
                        <strong>Browser clients were blocked by CORS.</strong>
                        The ASGI transport (used by <code>pyrpc dev</code>) set only
                        <code>content-type</code> on responses. No <code>Access-Control-Allow-Origin</code>,
                        no <code>OPTIONS</code> handler. Cross-origin <code>fetch</code> from a
                        browser frontend was impossible without manually wrapping the app.
                    </li>
                </ol>
                <p>
                    Each fix follows the patterns you&rsquo;d see in tRPC, Better Auth, FastAPI,
                    webpack, and nodemon &mdash; no hacks, no reinventions.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">1. <code>rpc</code> in autocomplete: the type was telling the wrong story</h2>
                <p>
                    The client factory returned <code>PyRPCClient &amp; TTypes</code>. The
                    <code>PyRPCClient</code> class has a <code>public get rpc()</code> that
                    returns a proxy &mdash; it&rsquo;s the mechanism that intercepts method
                    calls and dispatches them as RPC requests. At runtime, <code>createClient</code>
                    wraps the instance in a second proxy that blocks access to <code>.rpc</code>
                    and throws a helpful error. But TypeScript doesn&rsquo;t know about that.
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`// Before — type lies to autocomplete
export function createClient<TTypes>(...): PyRPCClient & TTypes {
  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'rpc') throw new Error('Use client.method() instead')
      ...
    }
  })
}

// VS Code sees: { rpc: any } & TTypes → suggests .rpc
// Runtime: client.rpc → Error: "Use client.method() instead"`}</pre>
                <p>
                    The fix: return <code>TTypes</code> directly. The class type is an implementation
                    detail &mdash; the user&rsquo;s mental model is &ldquo;<code>client</code> is my
                    set of RPC procedures,&rdquo; not &ldquo;<code>client</code> is a class instance
                    that happens to have an <code>.rpc</code> getter.&rdquo; This is what tRPC and
                    openapi-fetch both do: their <code>createClient</code> return types map directly
                    to the procedure signatures, never the internal class shape.
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`// After — type matches user's mental model
export function createClient<TTypes>(...): TTypes {
  // Same runtime proxy, same error on .rpc
  // But TypeScript only knows about TTypes
}

// VS Code sees: TTypes → never suggests .rpc
// client.get_user("Atnatewos") → typed correctly
// client.rpc → TypeScript compile error`}</pre>
                <p>
                    If someone was using <code>client.rpc.get_user()</code> directly (which the
                    runtime proxy was already blocking with an error), they&rsquo;ll now get a
                    compile-time error instead of a runtime error. That&rsquo;s strictly better.
                    The intended path &mdash; <code>client.get_user()</code> &mdash; works identically.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">2. <code>/rpc/rpc</code>: a three-line URL normalization</h2>
                <p>
                    The client&rsquo;s <code>request()</code> method builds the fetch URL as
                    <code>{'`${this.baseUrl}/rpc`'}</code>. The constructor only stripped a
                    trailing slash. If the user passed <code>baseUrl: &quot;http://localhost:8000/rpc&quot;</code>
                    (which is exactly what the server output shows), the request went to
                    <code>http://localhost:8000/rpc/rpc</code> and the server returned 404.
                </p>
                <p>
                    The fix normalizes the URL in the constructor:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`// Before
this.baseUrl = baseUrl.replace(/\\/$/, '')

// After — strip trailing /rpc first, then re-append
const clean = baseUrl.replace(/\\/+$/, '')
this.url = clean.replace(/\\/rpc$/i, '') + '/rpc'`}</pre>
                <p>
                    Now both of these work:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`createClient({ baseUrl: 'http://localhost:8000' })
  // → http://localhost:8000/rpc  ✓

createClient({ baseUrl: 'http://localhost:8000/rpc' })
  // → strips /rpc, then re-appends → http://localhost:8000/rpc  ✓`}</pre>
                <p>
                    Only Better Auth auto-appends a path suffix among major reference projects.
                    tRPC, Axios, Apollo, and openapi-fetch all expect the full URL. But pyrpc&rsquo;s
                    design decision to simplify the common case (just pass the origin) is worth
                    preserving &mdash; as long as the footgun is fixed. URL normalization is the
                    standard approach: strip any existing trailing path segment that matches, then
                    re-append. Better Auth does the same thing with its <code>basePath</code>
                    option.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">3. File watcher: the debounce was missing</h2>
                <p>
                    The <code>watcher_loop()</code> called <code>regenerate()</code> on every
                    single <code>.py</code> file change. No debounce. IDEs write files in stages
                    during auto-save, so a single save could trigger multiple partial reads &mdash;
                    each producing a cascade of <code>✗ Types: invalid syntax</code> errors before
                    the file settled and regeneration succeeded.
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`// Before — fires on every file change
def watcher_loop():
    for changes in watch(*watched_dirs, ...):
        if any(f.endswith(".py") for _, f in changes):
            regenerate()

// Output on a single save:
//   ✗ Types: invalid syntax (main.py, line 1)
//   ✗ Types: expected ':' (main.py, line 4)
//   ✗ Types: expected an indented block ...
//   ✓ Types regenerated (1 procs)`}</pre>
                <p>
                    The fix adds a 300ms debounce using Python&rsquo;s standard
                    <code>threading.Timer</code>:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`_regenerate_timer = None
_timer_lock = threading.Lock()
DEBOUNCE_SECONDS = 0.3

def _schedule_regenerate():
    nonlocal _regenerate_timer
    with _timer_lock:
        if _regenerate_timer is not None:
            _regenerate_timer.cancel()     // reset on every new change
        _regenerate_timer = threading.Timer(DEBOUNCE_SECONDS, regenerate)
        _regenerate_timer.daemon = True
        _regenerate_timer.start()

def watcher_loop():
    for changes in watch(*watched_dirs, ...):
        if any(f.endswith(".py") for _, f in changes):
            _schedule_regenerate()         // debounced, not direct`}</pre>
                <p>
                    This is the same pattern webpack uses (<code>watchOptions.aggregateTimeout</code>,
                    default 20ms) and nodemon uses (<code>--delay</code>, default 1s). The timer
                    resets on every file change; regeneration only fires after 300ms of quiet.
                    Partial writes during a save settle within milliseconds, well under the
                    window. The result:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`// After — one message, once, after file settles
//
//   ✓ Types regenerated (1 procs)`}</pre>
                <p>
                    We considered using watchfiles&rsquo;s built-in <code>step</code> parameter,
                    but watchfiles&rsquo;s <code>step</code> is a one-shot cooldown from the
                    <em>first</em> event, not a resetting debounce. It doesn&rsquo;t give you
                    &ldquo;regenerate N ms after the <em>last</em> change,&rdquo; which is
                    the behavior every dev tool expects. <code>threading.Timer</code> is the
                    correct, standard approach.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">4. CORS: cross-origin fetch finally works</h2>
                <p>
                    The ASGI transport&rsquo;s <code>send_response()</code> set exactly one
                    header: <code>content-type: application/json</code>. No
                    <code>Access-Control-Allow-Origin</code>. No handling of
                    <code>OPTIONS</code> preflight requests. If you ran your frontend on
                    <code>localhost:5173</code> (Vite) or <code>localhost:3000</code> (Next.js),
                    any <code>fetch</code> to <code>localhost:8000/rpc</code> was blocked by
                    the browser&rsquo;s CORS policy.
                </p>
                <p>
                    The fix adds standard CORS headers to every response and handles
                    <code>OPTIONS /rpc</code> preflight:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`CORS_HEADERS = [
    (b"access-control-allow-origin", b"*"),
    (b"access-control-allow-methods", b"OPTIONS, GET, POST"),
    (b"access-control-allow-headers", b"Content-Type"),
    (b"access-control-max-age", b"86400"),
]

# In __call__:
if method == "OPTIONS" and path == "/rpc":
    await send({
        "type": "http.response.start",
        "status": 204,
        "headers": CORS_HEADERS,
    })
    await send({"type": "http.response.body", "body": b""})
    return

# In send_response:
await send({
    "type": "http.response.start",
    "status": status_code,
    "headers": [
        (b"content-type", b"application/json"),
    ] + CORS_HEADERS,
})`}</pre>
                <p>
                    These are the same headers FastAPI&rsquo;s <code>CORSMiddleware</code> sets.
                    Better Auth was the reference here &mdash; it handles CORS internally for its
                    API routes rather than punting to the server framework. Since pyrpc&rsquo;s
                    ASGI transport IS the server during <code>pyrpc dev</code>, it should do the
                    same. The <code>Access-Control-Max-Age: 86400</code> header reduces preflight
                    frequency to once per day.
                </p>
                <p>
                    The Flask and FastAPI transports are <strong>not</strong> changed. Those follow
                    tRPC&rsquo;s approach: the host application is responsible for CORS. Users of
                    <code>mount_flask</code> or <code>mount_fastapi</code> configure their own
                    <code>flask-cors</code> or <code>CORSMiddleware</code> as they would for any
                    other route.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Design decisions and what we didn&rsquo;t change</h2>
                <p>
                    <strong>The <code>baseUrl</code> + <code>/rpc</code> convention stays.</strong>
                    We considered removing the auto-append entirely (matching tRPC&rsquo;s &ldquo;give
                    us the full URL&rdquo; pattern), but that would break every existing user who
                    passes <code>baseUrl: &quot;http://localhost:8000&quot;</code>. The normalization
                    fix handles both forms transparently. If we ever introduce a
                    <code>path</code> option (like Better Auth&rsquo;s <code>basePath</code>), the
                    migration path will be: <code>baseUrl</code> becomes origin-only,
                    <code>path</code> defaults to <code>/rpc</code>. No breaking change needed.
                </p>
                <p>
                    <strong>Error deduplication is not implemented.</strong> The debounce alone
                    eliminates the flood &mdash; only one regeneration fires per save, so even if
                    the file has a real syntax error, you see exactly one <code>✗</code> message.
                    Error dedup adds complexity (tracking previous error strings across saves) for
                    marginal benefit. If the same error persists across multiple saves, you should
                    see it each time.
                </p>
                <p>
                    <strong>The <code>.rpc</code> getter stays on the class.</strong> It&rsquo;s
                    used internally by the proxy to dispatch calls. The fix is type-level only &mdash;
                    the runtime behavior is unchanged. Removing the getter would require rewriting
                    the dispatch mechanism and break anyone extending <code>PyRPCClient</code>
                    directly (unlikely, but possible).
                </p>
                <p>
                    <strong>CORS is not configurable in the ASGI transport.</strong>
                    <code>Access-Control-Allow-Origin: *</code> is correct for a dev server. If
                    users need stricter CORS in production, they should wrap the ASGI app with their
                    own middleware or use the Flask/FastAPI transports where CORS is the host
                    application&rsquo;s responsibility.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What these changes feel like</h2>
                <p>
                    The first-time experience now looks like this:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# Terminal (server):
$ pyrpc dev
  ✓ Types regenerated (1 procs)

  pyRPC dev server  http://127.0.0.1:8000/rpc
  Types: node_modules/@pyrpc/types/src/index.ts

type help for commands
pyrpc>

# VS Code (client):
import { createClient } from "@pyrpc/client";
import type { Types } from "@pyrpc/types";

const client = createClient<Types>({ baseUrl: "http://127.0.0.1:8000" });
// client. → autocomplete: get_user (not rpc)

const user = await client.get_user("Atnatewos");  // works

// On file save:
//   ✓ Types regenerated (1 procs)   ← one message, 300ms after save`}</pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Full changelog</h2>
                <ul className="space-y-2">
                    <li><strong>Client type system:</strong> <code>createClient</code> return type changed from <code>PyRPCClient &amp; TTypes</code> to <code>TTypes</code>. The <code>rpc</code> getter no longer pollutes autocomplete. Catches <code>client.rpc.method()</code> misuse at compile time instead of runtime.</li>
                    <li><strong>Client URL normalization:</strong> Constructor normalizes <code>baseUrl</code> by stripping any existing trailing <code>/rpc</code> before re-appending it. Prevents double <code>/rpc/rpc</code> when users copy the URL from server output. Handles both <code>http://localhost:8000</code> and <code>http://localhost:8000/rpc</code> correctly.</li>
                    <li><strong>File watcher debounce:</strong> <code>threading.Timer</code> with 300ms resetting debounce replaces direct <code>regenerate()</code> calls in the watcher loop. Matches webpack&rsquo;s <code>aggregateTimeout</code> and nodemon&rsquo;s <code>--delay</code>. Fires once after the last file change settles. Startup and manual <code>generate</code> command still regenerate immediately.</li>
                    <li><strong>ASGI CORS:</strong> Added <code>Access-Control-Allow-Origin: *</code>, <code>Access-Control-Allow-Methods</code>, <code>Access-Control-Allow-Headers</code>, and <code>Access-Control-Max-Age</code> to every response. Added <code>OPTIONS /rpc</code> handler returning 204. Same headers as FastAPI&rsquo;s <code>CORSMiddleware</code>. Flask and FastAPI transports unchanged.</li>
                </ul>

                <p className="mt-8">
                    See the <Link href="/changelog" className="underline underline-offset-2 hover:text-fd-foreground transition-colors">full changelog</Link> for details.
                </p>
            </section>
        </article>
    )
}
