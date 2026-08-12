import Link from 'next/link'

export default function FlaskReactTutorialPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Flask + React: lightweight Python, full type safety
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 8, 2026 at 11:00am</time>
                    <span>&middot;</span>
                    <span>9 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Flask is the minimal Python web framework — no ORM, no admin, just routes. pyRPC's Flask adapter adds a single <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">POST /rpc</code> endpoint to your Flask app, and the React client stays completely identical to the FastAPI version. The only differences are the import paths and the default port (5000 vs 8000).
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The server</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# server/main.py
from flask import Flask
from flask_cors import CORS
from pyrpc_core import rpc
from pyrpc_flask import mount_flask

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

@rpc.query
def greet(name: str = "World") -> dict:
    return {"message": f"Hello, {name}!", "framework": "Flask"}

@rpc.query
def read_item(item_id: int, q: str = None) -> dict:
    return {"item_id": item_id, "q": q, "framework": "Flask"}

@rpc.mutation
def create_item(name: str, description: str = None) -> dict:
    return {"name": name, "description": description, "created": True, "framework": "Flask"}

mount_flask(app)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)`}
                </pre>
                <p>
                    <strong>Note the port:</strong> Flask defaults to <strong>5000</strong>, not 8000. Update <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">baseUrl</code> in your client accordingly.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Start the dev server</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`cd server
uv add pyrpc-core[flask]
pyrpc dev   # wizard → writes pyrpc.json, starts Flask on :5000

# or skip the wizard
pyrpc dev --yes --module main --client ../client`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Client — identical pattern, different port</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// src/pyrpc.ts
import { createReactClient } from "@pyrpc/react"
import type { Types } from "@pyrpc/types"

export const api = createReactClient<Types>({
  baseUrl: process.env.REACT_APP_API_URL ?? "http://localhost:5000",
})`}
                </pre>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// src/App.tsx
import { useState } from "react"
import { api } from "./pyrpc"

function App() {
  const [name, setName] = useState("")

  const { data: greeting, isLoading } = api.greet.useQuery({ name: "Flask User" })
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
{`# Terminal 1
cd server && pyrpc dev

# Terminal 2
cd client && npm install && npm start`}
                </pre>
                <p>Open <strong>http://localhost:3000</strong>. Full source at <a href="https://github.com/pyrpc/pyrpc/tree/main/examples/flask-react" className="text-fd-foreground underline underline-offset-2">examples/flask-react</a>.</p>
            </section>
        </article>
    )
}
