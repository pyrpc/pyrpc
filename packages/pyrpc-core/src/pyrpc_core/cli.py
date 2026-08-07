import importlib
import json
import os
import subprocess
import sys
import threading
from pathlib import Path

import questionary
import typer
from pyrpc_core import __version__
from rich.console import Console
from rich.table import Table
from watchfiles import watch

# ── Constants ─────────────────────────────────────────────────────────────────

CONFIG_FILE = "pyrpc.json"
_DEFAULT_OUTPUT = "src/__pyrpc.d.ts"
_DEBOUNCE_SECONDS = 0.3

# Framework detection: config file name → canonical label → default output path
# Output path uses {src} as a placeholder replaced by _resolve_output_path()
_FRAMEWORK_SIGNATURES: list[tuple[str, str, str]] = [
    ("next.config.ts",    "Next.js",  "src/__pyrpc.d.ts"),
    ("next.config.js",    "Next.js",  "src/__pyrpc.d.ts"),
    ("next.config.mjs",   "Next.js",  "src/__pyrpc.d.ts"),
    ("nuxt.config.ts",    "Nuxt",     "src/__pyrpc.d.ts"),
    ("nuxt.config.js",    "Nuxt",     "src/__pyrpc.d.ts"),
    ("svelte.config.js",  "Svelte",   "src/__pyrpc.d.ts"),
    ("svelte.config.ts",  "Svelte",   "src/__pyrpc.d.ts"),
    ("vite.config.ts",    "Vite",     "src/__pyrpc.d.ts"),
    ("vite.config.js",    "Vite",     "src/__pyrpc.d.ts"),
    ("astro.config.mjs",  "Astro",    "src/__pyrpc.d.ts"),
]
_FRAMEWORK_LABELS = ["Next.js", "Nuxt", "Svelte", "Vite", "Astro", "Other"]

# Populated by _lazy_core() on first use
default_router = None
get_registry_schema = None

app = typer.Typer(
    name="pyrpc",
    help="pyRPC CLI — type-safe Python-to-TypeScript RPC",
    add_completion=False,
)
console = Console()

# ── Lazy imports ──────────────────────────────────────────────────────────────

def _lazy_core():
    global default_router, get_registry_schema
    from pyrpc_core import default_router, get_registry_schema
    return default_router, get_registry_schema

def _lazy_codegen():
    from pyrpc_codegen import save_typescript_client
    return save_typescript_client

# ── pyrpc.json helpers ────────────────────────────────────────────────────────

def _find_config() -> Path | None:
    """Walk up from cwd to find pyrpc.json."""
    p = Path.cwd()
    for parent in [p] + list(p.parents):
        candidate = parent / CONFIG_FILE
        if candidate.is_file():
            return candidate
    return None

def _read_config() -> dict | None:
    path = _find_config()
    if not path:
        return None
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return None

def _write_config(config: dict, path: Path | None = None) -> Path:
    if path is None:
        path = Path.cwd() / CONFIG_FILE
    with open(path, "w") as f:
        json.dump(config, f, indent=2)
        f.write("\n")
    return path

# ── Framework detection ───────────────────────────────────────────────────────

def _detect_framework(root: str) -> tuple[str, str] | None:
    """Return (framework_label, default_output) if a known config file is found."""
    for filename, label, output in _FRAMEWORK_SIGNATURES:
        if (Path(root) / filename).exists():
            return label, output
    return None

def _resolve_output_path(root: str, framework: str, default_output: str) -> str:
    """
    Resolve final output path.
    For Next.js/Vite/etc, check if src/ exists — if not, drop the src/ prefix.
    """
    src_dir = Path(root) / "src"
    if not src_dir.is_dir() and default_output.startswith("src/"):
        return default_output[4:]  # strip "src/"
    return default_output


# ── First-run wizard ──────────────────────────────────────────────────────────

