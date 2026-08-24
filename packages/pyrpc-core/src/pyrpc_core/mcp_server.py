"""Local MCP server: ``pyrpc mcp``.

Exposes the running pyRPC project to AI coding clients over the standard MCP
stdio transport. The project's Python environment is the source of truth:
tools import the configured backend module and answer from the live registry,
never from static file parsing.

Three tools, read-oriented by design:

    introspect_project  authoritative procedure registry with JSON Schemas
    check_call          validate hypothetical arguments without executing
    run_codegen         regenerate __pyrpc.ts via the CLI's codegen path

Procedure execution is deliberately not exposed: an agent must never trigger
database writes, network calls, or other backend side effects through MCP.
"""

import importlib
import json
import logging
import sys
from pathlib import Path
from typing import Any

from mcp.server import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.types import ToolAnnotations
from pydantic import BaseModel, Field

from .config import (
    CONFIG_FILE,
    BackendConfigError,
    clients_from_config,
    find_config,
    parse_backend,
)
from .constants import FRAMEWORKS
from .core.procedure import ProcedureError
from .runners import resolve_types_module

logger = logging.getLogger(__name__)

READ_ONLY = ToolAnnotations(read_only_hint=True, open_world_hint=False)
CODEGEN_ANNOTATIONS = ToolAnnotations(
    read_only_hint=False, destructive_hint=False, idempotent_hint=True
)

_MINIMAL_CONFIG = """{
  "backend": {"framework": "fastapi", "entrypoint": "server:app"}
}"""


# ── Result models ─────────────────────────────────────────────────────────────


class ParameterInfo(BaseModel):
    name: str
    type: str
    required: bool
    default: str | None = Field(
        default=None, description="JSON-encoded default value, or its repr."
    )
    schema_: dict[str, Any] = Field(description="JSON Schema for this parameter.")


class ProcedureInfo(BaseModel):
    name: str
    kind: str
    doc: str | None = None
    is_async: bool = False
    parameters: list[ParameterInfo]
    return_type: str
    return_schema: dict[str, Any]


class ClientInfo(BaseModel):
    framework: str | None = None
    root: str


class ProjectIntrospection(BaseModel):
    project_root: str
    config_path: str
    framework: str
    entrypoint: str
    types_module: str
    procedure_count: int
    procedures: list[ProcedureInfo]
    clients: list[ClientInfo]


class CallArgumentError(BaseModel):
    param: str | None = None
    message: str


class CallCheckResult(BaseModel):
    procedure: str
    valid: bool
    message: str
    errors: list[CallArgumentError] = []


class GeneratedFile(BaseModel):
    client_root: str
    output_path: str
    status: str


class CodegenResult(BaseModel):
    dry_run: bool
    types_module: str
    procedure_count: int
    files: list[GeneratedFile]
    message: str


# ── Project context ───────────────────────────────────────────────────────────


class _ProjectContext(BaseModel):
    config_path: Path
    project_root: Path
    framework: str
    entrypoint: str
    types_module: str
    clients: list[ClientInfo]
    client_roots: list[Path]


def _display_default(value: Any) -> str:
    try:
        return json.dumps(value)
    except TypeError:
        return repr(value)


def _load_config() -> tuple[Path, dict]:
    cwd = Path.cwd()
    config_path = find_config()
    if config_path is None:
        raise ToolError(
            f"No {CONFIG_FILE} found in {cwd.as_posix()} or any parent directory. "
            "Run 'pyrpc init' in your project root, or create a minimal configuration:\n"
            f"{_MINIMAL_CONFIG}"
        )
    try:
        cfg = json.loads(config_path.read_text(encoding="utf-8"))
    except OSError as e:
        raise ToolError(
            f"{config_path.as_posix()} could not be read ({e}). "
            "Check file permissions and retry."
        ) from None
    except json.JSONDecodeError as e:
        raise ToolError(
            f"{config_path.as_posix()} is not valid JSON (line {e.lineno}, "
            f"column {e.colno}: {e.msg}). Fix the syntax or regenerate it with "
            "'pyrpc init'."
        ) from None
    if not isinstance(cfg, dict):
        raise ToolError(
            f"{config_path.as_posix()} must contain a JSON object with a "
            "'backend' section, got: {type(cfg).__name__}."
        )
    return config_path, cfg


def _sniffed_framework(root: Path) -> str | None:
    # Reuse the CLI's marker sniffing for friendlier remediation only; the
    # result never preselects a backend here.
    from .cli import _sniff_backend

    return _sniff_backend(str(root))


