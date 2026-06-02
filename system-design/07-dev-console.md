# 7. Developer Console (`pyrpc dev`)

## What We're Building

An **embedded interactive console** inside `pyrpc dev` that lets developers inspect and interact with their running RPC server from the same terminal — no second shell, no HTTP calls, no `curl`.

```
$ pyrpc dev app.main

✓ Server running on http://127.0.0.1:8000/rpc
✓ Watching 3 directories for Python changes
✓ Types generated -> node_modules/@pyrpc/types/src/index.ts

pyrpc> help
pyrpc> procedures
pyrpc> inspect add
pyrpc> generate
pyrpc> exit
```

## The Problem

Developers building pyRPC servers need to:

1. **See what procedures are registered** — is `create_user` actually wired up? What are its parameters?
2. **Inspect procedure signatures** — what type does `add` expect for `a`? Is it optional?
3. **Trigger type regeneration** — when Python files change, regenerate TypeScript types immediately
4. **Verify the server is running** — is the dev server up? On what port?
5. **Quickly restart** — after changing server configuration

Without a console, developers have to:
- Switch to another terminal and run `pyrpc inspect app.main` (colder, separate process)
- Watch file save → wait for watcher → check if types regenerated
- Manually kill and restart the server

The console collapses all of these into one terminal session.

---

## What This Is NOT

This document exists because the original design discussions went down wrong paths. Let's be precise:

### Not a Remote RPC Shell

```
$ pyrpc shell                          ← NOT what this is
$ pyrpc shell --url staging.example.com
```

That's `pyrpc shell` — a separate tool that connects to any running server over HTTP to make RPC calls interactively. It already exists (built in the CLI overhaul). It's useful for debugging deployed servers, but it's not the dev console.

### Not a Language REPL

```
Python REPL:
>>> 1 + 1
2
>>> import os
```

The dev console doesn't evaluate arbitrary Python. You can't type `import json` and have it work. It's a **command console** for pyRPC-specific operations.

### Not Embedded in the Server Process

The console doesn't share memory space with the ASGI server. The server runs as a **separate subprocess**. The console reads the registry from the **parent process's copy** of `default_router`, which is populated by importing the user's module directly.

---

## Architecture Decisions

### The Three Options We Considered

#### Option A: Separate Shell Client (Redis/psql style)

```
Terminal 1:  $ pyrpc serve app.main
Terminal 2:  $ pyrpc shell
```

The shell is a separate process that connects to the running server over HTTP, downloads the schema, and lets you call procedures remotely.

**Examples:** `redis-cli`, `psql`, `mongosh`, `grpcurl`

**Pros:**
- Works against localhost, staging, and production — same tool
- No special server logic needed
- Uses the same HTTP protocol clients use

**Cons:**
- Requires a running server (cold start 300-500ms to fetch schema)
- First call is slow (must download schema over HTTP)
- Can't do compile-time validation (no TypeScript compiler)
- Unusual for RPC frameworks

#### Option B: Embedded REPL Inside Server Process

```
$ pyrpc serve app.main

Server running on :8000
[pyrpc] >
```

The REPL lives inside the same process as the ASGI server. Direct memory access to registry, zero network calls.

**Examples:** `python`, `node`, `irb`, `rails console`

**Problems:**
- The ASGI server (uvicorn) blocks the main thread — you can't have `input()` running alongside it without threads or asyncio hacks
- Server logs and REPL compete for stdout — `kubectl logs` shows REPL prompts
- Cannot connect remotely
- Harder to run in Docker (no TTY in background)
- Doesn't fit cloud deployments — `kubectl logs` and `[pyrpc] >` fighting over the same output

#### Option C (Chosen): Dev Server + Interactive Console

```
$ pyrpc dev app.main

✓ Server running on :8000
✓ Watching for changes

pyrpc> procedures
pyrpc> inspect add
pyrpc> generate
pyrpc> exit
```