def _run_wizard(root: str) -> dict:
    """
    Interactive first-run wizard. Returns a config dict ready to write.
    Asks only what it needs — 2-3 questions max.
    """
    console.print()
    console.print("[bold]pyRPC setup[/bold] [dim](runs once — saved to pyrpc.json)[/dim]")
    console.print()

    # Question 1: entry module
    default_module = "main"
    for candidate in ["main.py", "server.py", "app.py", "app/main.py"]:
        if (Path(root) / candidate).exists():
            default_module = candidate.replace(".py", "").replace("/", ".")
            break

    module = questionary.text(
        "Entry module",
        default=default_module,
        instruction="(e.g. main, app.server — the file that calls mount_fastapi/mount_flask)",
    ).ask()
    if module is None:
        raise typer.Exit(code=0)
    module = module.strip()

    # Question 2: frontend framework — auto-detect pre-fills the answer
    # Detection scans cwd first, then common frontend subdirectories
    detected = _detect_framework(root)
    if not detected:
        # Try common frontend subdirectory names before giving up
        for subdir in ["frontend", "client", "web", "ui"]:
            candidate = os.path.join(root, subdir)
            if os.path.isdir(candidate):
                detected = _detect_framework(candidate)
                if detected:
                    # Store the subdirectory so output path is relative to it
                    detected = (detected[0], os.path.join(subdir, detected[1]))
                    break

    default_fw = detected[0] if detected else "Next.js"

    framework = questionary.select(
        "Frontend framework",
        choices=_FRAMEWORK_LABELS,
        default=default_fw,
    ).ask()
    if framework is None:
        raise typer.Exit(code=0)

    # Derive output path from framework detection
    if detected and detected[0] == framework:
        raw_output = detected[1]
    else:
        # No framework config detected anywhere — ask for the output path explicitly
        # so the developer can point us at wherever their frontend lives
        raw_output = questionary.text(
            "Output path for generated types",
            default="src/__pyrpc.d.ts",
            instruction="(relative to this directory — e.g. src/__pyrpc.d.ts or frontend/src/__pyrpc.d.ts)",
        ).ask()
        if raw_output is None:
            raise typer.Exit(code=0)
        raw_output = raw_output.strip()

    output = _resolve_output_path(root, framework, raw_output)

    return {"module": module, "framework": framework, "output": output}


# ── Core helpers ──────────────────────────────────────────────────────────────

def _import_module(module_path: str):
    sys.path.insert(0, os.getcwd())
    try:
        return importlib.import_module(module_path)
    except ImportError as e:
        console.print(f"[bold red]Error:[/bold red] Could not import '{module_path}': {e}")
        raise typer.Exit(code=1) from e

def _parse_entry(entry: str) -> tuple[str, str]:
    """'main:app' → ('main', 'app'). Defaults app var to 'app'."""
    parts = entry.split(":", 1)
    return parts[0], parts[1] if len(parts) > 1 else "app"

def _find_python_dirs(root: str) -> list[str]:
    _skip = {"node_modules", "__pycache__", ".venv", "venv", "env", "dist", "build", ".git", ".next"}
    dirs = [root]
    try:
        for entry in os.scandir(root):
            if entry.is_dir() and entry.name not in _skip and not entry.name.startswith("."):
                dirs.append(entry.path)
    except PermissionError:
        pass
    return dirs

def _server_is_running(host: str, port: int) -> bool:
    try:
        import httpx
        resp = httpx.get(f"http://{host}:{port}/rpc", timeout=1.0)
        return resp.status_code < 500
    except Exception:
        return False

def _run_codegen(module: str, output_path: str) -> int:
    _lazy_core()
    _import_module(module)
    schemas = get_registry_schema(default_router)
    save = _lazy_codegen()
    save(schemas, output_path)
    return len(schemas)

def _fetch_schema(url: str) -> dict:
    import httpx
    clean = url.rstrip("/")
    if not clean.endswith("/rpc"):
        clean += "/rpc"
    r = httpx.get(clean)
    r.raise_for_status()
    return r.json()

def _load_schema(path_or_url: str) -> dict | None:
    if path_or_url.startswith(("http://", "https://")):
        return _fetch_schema(path_or_url)
    p = os.path.abspath(path_or_url)
    if os.path.isfile(p):
        with open(p) as f:
            return json.load(f)
    return None

