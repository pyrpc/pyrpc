import os
from pathlib import Path
from typing import Any, Dict

from jinja2 import Environment, FileSystemLoader

from pyrpc import get_registry_schema


def generate_typescript_client(registry: Any) -> str:
    """
    Generate a TypeScript client from a pyRPC registry.
    """
    schemas = get_registry_schema(registry)
    
    # Setup Jinja2
    template_dir = Path(__file__).parent / "templates"
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template("client.ts.j2")

    
    return template.render(schemas=schemas)


def save_typescript_client(registry: Any, output_path: str):
    """
    Generate and save the TypeScript client to a file.
    """
    content = generate_typescript_client(registry)
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)