**Architecture:**
```
┌──────────────────────────────────┐
│ pyrpc dev (parent process)      │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Console (main thread)      │  │
│  │  - input() loop            │  │
│  │  - reads parent's registry │  │
│  │  - prints Rich tables      │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Watcher (daemon thread)    │  │
│  │  - watchfiles.watch()      │  │
│  │  - calls regenerate()      │  │
│  │  - threading.Event stop    │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Registry (in-memory)       │  │
│  │  - default_router          │  │
│  │  - populated by import     │  │
│  │  - refreshed on reload     │  │
│  └────────────────────────────┘  │
└──────────┬───────────────────────┘
           │ subprocess.Popen
           ▼
┌──────────────────────────────────┐
│ uvicorn (child process)          │
│  - ASGI server                   │
│  - --reload for auto-restart     │
│  - serves GET /rpc               │
└──────────────────────────────────┘
```

**Why we chose this:**

1. **Console doesn't compete with server logs** — server runs in a subprocess, its stdout is separate
2. **Registry access is instant** — the parent process imports the module and has `default_router` in memory; no HTTP call needed for `procedures` or `inspect`
3. **Works for local development** — where developers spend most of their time
4. **Doesn't couple production servers to console logic** — the server subprocess is a standard uvicorn instance, it has no idea a console exists
5. **Clean shutdown** — `stop_event` signals the watcher thread, `server_proc.terminate()` kills the server
6. **Familiar pattern** — Django `manage.py shell`, Rails `console`, Vite dev server all use this model

---

## Component Details

### 1. Server Subprocess

```python
server_proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", tmp_path,
     "--host", host, "--port", str(port), "--reload"],
    cwd=tmp_dir,
)
```

- The server runs as a **child process** via `subprocess.Popen`
- Uses `--reload` so uvicorn auto-restarts when Python files change (independent of our watcher)
- A temp module file is generated that creates `PyRPCAsgiApp(default_router)` and starts uvicorn
- The parent process keeps `server_proc` handle for `.terminate()` and `.wait()` on shutdown
- `server_args` and `server_cwd` are stored for the `restart` command

**Why subprocess and not `uvicorn.run()` in-process?**

- `uvicorn.run()` blocks the main thread — you can't run `input()` after it
- Threading uvicorn is possible but the GIL, signal handling, and graceful shutdown become complex
- Subprocess gives clean process isolation: kill it, restart it, ignore its stdout

### 2. Watcher Thread

```python
stop_event = threading.Event()

def watcher_loop():
    for changes in watch(*watched_dirs, stop_event=stop_event, yield_on_timeout=True):
        if stop_event.is_set():
            break
        if any(f.endswith(".py") for _, f in changes):
            regenerate()

watcher_thread = threading.Thread(target=watcher_loop, daemon=True)
watcher_thread.start()
```

- Uses `watchfiles.watch()` — a Rust-backed file watcher (inotify/FSEvents/ReadDirectoryChangesW)
- Runs in a **daemon thread** — doesn't prevent process exit
- `stop_event=threading.Event()` — when set from the main thread (on `exit`), `watch()` stops yielding and the thread exits
- `yield_on_timeout=True` — periodically yields empty change sets so the thread can check `stop_event.is_set()`
- On Python file changes: calls `regenerate()` which re-imports the module, refreshes the registry, and regenerates TypeScript types

**Why daemon thread?**

- Daemon threads are automatically killed when the main thread exits
- No need to `.join()` or cleanly shut down — simplifies error handling
- The thread only does file I/O and `importlib.reload()` — no resources that need cleanup

### 3. Console Loop

```python
class _DevConsole:
    def run(self):
        while self._running:
            try:
                line = input("[cyan]pyrpc>[/cyan] ").strip()
            except (EOFError, KeyboardInterrupt):
                break

            parts = line.split(None, 1)
            cmd = parts[0].lower()

            handler = {
                "help": self._cmd_help,
                "procedures": self._cmd_procedures,
                "inspect": self._cmd_inspect,
                ...
            }.get(cmd)
            if handler:
                handler(arg)
```

