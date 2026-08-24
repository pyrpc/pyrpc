import json
import os
import re
import sys
import tempfile
import threading
import time
import unittest.mock as mock
from pathlib import Path

import pyrpc_core.cli as cli_mod
import pytest
import typer
from pyrpc_core import default_router, rpc
from pyrpc_core.cli import _parse_entry, app
from typer.testing import CliRunner

runner = CliRunner()


@pytest.fixture(autouse=True)
def clear_registry():
    default_router._procedures.clear()


# ── version ───────────────────────────────────────────────────────────────────

def test_cli_version():
    result = runner.invoke(app, ["version"])
    assert result.exit_code == 0
    assert "pyRPC version" in result.output


# ── inspect ───────────────────────────────────────────────────────────────────

def test_cli_inspect_empty():
    result = runner.invoke(app, ["inspect", "pyrpc_core.core.models"])
    assert result.exit_code == 0
    assert "No procedures found" in result.output


def test_cli_inspect_with_procs():
    @rpc
    def test_proc(x: int):
        return x

    with mock.patch("pyrpc_core.cli._import_module"):
        result = runner.invoke(app, ["inspect", "anything"])
    assert result.exit_code == 0
    assert "test_proc" in result.output
    assert "x: <class 'int'>" in result.output


# ── codegen ───────────────────────────────────────────────────────────────────

def test_cli_codegen_url():
    schemas = {"add": {"name": "add", "parameters": [], "return_type": "int", "return_schema": {}, "doc": ""}}
    with mock.patch("pyrpc_core.cli._resolve_source", return_value=schemas):
        with mock.patch("pyrpc_codegen.save_typescript_client") as mock_save:
            result = runner.invoke(app, ["codegen", "http://localhost:8000"])
    assert result.exit_code == 0
    assert "types generated" in result.output
    mock_save.assert_called_once_with(schemas, mock.ANY)


def test_cli_codegen_file():
    schemas = {
        "greet": {
            "name": "greet",
            "doc": "Say hello",
            "parameters": [{"name": "name", "type": "<class 'str'>", "required": True, "default": None}],
            "return_type": "<class 'str'>",
        }
    }
    with mock.patch("pyrpc_codegen.save_typescript_client") as mock_save:
        with tempfile.TemporaryDirectory() as tmpdir:
            schema_file = os.path.join(tmpdir, "schema.json")
            with open(schema_file, "w") as f:
                json.dump(schemas, f)
            result = runner.invoke(app, ["codegen", schema_file])
    assert result.exit_code == 0
    assert "types generated" in result.output
    mock_save.assert_called_once()


def test_cli_codegen_module():
    schemas = {"add": {"name": "add", "parameters": [], "return_type": "int", "return_schema": {}, "doc": ""}}
    with mock.patch("pyrpc_core.cli._resolve_source", return_value=schemas):
        with mock.patch("pyrpc_codegen.save_typescript_client") as mock_save:
            result = runner.invoke(app, ["codegen", "app.main"])
    assert result.exit_code == 0
    assert "types generated" in result.output
    mock_save.assert_called_once_with(schemas, mock.ANY)


def test_cli_codegen_custom_client(tmp_path):
    schemas = {"ping": {"name": "ping", "parameters": [], "return_type": "str", "return_schema": {}, "doc": ""}}
    out = str(tmp_path / "custom")
    with mock.patch("pyrpc_core.cli._resolve_source", return_value=schemas):
        with mock.patch("pyrpc_codegen.save_typescript_client") as mock_save:
            result = runner.invoke(app, ["codegen", "main", "--client", out])
    assert result.exit_code == 0
    expected_path = os.path.abspath(os.path.join(out, "__pyrpc.ts"))
    mock_save.assert_called_once_with(schemas, expected_path)


def test_codegen_writes_actual_file(tmp_path):
    schemas = {
        "multiply": {
            "name": "multiply",
            "doc": "",
            "parameters": [{"name": "a", "type": "<class 'int'>", "required": True, "default": None}],
            "return_type": "<class 'int'>",
        }
    }
    from pyrpc_codegen import save_typescript_client
    out = str(tmp_path / "output.d.ts")
    save_typescript_client(schemas, out)
    assert os.path.isfile(out)
    assert "multiply" in Path(out).read_text()


def test_codegen_cli_writes_to_default_client_path(tmp_path):
    """Default client root is . (relative to cwd)."""
    schemas = {"divide": {"name": "divide", "doc": "", "parameters": [], "return_type": "<class 'float'>"}}
    schema_file = tmp_path / "schema.json"
    schema_file.write_text(json.dumps(schemas))
    cwd = os.getcwd()
    os.chdir(str(tmp_path))
    try:
        result = runner.invoke(app, ["codegen", str(schema_file)])
        assert result.exit_code == 0
        generated = tmp_path / "__pyrpc.ts"
        assert generated.exists(), f"Expected {generated} to exist"
        assert "divide" in generated.read_text()
    finally:
        os.chdir(cwd)


# ── pull ──────────────────────────────────────────────────────────────────────

