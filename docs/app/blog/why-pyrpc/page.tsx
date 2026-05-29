import Link from 'next/link'

export default function WhyPyrpcPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="rounded-xl border border-fd-border bg-white/70 dark:bg-black/70 backdrop-blur-xl p-8 md:p-12">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Why pyRPC?
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>May 25, 2026</time>
                    <span>&middot;</span>
                    <span>6 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    If you've worked with FastAPI or Flask, you know the pattern: define a route, define a Pydantic model, wire up the request handler, document it with OpenAPI, and then write your frontend calls by hand  -  hoping the types match. It works, but there's a gap between your backend and frontend that you have to manage manually.
                </p>
                <p>
                    pyRPC closes that gap. It gives you a tRPC-style experience for Python backends: write a function, slap an <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code> decorator on it, and call it from TypeScript with full type safety. No OpenAPI codegen step, no manual type duplication, no runtime surprises.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The problem with traditional Python APIs</h2>
                <p>
                    A typical FastAPI endpoint looks like this:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`@app.post("/users")
async def get_user(user_id: int) -> User:
    user = await db.fetch_user(user_id)
    return user`}
                </pre>
                <p>
                    Then on the frontend, you write something like:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`const res = await fetch("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: 1 }),
})
const user = await res.json()
// user.name could be anything  -  no type safety`}
                </pre>
                <p>
                    The types are documented in OpenAPI, but you have to manually regenerate the TypeScript client, or write your own fetch wrappers, or rely on a codegen step that generates hundreds of lines of boilerplate. None of these are terrible, but they add friction to every change.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What tRPC showed us</h2>
                <p>
                    tRPC proved that you don't need a separate API layer at all. Define a procedure, call it from the client  -  the types flow through automatically. No REST endpoints to design, no GraphQL schema to maintain, no codegen to run. The function <em>is</em> the API.
                </p>
                <p>
                    The TypeScript ecosystem embraced this immediately. But Python  -  despite being the language of choice for countless backends  -  had no equivalent. You either used raw REST, or you adopted GraphQL, or you accepted the type gap.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Enter pyRPC</h2>
                <p>
                    pyRPC brings the same model to Python. Define your procedures with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code>, mount them on your framework of choice, and call them from TypeScript with full type inference.
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# server.py
from pyrpc_core import rpc, model
from pyrpc_fastapi import mount_fastapi
from fastapi import FastAPI

app = FastAPI()

@model
class User:
    id: int
    name: str
    email: str

@rpc
def get_user(user_id: int) -> User:
    return User(id=user_id, name="Alice", email="alice@example.com")

mount_fastapi(app)`}
                </pre>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// client.ts
import { createClient } from "@pyrpc/client"
import type { Types } from "@pyrpc/types"

const client = createClient<Types>()
const user = await client.get_user(1)
//    ^-- type: { id: number; name: string; email: string }`}
                </pre>
                <p>
                    The types are inferred from your Python code. Change a field in your model, and TypeScript immediately flags any mismatched usage. No codegen, no OpenAPI export, no manual sync.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The philosophy</h2>
                <p>
                    pyRPC is built on a few core ideas:
                </p>
                <ul>
                    <li><strong>Dead simple install</strong>  -  <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pip install pyrpc-core</code> and you're done. No config files, no boilerplate.</li>
                    <li><strong>Works everywhere</strong>  -  FastAPI, Flask, or any ASGI server. Pick your framework, pyRPC adapts.</li>
                    <li><strong>Batteries included but modular</strong>  -  Core is tiny. Add adapters and codegen as you need them.</li>
                    <li><strong>Universal validation</strong>  -  Pydantic v2 under the hood, automatic for primitives and models.</li>
                    <li><strong>Type-safe bridge</strong>  -  Python to TypeScript, end to end, without leaving your editor.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Where we are</h2>
                <p>
                    pyRPC is in alpha. The core protocol is stable, the FastAPI and Flask adapters work, the TypeScript client generates correct types, and the codegen tool produces production-ready contracts. We're still iterating on the developer experience, the adapter API surface, and the documentation.
                </p>
                <p>
                    Try it on the <Link href="/demo" className="text-fd-foreground underline underline-offset-2">interactive playground</Link>, check out the <Link href="/blog/demo-sandbox-design" className="text-fd-foreground underline underline-offset-2">sandbox architecture post</Link>, and open issues on <Link href="https://github.com/pyrpc/pyrpc" className="text-fd-foreground underline underline-offset-2">GitHub</Link> if something breaks.
                </p>
            </section>
            </div>
        </article>
    )
}
