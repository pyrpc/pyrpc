import asyncio
import inspect
from typing import Any, Dict

from .decorators import default_registry
from .models import RpcErrorModel, RpcRequest, RpcResponse


async def handle_request(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle an incoming RPC request.

    Args:
        payload: The raw dictionary representing the RPC request.

    Returns:
        A dictionary representing the RPC response.
    """
    request_id = payload.get("id")
    try:
        # 1. Parse Request
        request = RpcRequest.model_validate(payload)

        # 2. Find Procedure
        procedure = default_registry.get(request.method)
        if not procedure:
            return RpcResponse(
                id=request_id,
                error=RpcErrorModel(code=404, message=f"Method not found: {request.method}"),
            ).model_dump()

        # 3. Call Function (support both sync and async)
        params = request.params or {}

        try:
            if isinstance(params, list):
                result = procedure(*params)
            else:
                result = procedure(**params)

            if inspect.isawaitable(result):
                result = await result

            return RpcResponse(id=request_id, result=result).model_dump()


        except Exception as e:
            return RpcResponse(
                id=request_id, error=RpcErrorModel(code=500, message=str(e))
            ).model_dump()

    except Exception as e:
        # Handle parsing errors or other unexpected errors
        return RpcResponse(
            id=request_id, error=RpcErrorModel(code=400, message=f"Invalid request: {str(e)}")
        ).model_dump()