def test_cli_pull():
    @rpc
    def add(a: int, b: int) -> int:
        """Add two numbers."""
        return a + b

    mock_schema = {
        "add": {
            "name": "add",
            "doc": "Add two numbers.",
            "parameters": [
                {"name": "a", "type": "<class 'int'>", "required": True, "default": None},
                {"name": "b", "type": "<class 'int'>", "required": True, "default": None}
            ],
            "return_type": "<class 'int'>"
        }
    }
    
    with tempfile.TemporaryDirectory() as tmpdir:
        output_file = os.path.join(tmpdir, "schema.json")
        with mock.patch("pyrpc_core.cli._extract_schema_from_module", return_value=mock_schema):
            result = runner.invoke(app, ["pull", "any_module", "-o", output_file])
    
    assert result.exit_code == 0
    assert "schema" in result.output
    # The CLI reports success and says "1 procs", which confirms our mock worked


# ── serve ─────────────────────────────────────────────────────────────────────

def test_cli_serve():
    with mock.patch("pyrpc_core.cli._import_module"):
        with mock.patch("pyrpc_core.transport.asgi.PyRPCAsgiApp") as mock_app_cls:
            mock_app = mock.MagicMock()
            mock_app_cls.return_value = mock_app
            with mock.patch("uvicorn.run") as mock_run:
                result = runner.invoke(app, ["serve", "my_module", "--port", "9000"])
    assert result.exit_code == 0
    # Output format: "  pyRPC  http://127.0.0.1:9000/rpc"
    assert "pyRPC" in result.output
    assert "9000" in result.output
    mock_run.assert_called_once()


# ── dev ───────────────────────────────────────────────────────────────────────

def _nested_cfg(entrypoint="my_module:app", framework="fastapi", clients=None):
    cfg = {"backend": {"framework": framework, "entrypoint": entrypoint}}
    if clients is not None:
        cfg["clients"] = clients
    return cfg


def test_cli_dev_yes_zero_clients():
    """dev --yes with 0 clients configures no client."""
    with mock.patch("pyrpc_core.cli._find_config", return_value=None):
        with mock.patch("pyrpc_core.cli._find_frontend_projects", return_value=[]):
            with mock.patch("pyrpc_core.cli._write_config") as mock_write:
                with mock.patch("pyrpc_core.cli._import_module"):
                    with mock.patch("pyrpc_core.cli._server_is_running", return_value=False):
                        with mock.patch("pyrpc_core.cli._ServerProcess"):
                            with mock.patch("pyrpc_core.cli.watch", return_value=iter([])):
                                with mock.patch("pyrpc_core.cli._DevConsole") as mock_console:
                                    mock_console.return_value.run = mock.MagicMock()
                                    result = runner.invoke(app, ["dev", "--yes", "--framework", "fastapi"])
    assert result.exit_code == 0
    assert "no client configured" in result.output
    # Nested config: backend only, no clients key
    cfg = mock_write.call_args[0][0]
    assert cfg["backend"]["framework"] == "fastapi"
    assert cfg["backend"]["entrypoint"] == "main:app"
    assert "clients" not in cfg

def test_cli_dev_yes_one_client():
    """dev --yes with 1 client automatically uses it."""
    with mock.patch("pyrpc_core.cli._find_config", return_value=None):
        with mock.patch("pyrpc_core.cli._find_frontend_projects", return_value=[("./apps/web", "Next.js")]):
            with mock.patch("pyrpc_core.cli._write_config") as mock_write:
                with mock.patch("pyrpc_core.cli._import_module"):
                    with mock.patch("pyrpc_core.cli._regenerate_clients", return_value=1):
                        with mock.patch("pyrpc_core.cli._server_is_running", return_value=False):
                            with mock.patch("pyrpc_core.cli._ServerProcess"):
                                with mock.patch("pyrpc_core.cli.watch", return_value=iter([])):
                                    with mock.patch("pyrpc_core.cli._DevConsole") as mock_console:
                                        mock_console.return_value.run = mock.MagicMock()
                                        result = runner.invoke(app, ["dev", "--yes", "--framework", "flask"])
    assert result.exit_code == 0
    assert "./apps/web" in result.output
    cfg = mock_write.call_args[0][0]
    assert cfg["backend"]["framework"] == "flask"
    assert cfg["clients"] == [{"framework": "Next.js", "root": "./apps/web"}]

def test_cli_dev_yes_multiple_clients():
    """dev --yes with >1 client fails and demands explicit selection."""
    detected = [("./apps/web", "Next.js"), ("./apps/admin", "React")]
    with mock.patch("pyrpc_core.cli._find_config", return_value=None):
        with mock.patch("pyrpc_core.cli._find_frontend_projects", return_value=detected):
            result = runner.invoke(app, ["dev", "--yes", "--framework", "fastapi"])
    assert result.exit_code == 1
    assert "Multiple TypeScript projects found" in result.output
    assert "./apps/web" in result.output
    assert "./apps/admin" in result.output
    assert "--client <path>" in result.output


def test_cli_dev_yes_unsniffable_exits_with_hint():
    """--yes without a detectable or declared framework must error, never guess."""
    with mock.patch("pyrpc_core.cli._find_config", return_value=None):
        with mock.patch("pyrpc_core.cli._sniff_backend", return_value=None):
            result = runner.invoke(app, ["dev", "--yes"])
    assert result.exit_code == 1
    assert "Could not detect a backend framework" in result.output
    assert "--framework" in result.output


