from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field


class RpcRequest(BaseModel):
    """
    Represents an RPC request.
    """

    id: Optional[Union[str, int]] = None
    method: str
    params: Optional[Union[List[Any], Dict[str, Any]]] = None


class RpcErrorModel(BaseModel):
    code: int
    message: str


class RpcResponse(BaseModel):
    """
    Represents an RPC response.
    """

    id: Optional[Union[int, str]] = None
    result: Optional[Any] = None
    error: Optional[RpcErrorModel] = None
