import hashlib
import importlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
from pathlib import Path

import questionary
import typer
from pyrpc_core.constants import FRAMEWORKS
from rich.console import Console
from rich.table import Table
from watchfiles import watch

__version__ = "0.3.3"

PYRPC_CONFIG = dict | None
CONFIG_FILE = "pyrpc.json"
CONFIG_VERSION = 1
DISTRIBUTION_MODES = ["workspace", "server"]


def _find_pyrpc_json() -> Path | None:
    path = Path.cwd()
    for parent in [path] + list(path.parents):
        candidate = parent / CONFIG_FILE
        if candidate.is_file():
            return candidate
    return None


def _read_pyrpc_config() -> PYRPC_CONFIG:
    path = _find_pyrpc_json()
    if not path:
        return None
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception:
        return None


def _write_pyrpc_config(config: dict) -> bool:
    path = _find_pyrpc_json()
    if not path:
        path = Path.cwd() / CONFIG_FILE
    config["version"] = CONFIG_VERSION
    with open(path, "w") as f:
        json.dump(config, f, indent=2)
    return True


def _hash_file(path: str) -> str:
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def _prompt_for_config(previous: dict | None = None) -> dict | None:
    console.print("[bold]pyRPC Setup[/bold]")
    console.print("Let's configure pyRPC for your project.\n")

    default_framework = (previous or {}).get("framework", "fastapi")
    framework = questionary.select(
        "Which web framework are you using?",
        choices=FRAMEWORKS,
        default=default_framework,
    ).ask()
    if framework is None:
        return None

    default_entry = (previous or {}).get("entrypoint", "main")
    entry = questionary.text(
        "Python module to scan for @rpc procedures (e.g. main, app.main)",
        default=default_entry,
    ).ask()
    if entry is None:
        return None

    default_distribution = (previous or {}).get("distribution", "workspace")
    distribution = questionary.select(
        "How are types distributed to the client?",
        choices=DISTRIBUTION_MODES,
        default=default_distribution,
    ).ask()
    if distribution is None:
        return None

    client_root = None
    if distribution == "workspace":
        default_client = (previous or {}).get("client_root", "")
        client_root = questionary.text(
            "Where is your TypeScript client project? (relative path, e.g. ../frontend)",
            default=default_client,
        ).ask()
        if client_root is None:
            return None

    config = {"framework": framework, "entrypoint": entry, "distribution": distribution}
    if client_root:
        config["client_root"] = client_root
    return config


def _ensure_config(reconfigure: bool = False, previous: dict | None = None) -> dict | None:
    if not reconfigure:
        config = _read_pyrpc_config()
        if config and "distribution" in config:
            return config

    if reconfigure or (config and "distribution" not in config):
        console.print("  [yellow]⚠[/yellow] Reconfiguring pyRPC")

    config = _prompt_for_config(previous=previous or _read_pyrpc_config())
    if config is None:
        return None

    _write_pyrpc_config(config)
    return config


def _is_absolute_or_drive_path(p: str) -> bool:
    return os.path.isabs(p) or bool(re.match(r"^[A-Za-z]:[/\\]", p))


def _resolve_client_root(client_root: str, config_dir: str) -> str:
    p = client_root if _is_absolute_or_drive_path(client_root) else os.path.join(config_dir, client_root)
    return os.path.normpath(p)


def _handle_migration(old_path: str, new_path: str):
    if not os.path.isfile(old_path):
        return

    if not os.path.isfile(new_path):
        ans = questionary.confirm(
            f"Types location changed.\n  Old: {old_path}\n  New: {new_path}\n\nMove generated types?",
            default=True,
        ).ask()
        if ans is None:
            return
        if ans:
            os.makedirs(os.path.dirname(new_path), exist_ok=True)
            shutil.move(old_path, new_path)
            console.print(f"  [green]✓[/green] Moved types to new location")
        return

    if _hash_file(old_path) == _hash_file(new_path):
        os.remove(old_path)
        console.print("  [green]✓[/green] Generated types already exist at new location.")
        console.print("  [dim]Removed old copy.[/dim]")
        return

    console.print("\n[yellow]Generated types found in both locations.[/yellow]")
    console.print("  [bold]Recommended:[/bold] Regenerate from the current server.\n")
    choice = questionary.select(
        "What would you like to do?",
        choices=[
            "Regenerate at new location and remove old location",
            "Keep both locations",
            "Cancel",
        ],
        default="Regenerate at new location and remove old location",
    ).ask()
    if choice is None:
        return
    if choice.startswith("Regenerate"):
        os.remove(old_path)
        console.print("  [dim]Removed old copy.[/dim]")


