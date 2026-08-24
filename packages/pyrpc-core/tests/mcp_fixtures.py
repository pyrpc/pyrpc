"""Shared project fixtures for the MCP test suites.

Each test gets its own temporary pyRPC project with a uniquely named router
module so ``sys.modules`` caching and the global ``default_router`` can never
leak state between tests.
"""

import json
import uuid
from pathlib import Path
from typing import Any

PROCEDURE_BODY = '''\
from pyrpc_core import model, rpc


@model
class Post:
    id: int
    title: str
    published: bool = False


@rpc.query
def get_post(id: int) -> Post:
    """Fetch one post by id."""
    return Post(id=id, title="hello")


@rpc.mutation
def create_post(title: str = "untitled") -> Post:
    return Post(id=1, title=title)


@rpc.query
def untyped(value):
    return value
'''


def unique_module() -> str:
    return f"srv_{uuid.uuid4().hex[:10]}"


def write_config(root: Path, config: dict[str, Any]) -> Path:
    path = root / "pyrpc.json"
    path.write_text(json.dumps(config, indent=2), encoding="utf-8")
    return path


def write_router(root: Path, name: str, body: str | None = None) -> str:
    """Write a router module and return its dotted module name."""
    (root / f"{name}.py").write_text(
        body if body is not None else PROCEDURE_BODY, encoding="utf-8"
    )
    return name


def make_project(
    root: Path,
    *,
    config: dict[str, Any] | None = None,
    module_body: str | None = None,
    module_name: str | None = None,
    with_web_dir: bool = True,
) -> tuple[Path, str]:
    """Write a minimal pyRPC project into *root*; return (root, module_name).

    ``config`` defaults to a fastapi backend pointing at the generated module
    plus one Next.js client at ./web.
    """
    name = module_name or unique_module()
    if config is None:
        config = {
            "backend": {"framework": "fastapi", "entrypoint": f"{name}:app"},
            "clients": [{"framework": "Next.js", "root": "./web"}],
        }
    root.mkdir(parents=True, exist_ok=True)
    write_config(root, config)
    write_router(root, name, module_body)
    if with_web_dir:
        (root / "web").mkdir(exist_ok=True)
        (root / "web" / "package.json").write_text("{}", encoding="utf-8")
    return root, name
