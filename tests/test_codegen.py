import json
import os
import tempfile
import pytest
from pyrpc_core import rpc, default_router, get_registry_schema
from pyrpc_codegen import generate_typescript_client, save_typescript_client


@pytest.fixture(autouse=True)
def clear_registry():
    default_router._procedures.clear()


def test_generate_typescript_client():
    @rpc
    def add(a: int, b: int) -> int:
        """Add two numbers."""
        return a + b

    schemas = get_registry_schema(default_router)
    content = generate_typescript_client(schemas)

    assert "export interface Types" in content
    assert "add(a: number, b: number): Promise<number>;" in content


def test_generate_typescript_client_empty():
    schemas = get_registry_schema(default_router)
    content = generate_typescript_client(schemas)
    assert "export interface Types {" in content


def test_save_typescript_client_from_file():
    schemas = {
        "greet": {
            "name": "greet",
            "doc": "Say hello",
            "parameters": [
                {"name": "name", "type": "<class 'str'>", "required": True, "default": None}
            ],
            "return_type": "<class 'str'>",
        }
    }

    with tempfile.TemporaryDirectory() as tmpdir:
        schema_file = os.path.join(tmpdir, "schema.json")
        with open(schema_file, "w") as f:
            json.dump(schemas, f)

        from pyrpc_core.cli import _load_schema
        loaded = _load_schema(schema_file)
        assert loaded == schemas

        output_file = os.path.join(tmpdir, "types.ts")
        save_typescript_client(schemas, output_file)

        with open(output_file) as f:
            content = f.read()

        assert "export interface Types" in content
        assert "greet(name: string): Promise<string>;" in content


def test_save_typescript_client_serialized_schema():
    @rpc
    def add(a: int) -> int:
        return a

    schemas = get_registry_schema(default_router)

    serializable = {}
    for name, schema in schemas.items():
        serializable[name] = {
            "name": schema.name,
            "doc": schema.doc or "",
            "parameters": [
                {"name": p.name, "type": p.type, "required": p.required, "default": p.default}
                for p in schema.parameters
            ],
            "return_type": schema.return_type,
        }

    with tempfile.TemporaryDirectory() as tmpdir:
        output_file = os.path.join(tmpdir, "types.ts")
        save_typescript_client(serializable, output_file)

        with open(output_file) as f:
            content = f.read()

        assert "export interface Types" in content
        assert "add(a: number): Promise<number>;" in content
