# 5. Data Flow

## Full Request/Response Lifecycle

Let's trace what happens when `client.add(1, 2)` is called, all the way down to `add(1, 2)` running on the server and the result coming back.

```
CLIENT SIDE (TypeScript → JavaScript)
══════════════════════════════════════

  await client.add(1, 2)
       │
       │  TypeScript checks: "add" exists in Types interface?
       │  Params (1, 2) match (number, number)?
       │  Both pass ✅ (compile time)
       │
       ▼
  Proxy.get(target, "add", receiver)
       │
       │  Is "add" === "rpc"? → No
       │  Is "add" in PyRPCClient? → No
       │  → Falls through to target.rpc["add"]
       │
       ▼
  rpc Proxy.get({}, "add")
       │
       │  Returns function (...args) => request("add", args)
       │
       ▼
  request("add", [1, 2])
       │
       │  Body: { id: "abc123", method: "add", params: [1, 2] }
       │  URL: http://localhost:8000/rpc
       │  Method: POST
       │  Headers: { Content-Type: "application/json" }
       │
       ▼
  fetch("http://localhost:8000/rpc", { method: "POST", body: ..., headers: ... })
       │
       │  ╔══════════════════════════════════════════════╗
       │  ║            NETWORK (HTTP POST)               ║
       │  ╚══════════════════════════════════════════════╝
       │
       ▼

SERVER SIDE (Python)
══════════════════════════════════════

  PyRPCAsgiApp.__call__(scope, receive, send)
       │
       │  scope["method"] = "POST"
       │  scope["path"] = "/rpc"
       │  → calls self.handle_rpc(receive, send)
       │
       ▼
  handle_rpc(receive, send)
       │
       │  Read body from stream: '{"id":"abc123","method":"add","params":[1,2]}'
       │  json.loads(body) → { id: "abc123", method: "add", params: [1, 2] }
       │
       ▼
  handle_request(payload, router)
       │
       ├── Step 1: Validate envelope
       │    RpcRequest.model_validate(payload)
       │    • id = "abc123" ✅
       │    • method = "add" ✅  (required, non-empty)
       │    • params = [1, 2] ✅
       │    If invalid: return -32600 "Invalid request"
       │
       ├── Step 2: Look up procedure
       │    router.get("add")
       │    → finds Procedure(add) in registry
       │    If not found: return -32601 "Method not found: add"
       │
       ├── Step 3: Execute procedure
       │    procedure.execute([1, 2])
       │    │
       │    │  3a. Bind arguments
       │    │  sig.bind(1, 2) → bound_args.arguments = {"a": 1, "b": 2}
       │    │  If wrong number: -32602 "Invalid params"
       │    │
       │    │  3b. Validate params with TypeAdapters
       │    │  adapter_a = TypeAdapter(int)
       │    │  adapter_a.validate_python(1) → 1 ✅ (int)
       │    │  adapter_b = TypeAdapter(int)
       │    │  adapter_b.validate_python(2) → 2 ✅ (int)
       │    │  If type error: -32602 "Validation failed"
       │    │
       │    │  3c. Call the actual function
       │    │  add(a=1, b=2) → 3
       │    │  If exception: -32603 with error message
       │    │
       │    │  3d. Validate return type
       │    │  return_adapter = TypeAdapter(int)
       │    │  return_adapter.validate_python(3) → 3 ✅ (int)
       │    │  If type error: -32603 "Internal Error"
       │    │
       │    └── Returns: 3
       │
       └── Step 4: Build response
           RpcResponse(id="abc123", result=3, error=None)
           → model_dump() → {"id": "abc123", "result": 3, "error": null}
           → json.dumps → '{"id":"abc123","result":3,"error":null}'
           → send response
       
       │  ╔══════════════════════════════════════════════╗
       │  ║            NETWORK (HTTP 200 OK)             ║
       │  ╚══════════════════════════════════════════════╝
       │
       ▼

CLIENT SIDE (continued)
══════════════════════════════════════

  Response received
       │
       ├── response.ok? → Yes (status 200)
       ├── data = await response.json()
       │     → { id: "abc123", result: 3, error: null }
       ├── data.error? → No (null)
       └── return data.result as T → 3 (as number)
       │
       ▼
  const result = await client.add(1, 2)
  // result = 3, typed as number
```

---

## Named vs Positional Parameters

The client auto-detects which format to use:

```typescript
// Single plain object → named params (dict on server)
await client.get_user({ id: 1 })
// POST {"method": "get_user", "params": {"id": 1}}

// Multiple arguments → positional params (list on server)
await client.add(1, 2)
// POST {"method": "add", "params": [1, 2]}

// Single non-object value → positional
await client.hello("world")
// POST {"method": "hello", "params": ["world"]}
```

The server handles both formats:

```python
# procedure.py:55-62
if isinstance(params, list):
    bound_args = self.sig.bind(*params)       # positional: fn(1, 2)
elif isinstance(params, dict):
    bound_args = self.sig.bind(**params)      # named: fn(a=1, b=2)
```

**Why support both?**
- Positional is shorter for simple cases: `client.add(1, 2)`
- Named is clearer for complex cases: `client.create_user({name: "Alice", age: 30})`
- Matches how Python functions accept both `*args` and `**kwargs`

---

## Schema Introspection Flow (GET /rpc)

```
  fetch("http://localhost:8000/rpc", { method: "GET" })
       │
       ▼
  PyRPCAsgiApp.handle_introspection(send)
       │
       ▼
  get_registry_schema(router)
       │  for each (name, procedure) in router._procedures:
       │    schema = get_procedure_schema(procedure)
       │    schemas[name] = schema.model_dump()
       │
       ▼
  Response: JSON
  {
    "add": {
      "name": "add",
      "parameters": [
        {"name": "a", "type": "<class 'int'>", "required": true, "default": null},
        {"name": "b", "type": "<class 'int'>", "required": true, "default": null}
      ],
      "return_type": "<class 'int'>",
      "doc": "Add two numbers."
    },
    "greet": {
      ...
    }
  }
```

---

## Complete Wire Format

### Request

```json
{
  "id": "abc123",
  "method": "add",
  "params": [1, 2]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | No | Request identifier for correlating responses |
| `method` | `string` | **Yes** | The name of the procedure (from `@rpc`) |
| `params` | `array \| object` | No | Positional array `[1,2]` or named object `{"a":1,"b":2}` |

### Success Response

```json
{
  "id": "abc123",
  "result": 3,
  "error": null
}
```

### Error Response

```json
{
  "id": "abc123",
  "result": null,
  "error": {
    "code": -32602,
    "message": "Validation failed",
    "data": {
      "field": "a",
      "message": "Input should be a valid integer",
      "type": "int_parsing"
    }
  }
}
```

### Error Codes

| Code | Meaning | When it happens |
|---|---|---|
| `-32600` | Invalid Request | Missing `method` field, malformed JSON |
| `-32601` | Method Not Found | `client.nonexistent()` — no `@rpc` with that name |
| `-32602` | Invalid Params | Wrong types, missing required params, extra params |
| `-32603` | Internal Error | Your function raised an exception, or return type failed validation |

These follow JSON-RPC 2.0 specifications.
