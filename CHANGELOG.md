# Changelog

## 0.7.0 (2026-06-12)

### Features

- **python-client**: Schema-based sync/async dispatch. Python client now fetches procedure metadata from the server's `GET /rpc` introspection endpoint and uses it to determine whether a procedure is sync or async.
  - Sync server procedures → `client.proc()` returns the value directly (no `await`)
  - Async server procedures → `client.proc()` returns an awaitable coroutine
  - `.aio()` remains as an explicit async override for any procedure
  - Falls back to legacy event-loop detection when schema is unavailable
  - Added `client.set_schema()` for manual schema injection

- **introspection**: Added `is_async` field to `ProcedureSchema`, exposed via `GET /rpc` for all adapters (ASGI, FastAPI, Flask)

### Chores

- **asgi**: Hoisted `get_registry_schema` import to top level in `PyRPCAsgiApp` for explicit dependency declaration