- Runs in the **main thread** — `input()` blocks waiting for user input
- Command dispatcher using a dict (O(1) lookup, easy to extend)
- Rich formatting via `rich.table.Table` and `rich.console.Console`
- `exit` sets `_running = False` → loop exits → `finally` block in `dev()` cleans up

**Why input() and not cmd.Cmd or prompt_toolkit?**

- `input()` is stdlib — zero dependencies
- `cmd.Cmd` is also stdlib but its `cmdloop()` catches `KeyboardInterrupt` in ways that are awkward with threading (it raises `SystemExit`)
- `prompt_toolkit` would give us tab completion and history, but adds a dependency — defer to future iteration

### 4. Registry Access

```python
def _schemas(self) -> dict:
    try:
        return get_registry_schema(default_router)
    except Exception:
        return {}
```

- `get_registry_schema()` and `default_router` are **module-level globals** set by `_lazy_import_pyrpc_core()`
- They're imported once at the start of `dev()` and shared across threads
- The parent process imports the user's module directly, so `default_router` has all procedures in memory
- `regenerate()` re-imports and re-populates `default_router`, so subsequent `_schemas()` calls see the latest

**Why this works without HTTP:**

The parent process is a Python process that has the user's module loaded. When `regenerate()` runs:
1. `importlib.reload(mod)` re-executes the module code
2. `@rpc` decorators fire again, re-registering procedures in `default_router._procedures`
3. The registry is now up-to-date in the parent's memory
4. `procedures` and `inspect` commands read this in-memory registry — zero network calls

### 5. TypeScript Type Regeneration

```python
def regenerate():
    if not _regenerate_lock.acquire(blocking=False):
        return
    try:
        mod = importlib.import_module(module)
        importlib.reload(mod)
        default_router._procedures.clear()
        importlib.reload(mod)
        schemas = get_registry_schema(default_router)
        if schemas:
            save_typescript_client(schemas, DEFAULT_OUTPUT)
        ...
    finally:
        _regenerate_lock.release()
```

- **Thread-safe** via `threading.Lock` with non-blocking acquire — if regeneration is already in progress (e.g., watcher triggered while user typed `generate`), the second call returns immediately
- **Atomic reload** via `Router.reload_module()` — saves old procedures, clears the router, reloads the module (which re-fires `@rpc` decorators into the clean router), and restores old procedures on failure or if the module exports nothing
- Writes TypeScript types to `node_modules/@pyrpc/types/src/index.ts` — the standard location for `@pyrpc/types`

---

## Data Flow: File Change → Updated Types

Here's exactly what happens when a developer saves `app.py` with a new `@rpc` procedure:

```
1. Developer saves app.py
       │
       ▼
2. watchfiles detects change (inotify/FSEvents)
   └─ Runs in watcher daemon thread
       │
       ▼
3. regenerate() acquires lock
   └─ Runs in watcher daemon thread
       │
       ├─ 3a. default_router.reload_module(app) ── atomically replaces registry
       │   ├─ Save old procedures
       │   ├─ Clear router
       │   ├─ importlib.reload(app) ── @rpc decorators fire on clean slate
       │   ├─ If reload fails → restore old procedures (rollback)
       │   └─ If no procedures after reload → restore old procedures
       │
       ├─ 3b. get_registry_schema(default_router) ── reads fresh registry
       │
       ├─ 3c. save_typescript_client(schemas, ...) ── writes .ts file
       │
       └─ 3d. Release lock
       │
       ▼
4. (Meanwhile, independently)
   uvicorn --reload detects the file change
   └─ Kills old server subprocess
   └─ Starts new server subprocess
   └─ New server imports updated module
       └─ @rpc decorators fire on fresh process
```

**Result:**
- Parent process's `default_router` has the latest procedures ✅
- TypeScript types are regenerated with the latest schemas ✅
- HTTP server serves the latest procedures ✅
- Console `procedures` command shows the latest list ✅