def test_cli_dev_rejects_unknown_framework_flag():
    result = runner.invoke(app, ["dev", "--yes", "--framework", "express"])
    assert result.exit_code == 1
    assert "Unsupported --framework 'express'" in result.output
    assert "fastapi, flask, django, asgi" in result.output


def test_cli_dev_attaches_when_server_running(tmp_path):
    """When server is already running, pyrpc dev skips starting a backend."""
    config = _nested_cfg(clients=[{"framework": "Next.js", "root": "../client"}])
    cfg_file = tmp_path / "pyrpc.json"
    cfg_file.write_text(json.dumps(config))

    with mock.patch("pyrpc_core.cli._find_config", return_value=cfg_file):
        with mock.patch("pyrpc_core.cli._import_module"):
            # Mock the whole regen path: the real one writes tsconfig/bundler
            # config into the client dir, which must never leak into the repo.
            with mock.patch("pyrpc_core.cli._regenerate_clients", return_value=3):
                with mock.patch("pyrpc_core.cli._server_is_running", return_value=True):
                    with mock.patch("pyrpc_core.cli.watch", return_value=iter([])):
                        with mock.patch("pyrpc_core.cli._DevConsole") as mock_console:
                            mock_console.return_value.run = mock.MagicMock()
                            result = runner.invoke(app, ["dev"])
    assert result.exit_code == 0
    assert "already running" in result.output


def test_cli_dev_starts_server_when_not_running(tmp_path):
    """When server is not running, pyrpc dev launches uvicorn for ASGI backends."""
    config = _nested_cfg(clients=[{"framework": "Next.js", "root": "../client"}])
    cfg_file = tmp_path / "pyrpc.json"
    cfg_file.write_text(json.dumps(config))

    with mock.patch("pyrpc_core.cli._find_config", return_value=cfg_file):
        with mock.patch("pyrpc_core.cli._import_module"):
            with mock.patch("pyrpc_core.cli._regenerate_clients", return_value=2):
                with mock.patch("pyrpc_core.cli._server_is_running", return_value=False):
                    with mock.patch("pyrpc_core.cli._ServerProcess") as mock_sub:
                        mock_proc = mock.MagicMock()
                        mock_sub.return_value = mock_proc
                        with mock.patch("pyrpc_core.cli.watch", return_value=iter([])):
                            with mock.patch("pyrpc_core.cli._DevConsole") as mock_console:
                                mock_console.return_value.run = mock.MagicMock()
                                result = runner.invoke(app, ["dev"])
    assert result.exit_code == 0
    mock_sub.assert_called_once()
    argv = mock_sub.call_args[0][0]
    assert argv[1:4] == ["-m", "uvicorn", "my_module:app"]


def test_cli_dev_starts_flask_native_server(tmp_path):
    """A flask backend must launch `python -m flask ... run`, never uvicorn."""
    config = _nested_cfg(entrypoint="app:app", framework="flask")
    cfg_file = tmp_path / "pyrpc.json"
    cfg_file.write_text(json.dumps(config))

    with mock.patch("pyrpc_core.cli._find_config", return_value=cfg_file):
        with mock.patch("pyrpc_core.cli._import_module"):
            with mock.patch("pyrpc_core.cli._regenerate_clients", return_value=1):
                with mock.patch("pyrpc_core.cli._server_is_running", return_value=False):
                    with mock.patch("pyrpc_core.cli._ServerProcess") as mock_sub:
                        mock_sub.return_value = mock.MagicMock()
                        with mock.patch("pyrpc_core.cli.watch", return_value=iter([])):
                            with mock.patch("pyrpc_core.cli._DevConsole") as mock_console:
                                mock_console.return_value.run = mock.MagicMock()
                                result = runner.invoke(app, ["dev"])
    assert result.exit_code == 0
    argv = mock_sub.call_args[0][0]
    assert "-m" in argv and "flask" in argv
    assert "uvicorn" not in argv
    assert "--app" in argv and "app:app" in argv
    assert "run" in argv


def test_dev_flags_in_help():
    result = runner.invoke(app, ["dev", "--help"])
    assert result.exit_code == 0
    output = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', result.output)
    assert "--host" in output
    assert "--port" in output
    assert "--framework" in output


# ── watch ─────────────────────────────────────────────────────────────────────

def test_cli_watch_runs_initial_codegen():
    with mock.patch("pyrpc_core.cli._import_module"):
        with mock.patch("pyrpc_core.cli._regenerate_clients", return_value=3) as mock_cg:
            with mock.patch("pyrpc_core.cli.watch", return_value=iter([])):
                result = runner.invoke(app, ["watch", "my_module", "--client", "my_client"])
    assert result.exit_code == 0
    mock_cg.assert_called_once()
    assert "types generated" in result.output


def test_cli_watch_help():
    result = runner.invoke(app, ["watch", "--help"])
    assert result.exit_code == 0
    output = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', result.output)
    assert "--client" in output


def test_watch_command_does_not_shadow_watchfiles():
    """Regression for #134: the `watch` CLI command must not shadow the
    watchfiles.watch import used by the internal watcher loops."""
    import watchfiles
    assert cli_mod.watch is watchfiles.watch
    # The typer command lives under a distinct function name and is
    # registered explicitly so the CLI surface stays `pyrpc watch`.
    assert cli_mod.watch_command is not watchfiles.watch


