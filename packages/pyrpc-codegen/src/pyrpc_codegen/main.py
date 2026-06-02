import importlib
import json
import os
import subprocess
import sys
import tempfile
import threading
from datetime import datetime

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from watchfiles import watch

from .ts_codegen import DEFAULT_OUTPUT, save_typescript_client

__version__ = "0.2.0"


app = typer.Typer(
    name="pyrpc",
    help="pyRPC CLI - type-safe Python-to-TypeScript RPC",
    add_completion=False,
)
console = Console()


def _lazy_import_pyrpc_core():
    """Import pyrpc-core lazily so codegen-only usage avoids the dep."""
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
    module: str = typer.Argument(..., help="Module containing the pyRPC application (e.g. 'app.main')"),
    host: str = typer.Option("127.0.0.1", "--host", "-h", help="Bind socket to this host"),
    port: int = typer.Option(8000, "--port", "-p", help="Bind socket to this port"),
    types_only: bool = typer.Option(False, "--types-only", help="Only regenerate types, skip starting the server"),
):
    """Start the pyRPC dev server with auto-type regeneration and interactive console."""
    _lazy_import_pyrpc_core()

    cwd = os.getcwd()

    def regenerate():
        try:
            mod = importlib.import_module(module)
            importlib.reload(mod)
            default_router._procedures.clear()
            importlib.reload(mod)
            schemas = get_registry_schema(default_router)
            if schemas:
                save_typescript_client(schemas, DEFAULT_OUTPUT)
                console.print(f"[dim]{datetime.now().strftime('%H:%M:%S')}[/dim] Types regenerated [dim]({len(schemas)} procs)[/dim]")
        except Exception as e:
            console.print(f"[red]Error regenerating types: {e}[/red]")

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
def shell(
    url: str = typer.Argument("http://localhost:8000", help="URL of a running pyRPC server (e.g. http://localhost:8000)"),
):
    """Start an interactive RPC shell against a running pyRPC server."""
    import ast

    import httpx

    clean_url = url.rstrip("/")
    rpc_url = clean_url + "/rpc" if not clean_url.endswith("/rpc") else clean_url

    try:
        schema = _fetch_schema(url)
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] Could not connect to server at '{url}': {e}")
        raise typer.Exit(code=1) from e

    procs = {name: schema for name, schema in schema.items()}
    proc_names = sorted(procs.keys())

    console.print(Panel(
        f"Connected to [bold green]{rpc_url}[/bold green]\n"
        f"Available procedures: [bold]{len(proc_names)}[/bold]\n"
        f"Type [bold]help()[/bold] for usage or [bold]Ctrl+C[/bold] to exit",
        title="pyRPC Shell",
        border_style="cyan"
    ))

    def call_rpc(method: str, params: dict | list = None) -> dict:
        body = {"id": 1, "method": method, "params": params or {}}
        resp = httpx.post(rpc_url, json=body, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        if data.get("error"):
            console.print(f"[red]Error: {data['error']}[/red]")
            return None
        return data.get("result")

    while True:
        try:
            line = input(f"[{len(proc_names)} procs] >>> ").strip()
        except (EOFError, KeyboardInterrupt):
            console.print()
            break

        if not line:
            continue

        if line in ("exit", "quit"):
            break

        if line == "help()":
            console.print("[bold]pyRPC Shell Commands:[/bold]")
            console.print("  [cyan]method_name(arg1, arg2)[/cyan]  Call an RPC procedure with positional args")
            console.print("  [cyan]method_name(key=val)[/cyan]     Call an RPC procedure with keyword args")
            console.print("  [cyan]inspect()[/cyan]                List all available procedures")
            console.print("  [cyan]help()[/cyan]                   Show this help message")
            console.print("  [cyan]exit[/cyan] or [cyan]quit[/cyan]           Exit the shell")
            continue

        if line == "inspect()":
            table = Table(title="Available Procedures")
            table.add_column("Name", style="cyan")
            table.add_column("Params", style="green")
            table.add_column("Returns", style="magenta")
            table.add_column("Doc", style="white")
            for name, schema in sorted(procs.items()):
                params = ", ".join(
                    f"{p.get('name', '?')}: {p.get('type', 'any')}"
                    for p in schema.get("parameters", [])
                )
                table.add_row(
                    name,
                    params or "None",
                    schema.get("return_type", "any"),
                    schema.get("doc", "") or ""
                )
            console.print(table)
            continue

        try:
            tree = ast.parse(line, mode="eval")
            if not isinstance(tree.body, ast.Call):
                console.print("[red]Syntax: method_name(args) or method_name(key=val)[/red]")
                continue

            call = tree.body
            method_name = call.func.id if isinstance(call.func, ast.Name) else None
            if not method_name:
                console.print("[red]Invalid call syntax[/red]")
                continue

            if call.args and call.keywords:
                console.print("[red]Mix of positional and keyword args not supported[/red]")
                continue

            if call.args:
                params = [ast.literal_eval(a) for a in call.args]
            elif call.keywords:
                params = {kw.arg: ast.literal_eval(kw.value) for kw in call.keywords if kw.arg}
            else:
                params = {} if any(p.get("parameters") for p in procs.values()) else []

            result = call_rpc(method_name, params)
            if result is not None:
                console.print(result)
        except SyntaxError:
            console.print("[red]Invalid syntax. Use method_name(args) or method_name(key=val)[/red]")
        except Exception as e:
            console.print(f"[red]Error: {e}[/red]")


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
