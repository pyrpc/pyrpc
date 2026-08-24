"""Smoke-verify that every example's Python side still works.

- FastAPI/Flask servers: importing the module must succeed and register
  procedures (this exercises mount_* wiring exactly like a real run).
- Django servers: ``manage.py check`` must pass (it imports the URLconf,
  which executes the views import chain that registers @rpc).
- Top-level standalone scripts: syntax-checked only (some perform
  network calls when run).

Any failure exits nonzero so CI can gate on it.
"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXAMPLES = ROOT / "examples"

failures: list[str] = []
checked = 0


def run(cmd: list[str], cwd: Path) -> None:
    global checked
    checked += 1
    proc = subprocess.run(
        cmd, cwd=cwd, capture_output=True, text=True, timeout=120
    )
    label = f"{cwd.relative_to(ROOT)}: {' '.join(cmd)}"
    if proc.returncode != 0:
        failures.append(label)
        print(f"FAIL {label}\n{proc.stdout[-800:]}\n{proc.stderr[-2000:]}")
    else:
        print(f"ok   {label}")


def main() -> int:
    global checked
    if not EXAMPLES.is_dir():
        print("examples/ not found")
        return 1

    for server in sorted(EXAMPLES.glob("*/server")):
        main_py = server / "main.py"
        manage_py = server / "manage.py"
        if manage_py.exists():
            run([sys.executable, str(manage_py), "check"], server)
        elif main_py.exists():
            run([sys.executable, "-c", "import main"], server)

    # Standalone scripts: parse-only (importing them would run servers).
    for script in sorted(EXAMPLES.glob("*.py")):
        proc = subprocess.run(
            [
                sys.executable,
                "-c",
                "import ast, sys; ast.parse(open(sys.argv[1], encoding='utf-8').read())",
                str(script),
            ],
            capture_output=True,
            text=True,
            timeout=60,
        )
        checked += 1
        label = f"{script.relative_to(ROOT)}: ast.parse"
        if proc.returncode != 0:
            failures.append(label)
            print(f"FAIL {label}\n{proc.stderr[-1000:]}")
        else:
            print(f"ok   {label}")

    print(f"\n{checked - len(failures)}/{checked} example checks passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
