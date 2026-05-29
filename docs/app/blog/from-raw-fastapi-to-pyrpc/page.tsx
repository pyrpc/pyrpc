import Link from 'next/link'

export default function FromRawFastapiPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    From raw FastAPI to pyRPC
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>May 25, 2026</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    You have a working FastAPI app. Routes are organized, Pydantic models validate your inputs, OpenAPI documents your endpoints. But every time you add a new endpoint, you need to update your frontend types, write a new fetch call, and make sure the URL matches. It's not broken  -  it's just manual.
                </p>
                <p>
                    This post walks through migrating a real FastAPI application to pyRPC, showing the before and after for each piece.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Starting point: raw FastAPI</h2>
                <p>
                    Here's a typical user management API:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class User(BaseModel):
    id: int
    name: str
    email: str

class CreateUserInput(BaseModel):
    name: str
    email: str

@app.get("/users/{user_id}")
async def get_user(user_id: int) -> User:
    user = await fetch_user(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user

@app.post("/users")
async def create_user(data: CreateUserInput) -> User:
    user = await insert_user(data.name, data.email)
    return user`}
                </pre>
                <p>
                    And the TypeScript client code that goes with it:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`interface User {
    id: number
    name: string
    email: string
}

async function getUser(userId: number): Promise<User> {
    const res = await fetch(\`/users/\${userId}\`)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
}

async function createUser(name: string, email: string): Promise<User> {
    const res = await fetch("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
}`}
                </pre>
                <p>
                    Every endpoint URL, HTTP method, status code, request shape, and response type is hand-written and manually kept in sync. If you change the Python model, you have to find and update every TypeScript usage.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 1: Add pyRPC</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`pip install pyrpc-core pyrpc-fastapi`}
                </pre>
                <p>
                    That's it. One install command for the core runtime and the FastAPI adapter.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 2: Replace routes with procedures</h2>
                <p>
                    Instead of route decorators, you use <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code>. Instead of <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">BaseModel</code>, you use <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@model</code>. And instead of running <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">uvicorn app:app</code> directly, you call <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">mount_fastapi(app)</code>:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`from pyrpc_core import rpc, model
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
    user = fetch_user(user_id)
    if not user:
        raise ValueError("User not found")
    return user

@rpc
def create_user(name: str, email: str) -> User:
    return insert_user(name, email)

mount_fastapi(app)`}
                </pre>
                <p>
                    A few things to notice:
                </p>
                <ul>
                    <li><strong>No HTTP boilerplate</strong>  -  No routes, no methods, no status codes. The function <em>is</em> the endpoint.</li>
                    <li><strong>Plain Python types</strong>  -  Primitives are validated automatically. Complex models use <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@model</code> which is just a thin wrapper over Pydantic.</li>
                    <li><strong>Exceptions become errors</strong>  -  <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ValueError</code> is automatically mapped to an error response. No more <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">HTTPException</code> boilerplate.</li>
                    <li><strong>Sync is fine</strong>  -  pyRPC handles sync functions transparently. No need to make everything <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">async</code> unless you need it.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 3: Generate the TypeScript client</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`pip install pyrpc-codegen
pyrpc codegen http://localhost:8000`}
                </pre>
                <p>
                    This generates a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> package with all your model and procedure types. Then your frontend becomes:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`import { createClient } from "@pyrpc/client"
import type { Types } from "@pyrpc/types"

const client = createClient<Types>()

const user = await client.get_user(1)
const newUser = await client.create_user("Alice", "alice@example.com")`}
                </pre>
                <p>
                    Compare this to the original TypeScript code. No fetch calls, no URL strings, no JSON parsing, no manual error handling, no manual types. Everything is inferred.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The diff</h2>
                <p>
                    Here's what changed per endpoint:
                </p>
                <table className="w-full text-[11px] font-mono border-collapse">
                    <thead>
                        <tr className="border-b border-edge">
                            <th className="text-left py-2 pr-4">Concern</th>
                            <th className="text-left py-2 pr-4">Raw FastAPI</th>
                            <th className="text-left py-2">pyRPC</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-edge">
                            <td className="py-2 pr-4">Route</td>
                            <td className="py-2 pr-4"><code className="text-[10px]">{'@app.get("/users/{id}")'}</code></td>
                            <td className="py-2"><code className="text-[10px]">@rpc</code></td>
                        </tr>
                        <tr className="border-b border-edge">
                            <td className="py-2 pr-4">Input model</td>
                            <td className="py-2 pr-4"><code className="text-[10px]">class CreateUser(BaseModel)</code></td>
                            <td className="py-2"><code className="text-[10px]">def create_user(name: str, email: str)</code></td>
                        </tr>
                        <tr className="border-b border-edge">
                            <td className="py-2 pr-4">Error handling</td>
                            <td className="py-2 pr-4"><code className="text-[10px]">raise HTTPException</code></td>
                            <td className="py-2"><code className="text-[10px]">raise ValueError</code></td>
                        </tr>
                        <tr className="border-b border-edge">
                            <td className="py-2 pr-4">Client call</td>
                            <td className="py-2 pr-4"><code className="text-[10px]">{'fetch(...).then(r => r.json())'}</code></td>
                            <td className="py-2"><code className="text-[10px]">client.get_user(1)</code></td>
                        </tr>
                        <tr>
                            <td className="py-2 pr-4">Type safety</td>
                            <td className="py-2 pr-4">Manual</td>
                            <td className="py-2">Inferred</td>
                        </tr>
                    </tbody>
                </table>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">When should you migrate?</h2>
                <p>
                    pyRPC isn't meant to replace every FastAPI endpoint. It's best for:
                </p>
                <ul>
                    <li><strong>CRUD operations</strong>  -  The bread and butter of most backends.</li>
                    <li><strong>Business logic procedures</strong>  -  Functions that take inputs and return outputs.</li>
                    <li><strong>Internal APIs</strong>  -  Services that call each other within your infrastructure.</li>
                </ul>
                <p>
                    It's less suited for file uploads, streaming responses, or endpoints that need fine-grained HTTP control. For those, keep your regular FastAPI routes alongside pyRPC  -  they coexist perfectly.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Try it yourself</h2>
                <p>
                    The fastest way to see the difference is to open the <Link href="/demo" className="text-fd-foreground underline underline-offset-2">interactive playground</Link>, write a few <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code> procedures, and watch the TypeScript types update in real time.
                </p>
            </section>
        </article>
    )
}
