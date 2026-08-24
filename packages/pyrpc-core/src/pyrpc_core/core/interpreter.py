from typing import Any

from pydantic import ValidationError

from .decorators import default_router
from .models import RpcErrorModel, RpcRequest, RpcResponse
from .procedure import ProcedureError, _format_validation_error
from .registry import Router

# Maximum number of operations allowed in a single batch request. Guards
# against arbitrarily large payloads; the client-side httpBatchLink default
# (Infinity) is capped by this server limit.
MAX_BATCH_SIZE = 100


async def handle_request(
    payload: dict[str, Any] | list[dict[str, Any]],
    router: Router | None = None
) -> dict[str, Any] | list[dict[str, Any]]:
    """
    Handle an incoming RPC request using pre-compiled Procedures.

    A single-operation payload (a dict) dispatches exactly one procedure.
    A batch payload (a list) dispatches each operation sequentially through
    the same path and returns one response per operation, in the same order.

    Batches are a transport optimization, not a transaction: each operation
    is independent and keeps its own result or error.
    """
    if router is None:
        router = default_router

    if isinstance(payload, list):
        if len(payload) > MAX_BATCH_SIZE:
            error = RpcErrorModel(
                code=-32600,
                message=f"Batch too large: {len(payload)} operations (max {MAX_BATCH_SIZE})",
            )
            return [
                {"id": op.get("id") if isinstance(op, dict) else None, "result": None, "error": error.model_dump()}
                for op in payload
            ]
        return [await _handle_single(op, router) for op in payload]

    return await _handle_single(payload, router)


async def _handle_single(payload: Any, router: Router) -> dict[str, Any]:
    request_id = None
    if isinstance(payload, dict):
        request_id = payload.get("id")
    if not isinstance(payload, dict):
        return RpcResponse(
            id=request_id,
            error=RpcErrorModel(
                code=-32600,
                message="Invalid request: expected an object",
            ),
        ).model_dump()
    try:
        # 1. Parse Envelope
        try:
            request = RpcRequest.model_validate(payload)
        except ValidationError as e:
            return RpcResponse(
                id=request_id,
                error=RpcErrorModel(
                    code=-32600,
                    message="Invalid request",
                    data=_format_validation_error(e)
                ),
            ).model_dump()

        # 2. Find Procedure
        procedure = router.get(request.method)
        if not procedure:
            return RpcResponse(
                id=request_id,
                error=RpcErrorModel(code=-32601, message=f"Method not found: {request.method}"),
            ).model_dump()

        # 3. Execute Procedure (Validation and Call happens inside)
        try:
            result = await procedure.execute(request.params if request.params is not None else {})
            return RpcResponse(id=request_id, result=result).model_dump()

        except ProcedureError as pe:
            return RpcResponse(
                id=request_id,
                error=RpcErrorModel(
                    code=pe.code,
                    message=pe.message,
                    data=pe.data
                ),
            ).model_dump()
        except Exception as e:
            return RpcResponse(
                id=request_id,
                error=RpcErrorModel(code=-32603, message=str(e)),
            ).model_dump()

    except Exception as e:
        return RpcResponse(
            id=request_id,
            error=RpcErrorModel(code=-32600, message=f"Invalid request: {str(e)}"),
        ).model_dump()