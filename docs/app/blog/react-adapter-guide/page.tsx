import Link from 'next/link'

export default function ReactAdapterGuidePage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Guide: @pyrpc/react from zero to useQuery
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 4:45am</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`npm install @pyrpc/react @pyrpc/client @pyrpc/types @tanstack/react-query`}
                </pre>

                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// lib/pyrpc.ts
import { createReactClient } from "@pyrpc/react"
import type { Types } from "@pyrpc/types"

export const api = createReactClient<Types>({
  baseUrl: "http://localhost:8000",
})`}
                </pre>

                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// App.tsx
import { api } from "./lib/pyrpc"

export function App() {
  return (
    <api.Provider>
      <Greeting />
    </api.Provider>
  )
}

function Greeting() {
  const { data, isLoading } = api.greet.useQuery({ name: "Ada" })
  if (isLoading) return <p>…</p>
  return <p>{data}</p>
}`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Utils</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`const utils = api.useUtils()
await utils.greet.invalidate({ name: "Ada" })
await utils.greet.prefetch({ name: "Ada" })`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Same-origin tip</h2>
                <p>
                    In the browser, omitting <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">baseUrl</code> can fall back to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">window.location.origin</code> when your API is reverse-proxied on the same host. For local split ports, set <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">baseUrl</code> explicitly.
                </p>

                <p>
                    Need App Router? <Link href="/blog/nextjs-tanstack-query-tutorial" className="text-fd-foreground underline underline-offset-2">Next tutorial</Link>
                </p>
            </section>
        </article>
    )
}