---

## Commands Reference

| Command | Args | Description |
|---|---|---|
| `help` | — | Show available commands and usage |
| `procedures` | — | List all registered RPC procedures with params, return type, and doc |
| `procs` | — | Alias for `procedures` |
| `inspect` | `<name>` | Show detailed info for a specific procedure |
| `generate` | — | Manually trigger TypeScript type regeneration |
| `types` | — | Show path to generated TypeScript types |
| `restart` | — | Kill and restart the dev server subprocess |
| `exit` | — | Stop the dev server, watcher, and console |
| `quit` | — | Alias for `exit` |

### Example Outputs

#### `procedures`
```
┌──────────────────────────────────────────────────────┐
│                  Procedures (3 total)                 │
├──────────┬──────────────────┬─────────┬───────────────┤
│ Name     │ Params           │ Returns │ Doc           │
├──────────┼──────────────────┼─────────┼───────────────┤
│ add      │ a: int, b: int   │ int     │ Add two nums  │
│ greet    │ name: str        │ str     │ Say hello     │
│ get_user │ id: int          │ User    │ Fetch by ID   │
└──────────┴──────────────────┴─────────┴───────────────┘
```

#### `inspect add`
```
add
  Doc: Add two numbers.
  Returns: int
  Parameters (2):
    a: int
    b: int
```

#### `generate`
```
14:32:15 Types regenerated (3 procs)
```

---

## Threading Model

```
Main Thread                    Watcher Thread (daemon)     Server Subprocess
─────────────                  ──────────────────────      ─────────────────
dev() starts
  │
  ├─ _lazy_import_pyrpc_core()
  ├─ regenerate() (initial)
  ├─ subprocess.Popen ──────────────────────────────────► uvicorn runs
  ├─ thread.start() ───────────────────► watcher_loop()
  │                                     ├─ watch(...)
  │                                     │  ├─ on change
  │                                     │  │  └─ regenerate()
  │                                     │  ├─ on timeout
  │                                     │  │  └─ check stop_event
  │                                     │  └─ ...
  │                                     └─ exit when stop_event set
  ├─ _DevConsole.run()
  │  ├─ input() blocked
  │  ├─ user types "exit"
  │  └─ _running = False
  │
  └─ finally:
     ├─ stop_event.set() ───────────────► thread sees is_set(), exits
     ├─ server_proc.terminate() ────────────────────────► uvicorn killed
     └─ server_proc.wait()
```

### Key Design Points

**Why `threading.Lock` with non-blocking acquire?**

`regenerate()` is called from two places:
1. Watcher thread (on file change)
2. Console (user types `generate`)