def _install_adapter(framework: str):
    if framework == "asgi":
        return
    adapter_pkg = f"pyrpc-{framework}"
    try:
        importlib.import_module(adapter_pkg.replace("-", "_"))
        return
    except ImportError:
        pass
    console.print(f"  [dim]○[/dim] Installing {adapter_pkg}...")
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", adapter_pkg],
        capture_output=True, text=True,
    )
    if result.returncode == 0:
        console.print(f"  [green]✓[/green] Installed {adapter_pkg}")
    else:
        console.print(f"  [red]✗[/red] Could not auto-install {adapter_pkg}")
        console.print(f"       Install manually: pip install {adapter_pkg}")



def _parse_entry(entry: str) -> tuple[str, str | None]:
    parts = entry.split(":", 1)
    module = parts[0]
    app_var = parts[1] if len(parts) > 1 else None
    return module, app_var


app = typer.Typer(
    name="pyrpc",
    help="pyRPC CLI - type-safe Python-to-TypeScript RPC",
    add_completion=False,
)
console = Console()


def _lazy_import_pyrpc_core():
    global default_router, get_registry_schema
    from pyrpc_core import default_router, get_registry_schema
    return default_router, get_registry_schema


def _lazy_import_codegen():
    from pyrpc_codegen import DEFAULT_OUTPUT, save_typescript_client
    return DEFAULT_OUTPUT, save_typescript_client


def _import_module(module_path: str):
    sys.path.insert(0, os.getcwd())
    try:
        return importlib.import_module(module_path)
    except ImportError as e:
        console.print(f"[bold red]Error:[/bold red] Could not import module '{module_path}': {e}")
        raise typer.Exit(code=1) from e



def _fetch_schema(url: str) -> dict:
    import httpx
    clean_url = url.rstrip("/")
    if not clean_url.endswith("/rpc"):
        clean_url += "/rpc"
    response = httpx.get(clean_url)
    response.raise_for_status()
    return response.json()


def _load_schema(path_or_url: str) -> dict:
    if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
        console.print(f"Fetching schema from [bold yellow]{path_or_url}[/bold yellow]...")
        return _fetch_schema(path_or_url)

    path = os.path.abspath(path_or_url)
    if os.path.isfile(path):
        console.print(f"Reading schema from [bold yellow]{path}[/bold yellow]...")
        with open(path, "r") as f:
            return json.load(f)

    return None


def _extract_schema_from_module(module: str) -> dict:
    _lazy_import_pyrpc_core()
    _import_module(module)

    schemas = get_registry_schema(default_router)

    if not schemas:
        console.print("[yellow]No procedures found in registry for this module.[/yellow]")
        raise typer.Exit(code=1)

    serializable = {}
    for name, schema in schemas.items():
        serializable[name] = {
            "name": schema.name,
            "doc": schema.doc or "",
            "parameters": [
                {
                    "name": p.name,
                    "type": p.type,
                    "required": p.required,
                    "default": p.default,
                    "schema": p.schema_,
                }
                for p in schema.parameters
            ],
            "return_type": schema.return_type,
            "return_schema": schema.return_schema,
        }

    return serializable


def _resolve_source(source: str) -> dict:
    schemas = _load_schema(source)
    if schemas is not None:
        return schemas

    console.print(f"Importing module [bold yellow]{source}[/bold yellow]...")
    return _extract_schema_from_module(source)


@app.command()
def version():
    """Show pyRPC version."""
    console.print(f"pyRPC version: [bold cyan]{__version__}[/bold cyan]")



@app.command()
def pull(
    module: str = typer.Argument(..., help="Python module to scan for @rpc procedures (e.g. main, app.main)"),
    output: str = typer.Option("pyrpc-schema.json", "--output", "-o", help="Output JSON schema file path"),
):
    """Extract RPC schema from a Python module and save as JSON."""
    serializable = _extract_schema_from_module(module)

    output_path = os.path.abspath(output)
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(serializable, f, indent=2)

    console.print(f"[bold green]OK Schema extracted to {output_path}[/bold green]")
    console.print(f"  ({len(serializable)} procedure(s) written)")


