import inspect
import asyncio
from typing import Any, Callable, Dict, Literal, Optional, List
from pydantic import TypeAdapter, ValidationError

ProcedureKind = Literal["query", "mutation"]

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

class ProcedureError(Exception):
    def __init__(self, code: int, message: str, data: Optional[Dict[str, Any]] = None):
        self.code = code
        self.message = message
        self.data = data or {}

class Procedure:
    """
    Represents a 'compiled' RPC procedure.
    All expensive introspection and validator setup happens during initialization.
    """

    def __init__(
        self,
        fn: Callable[..., Any],
        name: Optional[str] = None,
        kind: ProcedureKind = "query",
    ):
        self.fn = fn
        self.name = name or fn.__name__
        self.kind: ProcedureKind = kind
        self.sig = inspect.signature(fn)
        self.is_async = inspect.iscoroutinefunction(fn)
        
        # Pre-build Pydantic TypeAdapters for all parameters
        self.arg_adapters: Dict[str, TypeAdapter] = {}
        for param_name, param in self.sig.parameters.items():
            if param.annotation is not inspect.Parameter.empty and param.annotation is not Any:
                self.arg_adapters[param_name] = TypeAdapter(param.annotation)
        
        # Pre-build Return TypeAdapter
        self.return_adapter: Optional[TypeAdapter] = None
        if self.sig.return_annotation is not inspect.Signature.empty and self.sig.return_annotation is not Any:
            self.return_adapter = TypeAdapter(self.sig.return_annotation)

    async def execute(self, params: Any) -> Any:
        """
        Execute the procedure with the given parameters.
        This is the optimized 'hot path' for RPC requests.
        """
        # 1. Bind arguments
        try:
            if isinstance(params, list):
                bound_args = self.sig.bind(*params)
            elif isinstance(params, dict):
                bound_args = self.sig.bind(**params)
            else:
                raise TypeError("Params must be a list or dict")
        except TypeError as e:
            raise ProcedureError(code=-32602, message=f"Invalid params: {str(e)}")

        # 2. Validate arguments using pre-built adapters
        for name, value in bound_args.arguments.items():
            adapter = self.arg_adapters.get(name)
            if adapter:
                try:
                    bound_args.arguments[name] = adapter.validate_python(value)
                except ValidationError as ve:
                    # Enrich the error with the parameter name if missing
                    error_data = _format_validation_error(ve)
                    if not error_data.get("field") or error_data["field"] == "unknown":
                        error_data["field"] = name
                    raise ProcedureError(code=-32602, message="Validation failed", data=error_data)

        # 3. Call the function (Sync or Async)
        if self.is_async:
            result = await self.fn(*bound_args.args, **bound_args.kwargs)
        else:
            result = self.fn(*bound_args.args, **bound_args.kwargs)

        # 4. Validate return type
        if self.return_adapter:
            try:
                result = self.return_adapter.validate_python(result)
            except ValidationError as ve:
                error_data = _format_validation_error(ve)
                raise ProcedureError(code=-32603, message="Internal Error: Return type validation failed", data=error_data)

        return result
