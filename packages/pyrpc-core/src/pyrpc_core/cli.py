import importlib
import json
import os
import subprocess
import sys
import tempfile
import threading
import tomllib
from datetime import datetime
from pathlib import Path

import typer
from pyrpc_core.constants import FRAMEWORKS
from pyrpc_codegen import DEFAULT_OUTPUT, save_typescript_client
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table
from watchfiles import watch

__version__ = "0.1.0"

PYRPC_CONFIG = dict | None


def _find_pyproject_toml() -> Path | None:
    path = Path.cwd()
    for parent in [path] + list(path.parents):
        candidate = parent / "pyproject.toml"
        if candidate.is_file():
            return candidate
    return None


def _read_pyrpc_config() -> PYRPC_CONFIG:
    path = _find_pyproject_toml()
    if not path:
        return None
    try:
        with open(path, "rb") as f:
            data = tomllib.load(f)
        return data.get("tool", {}).get("pyrpc")
    except Exception:
        return None


def _write_pyrpc_config(config: dict) -> bool:
    path = _find_pyproject_toml()
    if not path:
        return False
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    config_lines = ["[tool.pyrpc]\n"]
    for key, value in config.items():
        if isinstance(value, str):
            config_lines.append(f'{key} = "{value}"\n')
        elif isinstance(value, bool):
            config_lines.append(f"{key} = {'true' if value else 'false'}\n")
        elif isinstance(value, int):
            config_lines.append(f"{key} = {value}\n")

    start_idx = None
    end_idx = None
    for i, line in enumerate(lines):
        if line.strip().startswith("[tool.pyrpc]"):
            start_idx = i
        elif start_idx is not None and line.strip().startswith("["):
            end_idx = i
            break

    if start_idx is not None:
        if end_idx is None:
            end_idx = len(lines)
        lines[start_idx:end_idx] = config_lines
    else:
        if lines and not lines[-1].endswith("\n"):
            lines[-1] += "\n"
        lines.append("\n")
        lines.extend(config_lines)

    with open(path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    return True


def _prompt_for_config() -> dict:
    console.print("[bold]pyRPC Setup[/bold]")
    console.print("Let's configure pyRPC for your project.\n")
    framework = Prompt.ask(
        "Which web framework are you using?",
        choices=FRAMEWORKS,
        default="fastapi",
    )
    entry = Prompt.ask(
        "Entry point (e.g. app.main:app)",
        default="app.main:app",
    )
    return {"framework": framework, "entry": entry}


def _ensure_config(reconfigure: bool = False) -> dict | None:
    config = _read_pyrpc_config()
    if config and not reconfigure:
        return config
    if reconfigure:
        console.print("[yellow]Reconfiguring pyRPC...[/yellow]")
    config = _prompt_for_config()
    _write_pyrpc_config(config)
    return config


def _install_adapter(framework: str):
    if framework == "asgi":
        return
    adapter_pkg = f"pyrpc-{framework}"
    try:
        importlib.import_module(adapter_pkg.replace("-", "_"))
        return
    except ImportError:
        pass
    console.print(f"Installing [bold]{adapter_pkg}[/bold]...")
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", adapter_pkg],
        capture_output=True, text=True,
    )
    if result.returncode == 0:
        console.print(f"[bold green]OK Installed {adapter_pkg}[/bold green]")
    else:
        console.print(f"[yellow]Could not auto-install {adapter_pkg}[/yellow]")
        console.print(f"  Install manually: [bold]pip install {adapter_pkg}[/bold]")



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


def _import_module(module_path: str):
    sys.path.append(os.getcwd())
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
    module: str = typer.Argument(..., help="Python module path (e.g. 'app.main')"),
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
    module: str = typer.Argument(..., help="Module containing the pyRPC application (e.g. 'app.main')"),
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

    console.print(Panel(
        f"Starting pyRPC server for [bold cyan]{module}[/bold cyan]\n"
        f"Endpoint: [bold green]http://{host}:{port}/rpc[/bold green]",
        title="pyRPC Serve",
        border_style="blue"
    ))

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

    output = DEFAULT_OUTPUT
    console.print(f"Generating TypeScript contracts [dim]({len(schemas)} procedures)[/dim]...")
    save_typescript_client(schemas, output)
    console.print(f"[bold green]OK Types written to {output}[/bold green]")

    if os.path.exists(output):
        console.print("  Import: [bold]import type { Types } from \"@pyrpc/types\"[/bold]")



