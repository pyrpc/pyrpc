import importlib
import json
import os
import subprocess
import sys
import threading
import time
import traceback
from pathlib import Path
from typing import Callable

import questionary
import typer
from pyrpc_core import __version__
from rich.console import Console
from rich.table import Table
from watchfiles import watch

from .config import (
    CONFIG_FILE,
    BackendConfigError,
    clients_from_config,
    find_config as _find_config,
    has_valid_backend,
    normalize_entrypoint,
    parse_backend,
    read_config as _read_config,
    write_config as _write_config,
)
from .constants import BACKEND_LABELS, FRAMEWORKS
from .runners import LaunchPlan, resolve_launch, resolve_types_module

# ── Constants ─────────────────────────────────────────────────────────────────

_DEFAULT_CLIENT = "."
_DEBOUNCE_SECONDS = 0.3

_BACKEND_LABELS = [BACKEND_LABELS[f] for f in FRAMEWORKS]
_LABEL_TO_FRAMEWORK = {label: fw for fw, label in BACKEND_LABELS.items()}

_SKIP_DIRS = frozenset(
    {"node_modules", "__pycache__", ".venv", "venv", "env", "dist", "build", ".git", ".next"}
)

# Framework detection: config file name → canonical label
_FRAMEWORK_SIGNATURES: list[tuple[str, str]] = [
    ("next.config.ts",    "Next.js"),
    ("next.config.js",    "Next.js"),
    ("next.config.mjs",   "Next.js"),
    ("nuxt.config.ts",    "Nuxt"),
    ("nuxt.config.js",    "Nuxt"),
    ("svelte.config.js",  "Svelte"),
    ("svelte.config.ts",  "Svelte"),
    ("vite.config.ts",    "Vite"),
    ("vite.config.js",    "Vite"),
    ("astro.config.mjs",  "Astro"),
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

# ── Framework detection ───────────────────────────────────────────────────────

def _detect_framework(root: str) -> str | None:
    """Return framework_label if a known config file is found."""
    for filename, label in _FRAMEWORK_SIGNATURES:
        if (Path(root) / filename).exists():
            return label
    return None

def _find_frontend_projects(root: str) -> list[tuple[str, str]]:
    """Walk the directory tree to find frontend projects."""
    projects = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in _SKIP_DIRS and not d.startswith(".")]
        fw = _detect_framework(dirpath)
        if fw:
            rel = os.path.relpath(dirpath, root)
            if rel == ".":
                projects.append((".", fw))
            else:
                projects.append((f"./{rel}", fw))
    return projects


# ── Backend detection / defaults ─────────────────────────────────────────────

_BACKEND_CANDIDATES = ["main.py", "server.py", "app.py", "app/main.py"]

def _default_module(root: str) -> str:
    """Dotted module default derived from the first likely entry file."""
    for candidate in _BACKEND_CANDIDATES:
        if (Path(root) / candidate).exists():
            return candidate.replace(".py", "").replace("/", ".")
    return "main"

def _sniff_backend(root: str) -> str | None:
    """Best-effort backend framework guess from entry-file contents.

    Sniffing only preselects a wizard choice — it is never persisted without
    explicit confirmation (interactive) or an explicit --framework/--module
    declaration (non-interactive falls back to this sniff or errors).
    """
    texts = []
    for candidate in _BACKEND_CANDIDATES:
        p = Path(root) / candidate
        if not p.is_file():
            continue
        try:
            texts.append(p.read_text(encoding="utf-8", errors="ignore"))
        except OSError:
            continue
    markers = [
        ("mount_fastapi(", "fastapi"),
        ("mount_flask(", "flask"),
        ("mount_django(", "django"),
        ("PyRPCAsgiApp", "asgi"),
    ]
    for marker, framework in markers:
        if any(marker in text for text in texts):
            return framework
    if (Path(root) / "manage.py").is_file():
        return "django"
    return None

