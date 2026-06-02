# 3. Server Internals

## Package Structure

```
pyrpc-core/src/pyrpc_core/
│
├── __init__.py           # Public API: Router, rpc, handle_request, get_registry_schema, etc.
│
├── core/
│   ├── decorators.py     # @rpc, @model, default_router (just 8 lines!)
│   ├── registry.py       # Router — thread-safe dict of Procedures
│   ├── procedure.py      # Procedure — the compiled RPC endpoint
│   ├── introspection.py  # Schema generation (str() + json_schema())
│   ├── interpreter.py    # Request handler (JSON-RPC dispatcher)
│   └── models.py         # RpcRequest, RpcResponse Pydantic models
│
├── client/
│   └── python_client.py  # Python RPCClient (for Python-to-Python RPC)
│
└── transport/
    └── asgi.py           # Minimal ASGI app (POST /rpc, GET /rpc)
```

---

## The `@rpc` Decorator — Entry Point

```python
# decorators.py (the ENTIRE file)
from .registry import Router

default_router = Router()    # ← global singleton
rpc = default_router.rpc     # ← alias for easy import
```

When **you** write:

```python
from pyrpc_core import rpc

@rpc
def add(a: int, b: int) -> int:
    return a + b
```

This calls:

```python
# registry.py:31-33
# Since @rpc without parentheses calls:
default_router.rpc(add)
# Which sees callable → calls decorator(add)
```

The `Router.rpc()` method:

```python
# registry.py:15-33
def rpc(self, name_or_fn=None):
    def decorator(fn):
        name = name_or_fn if isinstance(name_or_fn, str) else fn.__name__
        proc = Procedure(fn, name=name)    # ← COMPILATION HAPPENS HERE
        self.register(name, proc)          # ← STORED IN ROUTER
        return fn                          # ← returns ORIGINAL function, not Procedure

    if callable(name_or_fn):               # @rpc without ()
        return decorator(name_or_fn)
    return decorator                       # @rpc("name") with ()
```

**Important:** The decorator returns the original function, not the Procedure. This means `add(1, 2)` still works as a normal Python function. The Procedure is stored in the Router for RPC dispatch only.

---

## Procedure Compilation (The "Compile Step")

Everything expensive happens HERE, once, at import time:

```python
# procedure.py:31-46
class Procedure:
    def __init__(self, fn, name=None):
        self.fn = fn
        self.name = name or fn.__name__
        
        # 1. Inspect function signature — captures ALL type info
        #    For add(a: int, b: int) → int:
        #    sig.parameters = OrderedDict([
        #      ("a", Parameter(name='a', annotation=int, kind=POSITIONAL_OR_KEYWORD)),
        #      ("b", Parameter(name='b', annotation=int, kind=POSITIONAL_OR_KEYWORD))
        #    ])
        #    sig.return_annotation = int
        self.sig = inspect.signature(fn)
        
        # 2. Check if function is async (determines await or direct call)
        self.is_async = inspect.iscoroutinefunction(fn)
        
        # 3. Pre-build Pydantic TypeAdapters for ALL parameters
        #    These are expensive to create, cheap to use
        self.arg_adapters = {}
        for param_name, param in self.sig.parameters.items():
            if param.annotation is not inspect.Parameter.empty and param.annotation is not Any:
                self.arg_adapters[param_name] = TypeAdapter(param.annotation)
                # e.g., TypeAdapter(int) — can validate int values AND generate JSON Schema
        
        # 4. Pre-build Return TypeAdapter
        self.return_adapter = None
        if return_type is not Any:
            self.return_adapter = TypeAdapter(return_type)
```

**Why this design (inspired by FastAPI)?** FastAPI also does this — it inspects routes at startup and pre-builds validation models. The idea is: do the expensive introspection once, then have a fast execution path.

---

## Procedure Execution (The "Run Step")

Fast and simple — the hot path for every RPC call:

```python
# procedure.py:48-91
async def execute(self, params: Any) -> Any:
    """Execute the procedure with the given parameters."""
    
    # 1. BIND arguments to the function signature
    #    Handles both formats:
    #      - list: sig.bind(*[1, 2]) → a=1, b=2
    #      - dict: sig.bind(**{"a": 1, "b": 2}) → a=1, b=2
    if isinstance(params, list):
        bound_args = self.sig.bind(*params)
    elif isinstance(params, dict):
        bound_args = self.sig.bind(**params)
    
    # 2. VALIDATE each parameter with its TypeAdapter
    #    TypeAdapter(int).validate_python(1) → 1 (int) ✅
    #    TypeAdapter(int).validate_python("hello") → ValidationError ❌
    for name, value in bound_args.arguments.items():
        adapter = self.arg_adapters.get(name)
        if adapter:
            bound_args.arguments[name] = adapter.validate_python(value)
    
    # 3. CALL the function (sync or async)
    if self.is_async:
        result = await self.fn(*bound_args.args, **bound_args.kwargs)
    else:
        result = self.fn(*bound_args.args, **bound_args.kwargs)
    
    # 4. VALIDATE the return value
    if self.return_adapter:
        result = self.return_adapter.validate_python(result)
    
    return result
```

---

## Router — The Procedure Registry

```python
# registry.py:5-55
class Router:
    def __init__(self):
        self._procedures: Dict[str, Procedure] = {}
        self._lock = threading.Lock()  # ← thread-safe for production servers
    
    def register(self, name, proc):
        with self._lock:
            self._procedures[name] = proc
    
    def get(self, name) -> Optional[Procedure]:
        with self._lock:
            return self._procedures.get(name)
    
    def list(self) -> List[str]:
        with self._lock:
            return list(self._procedures.keys())
    
    def merge(self, other, prefix=""):
        """Merge another router into this one (for namespacing)."""
        with other._lock, self._lock:
            for name, proc in other._procedures.items():
                new_name = f"{prefix}{name}" if prefix else name
                self._procedures[new_name] = proc
```

