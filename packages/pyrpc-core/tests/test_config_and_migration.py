"""
Tests for the new codegen output path behaviour.

The old pyrpc.json / distribution / client_root / migration machinery has been
removed. This file tests the replacement: pyrpc codegen --client writes to a
caller-specified path, the default is . (relative to cwd), and
save_typescript_client still requires an absolute path.
"""
import json
import os
import tempfile

import pytest
from pyrpc_codegen import save_typescript_client


# ── save_typescript_client invariants ────────────────────────────────────────

class TestSaveTypescriptClient:
    def test_requires_absolute_path(self):
        with pytest.raises(ValueError, match="absolute path"):
            save_typescript_client({}, "relative/path.d.ts")

    def test_accepts_absolute_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, "types.d.ts")
            schemas = {"ping": {"name": "ping", "parameters": [], "return_type": "str", "doc": ""}}
            save_typescript_client(schemas, out)
            assert os.path.isfile(out)
            content = open(out).read()
            assert "ping:" in content
            assert "ProcedureKinds" in content
            assert "procedureKinds" in content

    def test_creates_parent_directories(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, "deep", "nested", "types.d.ts")
            schemas = {"hello": {"name": "hello", "parameters": [], "return_type": "str", "doc": ""}}
            save_typescript_client(schemas, out)
            assert os.path.isfile(out)


# ── DEFAULT_OUTPUT removed from pyrpc_codegen public API ─────────────────────

def test_default_output_not_exported_from_pyrpc_codegen():
    """DEFAULT_OUTPUT was removed from __init__.py — it now lives in the CLI."""
    import pyrpc_codegen
    assert not hasattr(pyrpc_codegen, "DEFAULT_OUTPUT"), (
        "DEFAULT_OUTPUT should not be on the public API of pyrpc_codegen; "
        "the CLI layer owns the default path."
    )


# ── CLI default client root is . ──────────────────────────────

def test_cli_default_client_is_dot():
    from pyrpc_core.cli import _DEFAULT_CLIENT
    assert _DEFAULT_CLIENT == "."


def test_codegen_command_uses_default_client(tmp_path):
    """Running `pyrpc codegen <schema>` with no --client flag writes to __pyrpc.d.ts."""
    from typer.testing import CliRunner
    from pyrpc_core.cli import app

    schemas = {
        "add": {
            "name": "add",
            "doc": "",
            "parameters": [
                {"name": "a", "type": "<class 'int'>", "required": True, "default": None},
                {"name": "b", "type": "<class 'int'>", "required": True, "default": None},
            ],
            "return_type": "<class 'int'>",
        }
    }
    schema_file = tmp_path / "schema.json"
    schema_file.write_text(json.dumps(schemas))

    cwd = os.getcwd()
    os.chdir(str(tmp_path))
    try:
        result = CliRunner().invoke(app, ["codegen", str(schema_file)])
        assert result.exit_code == 0, result.output
        expected = tmp_path / "__pyrpc.d.ts"
        assert expected.exists(), f"Expected {expected}, got: {result.output}"
        assert "add" in expected.read_text()
    finally:
        os.chdir(cwd)


def test_codegen_command_respects_client_flag(tmp_path):
    """--client flag overrides the default path."""
    from typer.testing import CliRunner
    from pyrpc_core.cli import app

    schemas = {"greet": {"name": "greet", "doc": "", "parameters": [], "return_type": "<class 'str'>"}}
    schema_file = tmp_path / "schema.json"
    schema_file.write_text(json.dumps(schemas))

    custom_client = str(tmp_path / "custom")
    result = CliRunner().invoke(app, ["codegen", str(schema_file), "--client", custom_client])
    assert result.exit_code == 0, result.output
    
    expected_out = os.path.join(custom_client, "__pyrpc.d.ts")
    assert os.path.isfile(expected_out)
    assert "greet" in open(expected_out).read()