def test_cli_watch_exits_nonzero_when_watcher_crashes():
    """A crashed watcher must exit nonzero — never a silent, healthy-looking failure."""
    with mock.patch("pyrpc_core.cli._import_module"):
        with mock.patch("pyrpc_core.cli._regenerate_clients", return_value=1):
            with mock.patch("pyrpc_core.cli.watch", side_effect=TypeError("boom")):
                result = runner.invoke(app, ["watch", "my_module", "--client", "my_client"])
    assert result.exit_code == 1
    assert "watcher failed" in result.output
    assert "TypeError: boom" in result.output


def test_cli_dev_exits_nonzero_when_watcher_crashes(tmp_path):
    """dev must not keep running (and must terminate the server) when a watcher crashes."""
    config = _nested_cfg(clients=[{"framework": "Next.js", "root": "../client"}])
    cfg_file = tmp_path / "pyrpc.json"
    cfg_file.write_text(json.dumps(config))

    with mock.patch("pyrpc_core.cli._find_config", return_value=cfg_file):
        with mock.patch("pyrpc_core.cli._import_module"):
            with mock.patch("pyrpc_core.cli._regenerate_clients", return_value=2):
                with mock.patch("pyrpc_core.cli._server_is_running", return_value=False):
                    with mock.patch("pyrpc_core.cli._ServerProcess") as mock_sub:
                        mock_proc = mock.MagicMock()
                        mock_sub.return_value = mock_proc
                        with mock.patch("pyrpc_core.cli.watch", side_effect=TypeError("boom")):
                            with mock.patch("pyrpc_core.cli._DevConsole") as mock_console:
                                mock_console.return_value.run = mock.MagicMock()
                                result = runner.invoke(app, ["dev"])
    assert result.exit_code == 1
    assert "Python file watcher failed" in result.output
    assert "TypeError: boom" in result.output
    # The interactive console must never be entered after a watcher crash.
    mock_console.return_value.run.assert_not_called()
    # The uvicorn process we started must be cleaned up.
    mock_proc.terminate.assert_called()


def test_dev_watch_calls_never_use_stop_event(tmp_path):
    """Regression guard for #128: watch() must never receive stop_event, which is
    not supported by every watchfiles release."""
    def strict_watch(*args, **kwargs):
        assert "stop_event" not in kwargs, "watch() got stop_event — not portable"
        return iter([])

    config = _nested_cfg(clients=[{"framework": "Next.js", "root": "../client"}])
    cfg_file = tmp_path / "pyrpc.json"
    cfg_file.write_text(json.dumps(config))

    with mock.patch("pyrpc_core.cli._find_config", return_value=cfg_file):
        with mock.patch("pyrpc_core.cli._import_module"):
            with mock.patch("pyrpc_core.cli._regenerate_clients", return_value=2):
                with mock.patch("pyrpc_core.cli._server_is_running", return_value=False):
                    with mock.patch("pyrpc_core.cli._ServerProcess"):
                        with mock.patch("pyrpc_core.cli.watch", side_effect=strict_watch):
                            with mock.patch("pyrpc_core.cli._DevConsole") as mock_console:
                                mock_console.return_value.run = mock.MagicMock()
                                result = runner.invoke(app, ["dev"])
    assert result.exit_code == 0


def test_dev_console_exits_when_stop_event_set(capfd):
    """The dev console must stop (not block on input) once a watcher has failed."""
    stop = threading.Event()
    stop.set()
    console = cli_mod._DevConsole(
        module="m", client_dirs=[], host="127.0.0.1", port=8000,
        regenerate_cb=lambda: None, stop_event=stop,
    )
    console.run()  # must return without blocking on stdin
    assert "type help" in capfd.readouterr().out


# ── _run_watcher ──────────────────────────────────────────────────────────────

def test_run_watcher_records_crash_and_signals_stop():
    """_run_watcher converts a watcher crash into a recorded error + stop signal."""
    stop = threading.Event()
    errors: list = []

    def boom():
        raise RuntimeError("watcher exploded")

    cli_mod._run_watcher("test watcher", boom, stop, errors)
    assert len(errors) == 1
    assert errors[0][0] == "test watcher"
    assert isinstance(errors[0][1], RuntimeError)
    assert stop.is_set()


def test_run_watcher_clean_exit_records_nothing():
    """A watcher that exits cleanly must not look like a failure."""
    stop = threading.Event()
    errors: list = []

    def clean():
        return None

    cli_mod._run_watcher("test watcher", clean, stop, errors)
    assert errors == []
    assert not stop.is_set()


# ── wizard (backend + multi-client) ───────────────────────────────────────────

def _fake_questionary(select_answers, text_answers, checkbox_answers, path_answers=None):
    q = mock.MagicMock()
    q.select.return_value.ask.side_effect = select_answers
    q.text.return_value.ask.side_effect = text_answers
    q.checkbox.return_value.ask.side_effect = checkbox_answers
    q.path.return_value.ask.side_effect = path_answers or []
    return q


