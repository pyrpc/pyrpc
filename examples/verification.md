# pyRPC v0.12.1 — Verification Walkthrough

End-to-end steps to verify everything works.

## 1. Fresh project setup

```bash
mkdir my-app && cd my-app
npx create-next-app@latest . --typescript --app --no-tailwind --no-eslint --src-dir

# Python server deps — one command with the adapter as an extra
pip install pyrpc-core[fastapi]

# TypeScript client deps — one command per framework (the adapter pulls in
# @pyrpc/client and @pyrpc/types for you)
# Next.js:
npm install @pyrpc/next @tanstack/react-query
# React (Vite / CRA):
npm install @pyrpc/react @tanstack/react-query
# Vue:
npm install @pyrpc/vue @tanstack/vue-query
# Svelte:
npm install @pyrpc/svelte @tanstack/svelte-query
```

## 2. Write the Python server

Create `main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pyrpc_core import rpc
from pyrpc_fastapi import mount_fastapi

# This is your FastAPI app — you own and control it fully.
# mount_fastapi() adds POST /rpc and GET /rpc to YOUR app.
# It does not create a new app or wrap yours.
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@rpc.query
def greet(name: str = "World") -> str:
    """Greets a user."""
    return f"Hello, {name}!"

@rpc.mutation
def set_name(name: str) -> dict:
    """Sets a display name."""
    return {"ok": True, "name": name}

# Registers POST /rpc (dispatch) and GET /rpc (introspection) on your app.
mount_fastapi(app)
```

### What `mount_fastapi(app)` actually does

`mount_fastapi` takes your existing FastAPI app and registers two routes on it:
- `POST /rpc` — receives JSON-RPC 2.0 calls, dispatches to your `@rpc` procedures
- `GET /rpc` — returns introspection schema (used by pyrpc dev for codegen)

You then run this same `app` with uvicorn as normal. pyrpc does not create a
separate server — it adds to yours. Same pattern as `app.include_router()`.

## 3. First `pyrpc dev` run

```bash
pyrpc dev
```

Expected output:
```
pyRPC setup (runs once — saved to pyrpc.json)

? Entry module  › main          ← auto-filled from main.py
? Client project root  › .      ← the frontend project
? Frontend framework  › Next.js ← auto-detected from next.config.ts

  ✓ pyrpc.json created
  ✓ types generated (2 procs) → __pyrpc.ts
  pyRPC dev  http://127.0.0.1:8000/rpc
```

`pyrpc dev` wires `@pyrpc/types` to the generated file automatically:
tsconfig `paths` plus a bundler alias for Vite/SvelteKit/Next.js.

Check `__pyrpc.ts` exists at the client project root and contains `greet`
and `set_name`. Check `pyrpc.json`:
```json
{
  "module": "main",
  "framework": "Next.js",
  "client": "."
}
```

## 4. Wire up the TypeScript client

Create `lib/pyrpc.ts`:

**Next.js:**
```ts
import type { Types } from '@pyrpc/types';
import { createNextClient, httpLink } from '@pyrpc/next';

export const api = createNextClient<Types>({
  links: [httpLink({ url: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000' })],
});
```

**React (Vite):**
```ts
import type { Types } from '@pyrpc/types';
import { createReactClient, httpLink } from '@pyrpc/react';

export const api = createReactClient<Types>({
  links: [httpLink({ url: import.meta.env.VITE_API_URL ?? 'http://localhost:8000' })],
});
```

Hover over `api.greet` and `api.set_name` — confirm full type inference.

## 5. Verify hot reload

With `pyrpc dev` running, add a new procedure to `main.py`:

```python
@rpc.query
def ping() -> str:
    """Health check."""
    return "pong"
```

Within ~300ms:
```
  ✓ types regenerated (3 procs)
```

`api.ping` now autocompletes in TypeScript.

## 6. Verify server detection

Stop `pyrpc dev`. Start your server manually:
```bash
uvicorn main:app --reload
```

Now run `pyrpc dev` in another terminal:
```
  ○ server already running at http://127.0.0.1:8000/rpc — skipping uvicorn
  ✓ types generated (3 procs) → __pyrpc.ts
```

## 7. Verify `pyrpc watch` (watcher only)

```bash
uvicorn main:app --reload   # terminal 1
pyrpc watch                 # terminal 2 — reads pyrpc.json
```

```
  ✓ types generated (3 procs) → __pyrpc.ts
  watching... (Ctrl+C to stop)
```

## 8. Flask example

```python
from flask import Flask
from pyrpc_core import rpc
from pyrpc_flask import mount_flask  # pip install pyrpc-core[flask]

app = Flask(__name__)

@rpc.query
def greet(name: str = "World") -> str:
    return f"Hello, {name}!"

# Same pattern as FastAPI — adds /rpc routes to your existing Flask app
mount_flask(app)

if __name__ == "__main__":
    app.run(port=8000)
```

## 9. Django example

```python
# myproject/urls.py
from django.contrib import admin
from django.urls import path
from pyrpc_django import mount_django  # pip install "pyrpc-core[django]"
from . import views  # required: triggers @rpc decorator execution

urlpatterns = [
    path("admin/", admin.site.urls),
]

# Appends POST /rpc (dispatch) and GET /rpc (introspection) to the list.
mount_django(urlpatterns)
```

`mount_django` mutates `urlpatterns` in place and returns None — it does
not return a new list. The `views` import matters: without it Python never
executes the module, so no procedures are registered.
