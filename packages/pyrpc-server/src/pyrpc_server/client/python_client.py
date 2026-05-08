import uuid
from typing import Any, Dict, List, Optional, Union

import httpx


class RPCError(Exception):
    """
    Structured RPC error.
    """

    def __init__(self, code: int, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(f"RPC {code}: {message}")


class RPCClient:
    """
    A dynamic RPC client for pyRPC.
    Allows calling remote procedures as if they were local methods.
    """

    def __init__(
        self, 
        base_url: str, 
        async_client: Optional[httpx.AsyncClient] = None,
        sync_client: Optional[httpx.Client] = None
    ) -> None:
        """
        Initialize the RPC client.

        Args:
            base_url: The base URL of the pyRPC server.
            async_client: Optional custom async httpx client.
            sync_client: Optional custom sync httpx client.
        """
        self.base_url = base_url.rstrip("/")
        self._async_client = async_client or httpx.AsyncClient(base_url=self.base_url)
        self._sync_client = sync_client or httpx.Client(base_url=self.base_url)

    def __getattr__(self, name: str) -> Any:
        """
        Returns a callable that executes the RPC.
        Defaults to sync execution unless used in an async context or explicitly called.
        """

        class CallableRPC:
            def __init__(self, client: "RPCClient", method: str):
                self.client = client
                self.method = method

            def __call__(self, *args: Any, **kwargs: Any) -> Any:
                return self.client.call_sync(self.method, *args, **kwargs)

            def __await__(self):
                # This is a bit tricky for a dual-purpose object.
                # Usually, we'd want `await client.add(1, 2)` to work.
                # However, `client.add(1, 2)` is already called.
                # So we return the result of call_async if it was awaited.
                # But `client.add(1, 2)` returns a result, not a coroutine.
                # To support both, we'd need the __getattr__ to return an object 
                # that is both a callable and awaitable.
                pass

        # Simplified approach: expose explicit call_async and call_sync, 
        # and make __getattr__ return an object that decides based on usage?
        # Actually, let's stick to the original robust suggestion of clear separation 
        # but keep the convenience of dynamic calls by returning a helper.
        
        return RPCCallable(self, name)

    async def call_async(self, method: str, *args: Any, **kwargs: Any) -> Any:
        payload = self._prepare_payload(method, *args, **kwargs)
        response = await self._async_client.post("/rpc", json=payload)
        return self._handle_response(response)

    def call_sync(self, method: str, *args: Any, **kwargs: Any) -> Any:
        payload = self._prepare_payload(method, *args, **kwargs)
        response = self._sync_client.post("/rpc", json=payload)
        return self._handle_response(response)

    def _prepare_payload(self, method: str, *args: Any, **kwargs: Any) -> Dict[str, Any]:
        params: Union[List[Any], Dict[str, Any]]
        if kwargs:
            params = kwargs
        else:
            params = list(args)

        return {
            "id": str(uuid.uuid4()),
            "method": method,
            "params": params,
        }

    def _handle_response(self, response: httpx.Response) -> Any:
        response.raise_for_status()
        data = response.json()
        if "error" in data and data["error"]:
            error = data["error"]
            raise RPCError(error["code"], error["message"])
        return data.get("result")

    async def aclose(self) -> None:
        await self._async_client.aclose()

    def close(self) -> None:
        self._sync_client.close()

    async def __aenter__(self) -> "RPCClient":
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        await self.aclose()

    def __enter__(self) -> "RPCClient":
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.close()


class RPCCallable:
    """
    Helper for dynamic method calls.
    Supports both sync call and async call (via .aio() or similar).
    """

    def __init__(self, client: RPCClient, method: str):
        self.client = client
        self.method = method

    def __call__(self, *args: Any, **kwargs: Any) -> Any:
        """Sync call by default."""
        return self.client.call_sync(self.method, *args, **kwargs)

    async def aio(self, *args: Any, **kwargs: Any) -> Any:
        """Explicit async call."""
        return await self.client.call_async(self.method, *args, **kwargs)
