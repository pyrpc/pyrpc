import functools
from typing import Any, Callable, Optional, Union, overload

from .registry import ProcedureRegistry

# Global default registry for easy use
default_registry = ProcedureRegistry()


@overload
def rpc(fn: Callable[..., Any]) -> Callable[..., Any]: ...


@overload
def rpc(*, name: str) -> Callable[[Callable[..., Any]], Callable[..., Any]]: ...


def rpc(
    fn: Optional[Callable[..., Any]] = None, *, name: Optional[str] = None
) -> Union[Callable[..., Any], Callable[[Callable[..., Any]], Callable[..., Any]]]:
    """
    Decorator to register a function as an RPC procedure.

    Usage:
        @rpc
        def my_func(): ...

        @rpc(name="custom_name")
        def my_func(): ...
    """

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        procedure_name = name or func.__name__

        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            return func(*args, **kwargs)

        default_registry.register(procedure_name, wrapper)
        return wrapper


    if fn is None:
        return decorator
    return decorator(fn)
