import hashlib
import json
import os
import tempfile
import unittest.mock as mock

import pytest
from pyrpc_codegen import save_typescript_client, DEFAULT_OUTPUT

# ── save_typescript_client ─────────────────────────────────

class TestSaveTypescriptClient:
    def test_requires_absolute_path(self):
        with pytest.raises(ValueError, match="absolute path"):
            save_typescript_client({}, "relative/path")

    def test_accepts_absolute_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, "types.ts")
            schemas = {"ping": {"name": "ping", "parameters": [], "return_type": "str", "doc": ""}}
            save_typescript_client(schemas, out)
            assert os.path.isfile(out)
            with open(out) as f:
                assert "ping()" in f.read()

    def test_default_output_is_relative(self):
        assert not os.path.isabs(DEFAULT_OUTPUT)


# ── _resolve_client_root ───────────────────────────────────

class TestResolveClientRoot:
    def test_relative_resolved_against_config_dir(self):
        from pyrpc_core.cli import _resolve_client_root
        result = _resolve_client_root("../frontend", "C:/project/backend")
        assert result == os.path.normpath("C:/project/frontend")

    def test_absolute_returns_as_is(self):
        from pyrpc_core.cli import _resolve_client_root
        result = _resolve_client_root("C:/absolute/path", "/any/dir")
        assert result == os.path.normpath("C:/absolute/path")

    def test_dot_resolves_to_config_dir(self):
        from pyrpc_core.cli import _resolve_client_root
        result = _resolve_client_root(".", "C:/project/backend")
        assert result == os.path.normpath("C:/project/backend")


# ── _hash_file ──────────────────────────────────────────────

class TestHashFile:
    def test_sha256_of_file(self):
        from pyrpc_core.cli import _hash_file
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "test.txt")
            with open(path, "w") as f:
                f.write("hello")
            expected = hashlib.sha256(b"hello").hexdigest()
            assert _hash_file(path) == expected


# ── _find_pyrpc_json ────────────────────────────────────────

class TestFindPyrpcJson:
    def test_not_found_returns_none(self):
        from pyrpc_core.cli import _find_pyrpc_json
        with tempfile.TemporaryDirectory() as tmp:
            cwd = os.getcwd()
            os.chdir(tmp)
            try:
                result = _find_pyrpc_json()
                assert result is None
            finally:
                os.chdir(cwd)

    def test_found_in_cwd(self, tmp_path):
        from pyrpc_core.cli import _find_pyrpc_json, CONFIG_FILE
        cfg = tmp_path / CONFIG_FILE
        cfg.write_text("{}")
        cwd = os.getcwd()
        os.chdir(str(tmp_path))
        try:
            result = _find_pyrpc_json()
            assert result is not None
            assert result.name == CONFIG_FILE
        finally:
            os.chdir(cwd)

    def test_found_in_parent_dir(self, tmp_path):
        from pyrpc_core.cli import _find_pyrpc_json, CONFIG_FILE
        cfg = tmp_path / CONFIG_FILE
        cfg.write_text("{}")
        sub = tmp_path / "sub" / "nested"
        sub.mkdir(parents=True)
        cwd = os.getcwd()
        os.chdir(str(sub))
        try:
            result = _find_pyrpc_json()
            assert result is not None
            assert result.parent == tmp_path
        finally:
            os.chdir(cwd)


# ── _read_pyrpc_config / _write_pyrpc_config ────────────────

class TestReadWriteConfig:
    def test_corrupted_json_returns_none(self, tmp_path):
        from pyrpc_core.cli import _read_pyrpc_config, CONFIG_FILE
        cfg = tmp_path / CONFIG_FILE
        cfg.write_text("not json")
        cwd = os.getcwd()
        os.chdir(str(tmp_path))
        try:
            assert _read_pyrpc_config() is None
        finally:
            os.chdir(cwd)

    def test_write_creates_file(self, tmp_path):
        from pyrpc_core.cli import _write_pyrpc_config, CONFIG_FILE
        cwd = os.getcwd()
        os.chdir(str(tmp_path))
        try:
            _write_pyrpc_config({"framework": "flask", "entrypoint": "app"})
            assert (tmp_path / CONFIG_FILE).exists()
        finally:
            os.chdir(cwd)

    def test_write_adds_version(self, tmp_path):
        from pyrpc_core.cli import _write_pyrpc_config, CONFIG_FILE, CONFIG_VERSION
        cwd = os.getcwd()
        os.chdir(str(tmp_path))
        try:
            _write_pyrpc_config({"framework": "fastapi"})
            with open(tmp_path / CONFIG_FILE) as f:
                data = json.load(f)
            assert data["version"] == CONFIG_VERSION
        finally:
            os.chdir(cwd)

    def test_write_does_not_overwrite_existing_version(self, tmp_path):
        from pyrpc_core.cli import _write_pyrpc_config, CONFIG_FILE
        cwd = os.getcwd()
        os.chdir(str(tmp_path))
        try:
            _write_pyrpc_config({"framework": "fastapi", "version": 999})
            with open(tmp_path / CONFIG_FILE) as f:
                data = json.load(f)
            assert data["version"] == 1
        finally:
            os.chdir(cwd)


