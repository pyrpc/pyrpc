import inspect
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from .procedure import Procedure


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


def get_procedure_schema(proc: Procedure) -> ProcedureSchema:
    """
    Generate a schema from a compiled Procedure.
    """
    parameters = []

    for param_name, param in proc.sig.parameters.items():
        # Get parameter type
        param_type = param.annotation if param.annotation is not inspect.Parameter.empty else Any
        
        # Use pre-built adapter if available
        adapter = proc.arg_adapters.get(param_name)
        if adapter:
            param_json_schema = adapter.json_schema()
        else:
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
    return_type = proc.sig.return_annotation if proc.sig.return_annotation is not inspect.Signature.empty else Any
    if proc.return_adapter:
        return_json_schema = proc.return_adapter.json_schema()
    else:
        return_json_schema = {"type": "any"}

    return ProcedureSchema(
        name=proc.name,
        parameters=parameters,
        return_type=str(return_type),
        return_schema=return_json_schema,
        doc=inspect.getdoc(proc.fn),
    )


def get_registry_schema(router: Any) -> Dict[str, ProcedureSchema]:
    """
    Generate schemas for all procedures in a router.
    """
    schemas = {}
    for name, proc in router._procedures.items():
        schemas[name] = get_procedure_schema(proc)
    return schemas
