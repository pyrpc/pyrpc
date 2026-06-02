# 2. Type Generation Flow

## The Journey of a Type: `int` → `number`

This is the most important concept in pyRPC. Here's exactly how a Python type annotation ends up as a TypeScript type:

```
  Python source code                Internal representation        JSON on disk / HTTP        TypeScript output
 ┌──────────────────────┐      ┌─────────────────────────┐     ┌─────────────────────┐     ┌──────────────────────┐
 │                      │      │                         │     │                     │     │                      │
 │  def add(a: int)     │      │  Procedure.__init__()   │     │  {                   │     │  add(a: number):     │
 │             ^^^      │ ──►  │    sig = inspect.       │ ──► │    "type": "<class   │ ──► │       Promise<       │
 │   Python type int    │      │          signature(fn)  │     │     'int'>"          │     │         number>      │
 │                      │      │    TypeAdapter(int)     │     │  }                   │     │              ^^^^   │
 └──────────────────────┘      └─────────────────────────┘     └─────────────────────┘     └──────────────────────┘
      Step 0:                        Step 1:                        Step 2:                      Step 3:
   You write this           @rpc creates Procedure         pyrpc pull / GET /rpc          pyrpc codegen runs
   in your Python app       at import time                 serializes to JSON             _pytype_to_ts() maps
```

Let's trace through each step with 4 example functions.

---

## Step 0: You Define Your API

```python
# app/main.py
from pyrpc_core import rpc

@rpc
def add(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b

@rpc
def greet(name: str) -> str:
    """Say hello."""
    return f"Hello {name}"

@rpc
def process(items: list[int], flag: bool = True) -> Optional[Item]:
    """Process items with an optional flag."""
    return None

@rpc
def get_user(id: int) -> User:
    """Get a user by ID."""
    return User(id=id, name="Test")
```

**What the `@rpc` decorator does at import time:**

```python
# registry.py:15-33
@rpc
def add(a: int, b: int) -> int:
    ...
# Equivalent to:
default_router.rpc(add)
# Which calls:
Procedure(add, name="add")
# Which stores:
default_router._procedures["add"] = Procedure(add)
```

The key: **the decorator runs when you import the module**, not when you start the server. This is the "compilation" step.

---

## Step 1: Procedure Compilation (at import time)

When `Procedure(fn)` is created:

```python
# procedure.py:31-46
class Procedure:
    def __init__(self, fn, name=None):
        self.fn = fn
        self.name = name or fn.__name__
        
        # 1. Inspect the function signature
        #    For add(a: int, b: int) -> int:
        #    sig.parameters = {"a": Parameter(a, annotation=int),
        #                      "b": Parameter(b, annotation=int)}
        #    sig.return_annotation = int
        self.sig = inspect.signature(fn)
        
        # 2. Build TypeAdapter for EACH parameter
        #    TypeAdapter(int) → can validate and generate JSON schema for int
        #    This is Pydantic v2's generic validation engine
        self.arg_adapters = {
            "a": TypeAdapter(int),    # json_schema() → {"type": "integer"}
            "b": TypeAdapter(int),    # json_schema() → {"type": "integer"}
        }
        
        # 3. Build TypeAdapter for return type
        self.return_adapter = TypeAdapter(int)  # json_schema() → {"type": "integer"}
```

**Why Pydantic TypeAdapters?** We chose Pydantic v2's `TypeAdapter` because:
- It already handles `int`, `str`, `bool`, `float`, `list[X]`, `dict[K,V]`, `Optional[X]`, etc.
- It generates JSON Schema (`{"type": "integer"}`) for any Python type
- It can validate runtime values
- It supports Pydantic models, dataclasses, and arbitrary types
- It's the same engine FastAPI uses — proven in production

---

## Step 2: Schema Extraction (when you pull or serve)

Two ways to get the schema out of the Procedure. They produce identical output.

### Way A: `pyrpc pull app.main`

```python
# main.py:68-101
def pull(module, output):
    # 1. Import the user's module → triggers all @rpc → fills default_router
    importlib.import_module(module)
    
    # 2. Extract schema from all registered procedures
    schemas = get_registry_schema(default_router)
    
    # 3. Serialize to JSON and write to file
    for name, schema in schemas.items():
        serializable[name] = {
            "parameters": [
                {"name": p.name, "type": p.type, ...},  # p.type = str(param_type)
                ...
            ],
            "return_type": schema.return_type,  # str(return_annotation)
        }
    json.dump(serializable, output_file)
```

### Way B: `GET /rpc` (introspection endpoint)

```python
# asgi.py:34-50
async def handle_introspection(self, send):
    schemas = get_registry_schema(self.router)
    # Convert Pydantic models to dicts for JSON serialization
    response_data = {
        name: schema.model_dump() for name, schema in schemas.items()
    }
    await self.send_response(send, 200, response_data)
```

### What `get_procedure_schema()` produces:

```python
# introspection.py:23-63
def get_procedure_schema(proc):
    for param_name, param in proc.sig.parameters.items():
        param_type = param.annotation  # e.g., int, str, list[int]
        
        adapter = proc.arg_adapters.get(param_name)
        if adapter:
            json_schema = adapter.json_schema()  # Pydantic's JSON Schema
        else:
            json_schema = {"type": "any"}
        
        # The TWO type fields:
        parameters.append(ParameterSchema(
            name=param_name,
            type=str(param_type),       # → "<class 'int'>" (used by _pytype_to_ts)
            schema_=json_schema,        # → {"type": "integer"} (unused currently)
            ...
        ))
    
    return ProcedureSchema(
        parameters=parameters,
        return_type=str(proc.sig.return_annotation),  # → "<class 'int'>"
        ...
    )
```

**Why `str(param_type)` and not `json_schema["type"]`?** 
- `str(param_type)` gives us the FULL Python type name, including generics: `"typing.Optional[app.models.User]"`
- `json_schema["type"]` only gives us the JSON Schema primitive: `"integer"`, `"string"`, etc.
- For Pydantic models, `json_schema` might just be `{"$ref": "#/$defs/User"}` — we lose the model name
- The `str()` approach preserves rich type information that `_pytype_to_ts()` can parse later

### The JSON Output

For our 4 functions, the JSON looks like:

```json
{
  "add": {
    "parameters": [
      {"name": "a", "type": "<class 'int'>", "required": true},
      {"name": "b", "type": "<class 'int'>", "required": true}
    ],
    "return_type": "<class 'int'>"
  },
  "greet": {
    "parameters": [
      {"name": "name", "type": "<class 'str'>", "required": true}
    ],
    "return_type": "<class 'str'>"
  },
  "process": {
    "parameters": [
      {"name": "items", "type": "list[int]", "required": true},
      {"name": "flag", "type": "<class 'bool'>", "required": false, "default": true}
    ],
    "return_type": "typing.Optional[app.models.Item]"
  },
  "get_user": {
    "parameters": [
      {"name": "id", "type": "<class 'int'>", "required": true}
    ],
    "return_type": "<class 'app.models.User'>"
  }
}
```

---

## Step 3: `_pytype_to_ts()` — String to TypeScript Type

This is the core mapping function that parses Python type strings and converts them to TypeScript:

```python
# ts_codegen.py:10-71
_TYPE_MAP = {
    "int": "number", "float": "number", "str": "string",
    "bool": "boolean", "None": "null", "NoneType": "null", "Any": "any",
}

def _pytype_to_ts(type_str: str) -> str:
```

### Pattern 1: `<class '...'>` format

This is what `str(int)` produces: `"<class 'int'>"`.

```python
m = re.match(r"<class\s+'([^']+)'>", type_str)
if m:
    name = m.group(1)        # "int", "str", "User", etc.
    if name in _TYPE_MAP:    # Known primitive → quick lookup
        return _TYPE_MAP[name]  # "int" → "number"
    if name[0].isupper():    # Capitalized = model name → keep as is
        return name            # "User" → "User"
    return "any"
```

### Pattern 2: Generic type format

These come from `typing.Optional[str]`, `list[int]`, etc.

```python
# Optional[str] → "string | null"
if type_str.startswith("Optional[") ...:
    inner = type_str[9:-1]  # extract "str"
    return f"{_pytype_to_ts(inner)} | null"

# list[int] → "number[]"
if type_str.startswith("List[") or type_str.startswith("list[") ...:
    inner = type_str[5:-1]  # extract "int"
    return f"{_pytype_to_ts(inner)}[]"

# dict[str, int] → "Record<string, number>"
if type_str.startswith("Dict[") or type_str.startswith("dict[") ...:
    inner = type_str[5:-1]  # extract "str, int"
    parts = _split_type_args(inner)
    return f"Record<{_pytype_to_ts(parts[0])}, {_pytype_to_ts(parts[1])}>"

# Union[int, str] → "number | string"
if type_str.startswith("Union[") ...:
    parts = _split_type_args(inner)
    return " | ".join(_pytype_to_ts(p) for p in parts)

# tuple[int, str] → "[number, string]"
if type_str.startswith("Tuple[") or type_str.startswith("tuple[") ...:
    return f"[{', '.join(ts_parts)}]"

# set[int] → "Set<number>"
if type_str.startswith("Set[") or type_str.startswith("set[") ...:
    return f"Set<{inner}>"
```

### The Complete Mapping Table

| Python annotation | `str()` output | TypeScript output |
|---|---|---|
| `int` | `"<class 'int'>"` | `number` |
| `float` | `"<class 'float'>"` | `number` |
| `str` | `"<class 'str'>"` | `string` |
| `bool` | `"<class 'bool'>"` | `boolean` |
| `None` | `"<class 'NoneType'>"` | `null` |
| `Any` | `"<class 'typing.Any'>"` | `any` |
| `list[int]` | `"list[int]"` | `number[]` |
| `dict[str, int]` | `"dict[str, int]"` | `Record<string, number>` |
| `Optional[str]` | `"typing.Optional[str]"` | `string \| null` |
| `Union[int, str]` | `"typing.Union[int, str]"` | `number \| string` |
| `tuple[int, str]` | `"tuple[int, str]"` | `[number, string]` |
| `set[int]` | `"set[int]"` | `Set<number>` |
| `User` (Pydantic model) | `"<class 'app.User'>"` | `User` |
| `Item` (another model) | `"<class 'app.Item'>"` | `Item` |