def _extract_schema_from_module(module: str) -> dict:
    _lazy_core()
    _import_module(module)
    schemas = get_registry_schema(default_router)
    if not schemas:
        console.print("[yellow]No procedures found in this module.[/yellow]")
        raise typer.Exit(code=1)
    return {
        name: {
            "name": s.name, "doc": s.doc or "",
            "parameters": [{"name": p.name, "type": p.type, "required": p.required,
                            "default": p.default, "schema": p.schema_} for p in s.parameters],
            "return_type": s.return_type, "return_schema": s.return_schema,
        }
        for name, s in schemas.items()
    }

def _resolve_source(source: str) -> dict:
    s = _load_schema(source)
    if s is not None:
        return s
    console.print(f"Importing [bold yellow]{source}[/bold yellow]...")
    return _extract_schema_from_module(source)


# ── Regen callback (thread-safe, debounced) ───────────────────────────────────

def _make_regen_callback(module: str, output_path: str):
    _lock = threading.Lock()
    _timer: list[threading.Timer | None] = [None]
    _timer_lock = threading.Lock()

    def _do_regen():
        if not _lock.acquire(blocking=False):
            return
        try:
            ok = default_router.reload_module(module)
            if not ok:
                console.print("  [yellow]⚠[/yellow]  no procedures after reload")
                return
            schemas = get_registry_schema(default_router)
            save = _lazy_codegen()
            save(schemas, output_path)
            console.print(f"  [green]✓[/green]  types regenerated ({len(schemas)} procs)")
        except Exception as e:
            console.print(f"  [red]✗[/red]  codegen error: {e}")
        finally:
            _lock.release()

    def schedule():
        with _timer_lock:
            if _timer[0] is not None:
                _timer[0].cancel()
            t = threading.Timer(_DEBOUNCE_SECONDS, _do_regen)
            t.daemon = True
            t.start()
            _timer[0] = t

    return _do_regen, schedule

# ── Dev console ───────────────────────────────────────────────────────────────

class _DevConsole:
    def __init__(self, *, module: str, output_path: str, host: str, port: int,
                 regenerate_cb, server_proc=None, server_managed: bool = False):
        self.module = module
        self.output_path = output_path
        self.host = host
        self.port = port
        self.regenerate = regenerate_cb
        self.server_proc = server_proc
        self.server_managed = server_managed
        self._running = True

    def _schemas(self) -> dict:
        try:
            return get_registry_schema(default_router)
        except Exception:
            return {}

    def run(self):
        console.print("[dim]type help for commands[/dim]")
        while self._running:
            try:
                line = console.input("[bold cyan]pyrpc>[/bold cyan] ").strip()
            except (EOFError, KeyboardInterrupt):
                break
            if not line:
                continue
            parts = line.split(None, 1)
            cmd, arg = parts[0].lower(), parts[1] if len(parts) > 1 else ""
            {
                "help": self._help, "procedures": self._procs, "procs": self._procs,
                "inspect": self._inspect, "generate": self._generate,
                "types": self._types, "restart": self._restart,
                "exit": self._exit, "quit": self._exit,
            }.get(cmd, lambda _: console.print(f"[red]Unknown: {cmd}. Type help.[/red]"))(arg)

    def _help(self, _=""):
        console.print("[bold]Commands:[/bold]  help · procedures · inspect <name> · generate · types · restart · exit")

    def _procs(self, _=""):
        schemas = self._schemas()
        if not schemas:
            console.print("[yellow]No procedures registered.[/yellow]"); return
        t = Table(title=f"Procedures ({len(schemas)})")
        t.add_column("Name", style="cyan"); t.add_column("Kind", style="yellow")
        t.add_column("Params", style="green"); t.add_column("Returns", style="magenta")
        t.add_column("Doc", style="white")
        for name, s in sorted(schemas.items()):
            params = ", ".join(f"{p.name}: {p.type}" for p in (s.parameters if hasattr(s,"parameters") else []))
            t.add_row(name, getattr(s,"kind","query"), params or "—",
                      getattr(s,"return_type","any"), getattr(s,"doc","") or "")
        console.print(t)

    def _inspect(self, arg=""):
        if not arg:
            console.print("[red]Usage: inspect <name>[/red]"); return
        s = self._schemas().get(arg)
        if not s:
            console.print(f"[red]Not found: {arg}[/red]"); return
        console.print(f"[bold cyan]{arg}[/bold cyan]  [dim]{getattr(s,'kind','query')}[/dim]")
        if getattr(s,"doc",None): console.print(f"  {s.doc}")
        for p in (s.parameters if hasattr(s,"parameters") else []):
            opt = "" if p.required else " [dim](optional)[/dim]"
            console.print(f"  {p.name}: {p.type}{opt}")
        console.print(f"  → {getattr(s,'return_type','any')}")

    def _generate(self, _=""):
        console.print("[blue]Regenerating...[/blue]")
        self.regenerate()

    def _types(self, _=""):
        console.print(f"  [bold]{self.output_path}[/bold]")
        console.print('  import type {{ Types }} from "@pyrpc/types"')

    def _restart(self, _=""):
        if not self.server_managed or not self.server_proc:
            console.print("  [yellow]○[/yellow]  server not managed by pyrpc"); return
        console.print("[yellow]Restarting...[/yellow]")
        self.server_proc.terminate(); self.server_proc.wait()
        self.server_proc = subprocess.Popen(self.server_proc.args,
                                            cwd=getattr(self.server_proc, "_cwd", None))
        console.print("[green]Restarted[/green]")

    def _exit(self, _=""):
        self._running = False


