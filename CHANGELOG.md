# Changelog

## 0.8.0 (2026-06-14)

### Features

- **codegen**: Adopt `jsonschema-ts` v0.3.0 npx daemon for sub-10ms type generation. Instead of spawning `npx json-schema-to-typescript` as a subprocess on every conversion (3.3s/call), a persistent Node.js process runs in the background, keeping `json-schema-to-typescript` loaded in V8's code cache. Subsequent conversions drop to ~4.6ms — a ~715x speedup.
- **dev**: Reduce file watcher debounce from 1.6s to 200ms for faster type regeneration on save.

### Chores

- **version**: Bump all packages to v0.8.0 (pyrpc-core, pyrpc-codegen, pyrpc-flask, pyrpc-fastapi, pyrpc-django-adapter, @pyrpc/client, @pyrpc/types)
- **deps**: Pin `jsonschema-ts>=0.3.0` in pyrpc-codegen
- **docs**: Add blog post and codegen docs for npx daemon architecture

## 0.7.7 (2026-06-14)

### Bug Fixes

- **codegen**: Pin `jsonschema-ts>=0.2.1` to pull in the Windows `npx.cmd` fix. `jsonschema-ts` v0.2.0 called `subprocess.run(["npx", ...])` without `shell=True`. On Windows, `npx` is a script file (not `.exe`/`.com`) so `CreateProcess` cannot run it directly — `[WinError 2]` is raised. v0.2.1 uses `"npx.cmd"` on `os.name == "nt"`, resolving the error.

### Chores

- **version**: Bump all packages to v0.7.7 (pyrpc-core, pyrpc-codegen, pyrpc-flask, pyrpc-fastapi, pyrpc-django-adapter, @pyrpc/client, @pyrpc/types)
- **deps**: Pin `jsonschema-ts>=0.2.1` in pyrpc-codegen, `pyrpc-codegen>=0.7.7` in pyrpc-core, and `pyrpc-core>=0.7.7` in adapter packages

## 0.7.6 (2026-06-14)

### Bug Fixes

- **core**: Pin `pyrpc-codegen>=0.7.6` dependency to ensure `jsonschema-ts>=0.2.0` is pulled in correctly on fresh installs. Previously `pyrpc-core` had no version constraint on `pyrpc-codegen`, so older versions (0.6.x) that required only `jsonschema-ts>=0.1.0` could be installed, causing `ensure_inline_models` import errors.
- **cli**: Make `__version__` dynamic — `cli.py` now imports it from `pyrpc_core.__init__` instead of a hardcoded `"0.3.3"` string that was never updated.

### Chores

- **version**: Bump all packages to v0.7.6 (pyrpc-core, pyrpc-codegen, pyrpc-flask, pyrpc-fastapi, pyrpc-django-adapter, @pyrpc/client, @pyrpc/types)
- **deps**: Pin `pyrpc-core>=0.7.6` in flask, fastapi, and django adapter packages
- **tooling**: Update `scripts/release.mjs` to also sync `__init__.py` `__version__`
- **housekeeping**: Add `pyrpc-client.json` to `.gitignore`, remove unused `scripts/seed_downloads.py`

## 0.7.5 (2026-06-13)

### Bug Fixes

- **codegen**: Fix model type inference for `@model` dataclasses and `BaseModel`. Updated `jsonschema-ts` dependency to v0.2.0 which fixes `_to_safe_name()` PascalCase conversion and adds native `ensure_inline_models()` for promoting inline object schemas into `$defs`. The band-aid `_ensure_inlined_model()` workaround is removed in favor of the library's built-in solution.

## 0.7.4 (2026-06-13)

### Features

- **cli**: Reordered setup wizard prompts to ask distribution mode before entry point. The new order (Framework → Distribution → Entry point → Client root) places the high-level architectural decision (monorepo vs separate projects) before the implementation detail of the module path.

### Documentation

- **community**: Filled contributing, testimonials, and sponsors pages with real content
- **plugins**: Removed empty plugins section from navigation
- **extras**: Filled FAQ, Spec, and Further Reading pages
- **references**: Wrote full API references for Core, Python Client, and TypeScript Client
- Fixed reference meta.json to match actual page slugs

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
