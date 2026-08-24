"""Backend launch resolution: framework + entrypoint -> concrete process command.

The only place in pyRPC that knows how each supported backend starts.
``cli.py`` stays framework-agnostic: it asks for a LaunchPlan and runs it.

    fastapi/asgi -> uvicorn {module:app}
    flask        -> python -m flask --app {module:app} run   (native dev server)
    django       -> python manage.py runserver H:P           (native dev server)
"""

import os
import sys
from dataclasses import dataclass

from .config import BackendConfigError, BackendSpec
from .constants import FRAMEWORKS


@dataclass(frozen=True)
class LaunchPlan:
    argv: list[str]
    env_extra: dict[str, str] | None = None
    cwd: str | None = None  # None -> inherit the CLI's cwd


def _uvicorn(spec: BackendSpec, *, host: str, port: int, reload: bool) -> LaunchPlan:
    cmd = [
        sys.executable, "-m", "uvicorn", spec.entrypoint,
        "--host", host, "--port", str(port), "--log-level", "error",
    ]
    if reload:
        cmd.append("--reload")
    return LaunchPlan(argv=cmd)


def _flask(spec: BackendSpec, *, host: str, port: int, reload: bool) -> LaunchPlan:
    cmd = [
        sys.executable, "-m", "flask", "--app", spec.entrypoint,
        "run", "--host", host, "--port", str(port),
    ]
    if reload:
        cmd.append("--reload")
    return LaunchPlan(argv=cmd)


def _django(spec: BackendSpec, *, host: str, port: int, reload: bool, base_cwd: str) -> LaunchPlan:
    manage_py = (
        spec.entrypoint
        if os.path.isabs(spec.entrypoint)
        else os.path.join(base_cwd, spec.entrypoint)
    )
    if not os.path.isfile(manage_py):
        raise BackendConfigError(
            f"manage.py not found at '{manage_py}' — backend.entrypoint must point to your Django manage.py"
        )
    cmd = [sys.executable, manage_py, "runserver", f"{host}:{port}"]
    if not reload:
        cmd.append("--noreload")
    return LaunchPlan(argv=cmd, cwd=os.path.dirname(os.path.abspath(manage_py)))


def resolve_launch(
    spec: BackendSpec, *, host: str, port: int, reload: bool, base_cwd: str
) -> LaunchPlan:
    if spec.framework == "django":
        return _django(spec, host=host, port=port, reload=reload, base_cwd=base_cwd)
    runner = {"fastapi": _uvicorn, "asgi": _uvicorn, "flask": _flask}.get(spec.framework)
    if runner is None:
        raise BackendConfigError(
            f"Unsupported backend framework '{spec.framework}'. Choose from: {', '.join(FRAMEWORKS)}"
        )
    return runner(spec, host=host, port=port, reload=reload)


def resolve_types_module(spec: BackendSpec) -> str:
    """Module whose import/reload registers all @rpc procedures (codegen root)."""
    if spec.types_module:
        return spec.types_module
    if spec.framework == "django":
        raise BackendConfigError(
            "django backends must set backend.types_module — the module whose "
            "import registers your @rpc procedures (e.g. myproject.views); "
            "manage.py and settings register nothing"
        )
    return spec.entrypoint.split(":", 1)[0]
