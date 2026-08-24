from typing import Any

from pydantic import BaseModel


class RpcRequest(BaseModel):
    """
    Represents an RPC request.
    """

    id: str | int | None = None
    method: str
    params: list[Any] | dict[str, Any] | None = None


class RpcErrorModel(BaseModel):
    code: int
    message: str
    data: Any | None = None


class RpcResponse(BaseModel):
    """
    Represents an RPC response.
    """

    id: int | str | None = None
    result: Any | None = None
    error: RpcErrorModel | None = None
