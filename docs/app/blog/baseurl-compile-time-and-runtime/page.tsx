import Link from 'next/link'

export default function BaseUrlCompileTimeAndRuntimePage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    baseUrl: compile-time and runtime
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 8:20pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">baseUrl</code> is the one piece of runtime configuration every pyRPC client needs to know about, and it exists because of a split between two channels that run at different times. At compile time it is a string in an options type. At runtime it is the prefix every <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">fetch</code> is built from. This post walks both sides and the normalization in between.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why the option exists at all</h2>
                <p>
                    pyRPC is transport-first: the client is a thin JSON-RPC caller, and the only thing the app must tell it is <em>where the server is</em>. Everything else about the API shape comes from generated types, not from config. So the surface stays minimal, one URL, plus optional headers:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`interface ClientOptions {
  baseUrl?: string;
  headers?: HeadersInit | (() => Promise<HeadersInit> | HeadersInit);
}`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Compile time: a string, and nothing more</h2>
                <p>
                    In the type channel, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">baseUrl</code> is just <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">string | undefined</code>. The compiler enforces that you pass something shaped like a string, and that is the entire job of the type system here, the URL itself is never baked into the generated types. That is deliberate: the same <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">__pyrpc.ts</code> can point at a local dev server or a production domain without regenerating.
                </p>
                <p>
                    In practice the value arrives from the environment, and each framework has its own idiom for build-time inlining:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// Next.js, NEXT_PUBLIC_ vars are inlined at build time
createNextClient<Types>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
})

// Vite, import.meta.env
createReactClient<Types>({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})`}
                </pre>
                <p>
                    The fallback <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">?? 'http://localhost:8000'</code> is the compile-time convention that keeps <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">baseUrl</code> optional for local development while letting CI and production override it.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Runtime: the normalization pipeline</h2>
                <p>
                    At runtime the string must become a working request URL. The client is forgiving about what you give it (trailing slashes and a redundant <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">/rpc</code> are both handled) so the same option works whether it comes from an env var, a proxy prefix, or a hard-coded dev URL:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`baseUrl given                     fetch URL built
----------------------------------------------
"http://localhost:8000"           http://localhost:8000/rpc
"http://localhost:8000/"          http://localhost:8000/rpc
"http://localhost:8000/rpc"       http://localhost:8000/rpc
"http://localhost:8000/RPC"       http://localhost:8000/rpc
(undefined, browser)              window.location.origin + "/rpc"
(undefined, no window)            throws on first request`}
                </pre>
                <p>
                    The two lines that implement it:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`const clean = baseUrl.replace(/\\/+$/, '');          // strip trailing slashes
this.url = clean.replace(/\\/rpc$/i, '') + '/rpc';  // de-dup, then append`}
                </pre>
                <p>
                    Strip trailing slashes, drop a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">/rpc</code> suffix case-insensitively so it is never doubled, append <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">/rpc</code>. The same four lines run for every adapter because every adapter ultimately calls <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createClient</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Two fallbacks, one error</h2>
                <p>
                    Because the browser shares an origin with the API in the common single-deploy case, the client falls back to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">window.location.origin</code> when <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">baseUrl</code> is omitted, a Next.js app deployed on the same domain as its API works with zero configuration.
                </p>
                <p>
                    That fallback is browser-only. On the server there is no <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">window</code>, so omitting <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">baseUrl</code> leaves no URL at all, and the client fails loudly on the first request with a message that tells you exactly what to pass, rather than at construction time. Next.js Server Components hit this path when calling <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createCaller()</code>: the server needs an explicit, usually absolute, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">baseUrl</code> because there is no origin to inherit. The browser fallback, the server error, and the normalization are one coherent rule: <em>compile time only checks the type; runtime resolves the URL.</em>
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Adapters pass it straight through</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createReactClient</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createVueClient</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createSvelteClient</code>, and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createNextClient</code> all accept the same <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ClientOptions</code> and forward them to the underlying client unchanged. One contract, four entry points, which is why the normalization logic lives in exactly one place and every framework test asserts the same URL behavior.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Further reading</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li><Link href="/blog/one-api-object" className="text-fd-foreground underline underline-offset-2">One API object</Link>, how the client options flow through the framework adapters</li>
                    <li><Link href="/blog/rpc-call-flow" className="text-fd-foreground underline underline-offset-2">The RPC call flow</Link>, what happens after the URL is resolved</li>
                    <li><a href="https://nextjs.org/docs/app/building-your-application/configuring/environment-variables" className="text-fd-foreground underline underline-offset-2">Next.js: environment variables</a></li>
                </ul>
            </section>
        </article>
    )
}