---

## Step 4: Jinja2 Template Renders the Interface

```jinja2
{# templates/client.ts.j2 #}
/**
 * @pyrpc/types - Auto-generated by `pyrpc codegen`.
 */

export interface Types {
  {% for name, schema in schemas.items() %}
  /**
   * {{ schema.doc or "No documentation available." }}
   */
  {{ name }}({% for param in schema.parameters %}
    {{ param.name }}: {{ param.type | pytype_to_ts }}
    {%- if not loop.last %}, {% endif %}
  {% endfor %}): Promise<{{ schema.return_type | return_type_to_ts }}>;
  {% endfor %}
}
```

The `| pytype_to_ts` filter calls `_pytype_to_ts()` on each parameter's `type` field.

### What gets generated for our 4 functions:

```typescript
/**
 * @pyrpc/types - Auto-generated by `pyrpc codegen`.
 */

export interface Types {
  /**
   * Add two numbers.
   */
  add(a: number, b: number): Promise<number>;

  /**
   * Say hello.
   */
  greet(name: string): Promise<string>;

  /**
   * Process items with an optional flag.
   */
  process(items: number[], flag: boolean): Promise<Item | null>;

  /**
   * Get a user by ID.
   */
  get_user(id: number): Promise<User>;
}
```

---

## Step 5: How the Client Uses These Types

```typescript
// client.ts:96-106
export function createClient<TTypes = any>(options): PyRPCClient & TTypes {
  const client = new PyRPCClient(options);
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === 'rpc') return undefined;      // ← block internal rpc proxy
      if (prop in target) return Reflect.get(...); // ← client properties (baseUrl)
      return target.rpc[prop];                     // ← everything else → RPC
    }
  }) as any;
}
```

### At TypeScript compile time:

```typescript
import type { Types } from "@pyrpc/types";

// createClient returns PyRPCClient & Types
// The & Types means:
//   client.baseUrl → from PyRPCClient
//   client.add     → from Types: (a: number, b: number) => Promise<number>
//   client.greet   → from Types: (name: string) => Promise<string>
const client = createClient<Types>({ baseUrl: "http://localhost:8000" });

// TypeScript checks these at compile time:
await client.add(1, 2);          // ✅ correct
await client.add("hello", 2);    // ❌ TypeScript error: string ≠ number
await client.nonexistent();      // ❌ TypeScript error: not in Types
```

### At JavaScript runtime:

```javascript
// All types are erased. The Proxy handles everything:
client.add(1, 2)
  → Proxy intercepts "add" (not in PyRPCClient)
  → calls client.rpc["add"]
  → rpc Proxy creates a function
  → sends POST /rpc with method="add", params=[1, 2]
  → returns Promise<number>

client.rpc  // returns undefined (blocked in the outer proxy)
client.rpc.add(1, 2)  // ❌ TypeError: client.rpc is undefined
```

---

## Where Types Live at Each Stage — Summary Diagram

```
┌─ PYTHON SOURCE ────────────────────┐
│  def add(a: int, b: int) -> int    │
│  @rpc                              │
└────────────────┬───────────────────┘
                 │  Module imported (import time)
                 ▼
┌─ IN MEMORY (Python) ───────────────┐
│  Router._procedures["add"] =       │
│    Procedure(add)                  │
│      .sig = inspect.signature(add) │
│      .arg_adapters["a"] = TA(int)  │
│      .return_adapter = TA(int)     │
└────────────────┬───────────────────┘
                 │  pyrpc pull  or  GET /rpc
                 ▼
┌─ JSON (file or HTTP response) ─────┐
│  {                                 │
│    "add": {                        │
│      "parameters": [               │
│        {"type": "<class 'int'>"}   │
│      ],                            │
│      "return_type": "<class 'int'>"│
│    }                               │
│  }                                 │
└────────────────┬───────────────────┘
                 │  pyrpc codegen  or  postinstall.js
                 ▼
┌─ TYPESCRIPT FILE ON DISK ──────────┐
│  node_modules/@pyrpc/types/src/    │
│  index.ts                          │
│                                    │
│  export interface Types {          │
│    add(a: number, b: number):      │
│      Promise<number>;              │
│  }                                 │
└────────────────┬───────────────────┘
                 │  import type { Types }
                 ▼
┌─ TYPESCRIPT COMPILE TIME ──────────┐
│  createClient<Types>({ baseUrl })  │
│  client.add(1, 2)  ✅ typed       │
│  client.add("x")  ❌ TS error     │
└────────────────┬───────────────────┘
                 │  tsc compiles to JS
                 ▼
┌─ JAVASCRIPT RUNTIME ───────────────┐
│  Proxy intercepts "add"            │
│  → POST /rpc {"method":"add",     │
│               "params":[1,2]}      │
│  → Server validates with Pydantic  │
│  → Returns {"result": 3}           │
│  → Client returns 3 (as number)    │
└────────────────────────────────────┘
```
