import Link from 'next/link'

export default function BuildingNextjsExamplePage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Building the Next.js example app: file by file
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 7:15am</time>
                    <span>&middot;</span>
                    <span>12 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">examples/nextjs</code> directory is a complete working app: FastAPI backend, Next.js App Router frontend, end-to-end type safety. This post walks through every file and what it does.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">server.py — the Python backend</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`from fastapi import FastAPI
from pyrpc_fastapi import mount_fastapi
from pyrpc_core import rpc

app = FastAPI()

@rpc.query
def greet(name: str) -> str:
    return f"Hello, {name}!"

@rpc.query
def get_user(user_id: int) -> dict:
    return {"id": user_id, "name": "Ada"}

mount_fastapi(app)`}
                </pre>
                <p>
                    Two procedures. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">mount_fastapi(app)</code> registers the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">POST /rpc</code> endpoint. That is the entire backend.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">lib/pyrpc.ts — the client setup</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`import { createNextClient } from "@pyrpc/next"
import type { Types } from "@pyrpc/types"
import { procedureKinds } from "@pyrpc/types"

export const { api, prefetch, dehydrate, HydrateBoundary } =
  createNextClient<Types>({
    baseUrl: process.env.NEXT_PUBLIC_PYRPC_URL!,
    kinds: procedureKinds,
  })`}
                </pre>
                <p>
                    One line creates the full client: hooks, prefetch, dehydration, and the hydration boundary. The variable names are yours to choose.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">app/layout.tsx — providers</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`import { api } from "@/lib/pyrpc"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <api.Provider>{children}</api.Provider>
      </body>
    </html>
  )
}`}
                </pre>
                <p>
                    Wrap once with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.Provider</code>. All child components get access to the hooks.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">app/page.tsx — RSC with prefetch</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`import { prefetch, dehydrate, HydrateBoundary } from "@/lib/pyrpc"
import Greeting from "./greeting"

export default async function Home() {
  await prefetch.greet("Ada")
  const state = dehydrate()

  return (
    <HydrateBoundary state={state}>
      <Greeting />
    </HydrateBoundary>
  )
}`}
                </pre>
                <p>
                    Server Component prefetches data, dehydrates the cache, passes it to the client via <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">HydrateBoundary</code>. No loading spinners for initial data.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">app/greeting.tsx — client hook</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`"use client"
import { api } from "@/lib/pyrpc"

export default function Greeting() {
  const { data } = api.greet.useQuery("Ada")
  return <p>{data ?? "Loading..."}</p>
}`}
                </pre>
                <p>
                    The client component uses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code> because <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">greet</code> is a query. If it were a mutation, it would show <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code> automatically.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">app/providers.tsx — client provider</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`"use client"
import { api } from "@/lib/pyrpc"

export function Providers({ children }) {
  return <api.Provider>{children}</api.Provider>
}`}
                </pre>
                <p>
                    Separate client provider for areas where the root layout is a Server Component but children need client-side hooks.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this works</h2>
                <p>
                    Every file has a single responsibility. The backend is three lines of Python. The frontend is standard Next.js App Router with TanStack Query underneath. pyRPC is the glue, not the framework.
                </p>

                <p>
                    <a href="https://github.com/pyrpc/pyrpc/tree/main/examples/nextjs" className="text-fd-foreground underline underline-offset-2">examples/nextjs on GitHub</a> · <Link href="/docs/client/nextjs" className="text-fd-foreground underline underline-offset-2">Next.js docs</Link>
                </p>
            </section>
        </article>
    )
}
