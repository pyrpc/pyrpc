import asyncio
import inspect
from typing import Any, Dict, Optional

from .decorators import default_router
from .registry import Router
from pydantic import ValidationError

from .models import RpcErrorModel, RpcRequest, RpcResponse

from .procedure import Procedure, ProcedureError, _format_validation_error

async def handle_request(
    payload: Dict[str, Any], 
    router: Optional[Router] = None
) -> Dict[str, Any]:
    """
    Handle an incoming RPC request using pre-compiled Procedures.
    """
    if router is None:
        router = default_router

    request_id = payload.get("id")
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