def test_wizard_backend_framework_is_explicitly_confirmed():
    """The sniffed framework only preselects; the confirmed value is persisted."""
    detected = [("./web", "Next.js")]
    q = _fake_questionary(
        select_answers=["Flask", "React"],   # backend framework, frontend framework
        text_answers=["app"],                # entry point
        checkbox_answers=[],
        path_answers=["./web"],
    )
    with mock.patch("pyrpc_core.cli.questionary", q):
        with mock.patch.object(cli_mod, "_find_frontend_projects", return_value=detected):
            cfg = cli_mod._run_wizard(".")
    assert cfg["backend"] == {"framework": "flask", "entrypoint": "app:app"}
    assert cfg["clients"] == [{"framework": "React", "root": "./web"}]
    # Backend prompt is the first select, with the sniffed default when available
    first_kwargs = q.select.call_args_list[0].kwargs
    assert first_kwargs["choices"] == ["FastAPI", "Flask", "Django", "ASGI"]
    assert "default" in first_kwargs


def test_wizard_manual_entry_is_a_separate_action_not_a_checkbox_item():
    """'Enter a client path manually' must be an action, never a checkbox option."""
    detected = [("./client", "Vite"), ("./web", "Next.js"), ("./admin", "Next.js")]
    q = _fake_questionary(
        select_answers=["FastAPI", "Enter a client path manually", "React"],
        text_answers=["main"],
        checkbox_answers=[],
        path_answers=["./custom"],
    )
    with mock.patch("pyrpc_core.cli.questionary", q):
        with mock.patch.object(
            cli_mod, "_find_frontend_projects", return_value=detected
        ):
            cfg = cli_mod._run_wizard(".")
    assert cfg == {
        "backend": {"framework": "fastapi", "entrypoint": "main:app"},
        "clients": [{"framework": "React", "root": "./custom"}],
    }
    assert q.checkbox.called is False
    action_choices = q.select.call_args_list[1].kwargs["choices"]
    assert action_choices == [
        "Select detected projects",
        "Enter a client path manually",
    ]


def test_wizard_detected_projects_never_include_manual_entry():
    """The detected-projects checkbox must not mix a manual-entry option in."""
    detected = [("./client", "Vite"), ("./web", "Next.js")]
    q = _fake_questionary(
        select_answers=["ASGI", "Select detected projects"],
        text_answers=["main"],
        checkbox_answers=[["./client (Vite)", "./web (Next.js)"]],
    )
    with mock.patch("pyrpc_core.cli.questionary", q):
        with mock.patch.object(
            cli_mod, "_find_frontend_projects", return_value=detected
        ):
            cfg = cli_mod._run_wizard(".")
    assert cfg == {
        "backend": {"framework": "asgi", "entrypoint": "main:app"},
        "clients": [
            {"framework": "Vite", "root": "./client"},
            {"framework": "Next.js", "root": "./web"},
        ],
    }
    assert q.checkbox.called is True
    checkbox_choices = q.checkbox.call_args.kwargs["choices"]
    assert "Manual entry" not in checkbox_choices
    assert checkbox_choices == ["./client (Vite)", "./web (Next.js)"]


def test_wizard_django_asks_manage_py_and_types_module(tmp_path):
    """Django's entrypoint is the manage.py path; codegen needs an explicit types module."""
    (tmp_path / "manage.py").write_text("", encoding="utf-8")
    pkg = tmp_path / "myproject"
    pkg.mkdir()
    (pkg / "views.py").write_text("", encoding="utf-8")

    q = _fake_questionary(
        select_answers=["Django", "Svelte"],
        text_answers=["manage.py", "myproject.views"],
        checkbox_answers=[],
        path_answers=["./client"],
    )
    with mock.patch("pyrpc_core.cli.questionary", q):
        with mock.patch.object(cli_mod, "_find_frontend_projects", return_value=[("./client", "Svelte")]):
            cfg = cli_mod._run_wizard(str(tmp_path))
    assert cfg["backend"] == {
        "framework": "django",
        "entrypoint": "manage.py",
        "types_module": "myproject.views",
    }


def test_wizard_selection_is_never_silently_discarded():
    """Selecting detected projects preserves every checked project."""
    detected = [("./client", "Vite"), ("./web", "Next.js")]
    q = _fake_questionary(
        select_answers=["FastAPI", "Select detected projects"],
        text_answers=["main"],
        checkbox_answers=[["./client (Vite)", "./web (Next.js)"]],
    )
    with mock.patch("pyrpc_core.cli.questionary", q):
        with mock.patch.object(
            cli_mod, "_find_frontend_projects", return_value=detected
        ):
            cfg = cli_mod._run_wizard(".")
    assert [c["root"] for c in cfg["clients"]] == ["./client", "./web"]


def test_wizard_empty_checkbox_selection_reprompts():
    """An empty checkbox selection re-prompts instead of silently falling back."""
    detected = [("./client", "Vite"), ("./web", "Next.js")]
    q = _fake_questionary(
        select_answers=["FastAPI", "Select detected projects"],
        text_answers=["main"],
        checkbox_answers=[[], ["./web (Next.js)"]],
    )
    with mock.patch("pyrpc_core.cli.questionary", q):
        with mock.patch.object(
            cli_mod, "_find_frontend_projects", return_value=detected
        ):
            cfg = cli_mod._run_wizard(".")
    assert q.checkbox.call_count == 2
    assert cfg["clients"] == [{"framework": "Next.js", "root": "./web"}]


