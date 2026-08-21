import Link from 'next/link'

export default function NextjsTanstackTutorialPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Tutorial: Next.js App Router + TanStack Query with pyRPC
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 2:30am</time>
                    <span>&middot;</span>
                    <span>14 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Build a typed full-stack slice: Python procedures with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.query</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.mutation</code>, a Next.js App Router UI, RSC prefetch, and client hooks, all through <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/next</code>.
                </p>
                <p>
                    Prefer a ready-made tree? Clone the repo and open <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">examples/fastapi-nextjs</code>. This tutorial walks the same path from scratch.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What you will build</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li>FastAPI + pyRPC API on port 8000</li>
                    <li>Next.js app that prefetches on the server and hydrates on the client</li>
                    <li>A query hook and a mutation hook wired to TanStack Query</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 1, Python API</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# server.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pyrpc_core import rpc
from pyrpc_fastapi import mount_fastapi

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@rpc.query
def greet(name: str = "World") -> str:
    return f"Hello, {name}!"

@rpc.query
async def get_status() -> dict:
    return {"status": "online", "version": "0.8.1"}

@rpc.mutation
def set_display_name(name: str) -> dict:
    return {"ok": True, "name": name}

mount_fastapi(app)

# uv run uvicorn server:app --reload --port 8000`}
                </pre>
                <p>
                    Bare <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code> still works and defaults to kind <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">query</code>. Prefer explicit <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.query</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.mutation</code> for new code.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 2, Generate types</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# with the API running
pyrpc codegen http://localhost:8000 --client ../client`}
                </pre>
                <p>
                    You should get <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Types</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ProcedureKinds</code>, and a runtime <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">procedureKinds</code> object in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 3, Install the Next stack</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`npm install @pyrpc/next @pyrpc/react @pyrpc/client @pyrpc/types @tanstack/react-query
npm install next react react-dom`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 4, createNextClient</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// lib/pyrpc.ts
import { createNextClient } from "@pyrpc/next"
import type { Types } from "@pyrpc/types"
import { procedureKinds } from "@pyrpc/types"

export const {
  api,
  createCaller,
  prefetch,
  dehydrate,
  HydrateClient,
} = createNextClient<Types, typeof procedureKinds>({
  baseUrl: process.env.PYRPC_URL ?? "http://localhost:8000",
  kinds: procedureKinds,
})`}
                </pre>
                <p>
                    Naming matches <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createReactClient</code>. The Next factory returns a bundle because App Router needs server helpers, not only hooks.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 5, Provider</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// app/providers.tsx
"use client"
import { NextPyRPCProvider } from "@pyrpc/next"

export function Providers({ children }: { children: React.ReactNode }) {
  return <NextPyRPCProvider>{children}</NextPyRPCProvider>
}

// app/layout.tsx, wrap children with <Providers>`}
                </pre>
                <p>
                    This is TanStack Query’s cache provider. pyRPC does not add a separate RPC context.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 6, Prefetch in a Server Component</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// app/page.tsx
import { dehydrate, HydrateClient, prefetch } from "@/lib/pyrpc"
import { Greeting } from "./greeting"

export default async function Page() {
  await prefetch.greet("Ada")
  await prefetch.get_status(undefined)

  return (
    <HydrateClient state={dehydrate()}>
      <Greeting />
    </HydrateClient>
  )
}`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 7, Client Component hooks</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// app/greeting.tsx
"use client"
import { api } from "@/lib/pyrpc"

export function Greeting() {
  const { data, isLoading } = api.greet.useQuery("Ada")
  const status = api.get_status.useQuery(undefined)
  const rename = api.set_display_name.useMutation()

  return (
    <div>
      <p>{isLoading ? "…" : data}</p>
      <p>{status.data?.status}</p>
      <button onClick={() => rename.mutate("Grace")}>Rename</button>
    </div>
  )
}`}
                </pre>
                <p>
                    With <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">procedureKinds</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">set_display_name</code> only exposes <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code>, calling <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code> on it is a type error.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 8, Run both processes</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# terminal 1
uv run uvicorn server:app --reload --port 8000

# terminal 2
npm run dev   # Next on :3000`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Common pitfalls</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Missing baseUrl in RSC</strong>, Server Components have no <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">window</code>. Always set <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">baseUrl</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">PYRPC_URL</code>.</li>
                    <li><strong>Forgetting the provider</strong>, hooks throw without a QueryClient. Use <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">NextPyRPCProvider</code> or raw <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">QueryClientProvider</code>.</li>
                    <li><strong>CORS</strong>, allow <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">http://localhost:3000</code> on the FastAPI app during local dev.</li>
                    <li><strong>Stale kinds</strong>, after changing <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.query</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.mutation</code>, regenerate types.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Next reading</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li><Link href="/blog/framework-adapters-deep-dive" className="text-fd-foreground underline underline-offset-2">Deep dive: adapters architecture</Link></li>
                    <li><Link href="/docs/client/nextjs" className="text-fd-foreground underline underline-offset-2">Docs: Next.js adapter</Link></li>
                    <li><Link href="/docs/server/procedures" className="text-fd-foreground underline underline-offset-2">Docs: query vs mutation</Link></li>
                </ul>
            </section>
        </article>
    )
}
