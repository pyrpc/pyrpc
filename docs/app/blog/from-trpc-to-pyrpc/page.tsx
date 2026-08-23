import Link from 'next/link'

export default function FromTRpcToPyrpcPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    From tRPC to pyRPC: what stays, what goes, what gets easier
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 9:15am</time>
                    <span>&middot;</span>
                    <span>14 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    If you have used tRPC, pyRPC will feel familiar. Same hooks, same kinds, same query keys. But the server is Python, not TypeScript. This post maps tRPC concepts to their pyRPC equivalents and shows what changes in your code.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Side by side</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// tRPC (TypeScript server)
const appRouter = router({
  greet: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => \`Hello, \${input.name}!\`),
})

// pyRPC (Python server)
@rpc.query
def greet(name: str) -> str:
    return f"Hello, {name}!"`}
                </pre>
                <p>
                    tRPC defines procedures with builders (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">router()</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">publicProcedure</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.input()</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.query()</code>). pyRPC uses decorators. The Python function signature <em>is</em> the input schema. Pydantic validates the types.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What stays the same</h2>

                <p><strong>Client setup.</strong> Almost identical:</p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// tRPC
import { createTRPCReact } from "@trpc/react-query"
const api = createTRPCReact<AppRouter>()

// pyRPC
import { createReactClient } from "@pyrpc/react"
const api = createReactClient<Types>({ baseUrl: "..." })`}
                </pre>

                <p><strong>Hook syntax.</strong> Same pattern:</p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// tRPC
const { data } = api.greet.useQuery({ name: "Ada" })

// pyRPC
const { data } = api.greet.useQuery({ name: "Ada" })`}
                </pre>

                <p><strong>Query keys.</strong> Both use predictable keys for cache invalidation.</p>

                <p><strong>Providers.</strong> Both wrap with a QueryClient provider.</p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What goes away</h2>

                <p><strong>No Zod schemas.</strong> tRPC requires <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">z.object()</code> input validation on the server. pyRPC uses Python type hints. Pydantic validates at runtime. No schema duplication between server and client.</p>

                <p><strong>No appRouter type export.</strong> tRPC needs <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">export type AppRouter = typeof appRouter</code>. pyRPC generates <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Types</code> from Python code. No manual type export.</p>

                <p><strong>No links chain.</strong> tRPC has <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">httpBatchLink</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">httpBatchStreamLink</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">loggerLink</code>. pyRPC uses one <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">POST /rpc</code> endpoint. No configuration.</p>

                <p><strong>No superjson.</strong> tRPC uses SuperJSON for date/Map/Set serialization. pyRPC uses standard JSON. If you need custom serialization, add it at the adapter level.</p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What gets easier</h2>

                <p><strong>Server code.</strong> Three lines of Python vs a router builder with Zod schemas. The function signature is the contract.</p>

                <p><strong>No codegen for server types.</strong> tRPC infers types from the router at build time. pyRPC generates types at codegen time. The result is the same (fully typed client) but pyRPC works across language boundaries.</p>

                <p><strong>One install.</strong> <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pip install pyrpc-core[fastapi]</code> gives you the runtime, CLI, and codegen. tRPC requires the server package, the client package, the adapter package, and Zod.</p>

                <p><strong>Framework adapters.</strong> tRPC has separate packages for React, Next.js, and vanilla. pyRPC has one per framework, each following the same pattern. Switching frameworks means changing one import.</p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Next.js migration</h2>
                <p>
                    If you have a tRPC + Next.js App Router project, the migration path is:
                </p>
                <ol className="list-decimal pl-6 space-y-1">
                    <li>Replace <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createTRPCReact</code> with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createNextClient</code></li>
                    <li>Replace <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">trpc.</code> prefix with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.</code></li>
                    <li>Remove Zod schemas from the server, use Python type hints</li>
                    <li>Replace <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{"import type { AppRouter } from"}</code> with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{"import type { Types } from \"@pyrpc/types\""}</code></li>
                </ol>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What you lose</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li>tRPC's batching (multiple calls in one HTTP request), not yet in pyRPC</li>
                    <li>tRPC's subscriptions, on pyRPC's roadmap</li>
                    <li>The tRPC ecosystem (trpc-panel, trpc-openapi, etc.), pyRPC has its own introspection and CLI</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What you gain</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Python's type system (Pydantic, dataclasses, enums, unions)</li>
                    <li>Any Python web framework (FastAPI, Flask, Django, Starlette)</li>
                    <li>No build-time type inference, codegen works at dev time</li>
                    <li>Cross-language by design, the same frontend works with any backend</li>
                </ul>

                <p>
                    <Link href="/docs/client/adapters/react" className="text-fd-foreground underline underline-offset-2">React docs</Link> · <Link href="/docs/client/adapters/nextjs" className="text-fd-foreground underline underline-offset-2">Next.js docs</Link> · <Link href="/blog/from-createClient-to-hooks" className="text-fd-foreground underline underline-offset-2">Migration guide</Link>
                </p>
            </section>
        </article>
    )
}
