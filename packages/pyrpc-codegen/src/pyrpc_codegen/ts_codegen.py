import os
import re
from pathlib import Path
from typing import Any, Dict

from jinja2 import Environment, FileSystemLoader

DEFAULT_OUTPUT = "node_modules/@pyrpc/types/src/index.ts"

_TYPE_MAP: Dict[str, str] = {
    "int": "number",
    "float": "number",
    "str": "string",
    "bool": "boolean",
    "None": "null",
    "NoneType": "null",
    "Any": "any",
}


def _pytype_to_ts(type_str: str) -> str:
    if not type_str:
        return "any"

    m = re.match(r"<class\s+'([^']+)'>", type_str)
    if m:
        name = m.group(1)
        if name in _TYPE_MAP:
            return _TYPE_MAP[name]
        if name[0].isupper():
            return name
        return "any"

    if type_str.startswith("typing."):
        type_str = type_str[7:]

    if type_str.startswith("Optional["):
        inner = type_str[9:-1]
        return f"{_pytype_to_ts(inner)} | null"

    if type_str.startswith("Union["):
        inner = type_str[6:-1]
        parts = _split_type_args(inner)
        ts_parts = [_pytype_to_ts(p.strip()) for p in parts]
        non_null = [p for p in ts_parts if p != "null"]
        if len(non_null) < len(ts_parts):
            return f"{' | '.join(non_null)} | null"
        return " | ".join(ts_parts)

    if type_str.startswith("List[") or type_str.startswith("list["):
        inner = type_str[5:-1]
        return f"{_pytype_to_ts(inner.strip())}[]"

    if type_str.startswith("Dict[") or type_str.startswith("dict["):
        inner = type_str[5:-1]
        parts = _split_type_args(inner)
        if len(parts) >= 2:
            return f"Record<{_pytype_to_ts(parts[0].strip())}, {_pytype_to_ts(parts[1].strip())}>"
        return "Record<string, any>"

    if type_str.startswith("Tuple[") or type_str.startswith("tuple["):
        inner = type_str[6:-1]
        parts = _split_type_args(inner)
        ts_parts = [_pytype_to_ts(p.strip()) for p in parts]
        return f"[{', '.join(ts_parts)}]"

    if type_str.startswith("Set[") or type_str.startswith("set["):
        inner = type_str[4:-1]
        return f"Set<{_pytype_to_ts(inner.strip())}>"

    return "any"


def _split_type_args(s: str) -> list:
    parts = []
    depth = 0
    current = ""
    for c in s:
        if c in "[(":
            depth += 1
            current += c
        elif c in "])":
            depth -= 1
            current += c
        elif c == "," and depth == 0:
            parts.append(current)
            current = ""
        else:
            current += c
    if current:
        parts.append(current)
    return parts


def _return_type_to_ts(return_type: str) -> str:
    return _pytype_to_ts(return_type)


def generate_typescript_client(schemas: Dict[str, Any]) -> str:
    template_dir = Path(__file__).parent / "templates"
    env = Environment(loader=FileSystemLoader(template_dir))
    env.filters["pytype_to_ts"] = _pytype_to_ts
    env.filters["return_type_to_ts"] = _return_type_to_ts
    template = env.get_template("client.ts.j2")

    return template.render(schemas=schemas)


def save_typescript_client(schemas: Dict[str, Any], output_path: str = DEFAULT_OUTPUT):
    content = generate_typescript_client(schemas)
    if not os.path.isabs(output_path):
        output_path = os.path.join(os.getcwd(), output_path)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)
