import Link from 'next/link'

export default function FlaskNativeTutorialPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 Flask + Next.js with flask run under the hood
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 23, 2026 at 2:30pm</time>
 <span>&middot;</span>
 <span>8 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 Before v0.13.0, Flask projects ran their server in one terminal and a type watcher in another.
 Now one command does both, launching Flask&rsquo;s own dev server, not an ASGI stand-in.
 Here is the full setup, which doubles as the walkthrough for{' '}
 <a href="https://github.com/pyrpc/pyrpc/tree/main/examples/flask-nextjs"><code>examples/flask-nextjs</code></a>.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">1. The backend</h2>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# server/main.py
from flask import Flask
from flask_cors import CORS
from pyrpc_core import rpc
from pyrpc_flask import mount_flask

app = Flask(__name__)
CORS(app)

@rpc.query
def greet(name: str = "World") -> str:
 return f"Hello, {name}!"

@rpc.mutation
def create_item(name: str) -> dict:
 return {"name": name, "id": 1}

mount_flask(app)`}</pre>
 <p>
 Nothing exotic: a normal Flask app, procedures decorated, two routes added. You can run it
 yourself with <code>python main.py</code> at any time, pyRPC never takes ownership away
 from you.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">2. One command instead of three terminals</h2>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`$ cd server && pyrpc dev

 pyRPC setup (runs once - saved to pyrpc.json)
 ? Backend framework: Flask <- preselected: mount_flask( sniffed in main.py
 ? Backend entry point (module[:app] - the file that calls mount_flask): main
 ? Client project root: ../client <- directory autocomplete, Tab accepts
 ? Frontend framework: Next.js <- detected from next.config.ts

 ✓ pyrpc.json created
 ✓ types generated (2 procs) → ../client/__pyrpc.ts
 pyRPC dev http://127.0.0.1:8000/rpc`}</pre>
 <p>
 What actually runs is Flask native:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`python -m flask --app main:app run --host 127.0.0.1 --port 8000 --reload`}</pre>
 <p>
 No WSGI bridge, no uvicorn in the process tree. Tracebacks look like Flask because they are.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">3. The frontend side</h2>
 <p>
 <code>pyrpc dev</code> wrote <code>__pyrpc.ts</code> into <code>../client</code> and wired{' '}
 <code>@pyrpc/types</code> to it (tsconfig paths + a Turbopack alias). Your client file:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`// client/lib/pyrpc.ts
import { createNextClient, httpBatchLink } from "@pyrpc/next"
import type { Types } from "@pyrpc/types"

export const api = createNextClient<Types>({
 links: [httpBatchLink({ url: "http://localhost:8000" })],
})`}</pre>
 <p>
 Then ordinary TanStack usage, <code>api.greet.useQuery(&#123;&#125;)</code>,{' '}
 <code>api.create_item.useMutation()</code>, fully typed against the Python signatures.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">4. Things to try</h2>
 <ul className="list-disc pl-5 space-y-2">
 <li>Edit <code>main.py</code>, add a procedure: types regenerate within ~300ms; autocomplete updates without touching the client.</li>
 <li>Edit <code>pyrpc.json</code>: set <code>&quot;framework&quot;: &quot;fastapi&quot;</code> just to watch the watcher terminate Flask and relaunch uvicorn. Set it back.</li>
 <li>Start the server yourself (<code>python main.py</code>) on port 8000, then run <code>pyrpc dev</code>: it detects the running server and only runs the type watcher.</li>
 </ul>
 <p>
 Two terminals total: backend+types in one, <code>npm run dev</code> in the other. That is the
 whole workflow.
 </p>
 </section>
 </article>
 )
}
