import Link from 'next/link'

export default function DjangoReactTutorialPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Django + React: native async views, typed React hooks
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 8, 2026 at 1:00pm</time>
                    <span>&middot;</span>
                    <span>11 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Django's async view support (4.2+) makes it a natural fit for pyRPC. Procedures are just <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">async def</code> functions decorated with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.query</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.mutation</code>, and Django handles them natively — no <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">anyio.run</code> bridge.
                </p>
                <p>
                    There's one Django-specific thing to know: <strong>procedures are registered by executing their decorator</strong>, which happens when the module is imported. You must import <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">views</code> in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">urls.py</code> to trigger registration.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Server — views.py</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# myproject/views.py
from django.http import HttpResponse
from pyrpc_core import rpc

def index(request):
    return HttpResponse("<h1>Django + pyRPC</h1>")

@rpc.query
async def greet(name: str = "World") -> dict:
    return {"message": f"Hello, {name}!", "framework": "Django"}

@rpc.query
async def read_item(item_id: int, q: str = None) -> dict:
    return {"item_id": item_id, "q": q, "framework": "Django"}

@rpc.mutation
async def create_item(name: str, description: str = None) -> dict:
    return {"name": name, "description": description, "created": True}`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Server — urls.py</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# myproject/urls.py
from django.contrib import admin
from django.urls import path
from pyrpc_django import mount_django
from . import views  # ← this import registers the @rpc decorators

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", views.index, name="index"),
]
mount_django(urlpatterns)`}
                </pre>
                <p>
                    <strong>The import is required.</strong> Without <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">from . import views</code>, the procedures never run their decorators and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">/rpc</code> returns an empty schema.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">CORS — settings.py</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`INSTALLED_APPS = ["corsheaders", ...]
MIDDLEWARE = ["corsheaders.middleware.CorsMiddleware", ...]
CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Start the dev server</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`cd server
uv add pyrpc-core[django]
pyrpc dev --yes --module myproject.views --client ../client`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Client — identical to fastapi-react</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// src/pyrpc.ts
import { createReactClient } from "@pyrpc/react"
import type { Types } from "@pyrpc/types"

export const api = createReactClient<Types>({
  baseUrl: process.env.REACT_APP_API_URL ?? "http://localhost:8000",
})`}
                </pre>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// src/App.tsx
import { useState } from "react"
import { api } from "./pyrpc"

function App() {
  const [name, setName] = useState("")
  const { data: greeting, isLoading } = api.greet.useQuery({ name: "Django User" })
  const { data: item } = api.read_item.useQuery({ item_id: 42, q: "test" })
  const createItem = api.create_item.useMutation()

  return (
    <api.Provider>
      {isLoading ? <p>Loading…</p> : <pre>{JSON.stringify(greeting)}</pre>}
      <pre>{JSON.stringify(item)}</pre>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button onClick={() => createItem.mutate({ name })} disabled={createItem.isPending}>
        {createItem.isPending ? "Creating…" : "Create"}
      </button>
      {createItem.isSuccess && <pre>{JSON.stringify(createItem.data)}</pre>}
    </api.Provider>
  )
}`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Run it</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`cd server && pyrpc dev
cd client && npm install && npm start`}
                </pre>
                <p>Open <strong>http://localhost:3000</strong>. Full source at <a href="https://github.com/pyrpc/pyrpc/tree/main/examples/django-react" className="text-fd-foreground underline underline-offset-2">examples/django-react</a>.</p>
            </section>
        </article>
    )
}