def test_wizard_cancel_at_action_exits():
    detected = [("./client", "Vite"), ("./web", "Next.js")]
    q = _fake_questionary(
        select_answers=["FastAPI", None],
        text_answers=["main"],
        checkbox_answers=[],
    )
    with mock.patch("pyrpc_core.cli.questionary", q):
        with mock.patch.object(
            cli_mod, "_find_frontend_projects", return_value=detected
        ):
            with pytest.raises(typer.Exit):
                cli_mod._run_wizard(".")


# ── regen path (watcher reload) ───────────────────────────────────────────────

def test_do_regen_reloads_module_and_picks_up_new_procedures(tmp_path):
    """
    The watcher's real regen callback must reload the module, not just re-import
    the cached one. Editing a .py file (adding a procedure) must be reflected in
    the regenerated __pyrpc.ts. Also proves default_router is in scope in the
    regen path.
    """
    module = "regen_demo"
    src = tmp_path / "regen_demo.py"
    src.write_text(
        "from pyrpc_core import rpc\n\n"
        "@rpc\n"
        "def ping() -> str:\n"
        "    return 'old'\n",
        encoding="utf-8",
    )
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    out = client_dir / "__pyrpc.ts"

    sys.path.insert(0, str(tmp_path))
    try:
        _do, _ = cli_mod._make_regen_callback(module, [str(client_dir)])

        _do()
        assert out.exists(), "types should be generated on first regen"
        assert "ping" in out.read_text(encoding="utf-8")
        assert "pong" not in out.read_text(encoding="utf-8")

        src.write_text(
            "from pyrpc_core import rpc\n\n"
            "@rpc\n"
            "def ping() -> str:\n"
            "    return 'old'\n\n"
            "@rpc\n"
            "def pong() -> str:\n"
            "    return 'new'\n",
            encoding="utf-8",
        )

        _do()
        content = out.read_text(encoding="utf-8")
        assert "ping" in content, "existing procedure must survive reload"
        assert "pong" in content, "new procedure must be picked up after reload"
        assert "pong" in default_router.list()
    finally:
        if module in sys.modules:
            sys.modules.pop(module, None)
        if str(tmp_path) in sys.path:
            sys.path.remove(str(tmp_path))


def test_regenerate_clients_writes_all_clients(tmp_path):
    """_regenerate_clients generates __pyrpc.ts for every configured client."""
    module = "regen_multi"
    (tmp_path / "regen_multi.py").write_text(
        "from pyrpc_core import rpc\n\n"
        "@rpc\n"
        "def ping() -> str:\n"
        "    return 'p'\n",
        encoding="utf-8",
    )
    c1 = tmp_path / "c1"
    c2 = tmp_path / "c2"
    c1.mkdir()
    c2.mkdir()

    sys.path.insert(0, str(tmp_path))
    try:
        n = cli_mod._regenerate_clients(module, [str(c1), str(c2)])
        assert n == 1
        assert (c1 / "__pyrpc.ts").exists()
        assert (c2 / "__pyrpc.ts").exists()
    finally:
        if module in sys.modules:
            sys.modules.pop(module, None)
        if str(tmp_path) in sys.path:
            sys.path.remove(str(tmp_path))


# ── _parse_entry ──────────────────────────────────────────────────────────────

def test_parse_entry_module_only():
    module, app_var = _parse_entry("app.main")
    assert module == "app.main"
    assert app_var == "app"


def test_parse_entry_with_app():
    module, app_var = _parse_entry("app.main:my_app")
    assert module == "app.main"
    assert app_var == "my_app"


def test_parse_entry_complex():
    module, app_var = _parse_entry("my_package.submodule:create_app")
    assert module == "my_package.submodule"
    assert app_var == "create_app"


# ── entry-module import errors (#127) ────────────────────────────────────────

def _purge_app_modules():
    """Drop cached ``app.*`` modules so each test imports a fresh project."""
    for m in [m for m in sys.modules if m == "app" or m.startswith("app.")]:
        del sys.modules[m]


def _write_broken_project(root: Path, source: str) -> None:
    (root / "app").mkdir()
    (root / "app" / "__init__.py").write_text("", encoding="utf-8")
    (root / "app" / "main.py").write_text(source, encoding="utf-8")


def test_import_module_user_error_points_at_file_and_line(tmp_path, monkeypatch, capfd):
    """A NameError in user code must surface the file/line, not importlib frames."""
    _purge_app_modules()
    _write_broken_project(tmp_path, "class Foo:\n    value: MissingType\n")
    monkeypatch.chdir(tmp_path)

    with pytest.raises(typer.Exit) as exc_info:
        cli_mod._import_module("app.main")
    assert exc_info.value.exit_code == 1

    out = capfd.readouterr().out
    assert 'Failed to load entry module "app.main"' in out
    assert "NameError: name 'MissingType' is not defined" in out
    assert "Fix the error in app/main.py:2" in out
    assert "importlib" not in out
    assert "_gcd_import" not in out


def test_import_module_missing_module_is_clean(tmp_path, monkeypatch, capfd):
    """A missing entry module must not dump importlib machinery."""
    _purge_app_modules()
    monkeypatch.chdir(tmp_path)

    with pytest.raises(typer.Exit) as exc_info:
        cli_mod._import_module("does.not.exist")
    assert exc_info.value.exit_code == 1

    out = capfd.readouterr().out
    assert "Could not import" in out
    assert "No module named" in out
    assert "_gcd_import" not in out


