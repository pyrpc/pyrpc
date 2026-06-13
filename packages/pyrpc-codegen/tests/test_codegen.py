import json
import os
import shutil
import tempfile
import pytest
from pydantic import BaseModel
from pydantic.dataclasses import dataclass
from pyrpc_core import rpc, default_router, get_registry_schema
from pyrpc_codegen import generate_typescript_client, save_typescript_client
from pyrpc_codegen.ts_codegen import _to_safe_name, _to_pascal_case, _collect_schema_defs

def _npx_works() -> bool:
    """Check if npx works via subprocess.run without shell=True (how jsonschema_ts calls it)."""
    path = shutil.which("npx")
    if not path:
        return False
    try:
        import subprocess
        result = subprocess.run(
            ["npx", "--version"],
            capture_output=True, text=True, timeout=5, shell=False,
        )
        return result.returncode == 0
    except (OSError, subprocess.SubprocessError):
        return False

npx_available = _npx_works()


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


def test_to_pascal_case():
    assert _to_pascal_case("User") == "User"
    assert _to_pascal_case("user") == "User"
    assert _to_pascal_case("MyClass") == "MyClass"
    assert _to_pascal_case("my_model") == "MyModel"
    assert _to_pascal_case("") == ""


def test_to_safe_name():
    assert _to_safe_name("User") == "User"
    assert _to_safe_name("my_model") == "MyModel"
    assert _to_safe_name("MyClass") == "MyClass"
    assert _to_safe_name("") == "GeneratedType"


def test_collect_defs_base_model():
    class UserModel(BaseModel):
        name: str
        age: int

    @rpc
    def get_user(u: UserModel) -> UserModel:
        return u

    schemas = get_registry_schema(default_router)
    defs = _collect_schema_defs(schemas)
    assert "UserModel" in defs


def test_collect_defs_at_model():
    @dataclass
    class Item:
        name: str
        price: float

    @rpc
    def buy(item: Item) -> Item:
        return item

    schemas = get_registry_schema(default_router)
    defs = _collect_schema_defs(schemas)
    assert "Item" in defs


@pytest.mark.skipif(not npx_available, reason="requires npx (json-schema-to-typescript)")
def test_generate_typescript_client_with_base_model():
    class UserModel(BaseModel):
        name: str
        age: int
        email: str

    @rpc
    def create_user(user: UserModel) -> UserModel:
        return user

    schemas = get_registry_schema(default_router)
    content = generate_typescript_client(schemas)
    assert "export interface Types" in content
    assert "UserModel" in content


@pytest.mark.skipif(not npx_available, reason="requires npx (json-schema-to-typescript)")
def test_generate_typescript_client_with_at_model():
    @dataclass
    class Item:
        name: str
        price: float

    @rpc
    def buy_item(item: Item) -> Item:
        return item

    schemas = get_registry_schema(default_router)
    content = generate_typescript_client(schemas)
    assert "export interface Types" in content
    assert "Item" in content
