import sys
import warnings

warnings.warn(
    "Importing from pyrpc_codegen.main is deprecated. "
    "The CLI has moved to pyrpc_core. "
    "Upgrade: pip install --upgrade pyrpc-core",
    DeprecationWarning,
    stacklevel=2,
)

from pyrpc_core.cli import app  # noqa: E402

if __name__ == "__main__":
    sys.argv[0] = sys.argv[0].replace("-script.pyw", "").replace(".exe", "")
    sys.exit(app())