If both fire simultaneously:
- First caller acquires the lock
- Second caller's `acquire(blocking=False)` returns `False` → silently returns
- This prevents `importlib.reload()` race conditions (Python's import system is not thread-safe)

**Why `threading.Event` for stopping the watcher?**

- `watchfiles.watch()` accepts `stop_event` as a parameter — it checks it internally in the Rust polling loop
- When `stop_event.set()` is called from the main thread, `watch()` stops yielding on its next internal check
- Without this, the watcher thread would block forever on `watch()` — no way to join it

**Why `yield_on_timeout=True`?**

- Without it, `watch()` only yields when file changes occur
- With it, `watch()` periodically yields empty change sets (every `rust_timeout` ms, default 5000)
- This allows the loop to check `stop_event.is_set()` between timeouts
- Trade-off: slightly more CPU usage (polling) for responsiveness to stop signal

---

## Comparison With Existing Tools

| Feature | `pyrpc dev` (ours) | `pyrpc shell` (existing) | `docker exec` | `redis-cli` | `prisma studio` |
|---|---|---|---|---|---|
| Connection | In-process registry | HTTP to running server | Container exec | TCP to server | File watcher |
| Startup cost | Instant (in-memory) | 300-500ms (schema fetch) | Container attach | TCP connect | Bundle build |
| Network dependency | None | HTTP | Docker socket | TCP | Filesystem |
| Autocomplete | Not yet | No | Shell autocomplete | Redis command hints | GUI |
| Remote access | No | Yes (any URL) | Yes (any container) | Yes (any host) | No |
| Server awareness | Direct registry | Fetched schema | PID namespace | Server version | Schema file |

---

## Known Limitations

### 1. `restart` doesn't preserve `--types-only` context

If the server was started with `--types-only`, `restart` is a no-op. There's no way to start a server mid-session (that would require `pyrpc dev` to know host/port/module from a cold start).

### 2. No tab completion

The console uses raw `input()`, which doesn't support:
- Tab completion for command names
- Procedure name autocomplete
- Argument hinting

`prompt_toolkit` would solve this but adds a dependency.

### 3. `procedures` can show stale registry

If the module fails to re-import (syntax error), `regenerate()` logs an error but the console still shows the old registry. The user might think their new procedure is registered when it isn't.

### 4. Watcher and uvicorn --reload are redundant

Both the watcher thread and uvicorn's `--reload` watch for file changes. The watcher regenerates types on change; uvicorn restarts the server. This is intentional but creates two watch loops instead of one. A future optimization could have the watcher also signal uvicorn to restart, or have uvicorn's reload trigger type regeneration.

### 5. No cross-platform stdin handling

On Windows, `input()` with Rich ANSI codes works (Windows Terminal, VS Code terminal) but may have issues with:
- PowerShell ISE (no ANSI support)
- Old `cmd.exe` (limited ANSI)
- Git Bash / Cygwin (PTY issues)

---

## Future Improvements

### Phase 2: `prompt_toolkit` integration
- Tab completion for procedure names
- History (up arrow for previous commands)
- Syntax highlighting for argument values
- Multi-line input for complex parameters

### Phase 3: In-Console RPC Calls
- `call add(1, 2)` — execute an RPC call from the console
- Uses HTTP to the running server (like `pyrpc shell`)
- Display results as formatted tables or pretty-printed JSON
- This merges `pyrpc dev` and `pyrpc shell` into one session

### Phase 4: Unified Watch Loop
- Instead of two watch loops (watcher thread + uvicorn `--reload`), have one loop that:
  - Detects file changes
  - Calls `regenerate()` for type updates
  - Sends SIGHUP or similar to uvicorn for restart
- Would eliminate the temp file and `--reload` dependency

### Phase 5: File Watching for TypeScript Too
- Watch for `.ts` changes and trigger HMR
- Useful when manually editing generated types

---

## How to Test

The console is tested via `CliRunner` from Typer:

```python
def test_cli_dev_types_only():
    with mock.patch("pyrpc_codegen.main.get_registry_schema") as mock_get:
        mock_get.return_value = {}
        with mock.patch("pyrpc_codegen.main.save_typescript_client"):
            with mock.patch("pyrpc_codegen.main.watch") as mock_watch:
                mock_watch.return_value = []
                with mock.patch("builtins.input", return_value="exit"):
                    result = runner.invoke(app, ["dev", "my_module", "--types-only"])
                    assert result.exit_code == 0
```

Key changes from the old tests:
- `watch()` is mocked to return `[]` (empty iterator) instead of raising `KeyboardInterrupt` — because the watcher now runs in a thread
- `input()` is mocked to return `"exit"` — because the console reads stdin instead of being killed by `Ctrl+C`
- The old `KeyboardInterrupt` approach would crash the daemon thread and leak a warning

---

## Related Reading

- [Architecture Overview](./01-architecture-overview.md) — high-level picture
- [Server Internals](./03-server-internals.md) — how the registry and ASGI transport work
- [Data Flow](./05-data-flow.md) — request/response lifecycle
- [Deployment & Runtime](./06-deployment-considerations.md) — watchers in CI/CD
- `packages/pyrpc-codegen/src/pyrpc_codegen/main.py` — the implementation (lines ~195-420 for `_DevConsole` and `dev()`)
