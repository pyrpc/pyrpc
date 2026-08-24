"""Verify the Python code blocks embedded in the docs.

Two levels of enforcement, so docs cannot rot silently:

1. Every ```python fence in docs/content/docs/**/*.mdx must be valid
   Python syntax (ast.parse). Illustrative pseudo-code may opt out with
   an explicit ```python nocheck info string; opting out is visible and
   greppable, unlike silent breakage.
2. Fences marked ```python test are executed in a fresh namespace.
   They must be self-contained (imports included) and side-effect free
   enough to run in CI. Convention: use them for complete snippets such
   as server definitions from the quickstart.

TypeScript blocks are counted for visibility but not yet compiled.
"""

import ast
import re
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs" / "content" / "docs"

FENCE = re.compile(r"```(python[^\n]*)\n(.*?)(?=```)", re.DOTALL)
TS_FENCE = re.compile(r"```(?:ts|typescript|tsx)[^\n]*\n", re.DOTALL)

failures: list[str] = []
parsed = executed = skipped = 0
ts_blocks = 0


def check_file(path: Path) -> None:
    global parsed, executed, skipped, ts_blocks
    text = path.read_text(encoding="utf-8")
    ts_blocks += len(TS_FENCE.findall(text))
    rel = path.relative_to(DOCS.parent.parent.parent)
    for match in FENCE.finditer(text):
        info = match.group(1).strip()
        code = match.group(2)
        label = f"{rel}: {info or 'python'}"

        if "nocheck" in info:
            skipped += 1
            continue

        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            failures.append(f"{label}: SyntaxError: {e.msg} (line {e.lineno})")
            continue
        parsed += 1

        if "test" in info.split():
            namespace: dict = {"__name__": "__docs__"}
            try:
                exec(compile(tree, str(rel), "exec"), namespace)  # noqa: S102
            except Exception as e:  # noqa: BLE001 - report any snippet failure
                failures.append(
                    f"{label}: {type(e).__name__}: {e}"
                )
                continue
            executed += 1


def main() -> int:
    files = sorted(DOCS.rglob("*.mdx"))
    for path in files:
        check_file(path)

    print(f"{len(files)} mdx files | python fences: {parsed} parsed, "
          f"{executed} executed, {skipped} nocheck | ts/js fences: {ts_blocks}")

    if failures:
        print(f"\n{len(failures)} failure(s):")
        for f in failures:
            print(f"  FAIL {f}")
        return 1
    print("all docs python fences verified")
    return 0


if __name__ == "__main__":
    sys.exit(main())
