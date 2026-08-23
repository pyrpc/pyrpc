import Link from 'next/link'

export default function FrameworkAdaptersDeepDivePage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Deep dive: framework adapters, TanStack Query, and procedure kinds
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 2:00am</time>
                    <span>&middot;</span>
                    <span>18 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    pyRPC started with a deliberately small TypeScript surface: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createClient&lt;Types&gt;()</code>, a Proxy, and one <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">POST /rpc</code> per call. That is still the core. What we shipped next are <strong>thin framework adapters</strong> (React, Next.js, Vue, and Svelte) that put TanStack Query on top of that same client without inventing a second transport.
                </p>
                <p>
                    This post is the architecture deep dive: package layout, why the DX stays flat, how query/mutation kinds work end-to-end, and how Next.js hydration fits.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The invariant: one transport</h2>
                <p>
                    Every adapter ultimately calls <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createClient</code> from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code>. There is no parallel fetch layer, no links chain, no batcher in v1. That keeps the mental model identical to the vanilla client:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// Vanilla
const client = createClient<Types>({ baseUrl })
await client.greet({ name: "Ada" })

// React (same procedure name, TanStack Query around the Promise)
const api = createReactClient<Types>({ baseUrl })
api.greet.useQuery({ name: "Ada" })`}
                </pre>
                <p>
                    If you understand the Proxy client, you understand the adapters. The hooks are glue.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Package map</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`pyrpc-core          @rpc / @rpc.query / @rpc.mutation + JSON-RPC
pyrpc-codegen       Types + ProcedureKinds + procedureKinds
@pyrpc/types        generated contract (npm placeholder overwritten by codegen)
@pyrpc/client       createClient<Types>(), transport
@pyrpc/react        createReactClient, TanStack Query hooks
@pyrpc/next         createNextClient, React + RSC prefetch/hydrate
@pyrpc/vue          createVueClient
@pyrpc/svelte       createSvelteClient`}
                </pre>
                <p>
                    Dependency direction is strict: framework packages depend on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code>, never the reverse. Next depends on React. Vue and Svelte never import React.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why createReactClient imports ClientOptions</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Types</code> still come from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code>, that has not changed. Adapters also accept the same runtime config as the vanilla client (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">baseUrl</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">headers</code>), so they extend <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ClientOptions</code> from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code> and call <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createClient</code> internally:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`import { createClient, type ClientOptions } from "@pyrpc/client"

export type ReactClientOptions = ClientOptions & {
  kinds?: ProcedureKindMap
}

export function createReactClient<T>(options: ReactClientOptions = {}) {
  const { kinds, ...clientOptions } = options
  const client = createClient<T>(clientOptions)
  // Proxy: procedure → { useQuery, useMutation }
}`}
                </pre>
                <p>
                    So you import <strong>types for config</strong> from the client package, and <strong>procedure contracts</strong> from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code>. That split is intentional.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Naming: createNextClient, not createPyRPCNext</h2>
                <p>
                    We standardized on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">create*Client</code>:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createClient</code>, transport</li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createReactClient</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createVueClient</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createSvelteClient</code>, hooks</li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createNextClient</code>, App Router <em>bundle</em> (hooks + caller + prefetch + dehydrate)</li>
                </ul>
                <p>
                    tRPC uses names like <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createTRPCReact</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createTRPCNext</code>. We dropped the product prefix in the factory name because the package scope (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/next</code>) already says whose API it is. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createNextClient</code> is the consistent pyRPC pattern.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Procedure kinds (phase 2)</h2>
                <p>
                    TanStack Query distinguishes queries and mutations. tRPC encodes that on the server (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.query()</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.mutation()</code>). pyRPC now does the same:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`from pyrpc_core import rpc

@rpc.query
def get_user(user_id: int) -> dict: ...

@rpc.mutation
def update_user(user_id: int, name: str) -> dict: ...

# Bare @rpc defaults to kind "query" (backward compatible)`}
                </pre>
                <p>
                    Introspection includes <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kind</code>. Codegen emits:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`export interface Types { ... }
export type ProcedureKinds = {
  get_user: "query"
  update_user: "mutation"
}
export const procedureKinds = { ... } as const satisfies ProcedureKinds`}
                </pre>
                <p>
                    Pass <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kinds: procedureKinds</code> into the adapter so TypeScript only exposes the matching hook. Without kinds (legacy), both hooks exist on every procedure, useful during migration, not the long-term default.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Providers</h2>
                <p>
                    Wrap the app once with TanStack Query’s provider so hooks share a cache. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">PyRPCProvider</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">NextPyRPCProvider</code> are thin convenience wrappers around that; Vue uses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">VueQueryPlugin</code>; Svelte uses Svelte Query’s provider. pyRPC does not add a separate RPC or auth context, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">baseUrl</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">headers</code> live on the factory options.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Next.js: why a bundle?</h2>
                <p>
                    App Router splits server and client. Hooks cannot run in RSC. So <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createNextClient</code> returns:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api</code>, client hooks (from createReactClient)</li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createCaller</code>, Promise client for Server Components / route handlers</li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">prefetch</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">dehydrate</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">HydrateClient</code>, RSC → client cache handoff</li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">getQueryClient</code>, request-scoped on the server (React <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">cache</code>), singleton in the browser</li>
                </ul>
                <p>
                    That is the full adapter, not a docs-only DIY. The pattern matches how serious App Router + React Query apps are structured, with pyRPC’s simpler client underneath.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Query keys and utils</h2>
                <p>
                    Keys are stable and predictable: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{`["pyrpc", procedureName, input?]`}</code>. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.useUtils()</code> exposes invalidate / prefetch / fetch per procedure, the same job as tRPC’s utils without nested routers.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What we deliberately did not copy from tRPC</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Links / httpBatchLink</li>
                    <li>Nested procedure routers on the client</li>
                    <li>Superjson transformers</li>
                    <li>Subscriptions (roadmap item; not in adapters v1)</li>
                </ul>
                <p>
                    Alignment means familiar <em>hooks and kinds</em>, not a feature checklist clone. pyRPC’s differentiator stays: Python <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code> → generated Types → one flat client.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Versioning the multi-package surface</h2>
                <p>
                    npm adapters (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/*</code>) should stay on a <strong>synchronized version line</strong> (today 0.8.x) with peerDependencies on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code> and TanStack Query. Python packages (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code>, adapters, codegen) can move on PyPI versions independently but must document compatible ranges when schema fields (like <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kind</code>) change.
                </p>
                <p>
                    Practical rule: one feature PR that touches core kinds + codegen + JS adapters ships together; bump the npm workspace packages in lockstep for that release.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Where to go next</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li><Link href="/blog/nextjs-tanstack-query-tutorial" className="text-fd-foreground underline underline-offset-2">Tutorial: Next.js App Router + pyRPC</Link></li>
                    <li><Link href="/docs/client/adapters/react" className="text-fd-foreground underline underline-offset-2">Docs: React</Link> · <Link href="/docs/client/adapters/nextjs" className="text-fd-foreground underline underline-offset-2">Next.js</Link></li>
                    <li><Link href="/blog/package-versioning-and-releases" className="text-fd-foreground underline underline-offset-2">How we version and release the packages</Link></li>
                    <li><a href="https://github.com/pyrpc/pyrpc/tree/main/examples/fastapi-nextjs" className="text-fd-foreground underline underline-offset-2">examples/fastapi-nextjs</a></li>
                </ul>
            </section>
        </article>
    )
}