def test_report_internal_error_keeps_full_traceback(tmp_path, capfd):
    """Failures inside pyRPC keep the full traceback so bugs aren't hidden."""
    def boom():
        return 1 / 0

    exc = None
    try:
        boom()
    except ZeroDivisionError as e:
        exc = e

    cli_mod._report_import_error("some.module", exc, str(tmp_path))
    captured = capfd.readouterr()
    assert "internal error" in captured.out
    assert "ZeroDivisionError" in captured.err


def test_cli_inspect_broken_module_shows_clean_error(tmp_path, monkeypatch):
    """The inspect command exits 1 with a concise error for a broken module."""
    _purge_app_modules()
    _write_broken_project(tmp_path, "value: MissingType\n")
    monkeypatch.chdir(tmp_path)

    result = runner.invoke(app, ["inspect", "app.main"])
    assert result.exit_code == 1
    assert 'Failed to load entry module "app.main"' in result.output
    assert "NameError: name 'MissingType' is not defined" in result.output
    assert "app/main.py:1" in result.output
    assert "_gcd_import" not in result.output


# ── _DEFAULT_CLIENT constant ──────────────────────────────────────────────────

def test_default_client_constant():
    from pyrpc_core.cli import _DEFAULT_CLIENT
    assert _DEFAULT_CLIENT == "."


# ── CONFIG_FILE constant (needed for pyrpc.json watcher) ─────────────────────

def test_config_file_constant():
    """CONFIG_FILE is kept for pyrpc.json watcher logic — not old config machinery."""
    from pyrpc_core.cli import CONFIG_FILE
    assert CONFIG_FILE == "pyrpc.json"


# ── Old distribution-mode symbols are gone ───────────────────────────────────

def test_old_distribution_symbols_gone():
    """Confirm old distribution-mode config symbols are gone."""
    import pyrpc_core.cli as cli_mod
    for sym in ("CONFIG_VERSION", "DISTRIBUTION_MODES",
                "_find_pyrpc_json", "_read_pyrpc_config", "_write_pyrpc_config",
                "_prompt_for_config", "_ensure_config", "_handle_migration",
                "_resolve_client_root"):
        assert not hasattr(cli_mod, sym), f"Old symbol still present: {sym}"


# ── legacy config → wizard ────────────────────────────────────────────────────

def test_dev_rewrites_legacy_config_via_wizard(tmp_path):
    """A pre-0.13 flat pyrpc.json is treated as unconfigured: the wizard runs
    and the file is rewritten in the nested shape."""
    legacy = {"module": "old_main", "framework": "Next.js", "client": "./old_client"}
    cfg_file = tmp_path / "pyrpc.json"
    cfg_file.write_text(json.dumps(legacy))
    nested = {
        "backend": {"framework": "fastapi", "entrypoint": "main:app"},
        "clients": [{"framework": "Next.js", "root": "./client"}],
    }

    with mock.patch("pyrpc_core.cli._find_config", return_value=cfg_file):
        with mock.patch("pyrpc_core.cli._run_wizard", return_value=nested) as mock_wizard:
            with mock.patch("pyrpc_core.cli._import_module"):
                with mock.patch("pyrpc_core.cli._regenerate_clients"):
                    with mock.patch("pyrpc_core.cli._server_is_running", return_value=True):
                        with mock.patch("pyrpc_core.cli.watch", return_value=iter([])):
                            with mock.patch("pyrpc_core.cli._DevConsole") as mock_console:
                                mock_console.return_value.run = mock.MagicMock()
                                result = runner.invoke(app, ["dev"])
    assert result.exit_code == 0
    mock_wizard.assert_called_once()
    written = json.loads(cfg_file.read_text())
    assert written == nested
    assert "rewritten" not in result.output or "created" in result.output


# ── config watcher restarts on backend change ────────────────────────────────