# ── Commands ──────────────────────────────────────────────────────────────────

@app.command()
def version():
    """Show pyRPC version."""
    console.print(f"pyRPC version: [bold cyan]{__version__}[/bold cyan]")


@app.command()
def inspect(module: str = typer.Argument(..., help="Module to inspect (e.g. main)")):
    """List all registered RPC procedures in a module."""
    _lazy_core(); _import_module(module)
    schemas = get_registry_schema(default_router)
    if not schemas:
        console.print("[yellow]No procedures found.[/yellow]"); return
    t = Table(title=f"pyRPC: {module}")
    t.add_column("Method", style="cyan"); t.add_column("Kind", style="yellow")
    t.add_column("Params", style="green"); t.add_column("Returns", style="magenta")
    t.add_column("Doc", style="white", no_wrap=False)
    for name, s in schemas.items():
        params = ", ".join(f"{p.name}: {p.type}" for p in s.parameters)
        t.add_row(name, getattr(s,"kind","query"), params or "—", s.return_type, s.doc or "")
    console.print(t)


@app.command()
def pull(
    module: str = typer.Argument(..., help="Module to extract schema from"),
    output: str = typer.Option("pyrpc-schema.json", "--output", "-o"),
):
    """Extract RPC schema from a module and save as JSON."""
    data = _extract_schema_from_module(module)
    p = os.path.abspath(output)
    os.makedirs(os.path.dirname(p) or ".", exist_ok=True)
    with open(p, "w") as f:
        json.dump(data, f, indent=2)
    console.print(f"[green]✓[/green]  schema → {p}  ({len(data)} procs)")


@app.command()
def serve(
    module: str = typer.Argument(...),
    host: str = typer.Option("127.0.0.1", "--host", "-h"),
    port: int = typer.Option(8000, "--port", "-p"),
    reload: bool = typer.Option(False, "--reload"),
):
    """Start the standalone pyRPC ASGI server."""
    import uvicorn, tempfile
    _lazy_core(); _import_module(module)
    from pyrpc_core.transport.asgi import PyRPCAsgiApp
    inst = PyRPCAsgiApp(default_router)
    console.print(f"  [bold]pyRPC[/bold]  http://{host}:{port}/rpc")
    if reload:
        code = f"from pyrpc_core import default_router\nfrom pyrpc_core.transport.asgi import PyRPCAsgiApp\nimport {module}\napp = PyRPCAsgiApp(default_router)\n"
        tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8")
        tmp.write(code); tmp.close()
        mp = os.path.splitext(os.path.basename(tmp.name))[0]
        sys.path.insert(0, os.path.dirname(tmp.name))
        try: uvicorn.run(f"{mp}:app", host=host, port=port, reload=True)
        finally: os.unlink(tmp.name)
    else:
        uvicorn.run(inst, host=host, port=port)


