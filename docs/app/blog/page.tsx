'use client';

import Link from 'next/link'
import { useState } from 'react'
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
        description: 'The three critical fixes that ship pyRPC v0.2.0: real type generation, working async, and a postinstall-based @pyrpc/types setup.',
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
        description: 'Three tiers of CLI commands, the packaging-vs-code dependency distinction, and why lazy imports define capability boundaries \u2014 not just startup time.',
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
        description: 'Four strategies for breaking circular package dependencies in Python, evaluated through pyrpc\u2019s real-world restructuring \u2014 with a step-by-step extraction guide.',
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
        description: 'How we turned pyrpc\'s architecture into version-controlled, interactive diagrams using LikeC4 — and why every framework should do the same.',
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
        description: 'Architecture of @pyrpc/react, next, vue, and svelte — one transport, flat DX, query/mutation kinds, and Next.js hydration.',
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
        description: 'Why createNextClient / createReactClient return a single value with procedures, Provider, and server helpers — and why the variable can be named api or client.',
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
        description: 'Keep Promise calls via api.client / createCaller while adopting useQuery — and annotate mutations on the server.',
        date: 'July 27, 2026 at 5:15am',
        readTime: '7 min',
        category: 'tutorial',
    },
    {
        slug: 'v0-9-0-framework-adapters',
        title: 'v0.9.0 — Framework adapters, procedure kinds, one api object',
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
        title: 'Why we chose TanStack Query — and what it gives you for free',
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
]

export default function BlogPage() {
    const [active, setActive] = useState<Category>('all')

    const filtered = active === 'all' ? posts : posts.filter(p => p.category === active)

    const tagLabel: Record<Category, string> = {
        'all': '',
        'release': 'Release',
        'deep-dive': 'Deep Dive',
        'tutorial': 'Tutorial',
    }

    return (
        <div className="max-w-3xl mx-auto px-6 py-20">
            <h1 className="text-2xl font-bold tracking-tight uppercase font-mono mb-2">Blog</h1>
            <p className="text-sm text-fd-muted-foreground mb-8">
                Design notes, deep dives, and updates from the pyrpc team.
            </p>

            <div className="flex items-center gap-2 mb-12 pb-6 border-b border-fd-border">
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
            </div>
        </div>
    )
}