@app.command()
def serve(
    module: str = typer.Argument(..., help="Python module to scan for @rpc procedures (e.g. main, app.main)"),
    host: str = typer.Option("127.0.0.1", "--host", "-h", help="Bind socket to this host"),
    port: int = typer.Option(8000, "--port", "-p", help="Bind socket to this port"),
    reload: bool = typer.Option(False, "--reload", help="Enable auto-reload"),
):
    """Start the pyRPC ASGI server."""
    _lazy_import_pyrpc_core()
    import uvicorn
    _import_module(module)

    from pyrpc_core.transport.asgi import PyRPCAsgiApp
    app_instance = PyRPCAsgiApp(default_router)

    console.print(f"  [bold]pyRPC server[/bold]  http://{host}:{port}/rpc")

    if reload:
        startup_code = (
            "from pyrpc_core import default_router\n"
            "from pyrpc_core.transport.asgi import PyRPCAsgiApp\n"
            f"import {module}\n"
            "app = PyRPCAsgiApp(default_router)\n"
        )
        tmp = tempfile.NamedTemporaryFile(
            mode="w", suffix=".py", delete=False, encoding="utf-8"
        )
        tmp.write(startup_code)
        tmp.close()
        module_path = os.path.splitext(os.path.basename(tmp.name))[0]
        sys.path.insert(0, os.path.dirname(tmp.name))
        uvicorn.run(f"{module_path}:app", host=host, port=port, reload=reload)
    else:
        uvicorn.run(app_instance, host=host, port=port, reload=reload)


@app.command()
def codegen(
    source: str = typer.Argument(..., help="Schema JSON file path, URL, or Python module (e.g. pyrpc-schema.json, http://localhost:8000, or app.main)"),
):
    """Generate TypeScript type definitions from a schema file, a running server, or a Python module."""
    try:
        schemas = _resolve_source(source)
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] Could not load schema from '{source}': {e}")
        raise typer.Exit(code=1) from e

    DEFAULT_OUTPUT, save_typescript_client = _lazy_import_codegen()
    output = os.path.abspath(DEFAULT_OUTPUT)
    console.print(f"Generating TypeScript contracts [dim]({len(schemas)} procedures)[/dim]...")
    save_typescript_client(schemas, output)
    console.print(f"[bold green]OK Types written to {output}[/bold green]")

    if os.path.exists(output):
        console.print("  Import: [bold]import type { Types } from \"@pyrpc/types\"[/bold]")



