import importlib
import os
import sys
from typing import Optional

import typer
import uvicorn
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from .ts_codegen import save_typescript_client
from pyrpc import default_registry, get_registry_schema


# Avoid importing from .. (the root __init__) to prevent circularity if possible
# or just import specific things we need. 
# __version__ can be hardcoded here or read from somewhere else if needed, 
# but for CLI it's often fine to just have a local ref or import from a dedicated version file.
__version__ = "0.1.0" 


app = typer.Typer(
    name="pyrpc",
    help="pyRPC CLI - tRPC power for Python projects",
    add_completion=False,
)
console = Console()


def _import_module(module_path: str):
    """Dynamically import a module and handle errors."""
    sys.path.append(os.getcwd())
    try:
        return importlib.import_module(module_path)
    except ImportError as e:
        console.print(f"[bold red]Error:[/bold red] Could not import module '{module_path}': {e}")
        raise typer.Exit(code=1)


@app.command()
def version():
    """Show pyRPC version."""
    console.print(f"pyRPC version: [bold cyan]{__version__}[/bold cyan]")


@app.command()
def serve(
    module: str = typer.Argument(..., help="Module containing the pyRPC application (e.g. 'app.main')"),
    host: str = typer.Option("127.0.0.1", "--host", "-h", help="Bind socket to this host"),
    port: int = typer.Option(8000, "--port", "-p", help="Bind socket to this port"),
    reload: bool = typer.Option(False, "--reload", help="Enable auto-reload"),
):
    """Start the pyRPC ASGI server."""
    _import_module(module)
    
    console.print(Panel(
        f"Starting pyRPC server for [bold cyan]{module}[/bold cyan]\n"
        f"Endpoint: [bold green]http://{host}:{port}/rpc[/bold green]",
        title="pyRPC Serve",
        border_style="blue"
    ))
    
    # We use the built-in asgi_app if found in the package, or just the module path for uvicorn
    # If the user wants to serve their own app (like FastAPI), they'd use uvicorn directly.
    # Here we assume they want to serve the default pyrpc asgi app.
    uvicorn.run("pyrpc:asgi_app", host=host, port=port, reload=reload)


@app.command()
def codegen(
    module: str = typer.Option(..., "--module", "-m", help="Python module to introspect"),
    target: str = typer.Option("ts", "--target", "-t", help="Target language (only 'ts' supported)"),
    output: str = typer.Option("client.ts", "--output", "-o", help="Output file path"),
):
    """Generate a client for a pyRPC service."""
    if target != "ts":
        console.print(f"[bold red]Error:[/bold red] Target '{target}' is not supported. Use 'ts'.")
        raise typer.Exit(code=1)

    _import_module(module)
    
    console.print(f"Generating [bold cyan]{target}[/bold cyan] client for [bold yellow]{module}[/bold yellow]...")
    save_typescript_client(default_registry, output)
    console.print(f"[bold green]Successfully generated {output}[/bold green]")


@app.command()
def inspect(
    module: str = typer.Argument(..., help="Module to inspect")
):
    """List all registered RPC procedures in a module."""
    _import_module(module)
    
    schemas = get_registry_schema(default_registry)
    
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
