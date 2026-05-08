import threading
from typing import Any, Callable, Dict, List, Optional


class Router:
    """
    A Router manages a set of RPC procedures. 
    It can be used as a decorator and merged with other routers.
    """

    def __init__(self) -> None:
        self._procedures: Dict[str, Callable[..., Any]] = {}
        self._lock = threading.Lock()

    def rpc(self, name_or_fn: Any = None) -> Any:
        """
        Decorator to register a function as an RPC procedure.
        Usage: 
            @router.rpc
            def my_func(): ...
            
            @router.rpc(name="custom_name")
            def my_func(): ...
        """
        def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
            name = name_or_fn if isinstance(name_or_fn, str) else fn.__name__
            self.register(name, fn)
            return fn

        if callable(name_or_fn):
            return decorator(name_or_fn)
        return decorator

    def register(self, name: str, fn: Callable[..., Any]) -> None:
        with self._lock:
            self._procedures[name] = fn

    def merge(self, other: "Router", prefix: str = "") -> None:
        """Merge another router into this one, optionally with a prefix."""
        with other._lock:
            with self._lock:
                for name, fn in other._procedures.items():
                    new_name = f"{prefix}{name}" if prefix else name
                    self._procedures[new_name] = fn

    def get(self, name: str) -> Optional[Callable[..., Any]]:
        with self._lock:
            return self._procedures.get(name)

    def list(self) -> List[str]:
        with self._lock:
            return list(self._procedures.keys())
