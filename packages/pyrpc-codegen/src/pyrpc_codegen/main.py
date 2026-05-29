import importlib
import json
import os
import sys

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from .ts_codegen import save_typescript_client, DEFAULT_OUTPUT


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
        raise typer.Exit(code=1)


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
    console.print(f"Reading schema from [bold yellow]{path}[/bold yellow]...")
    with open(path, "r") as f:
        return json.load(f)


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
                {"name": p.name, "type": p.type, "required": p.required, "default": p.default}
                for p in schema.parameters
            ],
            "return_type": schema.return_type,
        }

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

    console.print(Panel(
        f"Starting pyRPC server for [bold cyan]{module}[/bold cyan]\n"
        f"Endpoint: [bold green]http://{host}:{port}/rpc[/bold green]",
        title="pyRPC Serve",
        border_style="blue"
    ))

    uvicorn.run("pyrpc:asgi_app", host=host, port=port, reload=reload)


@app.command()
def codegen(
    source: str = typer.Argument(..., help="Schema JSON file path or URL of a running pyRPC server (e.g. pyrpc-schema.json or http://localhost:8000)"),
    output: str = typer.Option(DEFAULT_OUTPUT, "--output", "-o", help="Output file path for generated types"),
):
    """Generate TypeScript type definitions from a schema file or a running server."""
    try:
        schemas = _load_schema(source)
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] Could not load schema from '{source}': {e}")
        raise typer.Exit(code=1)

    console.print(f"Generating TypeScript contracts [dim]({len(schemas)} procedures)[/dim]...")
    save_typescript_client(schemas, output)
    console.print(f"[bold green]OK Types written to {output}[/bold green]")

    if os.path.exists(output):
        console.print(f"  Import: [bold]import type {{ Types }} from \"@pyrpc/types\"[/bold]")


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
