import threading
from typing import Any, Callable, Dict, List, Optional


class ProcedureRegistry:
    """
    A thread-safe registry for storing and retrieving procedures by name.
    """

    def __init__(self) -> None:
        self._procedures: Dict[str, Callable[..., Any]] = {}
        self._lock = threading.Lock()

    def register(self, name: str, fn: Callable[..., Any]) -> None:
        """
        Register a procedure with the given name.

        Args:
            name: The name of the procedure.
            fn: The function/callable to register.
        """
        with self._lock:
            self._procedures[name] = fn

    def get(self, name: str) -> Optional[Callable[..., Any]]:
        """
        Retrieve a procedure by name.

        Args:
            name: The name of the procedure.

        Returns:
            The registered function if found, otherwise None.
        """
        with self._lock:
            return self._procedures.get(name)

    def list(self) -> List[str]:
        """
        List all registered procedure names.

        Returns:
            A list of names.
        """
        with self._lock:
            return list(self._procedures.keys())