def _detect_django_types_module(root: str) -> str | None:
    """Shallowest ``views`` module under root as a dotted name, if any."""
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in _SKIP_DIRS and not d.startswith(".")]
        if "views.py" in filenames:
            rel = os.path.relpath(dirpath, root)
            pkg = "" if rel == "." else rel.replace(os.sep, ".") + "."
            return f"{pkg}views"
    return None


# ── Client-root autocomplete ─────────────────────────────────────────────────

def _client_visible_filter(root_abs: str):
    """Suggestion filter: directories only, no junk/dot dirs, jailed to project root."""
    def _visible(full_name: str) -> bool:
        if not os.path.isdir(full_name):
            return False
        name = os.path.basename(full_name.rstrip(os.sep))
        if not name or name.startswith(".") or name in _SKIP_DIRS:
            return False
        real = os.path.realpath(full_name)
        return real == root_abs or real.startswith(root_abs + os.sep)
    return _visible

def _ask_client_root(message: str, default: str, root: str) -> str:
    """Ask for a client project root with filesystem autocomplete jailed to ``root``."""
    root_abs = os.path.abspath(root)

    def _exists(path: str):
        if os.path.isdir(os.path.abspath(path)):
            return True
        return "Directory does not exist"

    return questionary.path(
        message,
        default=default,
        only_directories=True,
        get_paths=lambda: [root_abs],
        file_filter=_client_visible_filter(root_abs),
        validate=_exists,
    ).ask()


# ── First-run wizard ──────────────────────────────────────────────────────────

def _ask_backend(root: str) -> dict:
    """Ask for (and persist only the explicitly confirmed) backend configuration."""
    sniffed = _sniff_backend(root)

    fw_label = questionary.select(
        "Which backend framework are you using?",
        choices=_BACKEND_LABELS,
        default=BACKEND_LABELS[sniffed] if sniffed else None,
    ).ask()
    if fw_label is None: raise typer.Exit(code=0)
    framework = _LABEL_TO_FRAMEWORK[fw_label]

    if framework == "django":
        while True:
            manage = questionary.text("Path to manage.py", default="manage.py").ask()
            if manage is None: raise typer.Exit(code=0)
            manage = manage.strip()
            if manage and (Path(root) / manage).is_file():
                break
            console.print(f"[red]✗[/red] No such file: [bold]{manage or '(empty)'}[/bold]")
        default_types = _detect_django_types_module(root) or ""
        types_module = questionary.text(
            "Types module (imports your @rpc procedures)",
            default=default_types,
            instruction="(e.g. myproject.views — settings and manage.py register nothing)",
        ).ask()
        if types_module is None: raise typer.Exit(code=0)
        backend = {
            "framework": framework,
            "entrypoint": manage,
            **({"types_module": t} if (t := types_module.strip()) else {}),
        }
        return backend

    instruction = {
        "fastapi": "(module[:app] — the file that calls mount_fastapi)",
        "flask": "(module[:app] — the file that calls mount_flask)",
        "asgi": "(module[:app] — the file that builds PyRPCAsgiApp)",
    }[framework]
    raw = questionary.text(
        "Backend entry point",
        default=_default_module(root),
        instruction=instruction,
    ).ask()
    if raw is None: raise typer.Exit(code=0)
    return {"framework": framework, "entrypoint": normalize_entrypoint(raw)}

