import threading
from typing import Any, Callable, Dict, List, Optional
from .procedure import Procedure

class Router:
    """
    A Router manages a set of RPC procedures. 
    It can be used as a decorator and merged with other routers.
    """

    def __init__(self) -> None:
        self._procedures: Dict[str, Procedure] = {}
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
            proc = Procedure(fn, name=name)
            self.register(name, proc)
            return fn

        if callable(name_or_fn):
            return decorator(name_or_fn)
        return decorator

    def register(self, name: str, proc: Procedure) -> None:
        with self._lock:
            self._procedures[name] = proc

    def merge(self, other: "Router", prefix: str = "") -> None:
        """Merge another router into this one, optionally with a prefix."""
        with other._lock:
            with self._lock:
                for name, proc in other._procedures.items():
                    new_name = f"{prefix}{name}" if prefix else name
                    # Create a new Procedure with the prefixed name if necessary
                    # though proc.name is mostly for introspection
                    self._procedures[new_name] = proc

    def get(self, name: str) -> Optional[Procedure]:
        with self._lock:
            return self._procedures.get(name)

    def list(self) -> List[str]:
        with self._lock:
            return list(self._procedures.keys())

    def reload_module(self, module_path: str) -> bool:
        """Reload a Python module and atomically replace this router's procedures.

        Clears the router, reloads the module (which re-fires @rpc decorators
        and registers in this router), and restores the old procedures on
        failure or if the module exports no procedures.

        NOTE: This only works correctly when the module's @rpc decorator is
        bound to this router instance (e.g. the global ``from pyrpc_core import rpc``
        which is ``default_router.rpc``).

        Returns True if the router was updated, False otherwise.
        """
        import importlib

        mod = importlib.import_module(module_path)
        with self._lock:
            old = dict(self._procedures)
            self._procedures.clear()

        try:
            importlib.reload(mod)
        except BaseException:
            with self._lock:
                self._procedures.update(old)
            raise

        with self._lock:
            if not self._procedures:
                self._procedures.update(old)
                return False
            return True
