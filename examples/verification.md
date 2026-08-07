# pyRPC v0.10.0 — Verification Example

End-to-end walkthrough to verify everything works after the config cleanup.

## 1. Fresh project setup

```bash
mkdir my-app && cd my-app
npm init -y
npx create-next-app@latest . --typescript --app --no-tailwind --no-eslint --src-dir
pip install pyrpc-core pyrpc-fastapi
npm install @pyrpc/client @pyrpc/next @pyrpc/react
```

After `npm install` completes you should see:
```
  ✓ @pyrpc/types → src/__pyrpc.d.ts (tsconfig.json)
  Run 'pyrpc dev main:app' to start generating types.
```

Check your `tsconfig.json` — it should now contain:
```json
"paths": {
  "@/*": ["./*"],
  "@pyrpc/types": ["./src/__pyrpc.d.ts"]
}
```

## 2. Write the Python server

Create `main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pyrpc_core import rpc
from pyrpc_fastapi import mount_fastapi

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["*"], allow_headers=["*"])

@rpc.query
def greet(name: str = "World") -> str:
    """Greets a user."""
    return f"Hello, {name}!"

@rpc.mutation
def set_name(name: str) -> dict:
    """Sets a display name."""
    return {"ok": True, "name": name}

mount_fastapi(app)
```

## 3. First pyrpc dev run

```bash
pyrpc dev
```

Expected output:
```
pyRPC setup (runs once — saved to pyrpc.json)

? Entry module  › main          ← auto-filled from main.py
? Frontend framework  › Next.js ← auto-detected from next.config.ts

  ✓ pyrpc.json created
  ✓ types generated (2 procs) → /path/to/my-app/src/__pyrpc.d.ts
  pyRPC dev  http://127.0.0.1:8000/rpc
  pyrpc>
```

Check that `src/__pyrpc.d.ts` was created and contains `greet` and `set_name`.
Check that `pyrpc.json` was created with:
```json
{
  "module": "main",
  "framework": "Next.js",
  "output": "src/__pyrpc.d.ts"
}
```

## 4. Wire up the TypeScript client

Create `lib/pyrpc.ts`:
```ts
import type { Types } from '@pyrpc/types';
import { createNextClient } from '@pyrpc/next';

export const api = createNextClient<Types>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
});
```

In your editor, verify that `api.greet` and `api.set_name` have full type inference —
hover over them and confirm the parameter and return types match your Python code.

## 5. Verify hot reload

With `pyrpc dev` still running, add a new procedure to `main.py`:

```python
@rpc.query
def ping() -> str:
    """Health check."""
    return "pong"
```

Within ~300ms you should see:
```
  ✓ types regenerated (3 procs)
```

Check `src/__pyrpc.d.ts` — `ping` should now appear. In your editor,
`api.ping` should now autocomplete.

## 6. Verify pyrpc.json reload

While `pyrpc dev` is running, change the module name in `pyrpc.json`:
```json
{ "module": "main", "framework": "Next.js", "output": "src/__pyrpc.d.ts" }
```
(no actual change needed — just save the file). You should see:
```
  pyrpc.json changed — reloading...
```

## 7. Verify server detection

Stop `pyrpc dev`. Start uvicorn yourself:
```bash
uvicorn main:app --reload
```

Now run `pyrpc dev` in another terminal:
```
  ○ server already running at http://127.0.0.1:8000/rpc — skipping uvicorn
  ✓ types generated (3 procs) → src/__pyrpc.d.ts
  pyRPC dev  http://127.0.0.1:8000/rpc
  pyrpc>
```

pyrpc attaches the watcher without starting a second server.

## 8. Verify pyrpc watch (watcher only)

```bash
uvicorn main:app --reload   # terminal 1
pyrpc watch                 # terminal 2
```

Expected:
```
  ✓ types generated (3 procs) → src/__pyrpc.d.ts
  watching... (Ctrl+C to stop)
```

Edit `main.py` — types regenerate automatically.