def load_project_context() -> tuple[_ProjectContext, Any]:
    """Resolve the pyRPC project deterministically; raise ToolError otherwise."""
    config_path, cfg = _load_config()
    project_root = config_path.parent

    spec = parse_backend(cfg)
    if spec is None:
        sniffed = _sniffed_framework(project_root)
        hint = (
            f" Entry-file markers suggest framework '{sniffed}'."
            if sniffed
            else ""
        )
        raise ToolError(
            f"{config_path.as_posix()} has no valid 'backend' section.{hint}\n"
            "Set 'backend.framework' to one of "
            f"{', '.join(FRAMEWORKS)} and 'backend.entrypoint' to your app "
            "target ('module[:app]' for fastapi/flask/asgi, the manage.py path "
            f"for django). Minimal example:\n{_MINIMAL_CONFIG}"
        )

    try:
        types_module = resolve_types_module(spec)
    except BackendConfigError as e:
        raise ToolError(f"Backend configuration incomplete: {e}") from None

    try:
        module_path = str(project_root)
        if module_path not in sys.path:
            sys.path.insert(0, module_path)
        importlib.import_module(types_module)
    except Exception as e:
        logger.debug("backend import failed", exc_info=True)
        raise ToolError(
            f"Failed to import backend module '{types_module}' "
            f"({type(e).__name__}: {e}). The MCP server imports your actual "
            "environment, so every dependency of that module must be installed "
            "here. Verify it imports cleanly (for example with 'pyrpc dev') "
            "and check backend.entrypoint / backend.types_module in "
            f"{CONFIG_FILE}."
        ) from None

    from . import default_router

    client_roots: list[Path] = []
    clients: list[ClientInfo] = []
    seen_roots: set[str] = set()
    for client in clients_from_config(cfg):
        root = Path(client["root"])
        if not root.is_absolute():
            root = project_root / root
        resolved = str(root.resolve())
        if resolved not in seen_roots:
            seen_roots.add(resolved)
            client_roots.append(root)
            clients.append(ClientInfo(framework=client.get("framework"), root=str(root)))

    ctx = _ProjectContext(
        config_path=config_path,
        project_root=project_root,
        framework=spec.framework,
        entrypoint=spec.entrypoint,
        types_module=types_module,
        clients=clients,
        client_roots=client_roots,
    )
    return ctx, default_router


def _registry_schemas(router: Any) -> dict:
    from .core.introspection import get_registry_schema

    return get_registry_schema(router)


def _procedure(router: Any, name: str):
    procs = router._procedures
    proc = procs.get(name)
    if proc is None:
        available = ", ".join(sorted(procs)) or "(none registered)"
        raise ToolError(
            f"No procedure named '{name}' is registered. Available "
            f"procedures: {available}. Use introspect_project for full details."
        )
    return proc


# ── Server ────────────────────────────────────────────────────────────────────


