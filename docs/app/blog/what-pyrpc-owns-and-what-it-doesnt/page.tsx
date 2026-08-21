import Link from 'next/link'

export default function WhatPyrpcOwnsAndWhatItDoesntPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    What pyRPC owns, and what it doesn&rsquo;t
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 8:40pm</time>
                    <span>&middot;</span>
                    <span>9 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    A client that depends on your library in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">dependencies</code> is a contract: it will be installed, bundled, and linked, forever. A client that lists your library as a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">peerDependency</code> is a promise that the ecosystem provides it. Getting this split right is the difference between a library that works out of the box and one that fights its users. This post is the contract pyRPC actually ships.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The contract, package by package</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`@pyrpc/react                            @pyrpc/next
----------------------------------------------------------------------------------
dependencies     @pyrpc/client ^0.12.0             same
                 @pyrpc/types  ^0.12.0             + @pyrpc/react ^0.12.0

peerDependencies @tanstack/react-query ^5.0        @tanstack/react-query ^5.0
                 react >=18.0.0                    react >=18.0.0
                                                  next >=14.0.0

devDependencies  same set, pinned for tests        same set, pinned for tests`}
                </pre>
                <p>
                    The pattern: <em>pyRPC owns everything it ships; the user&rsquo;s stack is a peer.</em> <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> are our code, so they are hard dependencies, installing <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/react</code> must bring them along. React, Next.js, and TanStack Query are the user&rsquo;s frameworks, so they are peers with version floors that state how recent your app must be.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">&ldquo;Internal&rdquo; does not mean &ldquo;owned&rdquo;</h2>
                <p>
                    TanStack Query is the interesting case. The hooks layer is thin (it is basically <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code>, and query-client plumbing around the transport. When a library depends so directly on a peer, there is a temptation to re-export it so users get &ldquo;everything in one import.&rdquo; We chose not to, and the reason is the same one that puts <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@tanstack/react-query</code> in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">peerDependencies</code> rather than <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">dependencies</code>: an app can legitimately use TanStack Query outside pyRPC) for REST endpoints, optimistic caches, its own prefetching (and it should not end up with two copies of React hooks state fighting over the same cache. One query client, one cache, one version. That is the unit the peer contract protects.
                </p>
                <p>
                    The same reasoning is why we import <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@tanstack/react-query</code> types in the hooks, not a wrapped copy. If the user upgrades React Query, the hooks keep working because they talk to the public API the user is already using.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The dependency that crossed over</h2>
                <p>
                    The line between owned and not-owned is not frozen. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> started as a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">devDependency</code> of the client packages (it was needed at compile time to build them, and the compiler erased the import, so users never needed it at runtime. Then the generated-file contract changed. The emitted <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">__pyrpc.ts</code> began referencing <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> directly, and more importantly the framework adapters started importing it as a runtime value. A type-only dependency became a runtime dependency) the story in <Link href="/blog/types-from-dev-dep-to-runtime-dep" className="text-fd-foreground underline underline-offset-2">types: from dev-dep to runtime-dep</Link>. That is the mechanism by which things move across the line: when a package stops being compile-time-erased and starts being imported at runtime in the shipped artifacts, it earns a place in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">dependencies</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The Python side: extras as the peer contract</h2>
                <p>
                    The Python package expresses the same idea differently, because pip has no <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">peerDependencies</code>. Instead, the framework integrations live behind extras: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core[fastapi]</code> pulls in the FastAPI scaffolding; Django and Flask get the same treatment. The core is framework-agnostic (it ships JSON-RPC handling and schema work with no server framework) and each server framework is opt-in. Install what you use, and never install four servers to use one. The role is identical to a peer range: pyRPC stays small, and the framework the user chose is respected as the user&rsquo;s call.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What this means for a pyRPC app</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Add <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/react</code> and npm pulls <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> automatically, you never install those by hand.</li>
                    <li>You install <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@tanstack/react-query</code> yourself and wire one <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">QueryClientProvider</code>, the one every app would have anyway.</li>
                    <li>npm warnings about unmatched peer ranges are real signals: you are below the supported floor for React or Next.js, and upgrading your framework is the fix.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Further reading</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li><Link href="/blog/why-tanstack-query" className="text-fd-foreground underline underline-offset-2">Why TanStack Query?</Link>, the decision that created the peer dependency</li>
                    <li><Link href="/blog/types-from-dev-dep-to-runtime-dep" className="text-fd-foreground underline underline-offset-2">Types: from dev-dep to runtime-dep</Link>, how the line gets crossed</li>
                    <li><a href="https://docs.npmjs.com/cli/v11/configuring-npm/package-json#peerdependencies" className="text-fd-foreground underline underline-offset-2">npm: peerDependencies</a></li>
                    <li><a href="https://tanstack.com/query/latest" className="text-fd-foreground underline underline-offset-2">TanStack Query docs</a></li>
                    <li><a href="https://trpc.io/docs" className="text-fd-foreground underline underline-offset-2">tRPC docs</a>, the peer-contract precedent</li>
                </ul>
            </section>
        </article>
    )
}
