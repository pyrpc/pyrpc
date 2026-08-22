import Link from 'next/link'

export default function DjangoNextJsTutorialPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Django + Next.js: RSC prefetch with a Django backend
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 8, 2026 at 2:30pm</time>
                    <span>&middot;</span>
                    <span>11 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Django + Next.js is a production-grade combination: Django's admin, ORM, and auth on the backend; Next.js App Router with RSC prefetch on the frontend. pyRPC handles the contract between them, no API layer to maintain, no schema drift.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Server</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# myproject/views.py
from pyrpc_core import rpc

@rpc.query
async def greet(name: str = "World") -> dict:
    return {"message": f"Hello, {name}!", "framework": "Django"}

@rpc.query
async def read_item(item_id: int, q: str = None) -> dict:
    return {"item_id": item_id, "q": q}

@rpc.mutation
async def create_item(name: str, description: str = None) -> dict:
    return {"name": name, "description": description, "created": True}

# myproject/urls.py
from . import views  # required to register @rpc decorators
from pyrpc_django import mount_django
urlpatterns = [
    path("", views.index),
]
mount_django(urlpatterns)

# myproject/settings.py
CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Start pyrpc dev</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`cd server
uv add pyrpc-core[django]
pyrpc dev --yes --module myproject.views --client ../client`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Client</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// lib/pyrpc.ts
import { createNextClient } from "@pyrpc/next"
import type { Types } from "@pyrpc/types"

export const api = createNextClient<Types>({
  baseUrl: process.env.PYRPC_URL ?? "http://localhost:8000",
})`}
                </pre>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// app/page.tsx, Server Component
import { api } from "@/lib/pyrpc"
import { Counter } from "./counter"

export default async function Page() {
  await api.prefetch.greet({ name: "Django User" })
  await api.prefetch.read_item({ item_id: 42, q: "django-test" })
  return (
    <api.HydrationBoundary state={api.dehydrate()}>
      <Counter />
    </api.HydrationBoundary>
  )
}

// app/counter.tsx, Client Component
"use client"
export function Counter() {
  const { data: greeting, isLoading } = api.greet.useQuery({ name: "Django User" })
  const { data: item } = api.read_item.useQuery({ item_id: 42, q: "django-test" })
  const createItem = api.create_item.useMutation()
  const [name, setName] = useState("")

  return (
    <div>
      {isLoading ? <p>Loading…</p> : <pre>{JSON.stringify(greeting)}</pre>}
      <pre>{JSON.stringify(item)}</pre>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button onClick={() => createItem.mutate({ name })} disabled={createItem.isPending}>
        {createItem.isPending ? "Creating…" : "Create"}
      </button>
      {createItem.isSuccess && <pre>{JSON.stringify(createItem.data)}</pre>}
    </div>
  )
}`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Run it</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`cd server && pyrpc dev
cd client && npm install && npm run dev`}
                </pre>
                <p>Open <strong>http://localhost:3000</strong>. Full source at <a href="https://github.com/pyrpc/pyrpc/tree/main/examples/django-nextjs" className="text-fd-foreground underline underline-offset-2">examples/django-nextjs</a>.</p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why Django + Next.js?</h2>
                <p>
                    Django gives you a production-grade admin panel, migrations, the ORM, and auth out of the box. Next.js gives you App Router, RSC, and first-class TypeScript. pyRPC's thin adapter layer means you never write a REST endpoint, Django procedures call through to your models directly, and the types land in Next.js automatically.
                </p>
            </section>
        </article>
    )
}
