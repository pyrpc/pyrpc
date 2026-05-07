import anyio
from rich.console import Console

console = Console()

async def main():
    console.print("[bold green]Running pyrpc example...[/bold green]")
    # Example logic will go here
    console.print("Integration complete!")

if __name__ == "__main__":
    anyio.run(main)