def create_server() -> MCPServer:
    from . import __version__

    mcp = MCPServer(
        "pyrpc",
        version=__version__,
        instructions=(
            "Local pyRPC MCP server for the project in this working directory. "
            "introspect_project returns the authoritative registry of RPC "
            "procedures with their input/output JSON Schemas; check_call "
            "validates hypothetical arguments against a procedure without "
            "executing anything; run_codegen regenerates __pyrpc.ts through "
            "the same pipeline as 'pyrpc codegen'. Procedures cannot be "
            "executed through this server."
        ),
    )

    @mcp.tool(title="Introspect the pyRPC project", annotations=READ_ONLY)
    def introspect_project() -> ProjectIntrospection:
        """Describe the current pyRPC project: backend framework, entrypoint,
        and every registered RPC procedure with parameter names, types,
        requiredness, defaults, JSON Schema, kind (query/mutation), docstrings,
        and return schemas. Call this before writing any client code so you
        work from the real registry instead of guessing."""
        ctx, router = load_project_context()
        schemas = _registry_schemas(router)
        procedures = [
            ProcedureInfo(
                name=s.name,
                kind=s.kind,
                doc=s.doc,
                is_async=s.is_async,
                parameters=[
                    ParameterInfo(
                        name=p.name,
                        type=p.type,
                        required=p.required,
                        default=None if p.default is None else _display_default(p.default),
                        schema_=p.schema_,
                    )
                    for p in s.parameters
                ],
                return_type=s.return_type,
                return_schema=s.return_schema,
            )
            for s in schemas.values()
        ]
        return ProjectIntrospection(
            project_root=str(ctx.project_root),
            config_path=str(ctx.config_path),
            framework=ctx.framework,
            entrypoint=ctx.entrypoint,
            types_module=ctx.types_module,
            procedure_count=len(procedures),
            procedures=procedures,
            clients=list(ctx.clients),
        )

    @mcp.tool(title="Validate a procedure call", annotations=READ_ONLY)
    def check_call(
        procedure: str,
        args: dict[str, Any] | None = None,
    ) -> CallCheckResult:
        """Check whether hypothetical keyword arguments would be accepted by a
        registered procedure, validated against its real Python types. Nothing
        is executed: no side effects, no database access, no network calls.
        Returns valid=true, or structured per-parameter validation errors."""
        ctx, router = load_project_context()
        proc = _procedure(router, procedure)
        try:
            proc.validate_args(args or {})
        except ProcedureError as e:
            data = e.data or {}
            errors = [
                CallArgumentError(
                    param=data.get("field"),
                    message=data.get("message", e.message),
                )
            ]
            return CallCheckResult(
                procedure=procedure,
                valid=False,
                message=(
                    f"'{procedure}' rejected these arguments: "
                    f"{errors[0].param or 'unknown'}: {errors[0].message}"
                ),
                errors=errors,
            )
        return CallCheckResult(
            procedure=procedure,
            valid=True,
            message=f"'{procedure}' would accept these arguments.",
        )

    @mcp.tool(
        title="Regenerate TypeScript client types",
        annotations=CODEGEN_ANNOTATIONS,
    )
    def run_codegen(dry_run: bool = True) -> CodegenResult:
        """Run pyRPC TypeScript code generation exactly like 'pyrpc codegen'.
        With dry_run=true (default) nothing is written: each configured
        client's __pyrpc.ts target is reported as up to date, would update,
        or would create. With dry_run=false the __pyrpc.ts file is written
        into each configured client root. Only generated files are written;
        tsconfig/bundler setup remains a 'pyrpc init'/'pyrpc codegen'
        concern."""
        from pyrpc_codegen import generate_typescript_client, save_typescript_client

        ctx, router = load_project_context()
        schemas = _registry_schemas(router)
        if not schemas:
            raise ToolError(
                f"No @rpc procedures were registered after importing "
                f"'{ctx.types_module}'. Define procedures with the @rpc "
                "decorator, or point backend.types_module at the module that "
                f"registers them in {CONFIG_FILE}."
            )
        if not ctx.client_roots:
            raise ToolError(
                "No TypeScript clients are configured, so there is nowhere to "
                f"generate __pyrpc.ts. Add a 'clients' section to "
                f"{CONFIG_FILE}, for example:\n"
                '{\n  "backend": {...},\n'
                '  "clients": [{"framework": "Next.js", "root": "./web"}]\n}'
            )
        expected = generate_typescript_client(schemas)
        files: list[GeneratedFile] = []
        for client, client_root in zip(ctx.clients, ctx.client_roots, strict=True):
            if not client_root.is_dir():
                raise ToolError(
                    f"Configured client root does not exist: "
                    f"{client_root.as_posix()}. Create it or fix the 'clients' "
                    f"section in {CONFIG_FILE}."
                )
            output_path = client_root / "__pyrpc.ts"
            current = output_path.read_text(encoding="utf-8") if output_path.is_file() else None
            unchanged = current == expected
            if dry_run:
                status = "up to date" if unchanged else (
                    "would update" if current is not None else "would create"
                )
            else:
                save_typescript_client(schemas, str(output_path))
                status = "unchanged" if unchanged else (
                    "updated" if current is not None else "created"
                )
            logger.info("codegen %s %s", status, output_path.as_posix())
            files.append(
                GeneratedFile(
                    client_root=client.root,
                    output_path=output_path.as_posix(),
                    status=status,
                )
            )
        verb = "Checked" if dry_run else "Wrote"
        return CodegenResult(
            dry_run=dry_run,
            types_module=ctx.types_module,
            procedure_count=len(schemas),
            files=files,
            message=(f"{verb} {len(files)} target(s); {len(schemas)} procedures."),
        )

    return mcp


def run_mcp_server() -> None:
    """Build the server and block on the stdio transport.

    stdout belongs to the MCP protocol while serving; all diagnostics go
    through logging (stderr).
    """
    server = create_server()
    logger.info("starting pyRPC local MCP server on stdio")
    server.run()