def test_cfg_watcher_restarts_backend_on_entrypoint_change(tmp_path):
    """Editing pyrpc.json's backend section swaps the launch command live."""
    config = _nested_cfg(entrypoint="main:app", framework="fastapi",
                         clients=[{"framework": "Next.js", "root": "./web"}])
    cfg_file = tmp_path / "pyrpc.json"
    cfg_file.write_text(json.dumps(config))

    def scripted_watch(*paths, **kwargs):
        """Only the config watcher (watching cfg_file's dir) mutates and yields;
        the python watcher gets an exhausted iterator so there is exactly one
        writer of pyrpc.json. Batches keep flowing like watchfiles polling,
        so shutdown can never swallow the change before it is processed."""
        if str(cfg_file.parent) not in {str(p) for p in paths}:
            return iter([])
        data = json.loads(cfg_file.read_text())
        data["backend"] = {"framework": "flask", "entrypoint": "app:app"}
        cfg_file.write_text(json.dumps(data))
        while True:
            yield [(1, str(cfg_file))]

    def fake_run(*_args, **_kwargs):
        # Keep the session alive until the restart has been observed; this
        # removes shutdown-vs-detection timing from the test entirely.
        deadline = time.time() + 5
        while time.time() < deadline and mock_sub.call_count < 2:
            time.sleep(0.01)

    with mock.patch("pyrpc_core.cli._find_config", return_value=cfg_file):
        with mock.patch("pyrpc_core.cli._import_module") as mock_import:
            with mock.patch("pyrpc_core.cli._regenerate_clients", return_value=1):
                with mock.patch("pyrpc_core.cli._server_is_running", return_value=False):
                    with mock.patch("pyrpc_core.cli._ServerProcess") as mock_sub:
                        mock_sub.return_value = mock.MagicMock()
                        with mock.patch("pyrpc_core.cli.watch", side_effect=scripted_watch):
                            with mock.patch("pyrpc_core.cli._DevConsole") as mock_console:
                                mock_console.return_value.run.side_effect = fake_run
                                result = runner.invoke(app, ["dev"])
    stop_deadline = time.time() + 5
    while time.time() < stop_deadline and threading.active_count() > 2:
        time.sleep(0.01)
    assert result.exit_code == 0, f"exit={result.exit_code} out={result.output}"
    assert mock_sub.call_count == 2, "backend must be restarted once"
    first_argv = mock_sub.call_args_list[0][0][0]
    second_argv = mock_sub.call_args_list[1][0][0]
    assert "uvicorn" in first_argv and "main:app" in first_argv
    assert "flask" in second_argv and "app:app" in second_argv
    assert mock_sub.return_value.terminate.called
    # The new types module was imported and regen re-wired
    assert any("app" in str(c) for c in mock_import.call_args_list)


# ── client-root autocomplete ──────────────────────────────────────────────────

def _make_tree(root: Path, outside: Path):
    (root / "src" / "app").mkdir(parents=True)
    (root / "src" / "api").mkdir()
    (root / "components").mkdir()
    (root / "node_modules" / "pkg").mkdir(parents=True)
    (root / ".venv").mkdir()
    (root / "README.md").write_text("x", encoding="utf-8")
    (outside / "elsewhere").mkdir(parents=True)
    os.symlink(outside / "elsewhere", root / "escape_link")


def test_client_filter_hides_junk_and_escapes(tmp_path):
    """Suggestions hide dot-dirs/junk and anything resolving outside the root."""
    outside = tmp_path / "outside"
    root = tmp_path / "project"
    root.mkdir()
    _make_tree(root, outside)

    visible = cli_mod._client_visible_filter(str(root))
    shown = sorted(
        entry.name for entry in root.iterdir() if visible(str(entry))
    )
    assert shown == ["components", "src"]
    assert visible(str(outside / "elsewhere")) is False
    assert visible(str(root / "src" / "app")) is True


def test_client_completer_suggests_scoped_dirs(tmp_path):
    """Headless drive of questionary's path completer through our filter."""
    from prompt_toolkit.completion import CompleteEvent
    from prompt_toolkit.document import Document
    from questionary.prompts.path import GreatUXPathCompleter

    outside = tmp_path / "outside"
    root = tmp_path / "project"
    root.mkdir()
    _make_tree(root, outside)

    completer = GreatUXPathCompleter(
        get_paths=lambda: [str(root)],
        only_directories=True,
        file_filter=cli_mod._client_visible_filter(str(root)),
    )

    def suggestions(text):
        return [c.display[0][1] for c in completer.get_completions(Document(text), CompleteEvent())]

    # Prefix match inside src/
    assert [s for s in suggestions("src/a") if s.startswith("a")] == ["api/", "app/"]
    # Empty input lists only visible root children
    assert set(suggestions("")) == {"components/", "src/"}
    # Nonexistent prefix yields nothing
    assert suggestions("nope/") == []
    # Escaping the jail is filtered out of suggestions: ../ lists the parent,
    # but only the project itself survives the filter — never outside dirs.
    assert set(suggestions("../")) == {"project/"}


def test_ask_client_root_wires_questionary_path(monkeypatch):
    """The prompt delegates to questionary.path with jail/filter/validator wired."""
    captured = {}
    sentinel = mock.MagicMock()

    def fake_path(message, **kwargs):
        captured.update(kwargs)
        captured["message"] = message
        return sentinel

    monkeypatch.setattr(cli_mod.questionary, "path", fake_path)
    result = cli_mod._ask_client_root("Client project root", ".", "/tmp/some-root")

    assert result is sentinel.ask.return_value
    assert captured["message"] == "Client project root"
    assert captured["only_directories"] is True
    assert captured["get_paths"]() == [os.path.abspath("/tmp/some-root")]
    visible = captured["file_filter"]
    assert callable(visible)


def test_ask_client_root_validator_blocks_missing_dir(tmp_path):
    """Submitting a nonexistent client root is rejected by the validator."""
    captured = {}

    def fake_path(message, **kwargs):
        captured.update(kwargs)
        return mock.MagicMock()

    with mock.patch("pyrpc_core.cli.questionary.path", side_effect=fake_path):
        cli_mod._ask_client_root("Root", ".", str(tmp_path))
    validate = captured["validate"]
    assert validate(str(tmp_path / "missing")) == "Directory does not exist"
    assert validate(str(tmp_path)) is True


def test_skip_dirs_constant_shared():
    """The consolidated skip list covers the previously duplicated sets."""
    for name in ("node_modules", "__pycache__", ".venv", "venv", "env",
                 "dist", "build", ".git", ".next"):
        assert name in cli_mod._SKIP_DIRS