def _run_wizard(root: str) -> dict:
    """
    Interactive first-run wizard. Returns a nested config dict ready to write.
    """
    console.print()
    console.print("[bold]pyRPC setup[/bold] [dim](runs once — saved to pyrpc.json)[/dim]")
    console.print()

    backend = _ask_backend(root)

    def _client_entry(client_root: str, detected_fw: str | None) -> dict:
        client = _ask_client_root("Client project root", default=client_root, root=root)
        if client is None: raise typer.Exit(code=0)
        framework = questionary.select(
            "Frontend framework", choices=_FRAMEWORK_LABELS, default=detected_fw or "Next.js"
        ).ask()
        if framework is None: raise typer.Exit(code=0)
        return {"framework": framework, "root": client}

    detected_projects = _find_frontend_projects(root)

    if not detected_projects:
        return {"backend": backend, "clients": [_client_entry(_DEFAULT_CLIENT, None)]}

    if len(detected_projects) == 1:
        client_dir, fw = detected_projects[0]
        return {"backend": backend, "clients": [_client_entry(client_dir, fw)]}

    console.print("\n[bold]Detected frontend projects:[/bold]")
    for path, fw in detected_projects:
        console.print(f"  • [cyan]{path}[/cyan]  [dim]({fw})[/dim]")

    action = questionary.select(
        "How would you like to configure clients?",
        choices=["Select detected projects", "Enter a client path manually"],
    ).ask()
    if action is None: raise typer.Exit(code=0)

    if action == "Enter a client path manually":
        return {"backend": backend, "clients": [_client_entry(_DEFAULT_CLIENT, None)]}

    choices = [f"{path} ({fw})" for path, fw in detected_projects]
    while True:
        selections = questionary.checkbox("Select detected projects", choices=choices).ask()
        if selections is None: raise typer.Exit(code=0)
        if selections:
            break
        console.print("[yellow]No projects selected — choose at least one or press Ctrl+C to cancel.[/yellow]")

    clients = []
    for sel in selections:
        for p, f in detected_projects:
            # Selection of a listed project confirms its detected framework.
            if sel == f"{p} ({f})":
                clients.append({"framework": f, "root": p})
                break
    return {"backend": backend, "clients": clients}


def _auto_configure(cwd: str, *, framework: str | None, module: str | None, client: str | None) -> dict:
    """Non-interactive (--yes) configuration. Sniffs or requires --framework."""
    fw = framework
    if fw is None:
        fw = _sniff_backend(cwd)
    if fw is None:
        console.print("[red]✗ Could not detect a backend framework.[/red]\n")
        console.print("[dim]Run [cyan]pyrpc dev[/cyan] interactively, or declare it explicitly:[/dim]")
        console.print(
            "  [cyan]pyrpc dev --yes --framework <fastapi|flask|django|asgi> "
            "[--module main] [--client ../frontend][/cyan]\n"
        )
        raise typer.Exit(1)

    if fw == "django":
        manage = "manage.py"
        if not (Path(cwd) / manage).is_file():
            console.print(f"[red]✗ No manage.py found in {cwd}.[/red]")
            console.print("[dim]Run pyrpc dev from the directory containing manage.py.[/dim]")
            raise typer.Exit(1)
        types_mod = module or _detect_django_types_module(cwd)
        if not types_mod:
            console.print("[red]✗ Could not detect a Django types module.[/red]")
            console.print("[dim]Pass it explicitly: [cyan]--module myproject.views[/cyan][/dim]")
            raise typer.Exit(1)
        backend = {"framework": fw, "entrypoint": manage, "types_module": types_mod}
    else:
        backend = {
            "framework": fw,
            "entrypoint": normalize_entrypoint(module or _default_module(cwd)),
        }

    cfg = {"backend": backend}
    if client:
        cfg["clients"] = [{"framework": _detect_framework(client) or "Other", "root": client}]
        console.print(f"  [dim]{backend['framework']} {backend['entrypoint']}  client={client}[/dim]")
    else:
        detected_projects = _find_frontend_projects(cwd)
        if len(detected_projects) > 1:
            console.print("[red]✗ Multiple TypeScript projects found.[/red]\n")
            for p, _ in detected_projects:
                console.print(f"  • {p}")
            console.print("\n[dim]Specify which client to use:[/dim]\n")
            console.print("  [cyan]pyrpc dev --client <path>[/cyan]\n")
            console.print("[dim]Or configure clients explicitly in pyrpc.json.[/dim]")
            raise typer.Exit(1)
        if detected_projects:
            p, f = detected_projects[0]
            cfg["clients"] = [{"framework": f, "root": p}]
            console.print(f"  [dim]{backend['framework']} {backend['entrypoint']}  client={p}[/dim]")
        else:
            console.print(f"  [dim]{backend['framework']} {backend['entrypoint']}  (no client configured)[/dim]")
    return cfg


