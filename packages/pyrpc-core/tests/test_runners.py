import sys

import pytest

from pyrpc_core.config import BackendConfigError, BackendSpec, normalize_entrypoint
from pyrpc_core.runners import resolve_launch, resolve_types_module


def _spec(framework="fastapi", entrypoint="main:app", types_module=None):
    return BackendSpec(framework=framework, entrypoint=entrypoint, types_module=types_module)


# ── entrypoint normalization ──────────────────────────────────────────────────

def test_normalize_entrypoint_appends_default_app_var():
    assert normalize_entrypoint("main") == "main:app"


def test_normalize_entrypoint_preserves_explicit_app_var():
    assert normalize_entrypoint("pkg.sub:api") == "pkg.sub:api"


def test_normalize_entrypoint_strips_whitespace():
    assert normalize_entrypoint("  server  ") == "server:app"


# ── uvicorn (fastapi / asgi) ──────────────────────────────────────────────────

def test_fastapi_launches_uvicorn_with_reload():
    plan = resolve_launch(_spec("fastapi", "server:app"), host="0.0.0.0", port=9000, reload=True, base_cwd="/x")
    argv = plan.argv
    assert argv[0] == sys.executable
    assert argv[1:4] == ["-m", "uvicorn", "server:app"]
    assert "--host" in argv and "0.0.0.0" in argv
    assert "--port" in argv and "9000" in argv
    assert "--log-level" in argv and "error" in argv
    assert argv[-1] == "--reload"


def test_asgi_uses_uvicorn_too():
    plan = resolve_launch(_spec("asgi", "app:app"), host="127.0.0.1", port=8000, reload=False, base_cwd="/x")
    assert "-m" in plan.argv and "uvicorn" in plan.argv
    assert "--reload" not in plan.argv


# ── flask ─────────────────────────────────────────────────────────────────────

def test_flask_launches_native_dev_server():
    plan = resolve_launch(_spec("flask", "app:app"), host="127.0.0.1", port=8000, reload=True, base_cwd="/x")
    argv = plan.argv
    assert argv[1:4] == ["-m", "flask", "--app"]
    assert argv[4] == "app:app"
    assert "run" in argv
    assert "--host" in argv and "--port" in argv
    assert "--reload" in argv
    assert "uvicorn" not in argv


def test_flask_no_reload_flag_when_disabled():
    plan = resolve_launch(_spec("flask"), host="h", port=1, reload=False, base_cwd="/x")
    assert "--reload" not in plan.argv


# ── django ────────────────────────────────────────────────────────────────────

def test_django_runs_manage_py_runserver(tmp_path):
    manage_py = tmp_path / "manage.py"
    manage_py.write_text("", encoding="utf-8")
    plan = resolve_launch(
        _spec("django", "manage.py"), host="127.0.0.1", port=8000, reload=True, base_cwd=str(tmp_path)
    )
    argv = plan.argv
    assert argv[0] == sys.executable
    assert argv[1] == str(manage_py)
    assert argv[2:4] == ["runserver", "127.0.0.1:8000"]
    assert plan.cwd == str(tmp_path)
    assert "uvicorn" not in argv and "flask" not in argv


def test_django_noreload_when_reload_disabled(tmp_path):
    (tmp_path / "manage.py").write_text("", encoding="utf-8")
    plan = resolve_launch(
        _spec("django", "manage.py"), host="h", port=1, reload=False, base_cwd=str(tmp_path)
    )
    assert "--noreload" in plan.argv


def test_django_missing_manage_py_raises(tmp_path):
    with pytest.raises(BackendConfigError, match="manage.py not found"):
        resolve_launch(
            _spec("django", "missing/manage.py"), host="h", port=1, reload=True, base_cwd=str(tmp_path)
        )


# ── dispatch ──────────────────────────────────────────────────────────────────

def test_unknown_framework_raises_listing_choices():
    with pytest.raises(BackendConfigError, match="fastapi, flask, django, asgi"):
        resolve_launch(_spec("express"), host="h", port=1, reload=True, base_cwd="/x")


# ── types module resolution ───────────────────────────────────────────────────

def test_types_module_defaults_to_entrypoint_module_part():
    assert resolve_types_module(_spec("fastapi", "server:app")) == "server"
    assert resolve_types_module(_spec("flask", "pkg.sub:api")) == "pkg.sub"


def test_types_module_explicit_wins():
    assert resolve_types_module(_spec("fastapi", "server:app", types_module="api.procs")) == "api.procs"


def test_django_requires_types_module():
    with pytest.raises(BackendConfigError, match="types_module"):
        resolve_types_module(_spec("django", "manage.py"))
    assert resolve_types_module(_spec("django", "manage.py", types_module="myproject.views")) == "myproject.views"
