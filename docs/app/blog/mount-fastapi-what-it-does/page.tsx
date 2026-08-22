export default function Page() {
  return (
    <article style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7 }}>
      <p style={{ color: '#666', fontSize: 14 }}>Deep Dive · v0.10.0</p>
      <h1>What mount_fastapi() actually does</h1>
      <p style={{ color: '#666' }}>
        One line that connects your Python server to your TypeScript client, here's exactly what happens under the hood.
      </p>
      <hr />

      <h2>The mental model</h2>
      <p>
        When you write <code>mount_fastapi(app)</code>, you are not creating a new server. You are not wrapping
        your app. You are adding two routes to the FastAPI application you already have, in exactly the same way
        that <code>app.include_router()</code> would.
      </p>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pyrpc_core import rpc
from pyrpc_fastapi import mount_fastapi

# Your app: you created it, you own it, you run it
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@rpc.query
def greet(name: str = "World") -> str:
    return f"Hello, {name}!"

# Adds POST /rpc and GET /rpc to your existing app.
# Nothing else changes.
mount_fastapi(app)

# You run this same app with uvicorn as you normally would:
# uvicorn main:app --reload`}</code></pre>

      <h2>The two routes it registers</h2>
      <p><strong>POST /rpc</strong>, the dispatch endpoint. Receives a JSON-RPC 2.0 request body:</p>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`{
  "id": "abc123",
  "method": "greet",
  "params": { "name": "Ada" }
}`}</code></pre>
      <p>
        The interpreter looks up the procedure in the router, validates parameters with Pydantic, runs the
        function, and returns a JSON-RPC 2.0 response:
      </p>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`{ "id": "abc123", "result": "Hello, Ada!" }`}</code></pre>

      <p><strong>GET /rpc</strong>, the introspection endpoint. Returns a schema of all registered procedures:</p>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`{
  "greet": {
    "parameters": [{ "name": "name", "type": "str", "required": false }],
    "return_type": "str",
    "kind": "query"
  }
}`}</code></pre>
      <p>
        This is what <code>pyrpc dev</code> calls to generate your TypeScript types. It's also what the
        pyRPC TypeScript client uses to communicate with the server.
      </p>

      <h2>Why "mount" and not "create"</h2>
      <p>
        The naming is intentional. You mount pyRPC onto your server the way you mount a sub-application or
        router. You keep full control of your FastAPI app, you can add other routes, middleware, dependencies,
        and lifespan hooks exactly as you normally would. pyRPC is a tenant on your server, not a replacement.
      </p>
      <p>
        This means you can mix pyRPC procedures with regular FastAPI routes:
      </p>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`app = FastAPI()

@app.get("/health")   # regular FastAPI route
def health(): return {"ok": True}

@rpc.query            # pyRPC procedure
def greet(name: str) -> str: return f"Hello, {name}!"

mount_fastapi(app)    # adds /rpc to the existing app`}</code></pre>

      <h2>Same pattern for other frameworks</h2>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`# Flask
from pyrpc_flask import mount_flask
app = Flask(__name__)
mount_flask(app)  # adds /rpc to your Flask app

# Django
from pyrpc_django import mount_django
urlpatterns = mount_django()  # returns URL patterns to include`}</code></pre>
    </article>
  );
}