# ── Core helpers ──────────────────────────────────────────────────────────────

_IMPORT_SKIP_DIRS = {
    ".venv", "venv", "env", "site-packages", "node_modules", "dist", "build", ".git"
}


def _user_frame(exc: BaseException, cwd: str) -> tuple[str, int] | None:
    """Return ``(filename, lineno)`` of the deepest frame in the user's project.

    The traceback chain walks from the outermost frame (where the exception
    surfaced) toward the raise site, so the last frame whose file lives under
    ``cwd`` and outside vendored/venv directories is the actual error site.
    Returns ``None`` when the failure happened entirely inside pyRPC or the
    standard library, so internal bugs are never misattributed to user code.
    """
    cwd_abs = os.path.abspath(cwd)
    tb = exc.__traceback__
    best: tuple[str, int] | None = None
    while tb is not None:
        raw = tb.tb_frame.f_code.co_filename
        if not raw.startswith("<"):
            filename = os.path.abspath(raw)
            if filename == cwd_abs or filename.startswith(cwd_abs + os.sep):
                dirs = filename[len(cwd_abs):].split(os.sep)[:-1]
                if not any(d in _IMPORT_SKIP_DIRS for d in dirs):
                    best = (filename, tb.tb_lineno)
        tb = tb.tb_next
    return best


def _report_import_error(module_path: str, exc: BaseException, cwd: str) -> None:
    """Print a concise, actionable error for an entry-module import failure.

    When the failure is in the user's own code, point at the exact file and
    line. When it happened entirely inside pyRPC machinery, keep the full
    internal traceback so pyRPC bugs are not hidden.
    """
    frame = _user_frame(exc, cwd)
    if frame is not None:
        filename, lineno = frame
        rel = os.path.relpath(filename, cwd)
        console.print(f'[bold red]✗[/bold red] Failed to load entry module "{module_path}"')
        console.print()
        console.print(f"  [bold]{type(exc).__name__}[/bold]: {exc}")
        console.print()
        console.print(
            f"  [yellow]→ Fix the error in {rel}:{lineno} and run `pyrpc dev` again.[/yellow]"
        )
        return
    if isinstance(exc, ImportError):
        console.print(f'[bold red]✗[/bold red] Could not import "{module_path}": {exc}')
        return
    console.print(f'[bold red]✗[/bold red] Failed to load entry module "{module_path}" (internal error):')
    traceback.print_exception(type(exc), exc, exc.__traceback__)


def _import_module(module_path: str):
    sys.path.insert(0, os.getcwd())
    try:
        return importlib.import_module(module_path)
    except Exception as e:
        _report_import_error(module_path, e, os.getcwd())
        raise typer.Exit(code=1) from e

def _parse_entry(entry: str) -> tuple[str, str]:
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

def _run_codegen(module: str, output_path: str, *, reload: bool = False) -> int:
    """
    Generate TypeScript declarations for one output path.

    ``reload=False`` imports the module (registering procedures in
    ``default_router``). ``reload=True`` uses ``default_router.reload_module``
    so the watcher picks up procedures after edits — a plain re-import would
    return the cached module and regenerate stale types.
    """
    _lazy_core()
    from pyrpc_core import default_router, get_registry_schema
    if reload:
        if not default_router.reload_module(module):
            console.print("  [yellow]⚠[/yellow]  no procedures after reload")
            return 0
    else:
        _import_module(module)
    schemas = get_registry_schema(default_router)
    save = _lazy_codegen()
    save(schemas, output_path)
    return len(schemas)