class _DevConsole:
    """Interactive developer console attached to the pyrpc dev server."""

    def __init__(self, module: str, regenerate_cb, server_proc=None, tmp_path: str = None, server_args: list = None, server_cwd: str = None, types_path: str = DEFAULT_OUTPUT):
        self.module = module
        self.regenerate = regenerate_cb
        self.server_proc = server_proc
        self.tmp_path = tmp_path
        self.server_args = server_args
        self.server_cwd = server_cwd
        self.types_path = types_path
        self._running = True

    def _schemas(self) -> dict:
        try:
            return get_registry_schema(default_router)
        except Exception:
            return {}

    def run(self):
        console.print()
        console.print("[bold cyan]pyrpc>[/bold cyan] type [bold]help[/bold] for commands")
        while self._running:
            try:
                line = input("[cyan]pyrpc>[/cyan] ").strip()
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
        console.print("[bold blue]Regenerating TypeScript types...[/bold blue]")
        self.regenerate()

    def _cmd_types(self, _arg=""):
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
    module: str = typer.Argument(None, help="Module containing the pyRPC application (e.g. 'app.main')"),
    host: str = typer.Option("127.0.0.1", "--host", "-h", help="Bind socket to this host"),
    port: int = typer.Option(8000, "--port", "-p", help="Bind socket to this port"),
    types_only: bool = typer.Option(False, "--types-only", help="Only regenerate types, skip starting the server"),
    reconfigure: bool = typer.Option(False, "--reconfigure", help="Re-run first-time setup prompts"),
):
    """Start the pyRPC dev server with auto-type regeneration and interactive console."""
    if not module or reconfigure:
        config = _ensure_config(reconfigure=reconfigure)
        if config:
            module, _ = _parse_entry(config.get("entry", ""))
            framework = config.get("framework", "asgi")
            _install_adapter(framework)
    if not module:
        console.print("[bold red]Error:[/bold red] No module specified and no [tool.pyrpc] config found.")
        console.print("  Run [bold]pyrpc dev --reconfigure[/bold] to set up, or pass a module path.")
        raise typer.Exit(code=1)

    _lazy_import_pyrpc_core()

    cwd = os.getcwd()
    _regenerate_lock = threading.Lock()

    def regenerate():
        if not _regenerate_lock.acquire(blocking=False):
            return
        try:
            ok = default_router.reload_module(module)
            if not ok:
                console.print("[yellow]No procedures found after reload — did you remove all @rpc decorators?[/yellow]")
                return
            schemas = get_registry_schema(default_router)
            save_typescript_client(schemas, DEFAULT_OUTPUT)
            console.print(f"[dim]{datetime.now().strftime('%H:%M:%S')}[/dim] Types regenerated [dim]({len(schemas)} procs)[/dim]")
        except Exception as e:
            console.print(f"[red]Error regenerating types: {e}[/red]")
        finally:
            _regenerate_lock.release()

    console.print("[bold blue]Generating initial TypeScript types...[/bold blue]")
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
        server_args = [sys.executable, "-m", "uvicorn", tmp_path, "--host", host, "--port", str(port), "--reload"]
        server_cwd = os.path.dirname(tmp.name)
        server_proc = subprocess.Popen(server_args, cwd=server_cwd)

        console.print(Panel(
            f"Dev server for [bold cyan]{module}[/bold cyan]\n"
            f"Endpoint: [bold green]http://{host}:{port}/rpc[/bold green]\n"
            f"Types: [bold]{DEFAULT_OUTPUT}[/bold]",
            title="pyRPC Dev",
            border_style="green"
        ))

    watched_dirs = _find_python_dirs(cwd)
    stop_event = threading.Event()

    def watcher_loop():
        for changes in watch(*watched_dirs, stop_event=stop_event, yield_on_timeout=True):
            if stop_event.is_set():
                break
            if any(f.endswith(".py") for _, f in changes):
                regenerate()

    watcher_thread = threading.Thread(target=watcher_loop, daemon=True)
    watcher_thread.start()

    console.print(f"Watching [bold]{len(watched_dirs)}[/bold] directories for Python changes...")

    try:
        console_obj = _DevConsole(
            module=module,
            regenerate_cb=regenerate,
            server_proc=server_proc,
            tmp_path=tmp_path,
            server_args=server_args,
            server_cwd=server_cwd,
            types_path=DEFAULT_OUTPUT,
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