# ── _ensure_config ──────────────────────────────────────────

class TestEnsureConfig:
    def test_returns_none_when_cancelled(self):
        from pyrpc_core.cli import _ensure_config
        with mock.patch("pyrpc_core.cli._prompt_for_config", return_value=None):
            result = _ensure_config(reconfigure=True)
            assert result is None

    def test_returns_existing_config_without_reconfigure(self):
        from pyrpc_core.cli import _ensure_config
        existing = {"framework": "fastapi", "entrypoint": "main", "client_root": "../frontend", "distribution": "workspace"}
        with mock.patch("pyrpc_core.cli._read_pyrpc_config", return_value=existing):
            result = _ensure_config(reconfigure=False)
            assert result == existing


# ── _handle_migration ───────────────────────────────────────

class TestHandleMigration:
    def test_no_op_when_old_missing(self):
        from pyrpc_core.cli import _handle_migration
        with tempfile.TemporaryDirectory() as tmp:
            old = os.path.join(tmp, "old", "types.ts")
            new = os.path.join(tmp, "new", "types.ts")
            _handle_migration(old, new)
            assert not os.path.isdir(os.path.join(tmp, "new"))

    def test_moves_when_new_missing(self):
        from pyrpc_core.cli import _handle_migration
        with tempfile.TemporaryDirectory() as tmp:
            old_dir = os.path.join(tmp, "old")
            os.makedirs(old_dir)
            old = os.path.join(old_dir, "types.ts")
            with open(old, "w") as f:
                f.write("content")
            new = os.path.join(tmp, "new", "types.ts")
            q = mock.MagicMock()
            q.ask.return_value = True
            with mock.patch("questionary.confirm", return_value=q):
                _handle_migration(old, new)
            assert not os.path.isfile(old)
            assert os.path.isfile(new)
            with open(new) as f:
                assert f.read() == "content"

    def test_auto_cleanup_when_identical(self):
        from pyrpc_core.cli import _handle_migration
        with tempfile.TemporaryDirectory() as tmp:
            for d in ("old", "new"):
                os.makedirs(os.path.join(tmp, d))
            old = os.path.join(tmp, "old", "types.ts")
            new = os.path.join(tmp, "new", "types.ts")
            with open(old, "w") as f:
                f.write("same")
            with open(new, "w") as f:
                f.write("same")
            _handle_migration(old, new)
            assert not os.path.isfile(old)
            assert os.path.isfile(new)


# ── _prompt_for_config cancellation ─────────────────────────

def _mock_ask(return_value):
    q = mock.MagicMock()
    q.ask.return_value = return_value
    return q


class TestPromptForConfig:
    def test_returns_none_on_select_cancel(self):
        from pyrpc_core.cli import _prompt_for_config
        with mock.patch("questionary.select", return_value=_mock_ask(None)):
            result = _prompt_for_config()
            assert result is None

    def test_returns_none_on_text_cancel(self):
        from pyrpc_core.cli import _prompt_for_config
        selects_called = [0]
        def fake_select(text, choices, default):
            selects_called[0] += 1
            if selects_called[0] == 1:
                return _mock_ask("fastapi")
            return _mock_ask("workspace")
        with mock.patch("questionary.select", side_effect=fake_select):
            with mock.patch("questionary.text", return_value=_mock_ask(None)):
                result = _prompt_for_config()
                assert result is None

    def test_uses_previous_as_defaults(self):
        from pyrpc_core.cli import _prompt_for_config
        previous = {"framework": "flask", "entrypoint": "src.main", "client_root": "../client", "distribution": "server"}
        selects_called = [0]
        def fake_select(text, choices, default):
            selects_called[0] += 1
            if selects_called[0] == 1:
                assert default == "flask"
                return _mock_ask("flask")
            assert default == "server"
            return _mock_ask("server")
        texts_called = [0]
        def fake_text(text, default):
            texts_called[0] += 1
            if texts_called[0] == 1:
                assert default == "src.main"
                return _mock_ask("src.main")
            assert default == "../client"
            return _mock_ask("../client")
        with mock.patch("questionary.select", side_effect=fake_select):
            with mock.patch("questionary.text", side_effect=fake_text):
                result = _prompt_for_config(previous=previous)
                assert result == {"framework": "flask", "entrypoint": "src.main", "distribution": "server"}