def _regenerate_clients(module: str, client_dirs: list[str], *, reload: bool = False) -> int:
    """Generate types for every configured client and configure each tsconfig + bundler."""
    from pyrpc_core.tsconfig import configure_tsconfig
    from pyrpc_core.bundlers import configure_bundler
    n = 0
    for client_dir in client_dirs:
        output_path = os.path.abspath(os.path.join(client_dir, "__pyrpc.ts"))
        n = _run_codegen(module, output_path, reload=reload)
        try:
            configure_tsconfig(client_dir)
        except Exception as e:
            console.print(f"[yellow]⚠ Could not configure tsconfig in {client_dir}: {e}[/yellow]")
        try:
            if not configure_bundler(client_dir):
                console.print(
                    f"[yellow]⚠ Could not auto-configure bundler in {client_dir} — "
                    "add a bundler alias '@pyrpc/types' → './__pyrpc.ts' "
                    "(Vite/SvelteKit/Next.js Turbopack).[/yellow]"
                )
        except Exception as e:
            console.print(f"[yellow]⚠ Could not configure bundler in {client_dir}: {e}[/yellow]")
    return n

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

def _make_regen_callback(module: str, client_dirs: list[str]) -> tuple[Callable[[], None], Callable[[], None]]:
    _lock = threading.Lock()
    _timer: list[threading.Timer | None] = [None]
    _timer_lock = threading.Lock()

    def _do_regen():
        if not _lock.acquire(blocking=False):
            return
        try:
            n = _regenerate_clients(module, client_dirs, reload=True)
            console.print(f"[dim]{time.strftime('%H:%M:%S')} types regenerated ({n} procs) for {len(client_dirs)} clients[/dim]")
        except Exception as e:
            console.print(f"[red]Error regenerating types:[/red] {e}")
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

# ── Watcher runner (crash-safe) ───────────────────────────────────────────────

def _run_watcher(name: str, fn: Callable[[], None], stop: threading.Event,
                 errors: list[tuple[str, BaseException]]) -> None:
    """Run a watcher loop, surfacing crashes instead of dying silently.

    Watcher threads must never die silently: ``pyrpc dev`` would keep running
    while file watching is broken, making the session look healthy when it is
    not. On failure, record the error, print a clear message, and signal
    ``stop`` so the whole session winds down and exits nonzero.
    """
    try:
        fn()
    except Exception as e:
        errors.append((name, e))
        console.print(f"[bold red]✗[/bold red] {name} failed: {type(e).__name__}: {e}")
        console.print("  [yellow]→ File watching stopped — fix the error above and run the command again.[/yellow]")
        stop.set()


# ── Dev console ───────────────────────────────────────────────────────────────

class _DevConsole:
    def __init__(self, *, module: str, client_dirs: list[str], host: str, port: int,
                 regenerate_cb, server_proc=None, server_managed: bool = False,
                 stop_event: threading.Event | None = None):
        self.module = module
        self.client_dirs = client_dirs
        self.host = host
        self.port = port
        self.regenerate = regenerate_cb
        self.server_proc = server_proc
        self.server_managed = server_managed
        self._stop_event = stop_event
        self._running = True

    def _schemas(self) -> dict:
        try:
            from pyrpc_core import default_router, get_registry_schema
            return get_registry_schema(default_router)
        except Exception:
            return {}

    def run(self):
        console.print("[dim]type help for commands[/dim]")
        while self._running:
            if self._stop_event is not None and self._stop_event.is_set():
                break
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
        for c in self.client_dirs:
            console.print(f"  [bold]{os.path.abspath(os.path.join(c, '__pyrpc.ts'))}[/bold]")
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
    client: str = typer.Option(_DEFAULT_CLIENT, "--client", "-c", help="Client project root"),
):
    """Generate TypeScript types from a schema, URL, or module."""
    try:
        schemas = _resolve_source(source)
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}"); raise typer.Exit(1) from e
    
    p = os.path.abspath(os.path.join(client, "__pyrpc.ts"))
    _lazy_codegen()(schemas, p)
    console.print(f"  [green]✓[/green]  types generated ({len(schemas)} procs) → {p}")
    console.print('  import type {{ Types }} from "@pyrpc/types"')


