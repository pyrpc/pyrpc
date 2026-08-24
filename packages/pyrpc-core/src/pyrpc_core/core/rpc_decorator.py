from collections.abc import Callable
from typing import Any, Literal

from .procedure import Procedure

ProcedureKind = Literal["query", "mutation"]


class RpcDecorator:
    """
    Callable decorator namespace supporting:

        @router.rpc
        @router.rpc("name")
        @router.rpc.query
        @router.rpc.mutation
        @router.rpc.query("name")
        @router.rpc.mutation("name")

    Bare ``@rpc`` defaults to kind ``query`` for backward compatibility.
    """

    def __init__(self, router: Any, kind: ProcedureKind | None = None) -> None:
        self._router = router
        self._kind = kind

    @property
    def query(self) -> "RpcDecorator":
        return RpcDecorator(self._router, "query")

    @property
    def mutation(self) -> "RpcDecorator":
        return RpcDecorator(self._router, "mutation")

    def __call__(self, name_or_fn: Any = None) -> Any:
        kind: ProcedureKind = self._kind or "query"

        def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
            name = name_or_fn if isinstance(name_or_fn, str) else fn.__name__
            proc = Procedure(fn, name=name, kind=kind)
            self._router.register(name, proc)
            return fn

        if callable(name_or_fn):
            return decorator(name_or_fn)
        return decorator
