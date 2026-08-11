import Link from 'next/link'

export default function V020Post() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    v0.2.0  -  Type safety, proper async, and @pyrpc/types
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>May 29, 2026 at 2:00pm</time>
                    <span>&middot;</span>
                    <span>6 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    v0.2.0 fixes three ship-blocking issues that eroded the &ldquo;tRPC for Python&rdquo; promise. Here&rsquo;s what changed and why.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">1. RPCCallable now actually awaits</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">RPCCallable.__await__</code> was a no-op  -  <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pass</code>. Calling <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">await client.add(1, 2)</code> silently returned nothing.
                </p>
                <p>
                    The fix: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">RPCCallable.__call__</code> now detects whether a running event loop exists. In async contexts, it returns a coroutine via <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">call_async</code>. In sync contexts, it calls <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">call_sync</code> directly.
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`client = RPCClient("http://localhost:8000")

# Sync  -  works as before
result = client.add(1, 2)

# Async  -  now actually works!
async_result = await client.add(1, 2)`}
                </pre>
                <p>
                    The explicit <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.aio()</code> method also remains available for clarity.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">2. Generated types that actually mean something</h2>
                <p>
                    Every parameter and return in the generated TypeScript interface was <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">any</code>:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// Before: zero type safety
add(a: any, b: any): Promise<any>;`}
                </pre>
                <p>
                    The codegen now maps Python types to TypeScript types:
                </p>
                <table className="w-full text-[11px] font-mono border-collapse">
                    <thead>
                        <tr className="border-b border-edge">
                            <th className="text-left py-2 pr-4">Python</th>
                            <th className="text-left py-2">TypeScript</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-edge">
                            <td className="py-2 pr-4"><code className="text-[10px]">int</code> / <code className="text-[10px]">float</code></td>
                            <td className="py-2"><code className="text-[10px]">number</code></td>
                        </tr>
                        <tr className="border-b border-edge">
                            <td className="py-2 pr-4"><code className="text-[10px]">str</code></td>
                            <td className="py-2"><code className="text-[10px]">string</code></td>
                        </tr>
                        <tr className="border-b border-edge">
                            <td className="py-2 pr-4"><code className="text-[10px]">bool</code></td>
                            <td className="py-2"><code className="text-[10px]">boolean</code></td>
                        </tr>
                        <tr className="border-b border-edge">
                            <td className="py-2 pr-4"><code className="text-[10px]">Optional[str]</code></td>
                            <td className="py-2"><code className="text-[10px]">string | null</code></td>
                        </tr>
                        <tr className="border-b border-edge">
                            <td className="py-2 pr-4"><code className="text-[10px]">List[int]</code></td>
                            <td className="py-2"><code className="text-[10px]">number[]</code></td>
                        </tr>
                        <tr>
                            <td className="py-2 pr-4"><code className="text-[10px]">Dict[str, int]</code></td>
                            <td className="py-2"><code className="text-[10px]">Record&lt;string, number&gt;</code></td>
                        </tr>
                    </tbody>
                </table>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// After: real types
add(a: number, b: number): Promise<number>;
greet(name: string): Promise<string>;`}
                </pre>
                <p>
                    Custom Pydantic models resolve to their class name for future model generation.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">3. @pyrpc/types  -  install, set up, done</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> is now a dependency of <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code>. The package ships a placeholder <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">src/index.ts</code> that is replaced when codegen runs. The import path <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{'import type { Types } from "@pyrpc/types"'}</code> always works  -  before codegen, it resolves to an empty <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Record&lt;string, never&gt;</code>; after codegen, it resolves to your actual procedure types.
                </p>

                <h3 className="text-base font-semibold text-fd-foreground mt-8">Setup is an npm install</h3>
                <p>
                    Installing <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code> triggers a postinstall script in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code>:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`npm install @pyrpc/client`}
                </pre>
                <p>
                    If you&rsquo;re in an interactive terminal, it prompts for your backend URL, fetches the schema, and generates types  -  all in one step. The generated file lives inside <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">node_modules/@pyrpc/types/src/index.ts</code>, so <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{'import type { Types } from "@pyrpc/types"'}</code> resolves immediately.
                </p>
                <p>
                    For CI or non-interactive environments, set <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">PYRPC_URL</code>:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`PYRPC_URL=https://api.example.com npm install @pyrpc/client`}
                </pre>
                <p>
                    No separate <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc init</code> command needed. No polling. No manual steps. The postinstall handles the common case.
                </p>

                <h3 className="text-base font-semibold text-fd-foreground mt-8">Types at compile time</h3>
                <p>
                    The generated file exports <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Types</code>, a TypeScript interface with your procedure signatures. Since it&rsquo;s inside <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">node_modules/@pyrpc/types</code>, the import path is clean and standard.
                </p>
                <p>
                    The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">baseUrl</code> in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createClient()</code> is the same URL used during codegen  -  there&rsquo;s one URL, it&rsquo;s your backend. No staging-vs-production confusion.
                </p>

                <h3 className="text-base font-semibold text-fd-foreground mt-8">Production / CI workflow</h3>
                <p>
                    In CI, types are generated as a build step:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# Install deps
npm install @pyrpc/client

# Build (CI provides PYRPC_URL, or codegen runs explicitly)
pyrpc codegen https://api.example.com
npm run build`}
                </pre>
                <p>
                    The generated file can also be committed to the repo so CI doesn&rsquo;t need access to a running Python server.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What&rsquo;s next</h2>
                <ul>
                    <li>Pydantic model → TypeScript interface generation</li>
                    <li>Dev-mode file watcher: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev</code> starts a file watcher (not HTTP poller) that regenerates types when Python sources change, using the same OS-level notification APIs as uvicorn <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--reload</code></li>
                </ul>
                <p>
                    Check the <Link href="/docs/get-started/quickstart" className="text-fd-foreground underline underline-offset-2">quickstart</Link> to try it out.
                </p>
            </section>
        </article>
    )
}
