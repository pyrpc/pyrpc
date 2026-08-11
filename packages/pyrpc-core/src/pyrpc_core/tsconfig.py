import os
import re

from jsonc_edit import apply_edits, modify


def _get_existing_value(source: str, path: list) -> str | None:
    edits = modify(source, path, "SENTINEL")
    if len(edits) == 1 and edits[0].content == '"SENTINEL"':
        return source[edits[0].offset : edits[0].offset + edits[0].length]
    return None


def configure_tsconfig(client_dir: str) -> bool:
    path = os.path.join(client_dir, "tsconfig.json")
    if not os.path.exists(path):
        return True

    with open(path, encoding="utf-8") as f:
        content = f.read()

    existing = _get_existing_value(
        content, ["compilerOptions", "paths", "@pyrpc/types"]
    )
    if existing is not None:
        no_comments = re.sub(r"//.*?\n|/\*.*?\*/", "", existing, flags=re.DOTALL)
        clean_val = re.sub(r"\s+", "", no_comments)
        if clean_val == '["./__pyrpc.ts"]':
            return True
        raise RuntimeError(
            f"@pyrpc/types is already configured to point elsewhere in {path}"
        )

    edits = modify(
        content,
        ["compilerOptions", "paths", "@pyrpc/types"],
        ["./__pyrpc.ts"],
    )
    if not edits:
        return True

    new_content = apply_edits(content, edits)
    if new_content != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)

    return True
