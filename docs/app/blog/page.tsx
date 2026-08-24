'use client';

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

type Category = 'all' | 'release' | 'deep-dive' | 'tutorial'

const categories: { key: Category; label: string }[] = [
 { key: 'all', label: 'All Posts' },
 { key: 'release', label: 'Release Notes' },
 { key: 'deep-dive', label: 'Deep Dives' },
 { key: 'tutorial', label: 'Tutorials' },
]

interface Post {
 slug: string
 title: string
 description: string
 date: string
 readTime: string
 category: Category
}

const posts: Post[] = [
 {
 slug: 'building-a-full-stack-app-with-pyrpc',
 title: 'Building a full-stack app with pyRPC',
 description: 'A step-by-step tutorial: FastAPI backend, TypeScript React frontend, end-to-end type safety with pyRPC.',
 date: 'May 25, 2026 at 9:00am',
 readTime: '10 min',
 category: 'tutorial',
 },
 {
 slug: 'from-raw-fastapi-to-pyrpc',
 title: 'From raw FastAPI to pyRPC',
 description: 'A before-and-after migration guide showing how to convert a traditional FastAPI application to pyRPC - and why you might want to.',
 date: 'May 25, 2026 at 10:30am',
 readTime: '7 min',
 category: 'tutorial',
 },
 {
 slug: 'why-pyrpc',
 title: 'Why pyRPC?',
 description: 'The philosophy behind pyRPC, what tRPC-style typing means for Python backends, and why we built it.',
 date: 'May 25, 2026 at 1:00pm',
 readTime: '6 min',
 category: 'tutorial',
 },
 {
 slug: 'demo-sandbox-design',
 title: 'Inside the Interactive Demo Sandbox',
 description: 'A deep dive into how the pyrpc playground works - design decisions, architecture, and a comparison with the real pyrpc implementation.',
 date: 'May 25, 2026 at 3:00pm',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'codegen-refactor-and-dx',
 title: 'Cleaner codegen, one CLI, and a sharper story',
 description: 'Pattern A CLI, lazy pyrpc-core imports, frontend DX simplified to npm install, cross-language positioning, SECURITY.md rewrite, and Windows cp1252 fixes.',
 date: 'May 29, 2026 at 10:00am',
 readTime: '8 min',
 category: 'release',
 },
 {
 slug: 'v0-2-0-type-safety-and-await',
 title: 'v0.2.0 - Type safety, proper async, and @pyrpc/types',
 description: 'The three critical fixes that ship v0.2.0: real type generation, working async, and a postinstall-based @pyrpc/types setup.',
 date: 'May 29, 2026 at 2:00pm',
 readTime: '6 min',
 category: 'release',
 },
 {
 slug: 'dev-console-architecture',
 title: 'Designing the pyrpc developer console',
 description: 'Threads, subprocesses, and an embedded interactive console - how pyrpc dev combines a dev server, file watcher, type generator, and CLI into one terminal session.',
 date: 'June 2, 2026 at 8:30am',
 readTime: '14 min',
 category: 'deep-dive',
 },
 {
 slug: 'cli-overhaul-and-dev-tools',
 title: 'CLI overhaul, model interfaces, and the dev tools we built',
 description: 'Merging pull into codegen, fixing serve, adding the dev watcher and shell REPL, and integrating jsonschema-ts for Pydantic model interfaces.',
 date: 'June 2, 2026 at 9:45am',
 readTime: '12 min',
 category: 'release',
 },
 {
 slug: 'circular-dependency-package-architecture',
 title: 'The circular dependency problem and how pyrpc-cli solved it',
 description: 'How we discovered and solved the circular dependency between pyrpc-core and pyrpc-codegen by extracting pyrpc-cli - with three alternative strategies evaluated and a step-by-step extraction guide.',
 date: 'June 2, 2026 at 10:15am',
 readTime: '10 min',
 category: 'deep-dive',
 },
 {
 slug: 'dev-console-vs-shell-design-decisions',
 title: 'Dev console vs shell: two tools, one job, and the line between them',
 description: 'Why the dev console reads from the parent process (not HTTP), how the shell connects remotely, and the shared REPL UI that bridges them.',
 date: 'June 2, 2026 at 11:30am',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'core-cli-codegen-dependency-chain',
 title: 'Core → CLI → Codegen: why the dependency direction matters',
 description: 'Why pyrpc-core → pyrpc-cli → pyrpc-codegen is the right dependency direction - and three principles for designing package chains that never tangle.',
 date: 'June 2, 2026 at 1:00pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'better-auth-pattern-for-python',
 title: 'The Better Auth meta-package pattern, adapted for Python',
 description: 'How Better Auth\u2019s npm meta-package inspired pyrpc\u2019s package architecture, and how we adapted it for Python\u2019s packaging constraints.',
 date: 'June 2, 2026 at 2:15pm',
 readTime: '9 min',
 category: 'deep-dive',
 },
 {
 slug: 'lazy-imports-as-api-contract',
 title: 'Lazy imports as API contract, not performance hack',
 description: 'Three tiers of CLI commands, the packaging-vs-code dependency distinction, and why lazy imports define capability boundaries, not just startup time.',
 date: 'June 2, 2026 at 3:00pm',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'windows-compatibility-in-python-oss',
 title: 'Windows compatibility in a Python OSS project: what we learned',
 description: 'Unicode crashes on cp1252, LF/CRLF git warnings, path separators, file watcher quirks, and a no-special-chars policy for cross-platform Python OSS.',
 date: 'June 2, 2026 at 4:00pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'breaking-circular-dependencies-in-python',
 title: 'How to break a circular dependency in Python packaging',
 description: 'Four strategies for breaking circular package dependencies in Python, evaluated through pyrpc\u2019s real-world restructuring, with a step-by-step extraction guide.',
 date: 'June 2, 2026 at 5:30pm',
 readTime: '11 min',
 category: 'deep-dive',
 },
 {
 slug: 'merging-cli-back-into-core',
 title: 'Why we merged pyrpc-cli back into pyrpc-core',
 description: 'How the circular dependency that motivated a three-package split disappeared - and why we simplified back to two packages for a single-install experience.',
 date: 'June 2, 2026 at 6:30pm',
 readTime: '7 min',
 category: 'release',
 },
 {
 slug: 'v0-3-0-single-install',
 title: 'v0.3.0 - pyrpc-cli merged into core, one-command install',
 description: 'pip install pyrpc-core now gives you the runtime, CLI, and codegen in a single command - no separate packages, no extra steps.',
 date: 'June 2, 2026 at 10:15pm',
 readTime: '5 min',
 category: 'release',
 },
 {
 slug: 'v0-3-1-lazy-codegen-import',
 title: 'v0.3.1 - Lazy imports, pyrpc_codegen decoupled from CLI',
 description: 'pyrpc_codegen is no longer loaded for version, inspect, serve, pull, or help - only codegen and dev need it. A patch triggered by a stale shim bug.',
 date: 'June 3, 2026 at 10:30am',
 readTime: '4 min',
 category: 'release',
 },
 {
 slug: 'v0-3-2-clean-ux-and-terminal',
 title: 'v0.3.2 - Cleaner terminal, smarter prompts, no more :app confusion',
 description: 'Interactive framework picker, simplified entry point, CWD import path fix, and a terminal that shows what matters - no Uvicorn spam, no raw [cyan] markup, no giant Panel boxes.',
 date: 'June 3, 2026 at 6:00pm',
 readTime: '6 min',
 category: 'release',
 },
 {
 slug: 'v0-3-3-client-and-watcher-fixes',
 title: 'v0.3.3 - Cleaner types, no more /rpc/rpc, quieter watcher, CORS included',
 description: 'TypeScript autocomplete no longer suggests .rpc, URL normalization prevents double /rpc/rpc, file watcher debounced to 300ms, and the ASGI dev server now sends CORS headers - all following reference patterns from tRPC, Better Auth, FastAPI, webpack, and nodemon.',
 date: 'June 3, 2026 at 9:30pm',
 readTime: '8 min',
 category: 'release',
 },
 {
 slug: 'pyrpc-json-config',
 title: 'pyrpc.json: why we left pyproject.toml behind',
 description: 'Three problems with [tool.pyrpc] in pyproject.toml - fragile writing, ambiguous file ownership, and unclear path semantics - and why a dedicated pyrpc.json file with JSON, not TOML, was the right answer.',
 date: 'June 6, 2026 at 8:00am',
 readTime: '9 min',
 category: 'deep-dive',
 },
 {
 slug: 'path-resolution-config-relative',
 title: 'Path resolution in pyrpc: config-relative, not CWD-relative',
 description: 'Why resolving paths against pyrpc.json\'s directory (not os.getcwd()) is the only correct approach, how the pipeline produces absolute paths everywhere, and why save_typescript_client() enforces the contract at the boundary.',
 date: 'June 6, 2026 at 8:15am',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'migration-strategy-three-cases',
 title: 'Three cases, zero data loss: pyrpc\'s types migration strategy',
 description: 'What happens when you change client_root in pyrpc.json? Three cases with SHA256 comparison, interactive prompts only when needed, and a clean KeyboardInterrupt path that never leaves half-migrated state.',
 date: 'June 6, 2026 at 8:30am',
 readTime: '10 min',
 category: 'deep-dive',
 },
 {
 slug: 'three-deployment-architectures',
 title: 'Three deployment architectures for pyrpc',
 description: 'Monorepo, separate repos, and published npm package - how pyrpc\'s config system and type generation handle all three workflows, and why server-side codegen was built before the client-side npx CLI.',
 date: 'June 6, 2026 at 8:45am',
 readTime: '9 min',
 category: 'deep-dive',
 },
 {
 slug: 'integrated-first-time-setup',
 title: 'No pyrpc init needed: designing the integrated setup wizard',
 description: 'Why pyrpc embeds setup inside pyrpc dev instead of a separate init command: fewer context switches, --reconfigure pre-fills defaults, CLI flags skip the wizard entirely, and KeyboardInterrupt exits cleanly.',
 date: 'June 6, 2026 at 9:00am',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'absolute-path-contract',
 title: 'Why save_typescript_client() refuses relative paths',
 description: 'The hidden bug in os.getcwd() fallback paths - why a silent default is worse than a hard error, how the CLI layer resolves paths before calling the API, and the "fail fast on global state" design principle.',
 date: 'June 6, 2026 at 9:15am',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'distribution-modes',
 title: 'Distribution modes: workspace and server',
 description: 'Two distribution modes for pyrpc: workspace (monorepo, types written directly to client) and server (separate repos, types fetched via HTTP). When to use each and how they work under the hood.',
 date: 'June 6, 2026 at 1:00pm',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'distribution-workspace-flow',
 title: 'Workspace mode: what happens when you run pyrpc dev',
 description: 'A step-by-step walkthrough of workspace mode: config resolution, client root validation, migration checks, file watcher loop, dev server startup, and CI compatibility.',
 date: 'June 6, 2026 at 1:15pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'distribution-server-flow',
 title: 'Server mode: type distribution across repositories',
 description: 'How server mode works: the schema endpoint stays in memory, pyrpc never writes to the client filesystem, and the client fetches types on demand via npx pyrpc sync.',
 date: 'June 6, 2026 at 1:30pm',
 readTime: '9 min',
 category: 'deep-dive',
 },
 {
 slug: 'v0-6-0-release',
 title: 'v0.6.0 - Client distribution and package standardization',
 description: 'npx pyrpc sync, postinstall prompt, framework extras (pyrpc-core[fastapi], pyrpc-core[flask]), adapter auto-install, pyrpc.json config, distribution modes, and package standardization.',
 date: 'June 6, 2026 at 2:00pm',
 readTime: '10 min',
 category: 'release',
 },
 {
 slug: 'v0-7-3-django-adapter',
 title: 'v0.7.3 - Django adapter, FastAPI/Flask fixes',
 description: 'A new Django adapter (pyrpc-django-adapter) with native async views, plus an introspection crash fix that affected all adapters when no explicit router was provided.',
 date: 'June 13, 2026 at 8:00am',
 readTime: '4 min',
 category: 'release',
 },
 {
 slug: 'npx-daemon-715x-speedup',
 title: '715x faster type generation with the npx daemon',
 description: 'A persistent Node.js daemon replaces per-call npx subprocesses, dropping type regeneration from 3.3s to 4.6ms. How it works, the benchmarks, and the edge cases we handled.',
 date: 'June 14, 2026 at 3:00am',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'architecture-as-code',
 title: 'Architecture as Code: Mapping pyrpc with LikeC4',
 description: 'How we turned pyrpc\'s architecture into version-controlled, interactive diagrams using LikeC4, and why every framework should do the same.',
 date: 'June 15, 2026 at 12:00pm',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'visual-tour',
 title: 'A Visual Tour of pyrpc\'s Architecture',
 description: 'Eight diagrams, seven packages, one framework: a guided walkthrough of pyrpc\'s architecture from the system landscape down to individual components and dynamic flows.',
 date: 'June 15, 2026 at 12:15pm',
 readTime: '10 min',
 category: 'deep-dive',
 },
 {
 slug: 'rpc-call-flow',
 title: 'Following an RPC Call: From TypeScript Client to Python Function and Back',
 description: 'A step-by-step trace through pyrpc\'s RPC Call Flow: Proxy interception, HTTP transport, envelope validation, Router lookup, Procedure execution with TypeAdapters, and the error path.',
 date: 'June 15, 2026 at 12:30pm',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'framework-adapters-deep-dive',
 title: 'Deep dive: framework adapters, TanStack Query, and procedure kinds',
 description: 'Architecture of @pyrpc/react, next, vue, and svelte, one transport, flat DX, query/mutation kinds, and Next.js hydration.',
 date: 'July 27, 2026 at 2:00am',
 readTime: '18 min',
 category: 'deep-dive',
 },
 {
 slug: 'nextjs-tanstack-query-tutorial',
 title: 'Tutorial: Next.js App Router + TanStack Query with pyRPC',
 description: 'Step-by-step: @rpc.query/@rpc.mutation, createNextClient, RSC prefetch, HydrateClient, and client hooks.',
 date: 'July 27, 2026 at 2:30am',
 readTime: '14 min',
 category: 'tutorial',
 },
 {
 slug: 'package-versioning-and-releases',
 title: 'How to version, edit, and ship pyRPC’s multi-package surface',
 description: 'Synchronized npm @pyrpc/* versions, PyPI independence, what to edit where, and PR/release standards for a multi-package monorepo.',
 date: 'July 27, 2026 at 3:00am',
 readTime: '12 min',
 category: 'deep-dive',
 },
 {
 slug: 'one-api-object',
 title: 'One api object: Provider, prefetch, and hooks in the same place',
 description: 'Why createNextClient / createReactClient return a single value with procedures, Provider, and server helpers, and why the variable can be named api or client.',
 date: 'July 27, 2026 at 4:00am',
 readTime: '9 min',
 category: 'deep-dive',
 },
 {
 slug: 'rpc-query-vs-mutation',
 title: '@rpc.query and @rpc.mutation: why procedure kinds exist',
 description: 'How server-side query/mutation kinds flow through codegen into TanStack hooks without a second import in app code.',
 date: 'July 27, 2026 at 4:15am',
 readTime: '10 min',
 category: 'deep-dive',
 },
 {
 slug: 'nextjs-rsc-prefetch-hydration',
 title: 'Next.js RSC: prefetch, dehydrate, and HydrationBoundary',
 description: 'What each server helper does, when you can skip hydration, and why prefetch is for queries not mutations.',
 date: 'July 27, 2026 at 4:30am',
 readTime: '11 min',
 category: 'deep-dive',
 },
 {
 slug: 'react-adapter-guide',
 title: 'Guide: @pyrpc/react from zero to useQuery',
 description: 'Minimal install, api.Provider, useQuery/useMutation, and useUtils for a Vite or CRA-style React app.',
 date: 'July 27, 2026 at 4:45am',
 readTime: '8 min',
 category: 'tutorial',
 },
 {
 slug: 'vue-svelte-adapters',
 title: 'Vue and Svelte adapters: same contract, stack-native setup',
 description: 'createPyrpcVue with api.plugin, createSvelteClient with createQuery/createMutation, and TanStack conventions per framework.',
 date: 'July 27, 2026 at 5:00am',
 readTime: '9 min',
 category: 'tutorial',
 },
 {
 slug: 'from-createClient-to-hooks',
 title: 'Migrating from createClient to TanStack hooks',
 description: 'Keep Promise calls via api.client / createCaller while adopting useQuery, and annotate mutations on the server.',
 date: 'July 27, 2026 at 5:15am',
 readTime: '7 min',
 category: 'tutorial',
 },
 {
 slug: 'v0-9-0-framework-adapters',
 title: 'v0.9.0, Framework adapters, procedure kinds, one api object',
 description: 'Release notes for @pyrpc/react, next, vue, svelte, server kinds, and the unified api DX.',
 date: 'July 27, 2026 at 5:30am',
 readTime: '8 min',
 category: 'release',
 },
 {
 slug: 'publishing-pyrpc-packages',
 title: 'Publishing guide: npm @pyrpc/* and PyPI',
 description: 'release.mjs, build order, GitHub Actions tag publish, and manual npm/twine steps for new adapter packages.',
 date: 'July 27, 2026 at 5:45am',
 readTime: '10 min',
 category: 'deep-dive',
 },
 {
 slug: 'procedure-kinds-end-to-end',
 title: 'How procedure kinds flow from Python to TypeScript',
 description: 'Trace @rpc.query/@rpc.mutation from Python decorator through introspection, codegen, and into typed hooks.',
 date: 'July 27, 2026 at 6:00am',
 readTime: '12 min',
 category: 'deep-dive',
 },
 {
 slug: 'registry-merge-and-namespaces',
 title: 'Router.merge: how pyRPC handles namespaces',
 description: 'Split procedures into separate modules and combine them with Router.merge() for larger projects.',
 date: 'July 27, 2026 at 6:15am',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'codegen-template-internals',
 title: 'Inside the codegen template: what client.ts.j2 generates',
 description: 'What the Jinja2 template produces: Types interface, ProcedureKinds, procedureKinds, and model interfaces.',
 date: 'July 27, 2026 at 6:30am',
 readTime: '10 min',
 category: 'deep-dive',
 },
 {
 slug: 'npx-daemon-internals',
 title: 'The npx daemon: 715x faster type generation',
 description: 'How a persistent Node.js process drops jsonschema-ts from 3.3s to 4.6ms.',
 date: 'July 27, 2026 at 6:45am',
 readTime: '10 min',
 category: 'deep-dive',
 },
 {
 slug: 'procedurekinds-in-types-package',
 title: 'The tiny change in @pyrpc/types that powers everything',
 description: 'Why ProcedureKinds and procedureKinds are in @pyrpc/types, and how the const satisfies pattern works.',
 date: 'July 27, 2026 at 7:00am',
 readTime: '6 min',
 category: 'deep-dive',
 },
 {
 slug: 'building-nextjs-example',
 title: 'Building the Next.js example app: file by file',
 description: 'Walkthrough of examples/fastapi-nextjs: server.py, lib/pyrpc.ts, layout, RSC prefetch, and client hooks.',
 date: 'July 27, 2026 at 7:15am',
 readTime: '12 min',
 category: 'tutorial',
 },
 {
 slug: 'vue-adapter-pattern',
 title: 'The Vue adapter: same contract, Vue-native patterns',
 description: 'How createPyrpcVue uses plugins instead of providers, composables instead of hooks.',
 date: 'July 27, 2026 at 7:30am',
 readTime: '8 min',
 category: 'tutorial',
 },
 {
 slug: 'svelte-adapter-pattern',
 title: 'The Svelte adapter: framework-native, zero ceremony',
 description: 'How createSvelteClient integrates with TanStack Svelte Query stores and Svelte-native patterns.',
 date: 'July 27, 2026 at 7:45am',
 readTime: '8 min',
 category: 'tutorial',
 },
 {
 slug: 'how-we-publish',
 title: 'How we publish: from git tag to npm and PyPI',
 description: 'The full release flow: release.mjs, tag push, CI chain, OIDC for PyPI, and manual fallback.',
 date: 'July 27, 2026 at 8:00am',
 readTime: '10 min',
 category: 'deep-dive',
 },
 {
 slug: 'cicd-publish-pipeline',
 title: 'The CI/CD publish pipeline: tag-triggered, chained, OIDC',
 description: 'How publish.yml chains 6 jobs: PyPI via OIDC, npm types/client/react/adapters, and GitHub Release.',
 date: 'July 27, 2026 at 8:15am',
 readTime: '12 min',
 category: 'deep-dive',
 },
 {
 slug: 'backward-compatibility',
 title: 'Backward compatibility: how @rpc stayed working through v0.9.0',
 description: 'Why bare @rpc, no-kinds adapters, and existing installs all work without changes.',
 date: 'July 27, 2026 at 8:30am',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'procedure-kinds-test-suite',
 title: 'Testing procedure kinds: what we covered',
 description: 'Tests across four layers: Python decorators, introspection schema, codegen output, and adapter proxy.',
 date: 'July 27, 2026 at 8:45am',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'why-tanstack-query',
 title: 'Why we chose TanStack Query, and what it gives you for free',
 description: 'Caching, stale-while-revalidate, deduplication, and mutation invalidation without reinventing the wheel.',
 date: 'July 27, 2026 at 9:00am',
 readTime: '12 min',
 category: 'deep-dive',
 },
 {
 slug: 'from-trpc-to-pyrpc',
 title: 'From tRPC to pyRPC: what stays, what goes, what gets easier',
 description: 'Side-by-side comparison for tRPC users: same hooks, Python server, no Zod, no links chain.',
 date: 'July 27, 2026 at 9:15am',
 readTime: '14 min',
 category: 'tutorial',
 },
 {
 slug: 'uvicorn-reload-default',
 title: 'uvicorn --reload by default: how pyrpc dev manages the server',
 description: 'How pyrpc dev spawns uvicorn with --reload by default, the two independent reload paths, the restart command, and when to choose --no-reload.',
 date: 'August 8, 2026 at 8:00am',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'pyrpc-dev-wizard-design',
 title: 'Designing the pyrpc dev setup wizard: two questions, zero friction',
 description: 'How the first-run wizard asks the module and client questions, why --reconfigure pre-fills, and where detection takes over from prompts.',
 date: 'August 8, 2026 at 8:00am',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'fastapi-react-tutorial',
 title: 'FastAPI + React: full-stack type safety from zero',
 description: 'Step-by-step: FastAPI server with @rpc.query/@rpc.mutation, createReactClient, api.Provider, and useQuery/useMutation, the complete fastapi-react example explained.',
 date: 'August 8, 2026 at 9:00am',
 readTime: '10 min',
 category: 'tutorial',
 },
 {
 slug: 'framework-auto-detection',
 title: 'Framework auto-detection: reading the room from config files',
 description: 'How pyrpc recognizes Vite, Next.js, React, Vue, Svelte, and other frontends from package.json before the wizard has to ask.',
 date: 'August 8, 2026 at 9:00am',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'fastapi-nextjs-tutorial',
 title: 'FastAPI + Next.js: RSC prefetch with a Python backend',
 description: 'How api.prefetch, api.dehydrate(), and api.HydrationBoundary work together to give you instant data in Server Components, with a FastAPI backend.',
 date: 'August 8, 2026 at 9:30am',
 readTime: '12 min',
 category: 'tutorial',
 },
 {
 slug: 'fastapi-vue-tutorial',
 title: 'FastAPI + Vue: TanStack Vue Query with a Python backend',
 description: 'createPyrpcVue, pyrpc.plugin, createQuery with reactive args, and createMutation, the complete fastapi-vue example explained.',
 date: 'August 8, 2026 at 10:00am',
 readTime: '9 min',
 category: 'tutorial',
 },
 {
 slug: 'source-tree-types',
 title: 'Types in your source tree: why generated types left node_modules',
 description: 'The design decision behind committing generated types to the client repo, and what it means for editors, CI, and deployment.',
 date: 'August 8, 2026 at 10:00am',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'fastapi-svelte-tutorial',
 title: 'FastAPI + Svelte: typed Python procedures as Svelte stores',
 description: 'createSvelteClient, QueryClientProvider in +layout.svelte, createQuery/createMutation stores, and the $ subscription pattern, the fastapi-svelte example explained.',
 date: 'August 8, 2026 at 10:30am',
 readTime: '9 min',
 category: 'tutorial',
 },
 {
 slug: 'flask-react-tutorial',
 title: 'Flask + React: lightweight Python, full type safety',
 description: 'The flask-react example explained: mount_flask, flask-cors, createReactClient on port 5000, and the same useQuery/useMutation hooks as every other React adapter.',
 date: 'August 8, 2026 at 11:00am',
 readTime: '9 min',
 category: 'tutorial',
 },
 {
 slug: 'flask-vue-tutorial',
 title: 'Flask + Vue: zero-ceremony Python backend, Vue 3 frontend',
 description: 'The flask-vue example: mount_flask with flask-cors, createPyrpcVue pointing at port 5000, and Vue Composition API composables.',
 date: 'August 8, 2026 at 11:30am',
 readTime: '8 min',
 category: 'tutorial',
 },
 {
 slug: 'flask-svelte-tutorial',
 title: 'Flask + Svelte: minimal server, typed Svelte stores',
 description: 'The flask-svelte example: a two-file Flask server, createSvelteClient, and reactive stores, the smallest possible pyRPC stack.',
 date: 'August 8, 2026 at 12:00pm',
 readTime: '8 min',
 category: 'tutorial',
 },
 {
 slug: 'server-detection-probe',
 title: 'Probing the server: how pyrpc dev knows uvicorn is already running',
 description: 'One HTTP probe, a one-second timeout, and a server_managed flag that decides whether pyRPC starts uvicorn or attaches in watcher-only mode.',
 date: 'August 8, 2026 at 12:00pm',
 readTime: '6 min',
 category: 'deep-dive',
 },
 {
 slug: 'flask-nextjs-tutorial',
 title: 'Flask + Next.js: App Router with a Flask backend',
 description: 'The flask-nextjs example: mount_flask on port 5000, createNextClient with the Flask baseUrl, server-side prefetch, and client-side hooks.',
 date: 'August 8, 2026 at 12:30pm',
 readTime: '9 min',
 category: 'tutorial',
 },
 {
 slug: 'django-react-tutorial',
 title: 'Django + React: native async views, typed React hooks',
 description: 'The django-react example: async @rpc.query/@rpc.mutation views, why you must import views in urls.py, django-cors-headers setup, and createReactClient.',
 date: 'August 8, 2026 at 1:00pm',
 readTime: '11 min',
 category: 'tutorial',
 },
 {
 slug: 'django-vue-tutorial',
 title: 'Django + Vue: async Django backend, Vue 3 composables',
 description: 'The django-vue example: Django async views with pyRPC, createPyrpcVue with app.use(pyrpc.plugin), and reactive createQuery composables.',
 date: 'August 8, 2026 at 1:30pm',
 readTime: '9 min',
 category: 'tutorial',
 },
 {
 slug: 'django-svelte-tutorial',
 title: 'Django + Svelte: async Python backend, reactive Svelte stores',
 description: 'The django-svelte example: Django 4.2+ async views, createSvelteClient, and the $ store subscription pattern with TanStack Svelte Query.',
 date: 'August 8, 2026 at 2:00pm',
 readTime: '9 min',
 category: 'tutorial',
 },
 {
 slug: 'pyrpc-watch-command',
 title: 'pyrpc watch: type generation without the server',
 description: 'The type-watcher half of pyrpc dev with the server management removed: the same regeneration pipeline, minus uvicorn, port probing, and the interactive console.',
 date: 'August 8, 2026 at 2:00pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'django-nextjs-tutorial',
 title: 'Django + Next.js: RSC prefetch with a Django backend',
 description: 'The django-nextjs example: Django async views with pyRPC, createNextClient pointing at Django, server-side prefetch in RSC, and client-side useQuery/useMutation.',
 date: 'August 8, 2026 at 2:30pm',
 readTime: '11 min',
 category: 'tutorial',
 },
 {
 slug: 'zero-codegen-step',
 title: 'The zero-codegen workflow: save, wait 300ms, types are fresh',
 description: 'How the watch scope, .py filtering, and a 300ms debounce turn "edit Python, save" into regenerated TypeScript with no codegen command at all.',
 date: 'August 8, 2026 at 3:00pm',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'cli-yes-flag',
 title: 'pyrpc dev --yes: non-interactive setup for CI and scripts',
 description: 'Fully explicit --yes --module --client, auto-detected clients and frameworks, and a hard error instead of a guess when multiple frontends exist.',
 date: 'August 8, 2026 at 4:00pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'multi-client-support',
 title: 'Multi-client support: one Python server, many frontends',
 description: 'The clients array in pyrpc.json, per-client __pyrpc.d.ts generation, and the live-watch reload when clients change.',
 date: 'August 11, 2026 at 7:00am',
 readTime: '9 min',
 category: 'deep-dive',
 },
 {
 slug: 'tsconfig-path-injection',
 title: 'Surgical tsconfig edits: injecting @pyrpc/types with jsonc-edit',
 description: 'The tsconfig.json edit that lets generated types reference @pyrpc/types, when it happens, and the edge cases we handle.',
 date: 'August 11, 2026 at 9:00am',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'module-reload-watcher',
 title: 'Reloading modules in the watcher: import vs reload',
 description: 'Why a fresh import is not enough, how importlib.reload refreshes procedures without restarting the server, and the tradeoffs of reloading modules.',
 date: 'August 11, 2026 at 12:00pm',
 readTime: '9 min',
 category: 'deep-dive',
 },
 {
 slug: 'debounced-regen-threads',
 title: 'Threads, timers, and the missing import time: how regeneration stays safe',
 description: 'The debounce timer, the timer lock, the regen lock, and the one-line import bug that silently silenced the regen log.',
 date: 'August 11, 2026 at 2:00pm',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'wizard-manual-entry',
 title: 'Manual entry as a first-class wizard action',
 description: 'How v0.11.1 makes manual client entry a first-class wizard action, chosen before the checkbox list, so detected-project selections are never silently discarded.',
 date: 'August 11, 2026 at 3:00pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'pyrpc-dev-console',
 title: 'The dev console: a control panel, not a shell',
 description: 'Six commands (procedures, inspect, generate, restart, exit) and why the console deliberately stops at the dev loop instead of becoming a REPL.',
 date: 'August 11, 2026 at 4:00pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'pyrpc-json-lifecycle',
 title: 'The life of pyrpc.json: from wizard to watcher to CI',
 description: 'How a small JSON file is born in the wizard, found by walking up, read by every command, and hot-reloaded by a running dev session.',
 date: 'August 11, 2026 at 5:00pm',
 readTime: '9 min',
 category: 'deep-dive',
 },
 {
 slug: 'from-declaration-to-runtime-module',
 title: 'From .d.ts to .ts: when types became a runtime module',
 description: 'Why v0.12.0 stops emitting a declaration-only __pyrpc.d.ts and generates a real __pyrpc.ts module that carries both compile-time types and the runtime procedureKinds map.',
 date: 'August 12, 2026 at 9:00am',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'the-generated-file-contract',
 title: "The generated file's contract",
 description: 'The header of __pyrpc.ts is not decoration: it documents how the file is resolved, when it is regenerated, and what happens if you edit it by hand.',
 date: 'August 12, 2026 at 9:20am',
 readTime: '5 min',
 category: 'deep-dive',
 },
 {
 slug: 'jinja-template-mechanics',
 title: 'Inside the codegen template',
 description: 'How client.ts.j2 renders Types, the _pyrpcKind brand, ProcedureKinds, and the procedureKinds const from a Python schema dict.',
 date: 'August 12, 2026 at 9:40am',
 readTime: '9 min',
 category: 'deep-dive',
 },
 {
 slug: 'pytype-to-ts-grammar',
 title: 'Parsing Python type strings into TypeScript',
 description: 'The string-grammar parser behind _pytype_to_ts: how Optional, Union, List, Dict, Tuple, and Set annotations become nullable unions, arrays, and records, and where it falls back to any.',
 date: 'August 12, 2026 at 10:00am',
 readTime: '10 min',
 category: 'deep-dive',
 },
 {
 slug: 'branding-types-with-pyrpc-kind',
 title: 'The _pyrpcKind brand and type-level kind inference',
 description: 'Every generated procedure carries a readonly _pyrpcKind brand. InferProcedureKinds reads it in a mapped type so the compile-time type system knows whether .useQuery or .useMutation exists.',
 date: 'August 12, 2026 at 10:20am',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'the-throwing-placeholder',
 title: 'The placeholder that throws',
 description: 'Before pyrpc dev runs, @pyrpc/types ships a Proxy placeholder whose procedureKinds throws on access, so a misconfigured resolution fails loud instead of silently showing every hook.',
 date: 'August 12, 2026 at 10:40am',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'fail-closed-vs-fail-open',
 title: 'Fail closed: why the placeholder throws',
 description: "v0.9.0's placeholder exposed both hooks on every procedure; v0.12.0's throws. A comparison of two failure modes and why the strict one is the safe default.",
 date: 'August 12, 2026 at 11:00am',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'two-channels-type-and-runtime',
 title: 'Two channels: compile-time types and runtime kinds',
 description: 'TypeScript erases types at runtime. procedureKinds is the runtime channel that mirrors the compile-time Types channel, and the generated module is where both meet.',
 date: 'August 12, 2026 at 11:20am',
 readTime: '6 min',
 category: 'deep-dive',
 },
 {
 slug: 'the-node-modules-resolution-gap',
 title: 'The node_modules resolution gap',
 description: 'Why tsconfig paths work for TypeScript and webpack but not for imports originating inside node_modules, and the bundler alias that closes the gap.',
 date: 'August 12, 2026 at 11:40am',
 readTime: '9 min',
 category: 'deep-dive',
 },
 {
 slug: 'bundler-config-detection',
 title: 'Detecting the bundler by config filename',
 description: 'Six filenames, two frameworks: how pyrpc decides which bundler you use by walking the client directory for vite.config and next.config signatures.',
 date: 'August 12, 2026 at 12:00pm',
 readTime: '6 min',
 category: 'deep-dive',
 },
 {
 slug: 'a-mini-js-parser-for-config-edit',
 title: 'A mini JS tokenizer for safe config editing',
 description: 'The hand-rolled tokenizer behind bundler config edits: skipping strings, comments, and template-literal interpolations so brace matching never misfires.',
 date: 'August 12, 2026 at 12:20pm',
 readTime: '10 min',
 category: 'deep-dive',
 },
 {
 slug: 'surgical-splice-without-a-parser',
 title: 'Inserting into a config object without parsing it',
 description: 'How a one-line splice at the closing brace, an idempotency guard, and write-on-change logic keep config edits safe across hundreds of regenerations.',
 date: 'August 12, 2026 at 12:40pm',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'two-alias-shapes',
 title: 'Two alias shapes: Vite resolve.alias vs Turbopack resolveAlias',
 description: 'The same aliasing idea expressed in two bundler dialects, and why a shared splice core plus a per-tool snippet table is the right structure.',
 date: 'August 12, 2026 at 1:00pm',
 readTime: '6 min',
 category: 'deep-dive',
 },
 {
 slug: 'fail-loud-when-unconfigurable',
 title: 'When the config is too weird: failing loud',
 description: 'A two-state return value, a yellow warning, and the exact remediation hint, the calibrated failure ladder when a config cannot be safely edited.',
 date: 'August 12, 2026 at 1:20pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'relative-alias-default',
 title: 'Why the alias is relative',
 description: 'The leading dot in "./__pyrpc.ts" is not style, it is the difference between a sibling file and a package that was never published.',
 date: 'August 12, 2026 at 1:40pm',
 readTime: '5 min',
 category: 'deep-dive',
 },
 {
 slug: 'idempotent-regen-wiring',
 title: 'Idempotent re-wiring on every regen',
 description: 'Every codegen run reconfigures tsconfig and the bundler. How existing-value probes, alias guards, and write-on-change make that safe.',
 date: 'August 12, 2026 at 2:00pm',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'runtime-kind-consumption',
 title: 'How adapters read procedureKinds at runtime',
 description: 'The value import, the kinds override seam, and the Proxy get trap that builds query or mutation hooks from a single runtime lookup.',
 date: 'August 12, 2026 at 2:20pm',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'type-level-mirror-of-hooks',
 title: 'ProcedureHooksForKind: the type-level mirror',
 description: 'The conditional types that make TypeScript agree with the runtime Proxy, one decision, two languages, no drift.',
 date: 'August 12, 2026 at 2:40pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'the-kinds-override-seam',
 title: 'The kinds override seam and why tests use it',
 description: 'A documented @internal escape hatch that turns the adapter into a pure function of kind, making hook-selection behavior exhaustively testable.',
 date: 'August 12, 2026 at 3:00pm',
 readTime: '6 min',
 category: 'deep-dive',
 },
 {
 slug: 'externalizing-the-type-boundary',
 title: 'Why adapters keep @pyrpc/types external',
 description: 'The tsup externals that let the app bundle redirect the type package: how externalization makes runtime substitution possible.',
 date: 'August 12, 2026 at 3:20pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'types-from-dev-dep-to-runtime-dep',
 title: '@pyrpc/types: from type-only to runtime dependency',
 description: 'A one-line package.json move that announces the whole v0.12.0 thesis, the type boundary became a runtime contract.',
 date: 'August 12, 2026 at 3:40pm',
 readTime: '6 min',
 category: 'deep-dive',
 },
 {
 slug: 'release-script-internals',
 title: 'release.mjs: one command, eleven packages',
 description: 'How an 85-line script walks the packages directory and rewrites versions, internal ranges, and the root workspace in lockstep.',
 date: 'August 12, 2026 at 4:00pm',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'version-in-three-places',
 title: 'A version in three places',
 description: 'pyproject.toml, __init__.py, and uv.lock each hold the version for a different consumer, and the release process keeps them agreeing.',
 date: 'August 12, 2026 at 4:20pm',
 readTime: '6 min',
 category: 'deep-dive',
 },
 {
 slug: 'the-lockfile-dance',
 title: 'The lockfile dance after a version bump',
 description: 'Why the bump script skips lockfiles, and how uv lock and npm install close the resolution gap before the release PR opens.',
 date: 'August 12, 2026 at 4:40pm',
 readTime: '6 min',
 category: 'deep-dive',
 },
 {
 slug: 'release-matrix-two-ecosystems',
 title: 'Eleven packages, two ecosystems',
 description: 'Six npm workspaces and five Python packages shipped in lockstep from one tag, the dependency DAGs and the version contract that binds them.',
 date: 'August 12, 2026 at 5:00pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'publish-chain-topology',
 title: 'The publish chain: types to client to react to adapters',
 description: 'The needs: graph that serializes npm publishing, and why every job hermetically rebuilds its dependency chain from the tag.',
 date: 'August 12, 2026 at 5:20pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'idempotent-publishing',
 title: 'skip-existing and the npm guard: idempotent publishing',
 description: 'Two registries, two idempotency strategies, and why a release pipeline that can be re-run must reconcile instead of demand.',
 date: 'August 12, 2026 at 5:40pm',
 readTime: '6 min',
 category: 'deep-dive',
 },
 {
 slug: 'tag-driven-releases',
 title: 'A tag is a release trigger',
 description: 'How a git tag matching v*.*.* fires PyPI, npm, and the GitHub Release, and how the prerelease signal flows through all three.',
 date: 'August 12, 2026 at 6:00pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'release-notes-and-naming',
 title: 'Auto-generated release notes and the naming fix',
 description: 'The softprops action, conventional-commit release notes, and the one-line change that renamed releases to their bare tags.',
 date: 'August 12, 2026 at 6:20pm',
 readTime: '5 min',
 category: 'deep-dive',
 },
 {
 slug: 'workspace-version-contract',
 title: 'The version contract between npm workspaces and uv',
 description: 'An unenforced agreement that binds two package managers: how the shared version number is structured and where drift could creep in.',
 date: 'August 12, 2026 at 6:40pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'changelog-as-structured-data',
 title: 'The changelog as structured data',
 description: 'Why the changelog is a TypeScript module, not Markdown: typechecked, programmatic, and rendered consistently by the docs page.',
 date: 'August 12, 2026 at 7:00pm',
 readTime: '6 min',
 category: 'deep-dive',
 },
 {
 slug: 'zero-config-promise-revisited',
 title: 'Reconciling zero-config with a runtime module',
 description: 'A release that demands more configuration while moving toward less, and the safety mechanisms that make a tool-owned config trustworthy.',
 date: 'August 12, 2026 at 7:20pm',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'release-pr-review-flow',
 title: 'The release PR: how a version bump goes to review',
 description: 'Why the release is a reviewed merge followed by a tag, and how decoupling the two makes an irreversible step reversible.',
 date: 'August 12, 2026 at 7:40pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'the-bundler-verification-matrix',
 title: 'How we checked every bundler: the verification matrix',
 description: 'The claim that tsconfig paths work for webpack but not Vite, SvelteKit, or Turbopack, proven by unit tests, example apps, and a matrix that shows why.',
 date: 'August 12, 2026 at 8:00pm',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'baseurl-compile-time-and-runtime',
 title: 'baseUrl: compile-time and runtime',
 description: 'A string in an options type at compile time, a normalization pipeline at runtime, and why the browser fallback fails loudly on the server.',
 date: 'August 12, 2026 at 8:20pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'what-pyrpc-owns-and-what-it-doesnt',
 title: 'What pyRPC owns, and what it doesn\u2019t',
 description: 'The dependency contract: what ships in dependencies, what stays a peer, why TanStack Query is internal but not owned, and how the Python extras mirror it.',
 date: 'August 12, 2026 at 8:40pm',
 readTime: '9 min',
 category: 'deep-dive',
 },
 {
 slug: 'watch-shadowing-fix',
 title: 'A crash hiding in plain sight: watch vs watchfiles',
 description: 'How a local function shadowing the watchfiles import broke pyrpc watch, why every test missed it, and the three habits that catch shadowing bugs early.',
 date: 'August 20, 2026 at 9:00am',
 readTime: '5 min',
 category: 'deep-dive',
 },
 {
 slug: 'terminating-links',
 title: 'Terminating links: giving @pyrpc/client a pipeline',
 description: 'The tRPC-style link architecture behind v0.13.0: exactly one terminating link owns transport, composable links handle auth/retry/logging, and URL normalization moved where it belongs.',
 date: 'August 20, 2026 at 2:00pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'batched-rpc-end-to-end',
 title: 'Batched RPC requests, end to end',
 description: 'httpBatchLink coalesces same-tick operations into one JSON-array POST; the interpreter dispatches them sequentially with per-operation errors. What batching is - and deliberately is not.',
 date: 'August 21, 2026 at 9:30am',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'native-dev-servers-per-framework',
 title: 'Your framework\u2019s dev server, not ours',
 description: 'pyrpc dev now launches uvicorn, flask run, or manage.py runserver natively. Why hosting your stack beats substituting for it, and how LaunchPlan made the matrix testable.',
 date: 'August 21, 2026 at 2:00pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'explicit-backend-config',
 title: 'Explicit beats magic: declaring your backend in pyrpc.json',
 description: 'The nested backend/clients schema, sniffing demoted from oracle to preselection, --yes that fails closed, and BackendSpec validation as a data model instead of scattered ifs.',
 date: 'August 22, 2026 at 3:00pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'the-types-module-contract',
 title: 'The types_module contract',
 description: 'Registration is an import side effect. Why Django layouts regenerated stale types under the old model, and how naming the registration module fixes reload semantics honestly.',
 date: 'August 22, 2026 at 1:00pm',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'jailed-path-autocomplete',
 title: 'A filesystem prompt that can\u2019t escape its jail',
 description: 'Client-root autocomplete via questionary.path: realpath containment filters symlink escapes from suggestions, while typed input stays free and only existence-checked. Tested headlessly.',
 date: 'August 22, 2026 at 5:30pm',
 readTime: '7 min',
 category: 'deep-dive',
 },
 {
 slug: 'live-reconfiguration-cfg-watcher',
 title: 'Editing pyrpc.json while the server runs',
 description: 'The config watcher diffs parsed BackendSpec values, restarts only when the backend changes, and re-wires codegen for client edits - plus the three races its tests had to kill.',
 date: 'August 23, 2026 at 10:00am',
 readTime: '8 min',
 category: 'deep-dive',
 },
 {
 slug: 'migrating-clients-to-links',
 title: 'Migrating your client to the links API',
 description: 'The mechanical before/after for v0.13.0: constructor options become a one-element links array, adapters re-export the terminators, and URL normalization gets looser not stricter.',
 date: 'August 23, 2026 at 11:00am',
 readTime: '6 min',
 category: 'tutorial',
 },
 {
 slug: 'flask-native-fullstack-tutorial',
 title: 'Flask + Next.js with flask run under the hood',
 description: 'Full walkthrough of examples/flask-nextjs on v0.13.0: one command launches Flask native and regenerates types, with directory autocomplete in the wizard and live config swaps to try.',
 date: 'August 23, 2026 at 2:30pm',
 readTime: '8 min',
 category: 'tutorial',
 },
 {
 slug: 'django-first-class-tutorial',
 title: 'Django gets first-class treatment in v0.13.0',
 description: 'manage.py runserver launched for you, entrypoint as a manage.py path, a required types_module pointing at views.py - and why that contract also fixes stale-type regen.',
 date: 'August 23, 2026 at 4:00pm',
 readTime: '8 min',
 category: 'tutorial',
 },
 {
 slug: 'site-redesign-brand-theming',
 title: 'Redesigning the site around the code',
 description: 'New brand assets, better-auth-style light/dark tokens, fumadocs 16.12 migration, and one shared Shiki palette so landing, docs, and playground render code identically.',
 date: 'August 23, 2026 at 6:30pm',
 readTime: '6 min',
 category: 'deep-dive',
 },
 {
 slug: 'docs-information-architecture-v2',
 title: 'Restructuring the docs for adapters, links, and AI',
 description: 'Why client adapters got their own section, links earned dedicated pages, llms.txt and MCP became first-class navigation, and small fixes like restored sidebar icons compound.',
 date: 'August 23, 2026 at 8:00pm',
 readTime: '5 min',
 category: 'deep-dive',
 },
 {
 slug: 'twelve-examples-one-bar',
 title: 'Twelve examples, one conformance bar',
 description: 'Links-based clients everywhere, fixed provider scope in CRA, working Svelte inputs, Vue-idiomatic hooks, restored configs - what conformance means for an examples matrix that must stay green.',
 date: 'August 24, 2026 at 9:00am',
 readTime: '6 min',
 category: 'deep-dive',
 },
 {
 slug: 'v0-13-0-release-notes',
 title: 'pyRPC v0.13.0: explicit backends and native dev servers',
 description: 'Release tour: declared backend config, framework-native dev servers, terminating links with batching, jailed autocomplete, and the site redesign - plus the two-step upgrade path.',
 date: 'August 24, 2026 at 12:00pm',
 readTime: '6 min',
 category: 'release',
 },
]

