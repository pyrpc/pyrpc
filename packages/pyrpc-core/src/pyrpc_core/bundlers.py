"""Automatic bundler resolution wiring for the generated __pyrpc.ts runtime module.

tsconfig.json ``paths`` is enough for TypeScript and for webpack-based bundlers
(Next.js webpack mode, Create React App) because they apply ``paths`` to imports
originating inside node_modules.

Bundlers that don't honor tsconfig ``paths`` for node_modules-internal imports
(Vite, SvelteKit, Next.js Turbopack) need an explicit bundler alias pointing
"@pyrpc/types" at the generated file. This module injects that alias for the
known frameworks and leaves everything else untouched — an unconfigured bundler
resolves the throwing placeholder in @pyrpc/types and fails loudly instead of
silently exposing every hook on every procedure.

The edits are intentionally minimal and defensive: if a config file doesn't
match a known shape, we don't touch it and surface a clear warning.
"""

import os

_FRAMEWORK_SIGNATURES = {
    "vite.config.ts": "vite",
    "vite.config.js": "vite",
    "vite.config.mjs": "vite",
    "next.config.ts": "next",
    "next.config.js": "next",
    "next.config.mjs": "next",
}

_VITE_ALIAS = 'resolve: { alias: { "@pyrpc/types": "./__pyrpc.ts" } }'
_NEXT_ALIAS = (
    'turbopack: { resolveAlias: { "@pyrpc/types": "./__pyrpc.ts" } }'
)

_INSERT_HINT = (
    'add a bundler alias "@pyrpc/types" -> "./__pyrpc.ts" so the generated '
    "runtime kinds resolve correctly."
)


def _detect_bundler(client_dir: str) -> str | None:
    """Return the name of the first existing framework config file, if any."""
    for filename in _FRAMEWORK_SIGNATURES:
        if os.path.exists(os.path.join(client_dir, filename)):
            return filename
    return None


def _skip_strings_and_comments(content: str, index: int) -> int:
    """Advance past any string/comment starting at ``index``."""
    if index >= len(content):
        return index
    c = content[index]
    if c == '"' or c == "'":
        quote = c
        i = index + 1
        while i < len(content):
            if content[i] == "\\":
                i += 2
                continue
            if content[i] == quote:
                return i + 1
            i += 1
        return len(content)
    if c == "`":
        i = index + 1
        while i < len(content):
            if content[i] == "\\":
                i += 2
                continue
            if content[i] == "`":
                return i + 1
            if content[i] == "${":
                i = _skip_strings_and_comments(content, i + 2)
                continue
            i += 1
        return len(content)
    if c == "/" and index + 1 < len(content) and content[index + 1] == "/":
        i = content.find("\n", index + 2)
        return len(content) if i == -1 else i
    if c == "/" and index + 1 < len(content) and content[index + 1] == "*":
        i = content.find("*/", index + 2)
        return len(content) if i == -1 else i + 2
    return index


def _find_object_after(content: str, start: int) -> int:
    """Return index of the first top-level '{' after ``start`` (outside strings)."""
    i = start
    while i < len(content):
        nxt = _skip_strings_and_comments(content, i)
        if nxt != i:
            i = nxt
            continue
        if content[i] == "{":
            return i
        i += 1
    return -1


def _match_braces(content: str, open_idx: int) -> int:
    """Return the index of the closing '}' for the object opening at open_idx."""
    depth = 0
    i = open_idx
    while i < len(content):
        c = content[i]
        if c in ('"', "'", "`"):
            i = _skip_strings_and_comments(content, i)
            continue
        if c == "/" and i + 1 < len(content) and content[i + 1] in "/*":
            i = _skip_strings_and_comments(content, i)
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def _insert_before_close(content: str, open_idx: int, close_idx: int, alias: str) -> str:
    inner = content[open_idx + 1 : close_idx]
    sep = "" if inner.strip() == "" else ", "
    return content[:close_idx] + sep + alias + content[close_idx:]


def _already_aliased(content: str) -> bool:
    return '"@pyrpc/types"' in content and "__pyrpc.ts" in content


def _inject_vite(content: str) -> str | None:
    if _already_aliased(content):
        return content
    start = content.find("defineConfig(")
    if start == -1:
        return None
    open_idx = _find_object_after(content, start + len("defineConfig("))
    if open_idx == -1:
        return None
    close_idx = _match_braces(content, open_idx)
    if close_idx == -1:
        return None
    return _insert_before_close(content, open_idx, close_idx, _VITE_ALIAS)


def _inject_next(content: str) -> str | None:
    if _already_aliased(content):
        return content
    export_idx = content.find("export default")
    if export_idx != -1:
        open_idx = _find_object_after(content, export_idx + len("export default"))
        if open_idx != -1:
            close_idx = _match_braces(content, open_idx)
            if close_idx != -1:
                return _insert_before_close(content, open_idx, close_idx, _NEXT_ALIAS)
    const_idx = content.find("const nextConfig")
    if const_idx != -1:
        open_idx = _find_object_after(content, const_idx + len("const nextConfig"))
        if open_idx != -1:
            close_idx = _match_braces(content, open_idx)
            if close_idx != -1:
                return _insert_before_close(content, open_idx, close_idx, _NEXT_ALIAS)
    return None


def configure_bundler(client_dir: str) -> bool:
    """Inject the "@pyrpc/types" bundler alias for known frameworks.

    Returns True on success or when no known config file is present. Returns
    False when a known framework config exists but couldn't be edited, so the
    caller can surface a clear warning.
    """
    filename = _detect_bundler(client_dir)
    if filename is None:
        return True
    label = _FRAMEWORK_SIGNATURES[filename]

    path = os.path.join(client_dir, filename)
    with open(path, encoding="utf-8") as f:
        content = f.read()

    injected = (
        _inject_vite(content) if label == "vite" else _inject_next(content)
    )
    if injected is None:
        return False
    if injected != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(injected)
    return True