class _DevConsole:
    """Interactive developer console attached to the pyrpc dev server."""

    def __init__(self, module: str, regenerate_cb, server_proc=None, tmp_path: str = None, server_args: list = None, server_cwd: str = None, types_path: str = "node_modules/@pyrpc/types/src/index.ts", is_server_mode: bool = False):
        self.module = module
        self.regenerate = regenerate_cb
        self.server_proc = server_proc
        self.tmp_path = tmp_path
        self.server_args = server_args
        self.server_cwd = server_cwd
        self.types_path = types_path
        self.is_server_mode = is_server_mode
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
                console.print()
                break

            if not line:
                continue

            parts = line.split(None, 1)
            cmd = parts[0].lower()
            arg = parts[1] if len(parts) > 1 else ""

            handler = {
                "help": self._cmd_help,
                "procedures": self._cmd_procedures,
                "procs": self._cmd_procedures,
                "inspect": self._cmd_inspect,
                "generate": self._cmd_generate,
                "types": self._cmd_types,
                "restart": self._cmd_restart,
                "exit": self._cmd_exit,
                "quit": self._cmd_exit,
            }.get(cmd)

            if handler:
                handler(arg)
            else:
                console.print(f"[red]Unknown command: {cmd}. Type [bold]help[/bold] for commands.[/red]")

    def _cmd_help(self, _arg=""):
        console.print("[bold]pyRPC Dev Console Commands:[/bold]")
        console.print("  [cyan]help[/cyan]                Show this help message")
        console.print("  [cyan]procedures[/cyan]           List all registered RPC procedures")
        console.print("  [cyan]procs[/cyan]                Alias for procedures")
        console.print("  [cyan]inspect <name>[/cyan]       Show details for a specific procedure")
        if self.is_server_mode:
            console.print("  [cyan]generate[/cyan]             Manually trigger schema regeneration")
            console.print("  [cyan]types[/cyan]                Show how clients fetch types in server mode")
        else:
            console.print("  [cyan]generate[/cyan]             Manually trigger TypeScript type regeneration")
            console.print("  [cyan]types[/cyan]                Show the path to generated TypeScript types")
        console.print("  [cyan]restart[/cyan]              Restart the dev server")
        console.print("  [cyan]exit[/cyan] / [cyan]quit[/cyan]          Stop the dev server and exit")

    def _cmd_procedures(self, _arg=""):
        schemas = self._schemas()
        if not schemas:
            console.print("[yellow]No procedures registered.[/yellow]")
            return
        table = Table(title=f"Procedures ({len(schemas)} total)")
        table.add_column("Name", style="cyan")
        table.add_column("Params", style="green")
        table.add_column("Returns", style="magenta")
        table.add_column("Doc", style="white")
        for name, schema in sorted(schemas.items()):
            if hasattr(schema, "parameters"):
                params = ", ".join(f"{p.name}: {p.type}" for p in schema.parameters)
                returns = schema.return_type
                doc = schema.doc or ""
            else:
                params = ", ".join(
                    f"{p.get('name', '?')}: {p.get('type', 'any')}"
                    for p in schema.get("parameters", [])
                )
                returns = schema.get("return_type", "any")
                doc = schema.get("doc", "")
            table.add_row(name, params or "None", returns, doc)
        console.print(table)

    def _cmd_inspect(self, arg=""):
        if not arg:
            console.print("[red]Usage: inspect <procedure_name>[/red]")
            return
        schemas = self._schemas()
        schema = schemas.get(arg)
        if not schema:
            console.print(f"[red]Procedure '{arg}' not found.[/red]")
            return
        console.print(f"[bold cyan]{arg}[/bold cyan]")
        if hasattr(schema, "doc") and schema.doc:
            console.print(f"  Doc: {schema.doc}")
        returns = schema.return_type if hasattr(schema, "return_type") else schema.get("return_type", "any")
        console.print(f"  Returns: {returns}")
        params = schema.parameters if hasattr(schema, "parameters") else schema.get("parameters", [])
        if params:
            console.print(f"  Parameters ({len(params)}):")
            for p in params:
                name = p.name if hasattr(p, "name") else p.get("name", "?")
                ptype = p.type if hasattr(p, "type") else p.get("type", "any")
                required = p.required if hasattr(p, "required") else p.get("required", True)
                console.print(f"    {name}: {ptype} {'[dim](optional)[/dim]' if not required else ''}")

    def _cmd_generate(self, _arg=""):
        if self.is_server_mode:
            console.print("[bold blue]Regenerating schema...[/bold blue]")
        else:
            console.print("[bold blue]Regenerating TypeScript types...[/bold blue]")
        self.regenerate()

    def _cmd_types(self, _arg=""):
        if self.is_server_mode:
            console.print("Server mode — clients fetch types via HTTP.")
            console.print("  [bold]GET /rpc[/bold] returns the current schema")
            console.print("  Run [bold]npx pyrpc sync[/bold] on the client to regenerate types")
        else:
            console.print(f"TypeScript types written to: [bold]{self.types_path}[/bold]")
            console.print('  Import: [bold]import type { Types } from "@pyrpc/types"[/bold]')

    def _cmd_restart(self, _arg=""):
        if not self.server_proc:
            console.print("[yellow]No server running (--types-only mode).[/yellow]")
            return
        console.print("[yellow]Restarting server...[/yellow]")
        self.server_proc.terminate()
        self.server_proc.wait()
        self.server_proc = subprocess.Popen(
            self.server_args, cwd=self.server_cwd,
        )
        console.print("[bold green]Server restarted[/bold green]")

    def _cmd_exit(self, _arg=""):
        self._running = False




