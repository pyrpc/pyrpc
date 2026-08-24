import asyncio
import uuid
from typing import Any

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
        async_client: httpx.AsyncClient | None = None,
        sync_client: httpx.Client | None = None
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
        self._schema_loaded = False
        self._schema_fetch_attempted = False
        self._is_async_cache: dict[str, bool] = {}

    def set_schema(self, schema: dict[str, bool]) -> None:
        """Manually set procedure schema for sync/async dispatch.

        Bypasses the HTTP introspection fetch. Useful for testing or when
        the metadata is known ahead of time.

        Args:
            schema: Mapping of procedure name → ``is_async`` flag.
        """
        self._is_async_cache = schema.copy()
        self._schema_loaded = True
        self._schema_fetch_attempted = True

    def _ensure_schema_loaded(self) -> None:
        """Lazily fetch procedure metadata from the server's GET /rpc introspection endpoint.

        Only attempts once; on failure falls back to legacy event-loop detection.
        """
        if self._schema_fetch_attempted:
            return
        self._schema_fetch_attempted = True
        try:
            response = self._sync_client.get("/rpc")
            response.raise_for_status()
            data = response.json()
            for method_name, schema_data in data.items():
                if isinstance(schema_data, dict):
                    self._is_async_cache[method_name] = schema_data.get("is_async", False)
            self._schema_loaded = True
        except Exception:
            pass

    def __getattr__(self, name: str) -> "RPCCallable":
        return RPCCallable(self, name)

    async def call_async(self, method: str, *args: Any, **kwargs: Any) -> Any:
        payload = self._prepare_payload(method, *args, **kwargs)
        response = await self._async_client.post("/rpc", json=payload)
        return self._handle_response(response)

    def call_sync(self, method: str, *args: Any, **kwargs: Any) -> Any:
        payload = self._prepare_payload(method, *args, **kwargs)
        response = self._sync_client.post("/rpc", json=payload)
        return self._handle_response(response)

    def _prepare_payload(self, method: str, *args: Any, **kwargs: Any) -> dict[str, Any]:
        params: list[Any] | dict[str, Any]
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
    Supports sync call, async call (via .aio()), and direct await.
    """

    def __init__(self, client: RPCClient, method: str):
        self.client = client
        self.method = method

    def __call__(self, *args: Any, **kwargs: Any) -> Any:
        """
        Dispatch based on the server-side procedure type when schema is available.

        - If the server procedure is async → returns an awaitable (requires ``await``).
        - If the server procedure is sync → calls synchronously and returns the value directly.
        - If schema is unavailable → falls back to legacy event-loop detection.
        """
        self._args = args
        self._kwargs = kwargs

        # Try schema-based dispatch first
        self.client._ensure_schema_loaded()
        if self.client._schema_loaded and self.method in self.client._is_async_cache:
            if self.client._is_async_cache[self.method]:
                return self.client.call_async(self.method, *args, **kwargs)
            return self.client.call_sync(self.method, *args, **kwargs)

        # Fallback: detect running event loop
        try:
            asyncio.get_running_loop()
            return self.client.call_async(self.method, *args, **kwargs)
        except RuntimeError:
            return self.client.call_sync(self.method, *args, **kwargs)

    async def aio(self, *args: Any, **kwargs: Any) -> Any:
        return await self.client.call_async(self.method, *args, **kwargs)