@app.command("watch")
def watch_command(
    module: str = typer.Argument(None, help="Types module override (reads pyrpc.json if omitted)"),
    client: str = typer.Option(None, "--client", "-c", help="Client project root"),
):
    """Watch for Python changes and regenerate TypeScript types. No server started."""
    cwd = os.getcwd()
    cfg = _read_config() or {}
    spec = parse_backend(cfg)

    if not module:
        if spec is None:
            console.print(
                "[red]No module specified and no valid backend in pyrpc.json. "
                "Run pyrpc dev first.[/red]"
            )
            raise typer.Exit(1)
        try:
            module = resolve_types_module(spec)
        except BackendConfigError as e:
            console.print(f"[red]✗[/red] {e}")
            raise typer.Exit(1) from e

    if client:
        client_dirs = [client]
    else:
        client_dirs = [c["root"] for c in clients_from_config(cfg)]

    if not client_dirs:
        console.print("[red]No clients configured. Specify --client or configure clients in pyrpc.json.[/red]")
        raise typer.Exit(1)

    _lazy_core()

    try:
        n = _regenerate_clients(module, client_dirs)
        if len(client_dirs) == 1:
            console.print(f"  [green]✓[/green]  types generated ({n} procs) → {client_dirs[0]}")
        else:
            console.print(f"  [green]✓[/green]  types generated ({n} procs) for {len(client_dirs)} clients")
        console.print("  watching... [dim](Ctrl+C to stop)[/dim]")
    except Exception as e:
        console.print(f"  [red]✗[/red]  {e}"); raise typer.Exit(1) from e
        
    _do, schedule = _make_regen_callback(module, client_dirs)
    stop = threading.Event()
    errors: list[tuple[str, BaseException]] = []

    def _w():
        # ``stop_event`` is not supported by every watchfiles release, so
        # shutdown is signalled via ``stop`` + ``yield_on_timeout`` instead.
        for changes in watch(*_find_python_dirs(cwd), yield_on_timeout=True, debounce=200, rust_timeout=200):
            if stop.is_set(): break
            if any(f.endswith(".py") for _, f in changes): schedule()

    t = threading.Thread(target=_run_watcher, args=("watcher", _w, stop, errors), daemon=True)
    t.start()
    try:
        t.join()
    except KeyboardInterrupt:
        stop.set()
        console.print("\n  [dim]stopped[/dim]")
    if errors:
        raise typer.Exit(code=1) from errors[0][1]