@app.command()
def codegen(
    source: str = typer.Argument(..., help="Schema file, URL, or module"),
    output: str = typer.Option(_DEFAULT_OUTPUT, "--output", "-o"),
):
    """Generate TypeScript types from a schema, URL, or module."""
    try:
        schemas = _resolve_source(source)
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}"); raise typer.Exit(1) from e
    p = os.path.abspath(output)
    _lazy_codegen()(schemas, p)
    console.print(f"  [green]✓[/green]  types generated ({len(schemas)} procs) → {p}")
    console.print('  import type {{ Types }} from "@pyrpc/types"')


@app.command()
def watch(
    module: str = typer.Argument(None, help="Module to watch (reads pyrpc.json if omitted)"),
    output: str = typer.Option(None, "--output", "-o"),
):
    """Watch for Python changes and regenerate TypeScript types. No server started."""
    cwd = os.getcwd()
    cfg = _read_config() or {}
    module = module or cfg.get("module")
    output = output or cfg.get("output", _DEFAULT_OUTPUT)
    if not module:
        console.print("[red]No module specified. Run pyrpc dev first to create pyrpc.json.[/red]")
        raise typer.Exit(1)
    _lazy_core(); _import_module(module)
    out = os.path.abspath(output)
    try:
        n = _run_codegen(module, out)
        console.print(f"  [green]✓[/green]  types generated ({n} procs) → {out}")
        console.print("  watching... [dim](Ctrl+C to stop)[/dim]")
    except Exception as e:
        console.print(f"  [red]✗[/red]  {e}"); raise typer.Exit(1) from e
    _do, schedule = _make_regen_callback(module, out)
    stop = threading.Event()
    def _w():
        for changes in watch(*_find_python_dirs(cwd), stop_event=stop, yield_on_timeout=True, debounce=200):
            if stop.is_set(): break
            if any(f.endswith(".py") for _, f in changes): schedule()
    t = threading.Thread(target=_w, daemon=True); t.start()
    try: t.join()
    except KeyboardInterrupt: stop.set(); console.print("\n  [dim]stopped[/dim]")


