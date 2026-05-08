import asyncio
import inspect
from typing import Any, Dict, Optional

from .decorators import default_router
from .registry import Router
from .models import RpcErrorModel, RpcRequest, RpcResponse


from pydantic import TypeAdapter, ValidationError

def _format_validation_error(e: ValidationError) -> Dict[str, Any]:
    errors = e.errors()
    if not errors:
        return {"field": "unknown", "message": "Validation failed"}
    
    first_error = errors[0]
    loc = ".".join(str(l) for l in first_error.get("loc", []))
    return {
        "field": loc,
        "message": first_error.get("msg", "Validation failed"),
        "type": first_error.get("type", "unknown")
    }

async def handle_request(
    payload: Dict[str, Any], 
    router: Optional[Router] = None
) -> Dict[str, Any]:
    """
    Handle an incoming RPC request with automatic Pydantic validation.
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

        # 3. Validation Logic
        params = request.params if request.params is not None else {}
        sig = inspect.signature(procedure)
        bound_args = None

        try:
            # Match params to signature
            if isinstance(params, list):
                bound_args = sig.bind(*params)
            elif isinstance(params, dict):
                bound_args = sig.bind(**params)
            else:
                raise TypeError("Params must be a list or dict")
            
            # Apply universal validation
            for name, value in bound_args.arguments.items():
                param_type = sig.parameters[name].annotation
                if param_type is not inspect.Parameter.empty and param_type is not Any:
                    adapter = TypeAdapter(param_type)
                    try:
                        bound_args.arguments[name] = adapter.validate_python(value)
                    except ValidationError as ve:
                        # Re-format error to include the parameter name
                        error_data = _format_validation_error(ve)
                        if not error_data.get("field"):
                            error_data["field"] = name
                        return RpcResponse(
                            id=request_id,
                            error=RpcErrorModel(
                                code=-32602, 
                                message="Validation failed",
                                data=error_data
                            ),
                        ).model_dump()

        except TypeError as e:
            return RpcResponse(
                id=request_id,
                error=RpcErrorModel(code=-32602, message=f"Invalid params: {str(e)}"),
            ).model_dump()

        # 4. Call Function
        try:
            result = procedure(*bound_args.args, **bound_args.kwargs)
            if inspect.isawaitable(result):
                result = await result

            # 5. Validate Return Type (if specified)
            return_type = sig.return_annotation
            if return_type is not inspect.Signature.empty and return_type is not Any:
                adapter = TypeAdapter(return_type)
                result = adapter.validate_python(result)

            return RpcResponse(id=request_id, result=result).model_dump()

        except ValidationError as e:
             return RpcResponse(
                id=request_id,
                error=RpcErrorModel(
                    code=-32603, 
                    message="Internal Error: Return type validation failed",
                    data=_format_validation_error(e)
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