@app.command()
def dev(
    host: str = typer.Option("127.0.0.1", "--host", "-h", help="Server host"),
    port: int = typer.Option(8000, "--port", "-p", help="Server port"),
    reload: bool = typer.Option(True, "--reload/--no-reload", help="Backend dev-server auto-reload"),
    yes: bool = typer.Option(False, "--yes", "-y", help="Skip the setup wizard; auto-detect backend and client."),
    framework: str = typer.Option(None, "--framework", "-f", help="Backend framework: fastapi, flask, django, asgi. Requires --yes."),
    module: str = typer.Option(None, "--module", "-m", help="Backend entry point (django: types module). Requires --yes."),
    client: str = typer.Option(None, "--client", "-c", help="Client project root (skips wizard prompt). Requires --yes."),
    reconfigure: bool = typer.Option(False, "--reconfigure", help="Re-run the setup wizard even if pyrpc.json exists."),
):
    """Start the dev server and keep TypeScript types in sync.

    First run: wizard asks for your backend framework and entry point, then
    client roots — and writes pyrpc.json. Every run after reads it silently.

    backend.entrypoint is framework-specific:
    FastAPI/Flask/ASGI -> module[:app]; Django -> path to manage.py.

    Pass --yes to skip the wizard entirely:

      pyrpc dev --yes
      pyrpc dev --yes --framework fastapi --module main --client ../frontend

    The backend framework determines the native dev server: FastAPI/ASGI run
    under uvicorn, Flask uses `flask run`, Django uses `manage.py runserver`.

    Detects if a server is already running on host:port — if so, skips
    starting one and just runs the type watcher.

    Also watches pyrpc.json itself — if backend or clients change, the
    session re-wires automatically and restarts the server if needed.
    """
    cwd = os.getcwd()

    if framework is not None and framework not in FRAMEWORKS:
        console.print(
            f"[red]✗ Unsupported --framework '{framework}'.[/red] "
            f"Choose from: [cyan]{', '.join(FRAMEWORKS)}[/cyan]"
        )
        raise typer.Exit(1)

    # ── Config: read or run wizard ────────────────────────────────────────────
    cfg_path = _find_config()
    cfg = None
    if cfg_path is not None and not reconfigure:
        with open(cfg_path) as f:
            loaded = json.load(f)
        if has_valid_backend(loaded):
            cfg = loaded

    if cfg is None and not yes:
        cfg = _run_wizard(cwd)
        cfg_path = _write_config(cfg, cfg_path)
        console.print("  [green]✓[/green]  pyrpc.json created")
    elif cfg is None:
        cfg = _auto_configure(cwd, framework=framework, module=module, client=client)
        legacy = cfg_path is not None
        cfg_path = _write_config(cfg, cfg_path)
        console.print(f"  [green]✓[/green]  pyrpc.json {'rewritten' if legacy else 'created'} (auto-configured)")

    spec = parse_backend(cfg)
    base_dir = str(cfg_path.parent)
    try:
        types_module = resolve_types_module(spec)
    except BackendConfigError as e:
        console.print(f"[red]✗[/red] {e}")
        raise typer.Exit(1) from e
    client_dirs = [c["root"] for c in clients_from_config(cfg)]

    # ── Import types module + initial codegen ─────────────────────────────────
    _lazy_core()
    _import_module(types_module)
    if client_dirs:
        try:
            n = _regenerate_clients(types_module, client_dirs)
            if len(client_dirs) == 1:
                console.print(f"  [green]✓[/green]  types generated ({n} procs) → {client_dirs[0]}")
            else:
                console.print(f"  [green]✓[/green]  types generated ({n} procs) for {len(client_dirs)} clients")
        except Exception as e:
            console.print(f"  [red]✗[/red]  initial codegen failed: {e}")
            raise typer.Exit(1) from e
    else:
        console.print(f"  [dim]○[/dim]  no clients configured — skipping type generation")

    # ── Server: attach or start ───────────────────────────────────────────────
    server_proc: subprocess.Popen | None = None
    server_managed = False

    def _start_server(current_spec) -> subprocess.Popen:
        """Resolve the framework-native launch command and spawn it."""
        plan: LaunchPlan = resolve_launch(
            current_spec, host=host, port=port, reload=reload, base_cwd=base_dir
        )
        env = os.environ.copy()
        env.setdefault("PYTHONPATH", cwd)
        proc = subprocess.Popen(plan.argv, cwd=plan.cwd or cwd, env=env)
        proc._cwd = plan.cwd or cwd  # stash for restart
        return proc

    if _server_is_running(host, port):
        console.print(
            f"  [dim]○[/dim]  server already running at "
            f"http://{host}:{port}/rpc — skipping backend startup"
        )
    else:
        server_proc = _start_server(spec)
        server_managed = True
        console.print(f"  [bold]pyRPC dev[/bold]  http://{host}:{port}/rpc")

    # ── Regen callback wired to current types module/output ──────────────────
    if client_dirs:
        _do_regen, schedule = _make_regen_callback(types_module, client_dirs)
    else:
        def _do_regen(): pass
        def schedule(): pass

    # ── Watchers ──────────────────────────────────────────────────────────────
    stop = threading.Event()

    def _py_watcher():
        """Watch .py files → debounced regen."""
        # ``stop_event`` is not supported by every watchfiles release, so
        # shutdown is signalled via ``stop`` + ``yield_on_timeout`` instead.
        for changes in watch(
            *_find_python_dirs(cwd),
            yield_on_timeout=True,
            debounce=200,
            rust_timeout=200,
        ):
            if stop.is_set():
                break
            if any(f.endswith(".py") for _, f in changes):
                schedule()

    def _cfg_watcher():
        """
        Watch pyrpc.json — on change reload config and re-wire.
        If backend changed → import new types module, restart server (if we own it).
        If clients changed → point regen callback at the new roots.
        """
        nonlocal _do_regen, schedule, server_proc, types_module, spec, client_dirs

        for changes in watch(
            str(cfg_path.parent),
            yield_on_timeout=True,
            debounce=300,
            rust_timeout=300,
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

            new_spec = parse_backend(new_cfg) or spec
            new_client_dirs = [c["root"] for c in clients_from_config(new_cfg)]

            backend_changed = new_spec != spec
            output_changed = new_client_dirs != client_dirs

            if not backend_changed and not output_changed:
                continue

            console.print("  [blue]pyrpc.json changed — reloading...[/blue]")

            if output_changed:
                client_dirs = new_client_dirs
                console.print(f"  [dim]clients → {client_dirs}[/dim]")

            if backend_changed:
                try:
                    new_types_module = resolve_types_module(new_spec)
                    _import_module(new_types_module)
                except BackendConfigError as e:
                    console.print(f"[red]✗[/red] {e}")
                    continue
                spec = new_spec
                types_module = new_types_module
                console.print(f"  [dim]types module → {types_module}[/dim]")

            # Re-wire regen callback to new module/output
            _do_regen, schedule = _make_regen_callback(types_module, client_dirs)

            # Restart backend if we own it and its launch config changed
            if backend_changed and server_managed and server_proc:
                console.print("  [yellow]restarting backend...[/yellow]")
                server_proc.terminate()
                server_proc.wait()
                server_proc = _start_server(spec)

            # Regenerate immediately with new config
            _do_regen()

    watcher_errors: list[tuple[str, BaseException]] = []
    py_thread = threading.Thread(
        target=_run_watcher, args=("Python file watcher", _py_watcher, stop, watcher_errors), daemon=True
    )
    cfg_thread = threading.Thread(
        target=_run_watcher, args=("config watcher", _cfg_watcher, stop, watcher_errors), daemon=True
    )
    py_thread.start()
    cfg_thread.start()

    # Give watchers a moment to fail loudly before dropping into the console, so
    # a crashed watcher never leaves the session looking healthy.
    py_thread.join(timeout=0.25)
    cfg_thread.join(timeout=0.25)
    if watcher_errors:
        stop.set()
        if server_proc and server_managed:
            server_proc.terminate()
            server_proc.wait()
        console.print("  [dim]stopped[/dim]")
        raise typer.Exit(code=1)

    # ── Interactive console ───────────────────────────────────────────────────
    dev_console = _DevConsole(
        module=module,
        client_dirs=client_dirs,
        host=host,
        port=port,
        regenerate_cb=_do_regen,
        server_proc=server_proc,
        server_managed=server_managed,
        stop_event=stop,
    )
    try:
        dev_console.run()
    except KeyboardInterrupt:
        pass
    finally:
        stop.set()
        py_thread.join(timeout=1.0)
        cfg_thread.join(timeout=1.0)
        if server_proc and server_managed:
            server_proc.terminate()
            server_proc.wait()
        console.print("  [dim]stopped[/dim]")
    if watcher_errors:
        console.print("[bold red]✗ session ended with a watcher failure (see above).[/bold red]")
        raise typer.Exit(code=1)


if __name__ == "__main__":
    app()