@app.command()
def dev(
    host: str = typer.Option("127.0.0.1", "--host", "-h", help="Server host"),
    port: int = typer.Option(8000, "--port", "-p", help="Server port"),
    reload: bool = typer.Option(True, "--reload/--no-reload", help="Uvicorn auto-reload"),
):
    """Start the dev server and keep TypeScript types in sync.

    First run: wizard asks 2 questions and writes pyrpc.json.
    Every run after: reads pyrpc.json, no questions asked.

    Detects if a server is already running on host:port — if so, skips
    starting uvicorn and just runs the type watcher. Otherwise starts
    uvicorn with --reload and watches .py files for type regeneration.

    Also watches pyrpc.json itself — if module or output changes, the
    watcher re-wires automatically and uvicorn restarts if needed.
    """
    cwd = os.getcwd()

    # ── Config: read or run wizard ────────────────────────────────────────────
    cfg_path = _find_config()
    if cfg_path is None:
        cfg = _run_wizard(cwd)
        cfg_path = _write_config(cfg)
        console.print(f"  [green]✓[/green]  pyrpc.json created")
    else:
        with open(cfg_path) as f:
            cfg = json.load(f)

    module: str = cfg["module"]
    output: str = cfg.get("output", "src/__pyrpc.d.ts")
    output_path = os.path.abspath(output)

    # ── Import module + initial codegen ───────────────────────────────────────
    _lazy_core()
    _import_module(module)
    try:
        n = _run_codegen(module, output_path)
        console.print(f"  [green]✓[/green]  types generated ({n} procs) → {output_path}")
    except Exception as e:
        console.print(f"  [red]✗[/red]  initial codegen failed: {e}")
        raise typer.Exit(1) from e

    # ── Server: attach or start ───────────────────────────────────────────────
    server_proc: subprocess.Popen | None = None
    server_managed = False

    def _start_uvicorn(mod: str) -> subprocess.Popen:
        """Start uvicorn for module, return the Popen object."""
        # Derive app variable: try 'app', fall back to module name
        app_var = "app"
        cmd = [
            sys.executable, "-m", "uvicorn",
            f"{mod}:{app_var}",
            "--host", host,
            "--port", str(port),
            "--log-level", "error",
        ]
        if reload:
            cmd.append("--reload")
        env = os.environ.copy()
        env.setdefault("PYTHONPATH", cwd)
        proc = subprocess.Popen(cmd, cwd=cwd, env=env)
        proc._cwd = cwd  # stash for restart
        return proc

    if _server_is_running(host, port):
        console.print(
            f"  [dim]○[/dim]  server already running at "
            f"http://{host}:{port}/rpc — skipping uvicorn"
        )
    else:
        server_proc = _start_uvicorn(module)
        server_managed = True
        console.print(f"  [bold]pyRPC dev[/bold]  http://{host}:{port}/rpc")

    # ── Regen callback wired to current module/output ─────────────────────────
    _do_regen, schedule = _make_regen_callback(module, output_path)

    # ── Watchers ──────────────────────────────────────────────────────────────
    stop = threading.Event()

    def _py_watcher():
        """Watch .py files → debounced regen."""
        for changes in watch(
            *_find_python_dirs(cwd),
            stop_event=stop,
            yield_on_timeout=True,
            debounce=200,
        ):
            if stop.is_set():
                break
            if any(f.endswith(".py") for _, f in changes):
                schedule()

    def _cfg_watcher():
        """
        Watch pyrpc.json — on change reload config and re-wire.
        If module changed → restart uvicorn (if we own it).
        If output changed → point regen callback at new path.
        """
        nonlocal _do_regen, schedule, server_proc, module, output_path

        for changes in watch(
            str(cfg_path.parent),
            stop_event=stop,
            yield_on_timeout=True,
            debounce=300,
        ):
            if stop.is_set():
                break
            changed_files = {f for _, f in changes}
            if not any(str(cfg_path) in f or CONFIG_FILE in f for f in changed_files):
                continue

            # Re-read config
            try:
                with open(cfg_path) as f:
                    new_cfg = json.load(f)
            except Exception:
                continue

            new_module = new_cfg.get("module", module)
            new_output = os.path.abspath(new_cfg.get("output", output))

            module_changed = new_module != module
            output_changed = new_output != output_path

            if not module_changed and not output_changed:
                continue

            console.print("  [blue]pyrpc.json changed — reloading...[/blue]")

            if output_changed:
                output_path = new_output
                console.print(f"  [dim]output → {output_path}[/dim]")

            if module_changed:
                module = new_module
                console.print(f"  [dim]module → {module}[/dim]")
                _import_module(module)

            # Re-wire regen callback to new module/output
            _do_regen, schedule = _make_regen_callback(module, output_path)

            # Restart uvicorn if we own it and module changed
            if module_changed and server_managed and server_proc:
                console.print("  [yellow]restarting uvicorn...[/yellow]")
                server_proc.terminate()
                server_proc.wait()
                server_proc = _start_uvicorn(module)

            # Regenerate immediately with new config
            _do_regen()

    py_thread = threading.Thread(target=_py_watcher, daemon=True)
    cfg_thread = threading.Thread(target=_cfg_watcher, daemon=True)
    py_thread.start()
    cfg_thread.start()

    # ── Interactive console ───────────────────────────────────────────────────
    dev_console = _DevConsole(
        module=module,
        output_path=output_path,
        host=host,
        port=port,
        regenerate_cb=_do_regen,
        server_proc=server_proc,
        server_managed=server_managed,
    )
    try:
        dev_console.run()
    except KeyboardInterrupt:
        pass
    finally:
        stop.set()
        if server_proc and server_managed:
            server_proc.terminate()
            server_proc.wait()
        console.print("  [dim]stopped[/dim]")


if __name__ == "__main__":
    app()