// Lowercase search haystack per post, built once at module load instead of
// on every keystroke.
const searchIndex = new Map<string, string>(
 posts.map((p) => [p.slug, `${p.title} ${p.description} ${p.slug}`.toLowerCase()]),
)

export default function BlogPage() {
 const [active, setActive] = useState<Category>('all')
 const [query, setQuery] = useState('')
 const inputRef = useRef<HTMLInputElement>(null)

 // "/" focuses the search input, matching the docs sidebar convention.
 useEffect(() => {
 const onKey = (e: KeyboardEvent) => {
 const target = e.target as HTMLElement | null
 if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
 if (e.key === '/') {
 e.preventDefault()
 inputRef.current?.focus()
 }
 }
 window.addEventListener('keydown', onKey)
 return () => window.removeEventListener('keydown', onKey)
 }, [])

 const tokens = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query])

 const filtered = useMemo(() => {
 const base = active === 'all' ? posts : posts.filter((p) => p.category === active)
 if (tokens.length === 0) return base
 return base.filter((p) => {
 const haystack = searchIndex.get(p.slug)
 return haystack !== undefined && tokens.every((t) => haystack.includes(t))
 })
 }, [active, tokens])

 const tagLabel: Record<Category, string> = {
 'all': '',
 'release': 'Release',
 'deep-dive': 'Deep Dive',
 'tutorial': 'Tutorial',
 }

 return (
 <div className="relative min-h-[calc(100svh-6.5rem)] pt-14 md:pt-24 pb-20">
 <div className="relative max-w-[1200px] mx-auto px-6">
 <div className="mb-16">
 <h1 className="text-2xl font-semibold tracking-tight leading-tight text-fd-foreground">
 Blog
 </h1>
 <p className="mt-4 text-sm text-fd-muted-foreground leading-relaxed max-w-xl">
 Thoughts, tutorials, and deep dives from the pyRPC team.
 </p>
 </div>

 <div className="flex items-center gap-2 mb-12 pb-6 border-b border-fd-border">
 <div className="relative">
 <svg
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 aria-hidden="true"
 className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-fd-muted-foreground pointer-events-none"
 >
 <circle cx="11" cy="11" r="8" />
 <path d="m21 21-4.3-4.3" />
 </svg>
 <input
 ref={inputRef}
 type="search"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Escape') {
 setQuery('')
 inputRef.current?.blur()
 }
 }}
 placeholder="Search posts"
 aria-label="Search posts"
 className="w-full sm:w-64 rounded-full bg-fd-muted/30 border border-fd-border pl-9 pr-9 py-1.5 text-xs text-fd-foreground placeholder:text-fd-muted-foreground outline-none focus:border-fd-ring transition-colors [&::-webkit-search-cancel-button]:appearance-none"
 />
 {query.length === 0 && (
 <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center justify-center h-4 min-w-4 px-1 rounded border border-fd-border bg-fd-muted/40 font-mono text-[9px] text-fd-muted-foreground pointer-events-none">
 /
 </kbd>
 )}
 </div>
 {categories.map((cat) => (
 <button
 key={cat.key}
 onClick={() => setActive(cat.key)}
 className={cn(
 "px-3 py-1.5 text-[11px] font-medium tracking-wide rounded-full transition-colors",
 active === cat.key
 ? "bg-fd-foreground text-fd-background dark:text-black"
 : "text-fd-muted-foreground hover:text-fd-foreground bg-fd-accent/30"
 )}
 >
 {cat.label}
 </button>
 ))}
 <span className="ml-auto shrink-0 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground" aria-live="polite">
 {query.trim().length > 0
 ? `${filtered.length} result${filtered.length === 1 ? '' : 's'}`
 : `${filtered.length} post${filtered.length === 1 ? '' : 's'}`}
 </span>
 </div>

 <div className="space-y-6">
 {[...filtered].reverse().map((post) => (
 <Link
 key={post.slug}
 href={`/blog/${post.slug}`}
 className="block group border border-edge rounded-lg p-5 hover:bg-fd-accent/30 transition-colors"
 >
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground mb-2">
 <time>{post.date}</time>
 <span>&middot;</span>
 <span>{post.readTime}</span>
 <span className="text-[9px] px-1.5 py-0.5 rounded bg-fd-accent/50 text-fd-muted-foreground font-bold">
 {tagLabel[post.category]}
 </span>
 </div>
 <h2 className="text-base font-semibold group-hover:text-fd-foreground transition-colors mb-1">
 {post.title}
 </h2>
 <p className="text-sm text-fd-muted-foreground leading-relaxed">
 {post.description}
 </p>
 </Link>
 ))}
 {filtered.length === 0 && (
 <div className="border border-edge rounded-lg p-10 text-center">
 <p className="text-sm text-fd-muted-foreground">
 No posts match your search.
 </p>
 <button
 onClick={() => {
 setQuery('')
 setActive('all')
 }}
 className="mt-3 text-xs underline underline-offset-4 text-fd-muted-foreground hover:text-fd-foreground transition-colors"
 >
 Clear search and filters
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 )
}
