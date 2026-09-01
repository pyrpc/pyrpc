export interface ReleaseSection {
    title: string;
    items: string[];
}

export interface Release {
    version: string;
    date: string;
    tag: string;
    description: string;
    sections: ReleaseSection[];
}

export const releases: Release[] = [
    {
        version: 'v0.14.1',
        date: '2026-08-27',
        tag: 'v0.14.1',
        description: 'Patch release: the FastAPI adapter now accepts batch requests. The type annotation on the /rpc endpoint was narrowed to dict, which caused FastAPI to reject JSON arrays before handle_request could process them.',
        sections: [
            {
                title: 'Bug Fixes',
                items: [
                    'FastAPI adapter: widened payload type annotation from `dict[str, Any]` to `dict[str, Any] | list[dict[str, Any]]` so batch requests (JSON arrays) pass through to `handle_request` instead of being rejected by FastAPI validation.',
                ],
            },
        ],
    },
    {
        version: 'v0.14.0',
        date: '2026-08-24',
        tag: 'v0.14.0',
        description: 'pyRPC now speaks MCP. Run pyrpc mcp inside your project and AI coding clients work from your real registry: full procedure introspection with JSON Schemas, argument validation that never executes your code, and dry-run-first codegen through the same pipeline as pyrpc codegen.',
        sections: [
            {
                title: 'Features',
                items: [
                    'Local MCP server: `pyrpc mcp` serves the standard MCP stdio transport on the official Python SDK (spec 2026-07-28). Clients launch it as a subprocess in your project environment; the server imports your configured backend module and answers from the live registry, never from static parsing.',
                    '`introspect_project` returns framework, entrypoint, types module, configured clients, and every registered procedure with kind (query/mutation), parameter names, types, requiredness, defaults, docstrings, and full input/output JSON Schemas via `get_registry_schema`.',
                    '`check_call` validates hypothetical arguments against a procedure\'s real pydantic TypeAdapters without executing it, returning structured per-parameter errors. Binding and validation were extracted into `Procedure.validate_args`, shared by both the RPC hot path and MCP so they cannot drift.',
                    '`run_codegen` regenerates each configured client\'s `__pyrpc.ts` through `generate_typescript_client`/`save_typescript_client`. `dry_run=true` by default: targets are reported as up to date, would update, or would create, byte-compared against the exact renderer. Only generated files are written; tsconfig and bundler setup stay with `pyrpc init`/`pyrpc codegen`.',
                    'Tool annotations are declared honestly: read-only tools set `readOnlyHint` and `openWorldHint=false`; codegen sets `readOnlyHint=false`, `destructiveHint=false`, `idempotentHint=true`.',
                ],
            },
            {
                title: 'Security',
                items: [
                    'No procedure execution tool exists: agents can introspect schemas and validate payloads but can never trigger backend side effects through MCP. A sentinel test registers a file-writing procedure and proves check_call leaves no trace.',
                    'The server is local-only stdio with no telemetry and no network egress. stdout carries protocol frames exclusively while serving; all diagnostics go to stderr via logging, enforced by tests that parse every stdout line as JSON-RPC.',
                ],
            },
            {
                title: 'Packaging',
                items: [
                    'The MCP SDK ships as an optional extra: `uv add "pyrpc-core[mcp]"`. Production installs of plain pyrpc-core stay lean (the SDK pulls cryptography, starlette, and OpenTelemetry API). Plain installs running `pyrpc mcp` print the exact remediation commands on stderr and exit 2.',
                ],
            },
            {
                title: 'Fixes',
                items: [
                    'Client root paths in MCP output are posix-normalized on every platform; Windows runners caught native backslash separators leaking into agent-facing paths.',
                ],
            },
            {
                title: 'Documentation',
                items: [
                    'New MCP guide under Get Started: how it works, copy-paste client configuration for Claude Code, Cursor, VS Code, Claude Desktop, Windsurf, and OpenCode, the security model, example interactions, and troubleshooting.',
                    'The landing page agent card now shows `pyrpc mcp` for the MCP tab.',
                ],
            },
        ],
    },
    {
        version: 'v0.13.0',
        date: '2026-08-24',
        tag: 'v0.13.0',
        description: 'The backend is now explicit: pyrpc.json declares your framework, entry point, and types module, and pyrpc dev launches each framework\u2019s native dev server (uvicorn, flask run, or manage.py runserver). The TypeScript client gains tRPC-style terminating links with automatic request batching, and the site ships a full visual redesign.',
        sections: [
            {
                title: 'Breaking Changes',
                items: [
                    'pyrpc.json moved from the flat `{ module, framework, client }` shape to a nested `{ backend: { framework, entrypoint, types_module }, clients: [{ framework, root }] }` schema. Legacy files are treated as unconfigured and rewritten in place the next time you run `pyrpc dev` \u2014 the wizard preselects whatever it can detect.',
                    '`pyrpc dev --yes` never guesses: it sniffs your code for `mount_fastapi(`/`mount_flask(`/`mount_django(` markers and exits nonzero with guidance when detection fails. Declare the framework explicitly with `--framework <fastapi|flask|django|asgi>`.',
                    'Scaffolded and example clients now use the links API (`createClient<Types>({ links: [httpBatchLink({ url })] })`). The previous constructor options are gone; see the migration guide for the mechanical rename.',
                ],
            },
            {
                title: 'Features',
                items: [
                    'Explicit backend configuration: a new validated `BackendSpec` model parses `pyrpc.json`, normalizes FastAPI/Flask/ASGI entry points to `module[:app]`, and treats Django\u2019s entry point as the path to `manage.py`. Unknown frameworks are rejected up front, before any config is touched.',
                    'Framework-native dev runners: `pyrpc dev` launches uvicorn for fastapi/asgi targets, Flask\u2019s own dev server (`flask --app <module:app> run`) for Flask, and `manage.py runserver` for Django (\u2013\u2013noreload when reload is disabled). No WSGI-to-ASGI bridging anywhere.',
                    'The setup wizard asks for the backend framework first. Sniffing only preselects \u2014 the choice is confirmed interactively. Django additionally requires a `types_module`: the module whose import registers `@rpc` procedures (typically the `views.py` that declares them), auto-detected as the shallowest `*/views.py` when possible.',
                    '`pyrpc watch` works without `pyrpc.json` again when you pass an explicit `--module`; with a config it reads `backend.types_module`, which fixes stale-type regen for split-module layouts where importing the entrypoint alone registers nothing.',
                    'The config watcher diffs the parsed spec: changing the backend in `pyrpc.json` terminates and relaunches the right server live; editing client roots re-wires codegen without a restart.',
                    'The client-root prompt gained filesystem autocomplete (via questionary.path): live directory suggestions jailed to the project root, dot dirs and node_modules hidden, symlink and `../` escapes filtered, Tab to accept.',
                ],
            },
            {
                title: 'TypeScript Client & Codegen',
                items: [
                    'Terminating links: `@pyrpc/client` now takes a `links` pipeline ending in exactly one terminating link \u2014 `httpLink` (one operation, one request) or `httpBatchLink` (many operations, one request). Non-terminating links (retry, auth, logging) can be composed in front.',
                    'Request batching end to end: `httpBatchLink` collects operations issued in the same scheduling window into a single JSON-array POST and resolves each caller independently; the interpreter dispatches every element sequentially through the normal router (max 100 per batch) and returns one response per operation, in order.',
                    'All four framework adapters (`@pyrpc/react`, `@pyrpc/next`, `@pyrpc/vue`, `@pyrpc/svelte`) accept and re-export the links, so `httpBatchLink` comes from your adapter package.',
                    'The codegen template now emits links-based client setup out of the box.',
                ],
            },
            {
                title: 'Fixes',
                items: [
                    '`pyrpc watch` no longer shadows the `watchfiles` import with its own function parameter, which crashed the command with a TypeError at startup.',
                    'Client-config tables across adapter docs had a mangled table cell; fixed, and the Svelte guide gained mutation-invalidation and query-key documentation for parity with React.',
                ],
            },
            {
                title: 'Website & Docs',
                items: [
                    'Full visual redesign: new brand assets, a unified light/dark theming system, and shared Shiki syntax themes so landing page, docs, and playground render code identically.',
                    'Docs restructured: server/client adapters split into their own sections, a dedicated Links section, a reference area, and an AI resources section (llms.txt, MCP, skills). File names now show as code-block titles in adapter guides.',
                    'Migrated the docs app to fumadocs 16.12 APIs and token names; playground editors match the site palette.',
                    'All 12 framework examples aligned with current APIs: links-based clients, correct provider scoping, working inputs and procedures, consistent branding, and a missing next.config.ts restored.',
                ],
            },
            {
                title: 'Tests',
                items: [
                    'New suites for launch-command resolution (argv matrix per framework, reload flags, Django manage.py handling), nested-config parsing/rejection, wizard flows including confirmed framework selection and Django prompts, and headless autocomplete jail tests.',
                    'A deterministic config-watch test drives the restart flow through a scripted watcher with a single writer, eliminating shutdown-vs-detection races.',
                ],
            },
        ],
    },
    {
        version: 'v0.12.1',
        date: '2026-08-16',
        tag: 'v0.12.1',
        description: 'Bug-fix release: bundler alias injection produces valid configs even for comment-only bodies, broken entry modules get a concise file:line error instead of an importlib traceback, and the dev/watch file watchers can no longer crash silently while the session looks healthy.',
        sections: [
            {
                title: 'Bug Fixes',
                items: [
                    'Bundler alias injection (Next.js Turbopack, Vite, SvelteKit) now picks its separator by scanning the config body for real tokens instead of checking if it is blank, so comment-only bodies (e.g. Next.js default `/* config options here */`) no longer produce a leading comma that made next.config.ts invalid TypeScript.',
                    'Entry-module import failures now show a concise, actionable error pointing at the exact file and line in the user\u2019s project (e.g. `\u2192 Fix the error in app/main.py:21`) instead of the full importlib traceback; failures inside pyRPC itself still keep the full traceback so internal bugs stay visible.',
                    '`pyrpc dev` and `pyrpc watch` no longer pass `stop_event` to `watch()` (unsupported by every watchfiles release), so the watcher threads can\u2019t crash at startup. Watcher failures are now printed, recorded, and exit nonzero (terminating uvicorn if pyRPC owns it) instead of leaving the session apparently healthy with dead watchers.',
                ],
            },
            {
                title: 'Tests',
                items: [
                    'Regression tests for comment-only Next.js/Vite alias injection, entry-module error reporting, watcher crash exit codes, and a guard asserting `watch()` never receives `stop_event`.',
                ],
            },
        ],
    },
    {
        version: 'v0.12.0',
        date: '2026-08-11',
        tag: 'v0.12.0',
        description: 'Generated types are now a real runtime module: codegen emits `<client>/__pyrpc.ts` with a runtime `procedureKinds` map, and pyrpc dev auto-configures bundler aliases so framework adapters only expose the hooks a procedure actually supports.',
        sections: [
            {
                title: 'Breaking Changes',
                items: [
                    'Generated types now land at `<client>/__pyrpc.ts` instead of `<client>/__pyrpc.d.ts`; the tsconfig paths alias is updated automatically by `pyrpc dev`, `pyrpc watch`, and `pyrpc codegen`.',
                    'The `@pyrpc/types` placeholder now throws on `procedureKinds` access until the generated module resolves, instead of silently exposing both query and mutation hooks on every procedure.',
                ],
            },
            {
                title: 'Features',
                items: [
                    'The generated module is a real runtime file: it carries the `Types` type, the `ProcedureKinds` type, and the runtime `procedureKinds` const that framework adapters read to expose only the matching hook per procedure.',
                    'Framework adapters (`@pyrpc/react`, `@pyrpc/next`, `@pyrpc/vue`, `@pyrpc/svelte`) now depend on `@pyrpc/types` at runtime and keep `@pyrpc/types` external in their bundles.',
                    'New `pyrpc_core.bundlers` module injects an explicit `"@pyrpc/types"` alias for bundlers that don\u2019t honor tsconfig paths for imports inside node_modules (Vite, SvelteKit, Next.js Turbopack), surfacing a clear warning when a config can\u2019t be auto-configured.',
                ],
            },
            {
                title: 'Tests',
                items: [
                    'New bundler-config injection suite covering Vite, SvelteKit, and Next.js config shapes, idempotency, and unknown-config fallbacks.',
                    'Adapter client tests pass explicit `kinds` so they don\u2019t trip the throwing placeholder.',
                ],
            },
        ],
    },
    {
        version: 'v0.11.1',
        date: '2026-08-11',
        tag: 'v0.11.1',
        description: 'Watcher regen now reloads edited modules so regenerated types reflect your latest code, and the setup wizard treats manual client entry as a first-class action.',
        sections: [
            {
                title: 'Bug Fixes',
                items: [
                    '`_do_regen` now reloads the entry module via `default_router.reload_module` (imported in scope) instead of re-importing the cached module, edited procedures are now reflected in regenerated types.',
                    '`_run_codegen` gains a `reload` flag; `_regenerate_clients` consolidates the per-client loop shared by `dev`, `watch`, and the debounced regen callback.',
                    'Setup wizard: "Enter a client path manually" is now a separate action, never a checkbox item, so detected-project selection is never silently discarded.',
                    '`_DevConsole._schemas` imports `default_router` locally.',
                ],
            },
            {
                title: 'Tests',
                items: [
                    'Regression tests for the wizard flow (manual entry path) and the real regen path (edited procedures reflected in output).',
                ],
            },
        ],
    },
    {
        version: 'v0.11.0',
        date: '2026-08-10',
        tag: 'v0.11.0',
        description: 'Multi-client support: pyrpc.json now stores one or more client project roots, and generated types always land at `<client>/__pyrpc.d.ts` with surgical tsconfig path injection via jsonc-edit.',
        sections: [
            {
                title: 'Features',
                items: [
                    'pyrpc.json now stores `client` (single root) or `clients` (list) instead of a single output path; generated types always land at `<client>/__pyrpc.d.ts`.',
                    'tsconfig path management via `jsonc-edit`: injects `"@pyrpc/types": ["./__pyrpc.d.ts"]` with surgical edits that preserve comments and trailing commas, is idempotent on repeat runs, and raises if the alias already points elsewhere.',
                    'Setup wizard walks the directory tree to detect frontend projects, multi-selects several clients, and configures each tsconfig.',
                    '`dev` and the watcher regenerate types for every client and re-wire automatically when pyrpc.json changes; `--module`/`--client` flags replace `--module`/`--output`.',
                    '`codegen` and `watch` take `--client` and normalize to the same `<client>/__pyrpc.d.ts` path.',
                    'Fixed missing import time in the debounced regen callback.',
                ],
            },
            {
                title: 'Bug Fixes',
                items: [
                    'Codegen header comment now references `./__pyrpc.d.ts` (the tsconfig alias) instead of `./src/__pyrpc.d.ts`, matching where types actually land.',
                ],
            },
            {
                title: 'Tests',
                items: [
                    'tsconfig editing suite: missing compilerOptions, missing paths, existing aliases with comments/trailing commas, idempotency, conflicting-alias errors, and no-tsconfig case.',
                    'CLI tests updated to the client-root model.',
                ],
            },
        ],
    },
    {
        version: 'v0.10.1',
        date: '2026-08-08',
        tag: 'v0.10.1',
        description: 'CLI --yes flag to skip the setup wizard, full docs rewrite for all 12 framework combinations, and 12 new tutorial blog posts.',
        sections: [
            {
                title: 'Features',
                items: [
                    '`pyrpc dev --yes` / `-y`: skip the first-run setup wizard entirely. Auto-detects entry module and output path.',
                    '`pyrpc dev --yes --module main --output ../client/src/__pyrpc.d.ts`: fully non-interactive, CI-safe execution.',
                    '`pyrpc dev --reconfigure`: re-run the setup wizard even when pyrpc.json already exists, pre-filling current values.',
                    '`pyrpc dev --module` / `-m` and `--output` / `-o` flags for explicit non-interactive values.',
                ],
            },
            {
                title: 'Documentation',
                items: [
                    'Full rewrite of `server/adapters/fastapi.mdx`: numbered steps, real example code, CORS origins table, --yes usage, example links.',
                    'Full rewrite of `server/adapters/flask.mdx`: same treatment with port-5000 callout and flask-cors notes.',
                    'Full rewrite of `server/adapters/django.mdx`: complete project scaffold (django-admin startproject, settings.py middleware order), URLconf wiring, why the views import is required, custom router section.',
                    'Full rewrite of `client/react.mdx`: explanation of why @pyrpc/types is a separate install (peer dep + postinstall mechanics), step-by-step setup, invalidation example.',
                    'Full rewrite of `client/nextjs.mdx`: complete App Router flow (providers, prefetch, HydrationBoundary, client hooks), api property reference table, createCaller for Server Actions.',
                    'Full rewrite of `client/vue.mdx`: plugin vs Provider explanation, reactive args getter pattern, config table.',
                    'Full rewrite of `client/svelte.mdx`: layout QueryClientProvider, $store subscription, reactive args, config table.',
                ],
            },
            {
                title: 'Blog',
                items: [
                    '12 new tutorial posts covering every framework combination: FastAPI/Flask/Django x React/Next.js/Vue/Svelte.',
                    'Each post is grounded in the actual working example code from the examples/ directory.',
                ],
            },
            {
                title: 'Landing Page',
                items: [
                    'Removed "Coming soon" badges from React, Next.js, Vue, and Svelte in the Fits Your Stack section -- all four are now fully supported.',
                    'Removed standalone TypeScript icon from the frontend list (the framework adapters cover it).',
                ],
            },
            {
                title: 'CI',
                items: [
                    'Publish workflow: switched PyPI from OIDC to API token (`PYPI_API_TOKEN` secret).',
                    'Publish workflow: npm publish steps now read version from each package.json and skip packages that are already published at that version (skip-existing parity with PyPI).',
                ],
            },
        ],
    },
    {
        version: 'v0.10.0',
        date: '2026-08-08',
        tag: 'v0.10.0',
        description: 'Zero-config setup: pyrpc dev wizard, tsconfig paths injection, source-tree type generation, server-detection, and 12 full-stack examples (FastAPI/Flask/Django x React/Next.js/Vue/Svelte).',
        sections: [
            {
                title: 'Features',
                items: [
                    'pyrpc dev first-run wizard: 2 questions (entry module + frontend framework), writes pyrpc.json, never runs again.',
                    'Framework auto-detection: scans for next.config.*, vite.config.*, svelte.config.*, nuxt.config.*, astro.config.* and pre-fills the framework answer.',
                    'Generated types now live in src/__pyrpc.d.ts (user source tree, committed to git) -- no more writing into node_modules.',
                    '@pyrpc/client postinstall injects "@pyrpc/types": ["./src/__pyrpc.d.ts"] into tsconfig.json automatically and silently.',
                    'pyrpc dev server-detection: probes GET /rpc on startup -- if server is already running, skips uvicorn and attaches watcher only.',
                    'pyrpc dev watches pyrpc.json itself: module or output changes re-wire the watcher and restart uvicorn automatically.',
                    'pyrpc dev starts uvicorn with --reload by default (disable with --no-reload).',
                    'New pyrpc watch command: type-watcher-only variant for developers who manage their own server.',
                    'Zero codegen step: pyrpc dev watches Python files and regenerates src/__pyrpc.d.ts on every save. No manual codegen command needed.',
                ],
            },
            {
                title: 'Examples',
                items: [
                    '12 complete working examples covering every supported combination: FastAPI + React, FastAPI + Next.js, FastAPI + Vue, FastAPI + Svelte, Flask + React, Flask + Next.js, Flask + Vue, Flask + Svelte, Django + React, Django + Next.js, Django + Vue, Django + Svelte.',
                    'Each example has a server/ directory (Python) and a client/ directory (TypeScript) that can be run independently.',
                    'Replaced legacy examples/nextjs, examples/basic_server.py, examples/basic_usage.py, and examples/flask_server.py with the structured 12-example layout.',
                    'examples/README.md with a table of all 12 combinations and quick-start commands.',
                ],
            },
            {
                title: 'Breaking Changes',
                items: [
                    'Removed pyrpc-client.json and @pyrpc/client postinstall wizard. Postinstall now silently injects tsconfig paths only.',
                    'Removed npx pyrpc sync (TS-side CLI). Types come from source tree, not remote fetch.',
                    'Removed distribution modes (workspace / server). pyRPC is monorepo-first.',
                    'Removed client_root, entrypoint, distribution fields from pyrpc.json.',
                    'createClient() no longer reads pyrpc-client.json for server_url. Pass baseUrl explicitly.',
                    'DEFAULT_OUTPUT removed from pyrpc_codegen public API. Default path (src/__pyrpc.d.ts) is now a CLI-layer constant.',
                ],
            },
            {
                title: 'Upgrade',
                items: [
                    'Delete existing pyrpc.json and pyrpc-client.json.',
                    'Run npm install to get new postinstall (adds tsconfig paths entry).',
                    'Run pyrpc dev -- 2-question wizard creates new pyrpc.json.',
                    'The @pyrpc/types import path and all framework adapter APIs are unchanged.',
                ],
            },
        ],
    },
    {
        version: 'v0.9.0',
        date: '2026-07-27',
        tag: 'v0.9.0',
        description: 'Framework adapters (React, Next.js, Vue, Svelte), server procedure kinds, and a unified one-api-object DX on TanStack Query.',
        sections: [
            {
                title: 'Features',
                items: [
                    'New npm packages: `@pyrpc/react`, `@pyrpc/next`, `@pyrpc/vue`, `@pyrpc/svelte`, thin TanStack Query adapters over `@pyrpc/client`.',
                    'One `api` object DX: `api.Provider`, `api.greet.useQuery`, and (Next) `api.prefetch` / `api.dehydrate` / `api.HydrationBoundary` on the same export.',
                    'Server procedure kinds: `@rpc.query` and `@rpc.mutation` (bare `@rpc` defaults to query). Codegen brands `Types` with `_pyrpcKind`; adapters apply kinds automatically.',
                    'Next.js App Router: `createNextClient` with RSC prefetch, hydration, and `createCaller` for server Promise calls.',
                    'Vue: `createPyrpcVue` with `api.plugin` for TanStack `VueQueryPlugin`. Svelte: `createSvelteClient` with `createQuery` / `createMutation`.',
                ],
            },
            {
                title: 'Documentation',
                items: [
                    'Client docs for React, Next.js, Vue, and Svelte.',
                    'Blog posts: adapters deep dive, Next tutorial, one-api-object, query vs mutation, publishing guide, v0.9.0 release notes.',
                    'Example app: `examples/fastapi-nextjs` with FastAPI backend.',
                    'Updated LikeC4 architecture diagram for framework adapters.',
                ],
            },
            {
                title: 'Chores',
                items: [
                    'Bump all packages to v0.9.0 (Python + npm).',
                    'Extend `.github/workflows/publish.yml` to publish new npm adapter packages.',
                    'Add `PUBLISH.md` release guide.',
                ],
            },
        ],
    },
    {
        version: 'v0.8.1',
        date: '2026-06-14',
        tag: 'v0.8.1',
        description: 'Fix CLI/postinstall Types generation to produce callable Promise signatures matching createClient<T> and industry standard.',
        sections: [
            {
                title: 'Bug Fixes',
                items: [
                    'Fix CLI `generate()` in `cli.js` and `postinstall.js` to produce callable `method(args): Promise<Result>` signatures instead of `{ params, result }` descriptor format.',
                    'The old format caused TypeScript/linters to warn "await has no effect" because `createClient<T>()`\'s Proxy returns a function `(...args) => Promise<any>`, but the generated Types interface described them as non-callable objects.',
                    'New output matches the `pyrpc-codegen` Jinja2 template format and the industry standard used by tRPC, `typed-rpc`, and `jsontpc`.',
                ]
            },
            {
                title: 'Chores',
                items: [
                    'Bump `@pyrpc/client` to v0.8.1 (npm only, no Python package changes).',
                ]
            },
        ]
    },
    {
        version: 'v0.8.0',
        date: '2026-06-13',
        tag: 'v0.8.0',
        description: 'npx daemon 715× speedup for type generation and reduced file watcher debounce.',
        sections: [
            {
                title: 'Features',
                items: [
                    'Adopt `jsonschema-ts` v0.3.0 npx daemon for sub-10ms type generation. Instead of spawning `npx json-schema-to-typescript` as a subprocess on every conversion (3.3s/call), a persistent Node.js process runs in the background, keeping `json-schema-to-typescript` loaded in V8\'s code cache. Subsequent conversions drop to ~4.6ms, a ~715× speedup.',
                    'Reduce file watcher debounce from 1.6s to 200ms for faster type regeneration on save.',
                ]
            },
            {
                title: 'Chores',
                items: [
                    'Bump all packages to v0.8.0 (pyrpc-core, pyrpc-codegen, pyrpc-flask, pyrpc-fastapi, pyrpc-django-adapter, @pyrpc/client, @pyrpc/types).',
                    'Pin `jsonschema-ts>=0.3.0` in pyrpc-codegen.',
                    'Add blog post and codegen docs for npx daemon architecture.',
                ]
            },
        ]
    },
    {
        version: 'v0.7.7',
        date: '2026-06-13',
        tag: 'v0.7.7',
        description: 'Windows npx.cmd fix via jsonschema-ts v0.2.1.',
        sections: [
            {
                title: 'Bug Fixes',
                items: [
                    'Pin `jsonschema-ts>=0.2.1` to pull in the Windows `npx.cmd` fix. `jsonschema-ts` v0.2.0 called `subprocess.run(["npx", ...])` without `shell=True`. On Windows, `npx` is a script file (not `.exe`/`.com`) so `CreateProcess` cannot run it directly, `[WinError 2]` is raised. v0.2.1 uses `"npx.cmd"` on `os.name == "nt"`, resolving the error.',
                ]
            },
            {
                title: 'Chores',
                items: [
                    'Bump all packages to v0.7.7 (pyrpc-core, pyrpc-codegen, pyrpc-flask, pyrpc-fastapi, pyrpc-django-adapter, @pyrpc/client, @pyrpc/types).',
                    'Pin `jsonschema-ts>=0.2.1` in pyrpc-codegen, `pyrpc-codegen>=0.7.7` in pyrpc-core, and `pyrpc-core>=0.7.7` in adapter packages.',
                ]
            },
        ]
    },
    {
        version: 'v0.7.6',
        date: '2026-06-13',
        tag: 'v0.7.6',
        description: 'Dependency pin fix and dynamic __version__ in CLI.',
        sections: [
            {
                title: 'Bug Fixes',
                items: [
                    'Pin `pyrpc-codegen>=0.7.6` dependency to ensure `jsonschema-ts>=0.2.0` is pulled in correctly on fresh installs. Previously `pyrpc-core` had no version constraint on `pyrpc-codegen`, so older versions (0.6.x) that required only `jsonschema-ts>=0.1.0` could be installed, causing `ensure_inline_models` import errors.',
                    'Make `__version__` dynamic, `cli.py` now imports it from `pyrpc_core.__init__` instead of a hardcoded `"0.3.3"` string that was never updated.',
                ]
            },
            {
                title: 'Chores',
                items: [
                    'Bump all packages to v0.7.6 (pyrpc-core, pyrpc-codegen, pyrpc-flask, pyrpc-fastapi, pyrpc-django-adapter, @pyrpc/client, @pyrpc/types).',
                    'Pin `pyrpc-core>=0.7.6` in flask, fastapi, and django adapter packages.',
                    'Update `scripts/release.mjs` to also sync `__init__.py` `__version__`.',
                    'Add `pyrpc-client.json` to `.gitignore`, remove unused `scripts/seed_downloads.py`.',
                ]
            },
        ]
    },
    {
        version: 'v0.7.5',
        date: '2026-06-13',
        tag: 'v0.7.5',
        description: 'CLI daemonizes and automatically installs adapters via npm, removing manual pip install steps.',
        sections: [
            {
                title: 'CLI & Dev Server',
                items: [
                    'npm install is now automatic: pyrpc dev automatically runs npm install @pyrpc/fastapi or @pyrpc/flask if the adapter is missing for your chosen framework (FastAPI/Flask/Django).',
                    'Daemon-first design: dev server daemonizes once and manages its own lifecycle, allowing independent CLI tool execution.',
                    'The Python backend and TypeScript daemon communicate via a low-latency JSON pipe (stdio) instead of filesystem operations.',
                    'Eliminates manual npm installation prompts during setup.',
                ]
            },
            {
                title: 'Package Architecture',
                items: [
                    'pyrpc-core provides pypi packages with extras (pip install pyrpc-core[fastapi], pyrpc-core[flask], pyrpc-core[django]) to unify Python installation.',
                    'Adapter packages (@pyrpc/fastapi, @pyrpc/flask, etc.) remain unchanged for those who prefer direct installation.',
                ]
            },
            {
                title: 'Bug Fixes',
                items: [
                    'Fixed race condition in concurrent RPC calls where multiple requests could corrupt the dispatcher state by dispatching and cleaning up simultaneously.',
                    'Resolved TypeError in server mode when .adapter.get_registry_schema() was called before the adapter was initialized (e.g., in a bare client_root server setup).',
                    'Fixed pyrpc dev server crashing when TypeScript target was set to es2023 (breaking changes in ts-json-schema-generator related to es2023 enums and keywords).',
                    'Updated @pyrpc/client to correctly use the base_url field from pyrpc.json when performing remote client-side fetching.',
                    'Ensured --reconfigure correctly overwrites pyrpc.json with new framework and distribution choices instead of attempting to merge.',
                ]
            },
            {
                title: 'Documentation',
                items: [
                    'Updated quickstart to remove the npm install step.',
                    'Added migration note on daemon-first architecture in development.',
                    'Updated API references with details on improved error handling and JSON pipe communication.',
                ]
            },
        ]
    },
    {
        version: 'v0.7.4',
        date: '2026-06-13',
        tag: 'v0.7.4',
        description: 'Reordered CLI prompts, filled documentation stubs, and removed empty plugins section.',
        sections: [
            {
                title: 'CLI',
                items: [
                    'Setup wizard prompts reordered: Framework -> Distribution -> Entry point -> Client root. Distribution mode now asked before entry point -- high-level architectural choice before implementation detail.',
                ]
            },
            {
                title: 'Documentation',
                items: [
                    'Community pages filled: contributing, testimonials, sponsors',
                    'Plugins section removed from navigation (no plugins exist yet)',
                    'FAQ, Spec, and Further Reading filled with real content',
                    'Full API references written for Core, Python Client, and TypeScript Client',
                    'Changed "Python module to scan for @rpc procedures" to "Entry point to your application" in quickstart',
                ]
            },
        ]
    },
    {
        version: 'v0.7.3',
        date: '2026-06-13',
        tag: 'v0.7.3',
        description: 'Django adapter, FastAPI/Flask introspection fix, and package rename.',
        sections: [
            {
                title: 'New Adapter',
                items: [
                    'New pyrpc-django-adapter package with mount_django() for Django 4.2+',
                    'Native async views -- no anyio.run bridge needed',
                    'Both POST /rpc and GET /rpc endpoints for dispatch and introspection',
                    'Custom router support via mount_django(router=router)',
                    'Install with: pip install pyrpc-core[django] or pip install pyrpc-django-adapter',
                ]
            },
            {
                title: 'Bug Fixes',
                items: [
                    'Fixed AttributeError in mount_fastapi() and mount_flask() when no router is provided -- both now resolve router or default_router before calling get_registry_schema()',
                ]
            },
            {
                title: 'Documentation',
                items: [
                    'New Django adapter guide under Server -> Adapters',
                    'Installation page updated with Django section',
                    'Blog post: Django adapter release',
                    'Changelog entry: v0.7.3',
                ]
            },
        ]
    },
    {
        version: 'v0.6.0',
        date: '2026-06-06',
        tag: 'v0.6.0',
        description: 'Client-side distribution, framework extras, package standardization, pyrpc.json config, and distribution modes.',
        sections: [
            {
                title: 'Client-Side Distribution',
                items: [
                    '@pyrpc/client postinstall prompts for workspace or server mode, creates pyrpc-client.json',
                    'npx pyrpc sync fetches schema from server URL and regenerates @pyrpc/types',
                    'Server-mode clients can pull types on demand without server filesystem access',
                    'pyrpc-client.json stores distribution mode and server URL, checked into version control',
                ]
            },
            {
                title: 'Package Architecture',
                items: [
                    'pyrpc-core now exposes fastapi and flask extras: pyrpc-core[fastapi], pyrpc-core[flask]',
                    'Adapter packages (pyrpc-fastapi, pyrpc-flask) are internal implementation details',
                    'Adapter auto-install in pyrpc dev uses extras syntax (pip install pyrpc-core[{framework}])',
                    'Setup wizard detects importable adapters and uses them as the default framework choice',
                    'Tests moved from root tests/ into package-level tests/ directories',
                    'All Python packages have dedicated READMEs on PyPI and GitHub',
                    'Root README simplified: only pyrpc-core shown with extras for adapters',
                    'pyrpc.dev domain migrated to pyrpc.com across the entire codebase',
                    'Em dash (U+2014) characters normalized to regular dashes; 4 corrupted files (cp1252, UTF-16 LE) repaired',
                ]
            },
            {
                title: 'Workspace & Config',
                items: [
                    'pyrpc.json replaces [tool.pyrpc] in pyproject.toml - dedicated config file with explicit fields',
                    'Distribution mode (workspace/server) is a required field - explicit config, no heuristics',
                    'Workspace mode writes TypeScript types directly to client_root on file change',
                    'Server mode exposes schema at GET /rpc - no filesystem writes, clients fetch via HTTP',
                    'Setup wizard integrated into pyrpc dev - no separate pyrpc init command',
                    'Config-relative path resolution - paths resolved against pyrpc.json directory, not CWD',
                    'save_typescript_client() enforces absolute path contract at the boundary',
                    'Migration strategy with SHA256 comparison - handles client_root changes without data loss',
                ]
            },
            {
                title: 'CLI & Dev Server',
                items: [
                    'pyrpc dev prompts for framework, entrypoint, distribution, and client_root on first run',
                    'CLI flags (--framework, --entrypoint, --distribution, --client-root) skip the wizard entirely',
                    '--reconfigure re-runs setup prompts while pre-filling existing values',
                    'Client root validated before starting dev server - fails fast on missing paths',
                    'Adapter auto-installed if missing - no separate pip install step needed after pyrpc dev',
                ]
            },
            {
                title: 'Documentation',
                items: [
                    'Blog post: Client distribution and package standardization',
                    'Blog post: Distribution: workspace or server',
                    'Blog post: Workspace mode: what happens when you run pyrpc dev',
                    'Blog post: Server mode: type distribution across repositories',
                    'Blog post: Three deployment architectures for pyrpc',
                    'Blog post: pyrpc.json: why we left pyproject.toml behind',
                    'Blog post: Why save_typescript_client() refuses relative paths',
                    'Blog post: Path resolution: config-relative, not CWD-relative',
                    'Blog post: Three cases, zero data loss: pyrpc types migration strategy',
                    'Blog post: No pyrpc init needed: designing the integrated setup wizard',
                    'Changelog entry: v0.6.0',
                ]
            },
        ]
    },
    {
        version: 'v0.3.3',
        date: '2026-06-03',
        tag: 'v0.3.3',
        description: 'Cleaner types, no more /rpc/rpc, quieter watcher, CORS headers included.',
        sections: [
            {
                title: 'TypeScript Client',
                items: [
                    'createClient returns TTypes directly instead of PyRPCClient & TTypes - rpc no longer pollutes autocomplete',
                    'Catches client.rpc.method() misuse at compile time instead of runtime',
                    'URL normalization strips existing trailing /rpc before re-appending - prevents double /rpc/rpc when users copy the URL from server output',
                    'Both http://localhost:8000 and http://localhost:8000/rpc work correctly as baseUrl',
                ]
            },
            {
                title: 'File Watcher',
                items: [
                    'threading.Timer with 300ms resetting debounce replaces direct regenerate() calls in watcher loop',
                    'Matches webpack\'s aggregateTimeout and nodemon\'s --delay pattern',
                    'Types regenerate once after the last file change settles - no more flood of syntax errors on partial writes',
                    'Startup and manual generate command still regenerate immediately (bypass debounce)',
                ]
            },
            {
                title: 'ASGI Transport (CORS)',
                items: [
                    'Added Access-Control-Allow-Origin: *, Access-Control-Allow-Methods, Access-Control-Allow-Headers, and Access-Control-Max-Age to every response',
                    'Added OPTIONS /rpc handler returning 204 with CORS headers for preflight requests',
                    'Same headers as FastAPI\'s CORSMiddleware',
                    'Flask and FastAPI transports unchanged - CORS is the host application\'s responsibility',
                ]
            },
            {
                title: 'Documentation',
                items: [
                    'Blog post: v0.3.3 - Cleaner types, no more /rpc/rpc, quieter watcher, CORS included',
                    'Changelog entry: v0.3.3',
                ]
            },
        ]
    },
    {
        version: 'v0.3.2',
        date: '2026-06-03',
        tag: 'v0.3.2',
        description: 'Cleaner terminal, smarter setup prompts, entry point simplified - no more :app confusion.',
        sections: [
            {
                title: 'Setup Flow',
                items: [
                    'Framework picker changed from text input to questionary.select() arrow-key menu',
                    'Entry point prompt simplified to "Python module to scan for @rpc procedures (e.g. main, app.main)" with default "main"',
                    'Removed misleading :app convention (dev command never used the variable part)',
                ]
            },
            {
                title: 'Import Path',
                items: [
                    'sys.path.insert(0, os.getcwd()) added in dev() before module import (Uvicorn standard)',
                    '_import_module() changed from sys.path.append to sys.path.insert(0, ...) for consistency',
                    'main now finds main.py in current directory - fixes "No module named main" error',
                ]
            },
            {
                title: 'Terminal DX',
                items: [
                    'Uvicorn subprocess uses --log-level error - 6 lines of reloader/server spam eliminated',
                    'Heavy Panel box replaced with clean 2-line status block',
                    'input() replaced with console.input() so Rich markup renders (fixes raw [cyan] text)',
                    'Removed "Generating initial types" and "Watching X directories" noise lines',
                    'Consistent symbol prefixes: checkmark success, xmark error, warning warning, o in-progress',
                ]
            },
            {
                title: 'Dependencies',
                items: [
                    'Added questionary>=2.0.0 for interactive CLI prompts',
                ]
            },
            {
                title: 'Documentation',
                items: [
                    'Blog post: v0.3.2 - Cleaner terminal, smarter prompts, no more :app confusion',
                    'Help text updated on dev, serve, and pull commands to match new wording',
                ]
            },
        ]
    },
    {
        version: 'v0.3.1',
        date: '2026-06-03',
        tag: 'v0.3.1',
        description: 'Lazy imports: pyrpc_codegen decoupled from CLI, only loaded on codegen/dev commands.',
        sections: [
            {
                title: 'CLI',
                items: [
                    'pyrpc_codegen import moved from top-level to per-command lazy loader',
                    'Commands version, inspect, serve, pull, and --help no longer require the codegen library',
                    'Only codegen and dev commands trigger the pyrpc_codegen import',
                    'All 17 CLI tests pass with updated mock targets',
                ]
            },
        ]
    },
    {
        version: 'v0.3.0',
        date: '2026-06-02',
        tag: 'v0.3.0',
        description: 'Single-install architecture: pyrpc-cli merged back into pyrpc-core, simplified to two packages.',
        sections: [
            {
                title: 'Packaging',
                items: [
                    'pyrpc-cli merged into pyrpc-core  -  no separate CLI package to install',
                    'pip install pyrpc-core now gives you the runtime, CLI, and codegen in one command',
                    'pyrpc-codegen remains a standalone package only for programmatic/CI use',
                    'Dependency chain simplified: pyrpc-core to pyrpc-codegen (3 packages to 2)',
                ]
            },
            {
                title: 'CLI',
                items: [
                    'All CLI subcommands (serve, dev, inspect, codegen, pull, version) live in pyrpc_core.cli',
                    'Entry point: pyrpc = pyrpc_core.cli:app via [project.scripts]',
                    'Lazy imports maintained  -  pyrpc version still starts instantly',
                    'First-run setup prompts for framework and entry point',
                ]
            },
            {
                title: 'Documentation',
                items: [
                    'All docs updated: no more pyrpc-cli references, simplified install instructions',
                    'PYRPC.md, README, CONTRIBUTING, and 5 doc pages rewritten for single-install flow',
                    'System design doc updated: architecture diagram and dependency section reflect 2-package structure',
                    'New blog post: "Why we merged pyrpc-cli back into pyrpc-core"',
                    'New site favicon using pyrpc mark',
                ]
            },
        ]
    },
    {
        version: 'v0.2.0',
        date: '2026-05-29',
        tag: 'v0.2.0',
        description: 'Real type generation, working async dispatch, and postinstall-based @pyrpc/types setup.',
        sections: [
            {
                title: 'Core Engine',
                items: [
                    'RPCCallable.__call__ now detects running event loop  -  returns coroutine in async context, calls sync in sync context',
                    'Sync and async dispatch both tested and working',
                ]
            },
            {
                title: 'Code Generation',
                items: [
                    'Python-to-TypeScript type mapper: int to number, str to string, bool to boolean, Optional[T] to T | null, List[T] to T[], Dict[K,V] to Record<K,V>',
                    'Custom models resolve to class name for future model generation',
                    '--watch flag removed (HTTP polling every 2s was not production-grade)',
                    'pyrpc init replaced by @pyrpc/types postinstall (no separate init command needed)',
                    'DEFAULT_OUTPUT now points to node_modules/@pyrpc/types/src/index.ts',
                    'New pull subcommand: pyrpc pull <module> -o schema.json extracts RPC schema as portable JSON',
                    'pyrpc codegen accepts both file paths (pyrpc codegen schema.json) and URLs (pyrpc codegen http://localhost:8000)',
                    'pyrpc-core made a lazy dependency in pyrpc-codegen - codegen from JSON file does not import pyrpc-core',
                ]
            },
            {
                title: 'TypeScript Client',
                items: [
                    '@pyrpc/types ships a placeholder src/index.ts  -  import resolves immediately even before codegen',
                    'Postinstall script on npm install @pyrpc/client prompts for backend URL, fetches schema, generates types',
                    'PYRPC_URL env var support for non-interactive / CI setups',
                ]
            },
            {
                title: 'Documentation',
                items: [
                    'Blog post: v0.2.0  -  Type safety, proper async, and @pyrpc/types',
                    'Codegen plugin docs updated: no --watch, no pyrpc init, postinstall flow',
                ]
            },
        ]
    },
    {
        version: 'v0.1.0-alpha.3',
        date: '2026-05-29',
        tag: 'v0.1.0-alpha.3',
        description: 'Iterative npm release with @pyrpc/types postinstall setup and cross-language documentation alignment.',
        sections: [
            {
                title: 'TypeScript Packages',
                items: [
                    '@pyrpc/types published to npm as a standalone package with postinstall codegen integration',
                    '@pyrpc/client updated with simplified README  -  pnpm/bun install options, removed auth section',
                ]
            },
            {
                title: 'Documentation',
                items: [
                    'Cross-language positioning: docs updated to remove npx pyrpc references',
                    'Existing blog posts updated for the postinstall workflow',
                ]
            },
        ]
    },
    {
        version: 'v0.1.0-alpha.2',
        date: '2026-05-29',
        tag: 'v0.1.0-alpha.2',
        description: 'Iterative npm release with Pattern A CLI refactor and demo sandbox improvements.',
        sections: [
            {
                title: 'Code Generation',
                items: [
                    'Pattern A CLI refactor: pyrpc pull <module> -o schema.json, pyrpc codegen accepts files and URLs',
                    'Lazy pyrpc-core imports  -  codegen from JSON file does not import pyrpc-core',
                    'Comprehensive test suite for CLI subcommands (pull, codegen URL/file)',
                ]
            },
            {
                title: 'Security & Trust',
                items: [
                    'SECURITY.md with reporting scope and vulnerability disclosure policy',
                    'Trust infrastructure files added: PYRPC.md, ROADMAP.md, CONTRIBUTING.md',
                    'Issue and PR templates created',
                ]
            },
            {
                title: 'Documentation',
                items: [
                    'Blog posts: why pyrpc, migrating from FastAPI, building a full-stack app',
                    'Demo sandbox blog post: deep-dive on the interactive playground architecture',
                    'LICENSE.md (MIT) and CONTRIBUTING.md added',
                    'README updated with contribution and security sections',
                    'npm and PyPI download badges added to README',
                ]
            },
            {
                title: 'Demo Sandbox',
                items: [
                    'Redesigned demo page with mock execution, terminal, and validation',
                    'Monaco createModel approach for live TypeScript type generation',
                    'Client-side Python parser for RPC/model type generation',
                    'Mock sandbox RPC endpoint with param binding and return literal parsing',
                ]
            },
        ]
    },
    {
        version: 'v0.1.0-alpha.1',
        date: '2026-05-25',
        tag: 'v0.1.0-alpha.1',
        description: 'Initial alpha release of pyrpc  -  a type-safe RPC framework bridging Python servers and TypeScript clients.',
        sections: [
            {
                title: 'Core Engine',
                items: [
                    'Python RPC server built on Pydantic v2 with TypeAdapter-based runtime type validation',
                    'JSON-RPC 2.0 protocol with structured error responses (-32600, -32601, -32602, -32603)',
                    'Async and sync procedure support with automatic detection',
                    'Router system with merge support for modular procedure organization',
                    'ASGI transport (PyRPCAsgiApp) for standalone deployment',
                ]
            },
            {
                title: 'Server Adapters',
                items: [
                    'FastAPI adapter: `mount_fastapi(app)` registers RPC routes on an existing FastAPI app',
                    'Flask adapter: `mount_flask(app)` registers RPC routes on an existing Flask app',
                    'Standalone adapter: direct ASGI deployment without a framework',
                ]
            },
            {
                title: 'TypeScript Client',
                items: [
                    'Proxy-based `createClient<Types>()` with full type inference from generated declarations',
                    'Support for positional and named parameter passing matching Python function signatures',
                    'Built-in error handling with `PyRPCError` (code, message, data)',
                    'Automatic request ID generation per call',
                ]
            },
            {
                title: 'Code Generation',
                items: [
                    '`pyrpc` CLI tool for generating TypeScript type declarations from Python server code',
                    'Supports both module-based introspection and URL-based schema fetching',
                    'Maps Python types to TypeScript: `int` to `number`, `str` to `string`, `list[X]` to `X[]`, `Optional[X]` to `X | null`, etc.',
                    'Handles Pydantic model fields, union types, and nested generics',
                ]
            },
            {
                title: 'Interactive Demo Sandbox',
                items: [
                    'Browser-based playground at `/demo` with side-by-side Python/TypeScript editors',
                    'Live TypeScript type generation from `@rpc`/`@model` decorators via Monaco `createModel`',
                    'Mock sandbox execution with return value literal parsing (no Python runtime needed)',
                    'Real-time code validation with Monaco error markers',
                    'Theme-aware terminal with `console.log()` simulation',
                    'Multi-provider templates: Core, FastAPI, and Flask',
                ]
            },
            {
                title: 'Documentation Site',
                items: [
                    'Fumadocs-powered documentation at `/docs` with full search, sidebar navigation, and MDX content',
                    'Getting started guide, architecture deep-dive, protocol specification, and API reference',
                    'Blog at `/blog` with technical deep-dives',
                    'Responsive design with dark/light theme support',
                ]
            },
        ]
    },
]