@app.command()
def dev(
    module: str = typer.Argument(None, help="Python module to scan for @rpc procedures (e.g. main, app.main)"),
    host: str = typer.Option("127.0.0.1", "--host", "-h", help="Bind socket to this host"),
    port: int = typer.Option(8000, "--port", "-p", help="Bind socket to this port"),
    types_only: bool = typer.Option(False, "--types-only", help="Only regenerate types, skip starting the server"),
    reconfigure: bool = typer.Option(False, "--reconfigure", help="Re-run setup prompts with previous answers as defaults"),
    framework: str = typer.Option(None, "--framework", help="Web framework to use (fastapi, flask, asgi)"),
    entry: str = typer.Option(None, "--entry", help="Python module to scan for @rpc procedures"),
    client_root: str = typer.Option(None, "--client-root", help="Relative path to TypeScript client project"),
    distribution: str = typer.Option(None, "--distribution", help="How types reach the client (workspace, server)"),
):
    """Start the pyRPC dev server with auto-type regeneration and interactive console."""
    config_path = _find_pyrpc_json()
    config_dir = os.path.dirname(str(config_path)) if config_path else os.getcwd()

    old_cfg = _read_pyrpc_config()
    old_client_root_raw = (old_cfg or {}).get("client_root")
    old_client_root = _resolve_client_root(old_client_root_raw, config_dir) if old_client_root_raw else None
    old_types_output = os.path.join(old_client_root, "node_modules/@pyrpc/types/src/index.ts") if old_client_root else None

    cfg = dict(old_cfg) if old_cfg else {}
    has_override = False
    if framework:
        cfg["framework"] = framework; has_override = True
    if entry:
        cfg["entrypoint"] = entry; has_override = True
    if client_root:
        cfg["client_root"] = client_root; has_override = True
    if distribution:
        cfg["distribution"] = distribution; has_override = True

    missing_distribution = old_cfg and "distribution" not in old_cfg and not distribution
    if not module and (reconfigure or not old_cfg or missing_distribution):
        cfg = _ensure_config(reconfigure=reconfigure or missing_distribution, previous=cfg if (old_cfg or has_override) else None)
        if cfg is None:
            console.print("[yellow]Setup cancelled.[/yellow]")
            raise typer.Exit(code=0)
        _write_pyrpc_config(cfg)
    elif not module and old_cfg and has_override:
        _write_pyrpc_config(cfg)

    if not module and cfg:
        module = cfg.get("entrypoint", "")
        resolved_framework = cfg.get("framework", "asgi")
        _install_adapter(resolved_framework)
    if not module:
        console.print("[bold red]Error:[/bold red] No module specified and no pyrpc.json config found.")
        console.print("  Run [bold]pyrpc dev --reconfigure[/bold] to set up, or pass a module path.")
        raise typer.Exit(code=1)

    resolved_distribution = cfg.get("distribution", "workspace")
    types_output = None
    if resolved_distribution == "workspace":
        new_client_root_raw = cfg.get("client_root")
        new_client_root = _resolve_client_root(new_client_root_raw, config_dir) if new_client_root_raw else None
        new_types_output = os.path.join(new_client_root, "node_modules/@pyrpc/types/src/index.ts") if new_client_root else None

        if new_client_root and not os.path.isdir(new_client_root):
            console.print(f"[bold red]Error:[/bold red] Client project not found at:")
            console.print(f"  {new_client_root}")
            console.print()
            console.print("Create it first, then re-run [bold]pyrpc dev[/bold].")
            console.print()
            console.print("  [dim]Examples:[/dim]")
            console.print("    npm create vite@latest frontend -- --template react-ts")
            console.print("    npx create-next-app@latest frontend --typescript")
            console.print("    npx create-react-app frontend --template typescript")
            console.print()
            raise typer.Exit(code=1)

        if old_types_output and new_types_output and old_client_root != new_client_root:
            _handle_migration(old_types_output, new_types_output)

        types_output = new_types_output

    sys.path.insert(0, os.getcwd())

    _lazy_import_pyrpc_core()

    cwd = os.getcwd()
    _regenerate_lock = threading.Lock()
    _regenerate_timer = None
    _timer_lock = threading.Lock()
    DEBOUNCE_SECONDS = 0.3

    def regenerate():
        if not _regenerate_lock.acquire(blocking=False):
            return
        try:
            ok = default_router.reload_module(module)
            if not ok:
                console.print(f"  [yellow]⚠[/yellow] No procedures found — did you remove all @rpc decorators?")
                return
            schemas = get_registry_schema(default_router)
            if resolved_distribution == "server":
                console.print(f"  [green]✓[/green] Server mode — schema updated ({len(schemas)} procs)")
            else:
                _, save_typescript_client = _lazy_import_codegen()
                save_typescript_client(schemas, types_output)
                console.print(f"  [green]✓[/green] Types regenerated ({len(schemas)} procs)")
        except Exception as e:
            console.print(f"  [red]✗[/red] Types: {e}")
        finally:
            _regenerate_lock.release()

    def _schedule_regenerate():
        nonlocal _regenerate_timer
        with _timer_lock:
            if _regenerate_timer is not None:
                _regenerate_timer.cancel()
            _regenerate_timer = threading.Timer(DEBOUNCE_SECONDS, regenerate)
            _regenerate_timer.daemon = True
            _regenerate_timer.start()

    regenerate()

    server_proc = None
    tmp_path = None
    server_args = None
    server_cwd = None
    if not types_only:
        startup_code = (
            "from pyrpc_core import default_router\n"
            "from pyrpc_core.transport.asgi import PyRPCAsgiApp\n"
            f"import {module}\n"
            "app = PyRPCAsgiApp(default_router)\n"
        )
        tmp = tempfile.NamedTemporaryFile(
            mode="w", suffix=".py", delete=False, encoding="utf-8"
        )
        tmp.write(startup_code)
        tmp.close()
        tmp_path = f"{os.path.splitext(os.path.basename(tmp.name))[0]}:app"
        os.environ.setdefault("PYTHONPATH", cwd)
        server_args = [sys.executable, "-m", "uvicorn", tmp_path, "--host", host, "--port", str(port), "--reload", "--log-level", "error"]
        server_cwd = os.path.dirname(tmp.name)
        server_proc = subprocess.Popen(server_args, cwd=server_cwd)

        console.print()
        console.print(f"  [bold]pyRPC dev server[/bold]  http://{host}:{port}/rpc")
        if resolved_distribution == "server":
            console.print(f"  [dim]Distribution:[/dim] server (clients fetch via npx pyrpc sync)")
        elif types_output:
            console.print(f"  [dim]Types:[/dim] {types_output}")

    watched_dirs = _find_python_dirs(cwd)
    stop_event = threading.Event()

    def watcher_loop():
        for changes in watch(*watched_dirs, stop_event=stop_event, yield_on_timeout=True):
            if stop_event.is_set():
                break
            if any(f.endswith(".py") for _, f in changes):
                _schedule_regenerate()

    watcher_thread = threading.Thread(target=watcher_loop, daemon=True)
    watcher_thread.start()

    try:
        console_obj = _DevConsole(
            module=module,
            regenerate_cb=regenerate,
            server_proc=server_proc,
            tmp_path=tmp_path,
            server_args=server_args,
            server_cwd=server_cwd,
            types_path=types_output or "node_modules/@pyrpc/types/src/index.ts",
            is_server_mode=resolved_distribution == "server",
        )
        console_obj.run()
    except KeyboardInterrupt:
        pass
    finally:
        stop_event.set()
        if server_proc:
            server_proc.terminate()
            server_proc.wait()



def _find_python_dirs(root: str) -> list:
    dirs = {root}
    for entry in os.scandir(root):
        if entry.is_dir() and not entry.name.startswith((".", "_", "node_modules", "__pycache__", ".venv", "venv", "env")):
            dirs.add(entry.path)
    return list(dirs)


@app.command()
def inspect(
    module: str = typer.Argument(..., help="Module to inspect")
):
    """List all registered RPC procedures in a module."""
    _lazy_import_pyrpc_core()
    _import_module(module)

    schemas = get_registry_schema(default_router)

    if not schemas:
        console.print("[yellow]No procedures found in registry for this module.[/yellow]")
        return

    table = Table(title=f"pyRPC Registry: {module}")
    table.add_column("Method", style="cyan")
    table.add_column("Params", style="green")
    table.add_column("Returns", style="magenta")
    table.add_column("Doc", style="white", no_wrap=False)

    for name, schema in schemas.items():
        params = ", ".join([f"{p.name}: {p.type}" for p in schema.parameters])
        table.add_row(
            name,
            params or "None",
            schema.return_type,
            schema.doc or ""
        )

    console.print(table)


if __name__ == "__main__":
    app()
