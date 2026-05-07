import inspect
from typing import Any, Callable, Dict, List, Optional, Type

from pydantic import BaseModel, TypeAdapter


class ParameterSchema(BaseModel):
    name: str
    type: str
    schema_: Dict[str, Any]
    required: bool
    default: Optional[Any] = None


class ProcedureSchema(BaseModel):
    name: str
    parameters: List[ParameterSchema]
    return_type: str
    return_schema: Dict[str, Any]
    doc: Optional[str] = None


def get_procedure_schema(func: Callable[..., Any], name: Optional[str] = None) -> ProcedureSchema:
    """
    Introspect a function and return its schema.
    """
    sig = inspect.signature(func)
    parameters = []

    for param_name, param in sig.parameters.items():
        # Get parameter type
        param_type = param.annotation if param.annotation is not inspect.Parameter.empty else Any
        
        # Generate JSON schema for the type using Pydantic
        try:
            adapter = TypeAdapter(param_type)
            param_json_schema = adapter.json_schema()
        except Exception:
            param_json_schema = {"type": "any"}

        parameters.append(
            ParameterSchema(
                name=param_name,
                type=str(param_type),
                schema_=param_json_schema,
                required=param.default is inspect.Parameter.empty,
                default=param.default if param.default is not inspect.Parameter.empty else None,
            )
        )

    # Get return type
    return_type = sig.return_annotation if sig.return_annotation is not inspect.Signature.empty else Any
    try:
        return_adapter = TypeAdapter(return_type)
        return_json_schema = return_adapter.json_schema()
    except Exception:
        return_json_schema = {"type": "any"}

    return ProcedureSchema(
        name=name or func.__name__,
        parameters=parameters,
        return_type=str(return_type),
        return_schema=return_json_schema,
        doc=inspect.getdoc(func),
    )


def get_registry_schema(registry: Any) -> Dict[str, ProcedureSchema]:
    """
    Generate schemas for all procedures in a registry.
    """
    schemas = {}
    # registry._procedures is a dict mapping name to func
    for name, func in registry._procedures.items():
        schemas[name] = get_procedure_schema(func, name=name)
    return schemas
