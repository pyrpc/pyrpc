# Changelog

## 0.7.3 (2026-06-13)

### Features

- **django**: New `pyrpc-django-adapter` package with native `mount_django()` support for Django 4.2+. The adapter uses Django's async view support directly (no `anyio.run` bridge) and exposes both `POST /rpc` and `GET /rpc` endpoints for procedure dispatch and introspection. Install with `pip install pyrpc-django-adapter` or `pip install pyrpc-core[django]`.

### Bug Fixes

- **fastapi/flask**: Fixed `AttributeError` when calling `get_registry_schema()` with no router argument. Both `mount_fastapi()` and `mount_flask()` now resolve `router or default_router` before passing to introspection, matching the Django adapter pattern.

### Chores

- **ci**: Added `pyrpc-django-adapter` to the automated build-and-publish workflow for PyPI releases.

## 0.7.2 (2026-06-13)

### Bug Fixes

- **codegen/client**: Resolve model type references with lowercase or module-qualified names. The type mappers in `ts_codegen.py`, `cli.js`, and `postinstall.js` returned `any` for models whose `str()` representation included a module prefix (e.g., `<class '__main__.user'>`) or used lowercase names, because they checked `name[0].isupper()` before returning the reference. Module prefixes are now stripped and the bare class name is used directly, fixing type inference for all models regardless of naming convention.

### Chores

- **cli**: Rewrite help text and prompts to describe distribution modes by user scenario (monorepo vs separate projects) rather than implementation details. Module arguments now say "Entry point to your application" instead of "Python module to scan for @rpc procedures".

## 0.7.1 (2026-06-13)

### Bug Fixes

- **codegen/client**: Resolve model type references with lowercase or module-qualified names. The type mappers in `ts_codegen.py`, `cli.js`, and `postinstall.js` returned `any` for models whose `str()` representation included a module prefix (e.g., `<class '__main__.user'>`) or used lowercase names, because they checked `name[0].isupper()` before returning the reference. Module prefixes are now stripped and the bare class name is used directly, fixing type inference for all models regardless of naming convention.

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
