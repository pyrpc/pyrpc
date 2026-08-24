"""pyrpc.json configuration model.

Owns locating, reading, writing, and validating the project configuration:

    {
      "backend": {"framework": "fastapi", "entrypoint": "server:app"},
      "clients": [{"framework": "Next.js", "root": "./client"}]
    }

``backend.entrypoint`` is framework-specific:
FastAPI/Flask/ASGI -> ``module[:app]``; Django -> path to ``manage.py``.
"""

import json
from dataclasses import dataclass
from pathlib import Path

from .constants import FRAMEWORKS

CONFIG_FILE = "pyrpc.json"


def find_config() -> Path | None:
    """Walk up from cwd to find pyrpc.json."""
    p = Path.cwd()
    for parent in [p] + list(p.parents):
        candidate = parent / CONFIG_FILE
        if candidate.is_file():
            return candidate
    return None


def read_config() -> dict | None:
    path = find_config()
    if not path:
        return None
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return None


def write_config(config: dict, path: Path | None = None) -> Path:
    if path is None:
        path = Path.cwd() / CONFIG_FILE
    with open(path, "w") as f:
        json.dump(config, f, indent=2)
        f.write("\n")
    return path


@dataclass(frozen=True)
class BackendSpec:
    """Validated ``backend`` section.

    ``entrypoint`` is what the native runner consumes verbatim: a uvicorn/flask
    target (``module[:app_var]``, normalized to include the app var) for
    fastapi/flask/asgi, or a filesystem path to manage.py for django.
    """

    framework: str
    entrypoint: str
    types_module: str | None = None


class BackendConfigError(ValueError):
    pass


def normalize_entrypoint(raw: str) -> str:
    """Complete a bare module name to runner target form ``module:app``."""
    raw = raw.strip()
    return raw if ":" in raw else f"{raw}:app"


def parse_backend(cfg: dict | None) -> BackendSpec | None:
    """Return a validated BackendSpec, or None when absent/invalid/legacy."""
    backend = cfg.get("backend") if isinstance(cfg, dict) else None
    if not isinstance(backend, dict):
        return None
    framework = backend.get("framework")
    entrypoint = backend.get("entrypoint")
    if framework not in FRAMEWORKS or not isinstance(entrypoint, str) or not entrypoint.strip():
        return None
    if framework == "django":
        entry = entrypoint.strip()
    else:
        entry = normalize_entrypoint(entrypoint)
    return BackendSpec(
        framework=framework,
        entrypoint=entry,
        types_module=(backend.get("types_module") or "").strip() or None,
    )


def has_valid_backend(cfg: dict | None) -> bool:
    return parse_backend(cfg) is not None


def clients_from_config(cfg: dict | None) -> list[dict]:
    """Return the valid ``clients`` entries ({framework, root} dicts)."""
    clients = cfg.get("clients") if isinstance(cfg, dict) else None
    if not isinstance(clients, list):
        return []
    return [c for c in clients if isinstance(c, dict) and isinstance(c.get("root"), str) and c["root"]]
