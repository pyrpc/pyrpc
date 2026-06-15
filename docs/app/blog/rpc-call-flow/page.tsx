import Link from 'next/link'

export default function RpcCallFlowPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Following an RPC Call: From TypeScript Client to Python Function and Back
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 15, 2026 at 12:30pm</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The RPC Call Flow dynamic diagram traces a single remote procedure call from the TypeScript client, through HTTP, into the Python backend, and back with a response. Let's walk through each step.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The setup</h2>
                <p>A TypeScript developer calls:</p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`import { createClient } from "@pyrpc/client";
import type { Types } from "@pyrpc/types";

const client = createClient<Types>({ baseUrl: "http://localhost:8000" });
const result = await client.greet({ name: "World" });`}
                </pre>
                <p>And on the Python side, the corresponding endpoint:</p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`from pyrpc_core import rpc

@rpc
def greet(name: str) -> str:
    return f"Hello, {name}!"`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 1: Proxy intercepts the call</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createClient&lt;Types&gt;()</code> returns a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Proxy</code> object. When you access <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client.greet</code>, the Proxy captures the property name <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"greet"</code> and returns a function. Calling that function with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{`{ name: "World" }`}</code>:
                </p>
                <ol className="list-decimal pl-6 space-y-1 text-sm">
                    <li>Detects the argument is a single object &rarr; named parameters mode</li>
                    <li>Builds a JSON-RPC 2.0 request: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{'{ id: "1", method: "greet", params: { name: "World" } }'}</code></li>
                    <li>Issues HTTP POST to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">/rpc</code></li>
                </ol>
                <p>
                    The Proxy supports two calling conventions: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{'client.method({ arg1: val })'}</code> (named params, single object) and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{'client.method(val1, val2)'}</code> (positional params, array).
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 2: Adapter dispatches to core</h2>
                <p>
                    The POST request arrives at one of four adapters. The FastAPI adapter does:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`@app.post("/rpc")
async def rpc_handler(request: Request):
    payload = await request.json()
    response = await handle_request(payload, router)
    return JSONResponse(response)`}
                </pre>
                <p>
                    26 lines for the entire adapter. The Flask adapter is more interesting — it must bridge sync to async:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`@flask.route("/rpc", methods=["POST"])
def rpc_handler():
    payload = request.get_json()
    response = anyio.run(handle_request, payload, router)
    return jsonify(response)`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 3: Envelope validation</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">handle_request()</code> validates the incoming payload against the Pydantic v2 <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">RpcRequest</code> model:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`class RpcRequest(BaseModel):
    id: str | int | None
    method: str
    params: list[object] | dict[str, object] | None = None`}
                </pre>
                <p>
                    If validation fails, a JSON-RPC error response is returned immediately with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">-32600</code> (Invalid Request) or <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">-32700</code> (Parse Error). This is a critical security boundary — no unvalidated data reaches user code.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 4: Router lookup</h2>
                <p>
                    The interpreter extracts the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">method</code> field and calls <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">router.get("greet")</code>. The Router is a thread-safe dictionary. If <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"greet"</code> isn't registered, the interpreter returns <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">-32601</code> (Method Not Found).
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 5: Procedure.execute() — the hot path</h2>
                <p>
                    Each <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Procedure</code> is compiled at registration time with pre-built Pydantic TypeAdapters:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`class Procedure:
    def __init__(self, fn, request_model, response_model):
        self.fn = fn
        self.request_adapter = TypeAdapter(request_model)
        self.response_adapter = TypeAdapter(response_model)

    def execute(self, params):
        validated_params = self.request_adapter.validate_python(params)
        result = self.fn(**validated_params)
        validated_result = self.response_adapter.validate_python(result)
        return validated_result`}
                </pre>
                <p>
                    <strong>Why this matters:</strong> The TypeAdapters are built <em>once</em> at registration time (import), not on every request. The hot path has zero type-resolution overhead — just fast C-level Pydantic validation.
                </p>
                <p>
                    For our <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">greet</code> call: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">request_adapter</code> validates <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{`{ name: "World" }`}</code> (name must be str), the function runs returning <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"Hello, World!"</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">response_adapter</code> validates the return type (must be str).
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 6: Response flows back</h2>
                <p>
                    The interpreter builds an <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">RpcResponse</code>:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`class RpcResponse(BaseModel):
    id: str | int | None
    result: Any = None
    error: ErrorModel | None = None`}
                </pre>
                <p>
                    Success: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{`{ "id": "1", "result": "Hello, World!" }`}</code>. Error: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{`{ "id": "1", "error": { "code": -32603, "message": "Internal error" } }`}</code>. The response serializes back through the adapter &rarr; HTTP &rarr; client.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The error path</h2>
                <p>
                    If the server returns an error, the TypeScript client throws <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">PyRPCError</code> with structured fields: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">code</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">message</code>, and optional <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">data</code>. The caller catches it with full type information:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`try {
    await client.method(arg);
} catch (e) {
    if (e instanceof PyRPCError) {
        console.error(\`RPC error \${e.code}: \${e.message}\`, e.data);
    }
}`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What this tells us</h2>
                <p>
                    Tracing a single call reveals several architectural decisions:
                </p>
                <ol className="list-decimal pl-6 space-y-2 text-sm">
                    <li><strong>The Proxy pattern is brilliant for DX.</strong> No code generation needed on the client for method dispatch. Just use it.</li>
                    <li><strong>Validation happens at the right boundaries.</strong> The JSON-RPC envelope is validated at the interpreter boundary. Function parameters are validated by pre-built TypeAdapters. User code never sees invalid data.</li>
                    <li><strong>The adapters are pure plumbing.</strong> They add zero overhead to the hot path. The entire adapter layer could be replaced (WebSocket, anyone?) without changing a line of core code.</li>
                    <li><strong>The hot path is optimized.</strong> TypeAdapters built at init time mean the critical <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">execute()</code> path is pure C-level Pydantic — no Python-level type introspection on the hot path.</li>
                </ol>
                <p>
                    Read the <Link href="/blog/visual-tour" className="text-fd-foreground underline">visual tour post</Link> for the full diagram walkthrough, or run <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npx likec4 start architecture</code> to explore the RPC Call Flow dynamic diagram interactively.
                </p>
            </section>
        </article>
    )
}