**Thread safety:** The `_lock` ensures concurrent requests don't corrupt the registry. This matters when you're running behind uvicorn/gunicorn with multiple workers.

**Merge for namespacing:** You can compose routers:
```python
user_router = Router()
@user_router.rpc
def get(id: int): ...

main_router = Router()
main_router.merge(user_router, prefix="user.")
# Now "user.get" exists in main_router
```

---

## Request Handling — The JSON-RPC Dispatcher

```python
# interpreter.py:13-70
async def handle_request(payload, router=None):
    if router is None:
        router = default_router
    
    request_id = payload.get("id")
    
    try:
        # 1. Parse and validate the envelope
        request = RpcRequest.model_validate(payload)
        # Checks: method is required string, params is optional
    except ValidationError:
        return error(-32600, "Invalid request")
    
    # 2. Look up the procedure
    procedure = router.get(request.method)
    if not procedure:
        return error(-32601, f"Method not found: {request.method}")
    
    # 3. Execute (validation + call happens inside)
    try:
        result = await procedure.execute(request.params or {})
        return {"id": request_id, "result": result, "error": None}
    except ProcedureError as pe:
        return error(pe.code, pe.message, pe.data)
```

### Error Code Reference

| Code | Meaning | When |
|---|---|---|
| `-32600` | Invalid Request | Missing fields, bad JSON-RPC structure |
| `-32601` | Method Not Found | No `@rpc` registered with that name |
| `-32602` | Invalid Params | Pydantic validation failed (wrong types, missing required params) |
| `-32603` | Internal Error | Your function raised an exception, or return type failed validation |

These follow the JSON-RPC 2.0 specification for error codes.

---

## ASGI Transport — The Wire

```python
# asgi.py:7-98
class PyRPCAsgiApp:
    async def __call__(self, scope, receive, send):
        if method == "POST" and path == "/rpc":
            await self.handle_rpc(receive, send)       # Execute an RPC call
        elif method == "GET" and path == "/rpc":
            await self.handle_introspection(send)      # Return schema
        else:
            await self.send_response(send, 404, ...)   # Not found
```

Two endpoints, one path:

| Method | Path | What it does | Used by |
|---|---|---|---|
| `POST` | `/rpc` | Execute an RPC procedure | `client.add(1,2)` at runtime |
| `GET` | `/rpc` | Return the full schema as JSON | `pyrpc codegen http://...` or postinstall.js |

**Why GET /rpc returns the same JSON as `pyrpc pull`?** Because they both call `get_registry_schema(router)` under the hood. The output is identical. This means:
- `pyrpc pull` = extract schema WITHOUT running a server (needs Python locally)
- `GET /rpc` = extract schema FROM a running server (any HTTP client can fetch it)

---

## Adapters: FastAPI and Flask

For people who already have a FastAPI or Flask app, we provide adapters:

```python
# pyrpc-fastapi/__init__.py
from fastapi import APIRouter

def mount_fastapi(app, router=None):
    """Mount pyrpc endpoints onto a FastAPI app."""
    api = APIRouter()
    
    @api.post("/rpc")
    async def handle_rpc(request: dict):
        return await handle_request(request, router)
    
    @api.get("/rpc")
    async def introspection():
        schemas = get_registry_schema(router)
        return {name: s.model_dump() for name, s in schemas.items()}
    
    app.include_router(api)
```

Usage:
```python
from fastapi import FastAPI
from pyrpc_fastapi import mount_fastapi
from pyrpc_core import rpc

@rpc
def hello(name: str) -> str:
    return f"Hello {name}"

app = FastAPI()
mount_fastapi(app)  # ← now /rpc works on your FastAPI app
```

---

## `pyrpc pull` vs `GET /rpc` — What's the Difference?

This is a common point of confusion. Let me clarify:

### `pyrpc pull app.main`

```
PROS:
  ✓ No server needed — works offline
  ✓ Captures the EXACT state of your Python code
  ✓ Good for CI where you want to version the schema

CONS:
  ✗ Requires Python + all your dependencies installed locally
  ✗ Requires the module to be importable (no import errors)

WHAT IT DOES:
  importlib.import_module("app.main")
    → triggers all @rpc decorators
    → fills default_router._procedures
  get_registry_schema(default_router)
    → extracts ProcedureSchema for each
  json.dump(...) → writes to file
```

### `GET /rpc` (introspection endpoint)

```
PROS:
  ✓ Any HTTP client can fetch it (curl, fetch, postinstall.js)
  ✓ No Python required on the fetching machine
  ✓ Always returns the CURRENT state of the running server

CONS:
  ✗ Requires running server
  ✗ Server and client must be on the same network

WHAT IT DOES:
  Server receives GET /rpc
  handle_introspection() called
  get_registry_schema(router) → same as pull
  model_dump() → JSON → HTTP response
```

### They produce the SAME JSON output

```json
{
  "add": {
    "parameters": [{"name": "a", "type": "<class 'int'>", ...}],
    "return_type": "<class 'int'>"
  }
}
```

### When to use which:

| Situation | Use |
|---|---|
| Local development | `pyrpc codegen http://localhost:8000` (internally uses GET /rpc) |
| CI — you have Python | `pyrpc pull app.main` then `pyrpc codegen schema.json` |
| CI — no Python | `pyrpc codegen http://deployed-server.com` |
| You just want types | `npm install @pyrpc/client` → postinstall prompts for URL → GET /rpc |

**The two-step (`pull` → `codegen`) is for when you need an intermediate JSON artifact. The one-step (`codegen http://...`) is for when you have a running server. They're not redundant — they serve different workflows.**
