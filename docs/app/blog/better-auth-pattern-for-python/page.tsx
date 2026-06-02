import Link from 'next/link'

export default function BetterAuthPatternPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The Better Auth meta-package pattern, adapted for Python
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 2, 2026</time>
                    <span>&middot;</span>
                    <span>9 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    When we started designing pyRPC's package architecture, we looked at how
                    other frameworks organize their packages. The usual suspects were obvious:
                    FastAPI, Flask, Django. But the most instructive comparison was
                    <strong>Better Auth</strong> &mdash; a TypeScript authentication library
                    that solves a packaging problem remarkably similar to ours.
                </p>
                <p>
                    This post is about how Better Auth's meta-package pattern works, why we
                    could not use it directly in Python, and how we adapted the same idea
                    into a three-package structure that respects Python's packaging constraints.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Better Auth's meta-package model</h2>
                <p>
                    Better Auth is a TypeScript library for authentication. It has a core
                    package, framework adapters, database adapters, and plugins. In npm, they
                    ship this as a <strong>meta-package</strong>: you install <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">better-auth</code>
                    and it re-exports everything from its sub-packages.
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`// npm: one install, everything available
npm install better-auth

// The meta-package re-exports sub-packages
import { auth } from "better-auth"           // core
import { react } from "better-auth/react"     // React adapter
import { next } from "better-auth/next"       // Next.js adapter`}
                </pre>
                <p>
                    The beauty of this pattern is that the sub-packages can depend on each
                    other in any direction &mdash; npm does not care about circular dependencies
                    between packages that are always installed together. The meta-package just
                    aggregates them. Developers get one install command and one version to
                    track, and the library authors can split concerns across packages without
                    worrying about install UX.
                </p>
                <p>
                    We wanted this exact pattern for pyRPC. One install command, everything
                    works. The ideal was:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`# Dream scenario: one meta-package
pip install pyrpc
# Gives you: core runtime + CLI + TypeScript codegen`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why it does not translate directly</h2>
                <p>
                    Python packaging has a constraint that npm does not: <strong>no package
                    namespaces without a meta-package on PyPI</strong>. You cannot publish
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc/core</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc/cli</code> as separate packages on PyPI &mdash;
                    the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">/</code> namespace separator does not exist. You get flat names:
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-cli</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-codegen</code>.
                </p>
                <p>
                    More importantly, <strong>Python packaging tools (pip, uv, poetry) cannot
                    resolve circular dependencies</strong>. If <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code> depends on
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-cli</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-cli</code> depends on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc-core</code>, you get
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ResolutionImpossible</code>. In npm, circular dependencies between sibling
                    packages under a common meta-package are irrelevant because npm resolves
                    the dependency tree before installation and does not care about cycles
                    between co-installed packages.
                </p>
                <p>
                    This means we cannot have a true meta-package in Python. The closest we
                    can get is a chain: one package depends on another, which depends on a
                    third. The chain must be acyclic and the direction must be unambiguous.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The Better Auth model reimagined for Python</h2>
                <p>
                    We mapped Better Auth's logical model onto Python's constraints:
                </p>
                <table className="w-full text-[10px] font-mono border-collapse [&_td]:border [&_td]:border-fd-muted [&_td]:px-3 [&_td]:py-2">
                    <thead>
                        <tr className="bg-fd-muted">
                            <th className="border border-fd-muted px-3 py-2 text-left">npm (Better Auth)</th>
                            <th className="border border-fd-muted px-3 py-2 text-left">PyPI (pyRPC)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-fd-muted px-3 py-2"><code className="text-[10px] font-mono">better-auth</code> (meta-package)</td>
                            <td className="border border-fd-muted px-3 py-2"><code className="text-[10px] font-mono">pyrpc-core</code> (entry point, declares deps)</td>
                        </tr>
                        <tr>
                            <td className="border border-fd-muted px-3 py-2"><code className="text-[10px] font-mono">better-auth/core</code></td>
                            <td className="border border-fd-muted px-3 py-2"><code className="text-[10px] font-mono">pyrpc-core</code> (same package, contains Router, etc.)</td>
                        </tr>
                        <tr>
                            <td className="border border-fd-muted px-3 py-2"><code className="text-[10px] font-mono">better-auth/react</code></td>
                            <td className="border border-fd-muted px-3 py-2"><code className="text-[10px] font-mono">pyrpc-cli</code> (separate concern, depends on core + codegen)</td>
                        </tr>
                        <tr>
                            <td className="border border-fd-muted px-3 py-2"><em>no equivalent</em></td>
                            <td className="border border-fd-muted px-3 py-2"><code className="text-[10px] font-mono">pyrpc-codegen</code> (pure library at bottom of chain)</td>
                        </tr>
                    </tbody>
                </table>
                <p>
                    The key insight: <strong>we merged the meta-package role into pyrpc-core
                    itself</strong>. pyrpc-core is both the runtime library <em>and</em> the package
                    that declares the dependency on pyrpc-cli. When you install pyrpc-core,
                    pip resolves the chain and pulls in pyrpc-cli and pyrpc-codegen
                    transitively. One install command, everything present, no cycles.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The chain, visualized</h2>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`Better Auth (npm):
  better-auth (meta-package)
    ├── @better-auth/core          (no deps on other better-auth packages)
    ├── @better-auth/react         (depends on core)
    └── @better-auth/next          (depends on core + react)
  → Circular deps don't matter in npm

pyRPC (PyPI):
  pip install pyrpc-core
    └── pyrpc-core                 (runtime, also acts as entry point)
        └── depends on: pyrpc-cli  (CLI tooling)
            └── depends on: pyrpc-codegen  (pure library, no pyrpc deps)
  → Chain must be acyclic in Python`}
                </pre>
                <p>
                    The pyrpc-core package plays double duty: it is the runtime library
                    (Router, decorators, adapters) <em>and</em> the logical equivalent of the
                    meta-package (the thing you install to get everything). This is a
                    pragmatic compromise: it works because pyrpc-core never imports pyrpc-cli
                    at module level. The packaging dependency ensures pyrpc-cli is on disk,
                    but the code dependency is lazy.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why pyrpc-codegen is at the bottom</h2>
                <p>
                    In the Better Auth model, a "codegen" package would likely depend on
                    "core" to introspect types. That is what we originally had: pyrpc-codegen
                    depended on pyrpc-core. But that creates a cycle when pyrpc-core (the
                    meta-package equivalent) needs to depend on pyrpc-codegen.
                </p>
                <p>
                    The solution was to make pyrpc-codegen a <strong>pure transformation
                    library</strong> that takes a dict and returns a string. It has no pyrpc
                    dependencies at all. The introspect-and-codegen workflow is owned by
                    pyrpc-cli, which depends on both pyrpc-core (for introspection) and
                    pyrpc-codegen (for generation). The chain flows cleanly downward.
                </p>
                <p>
                    This is the Better Auth principle applied under Python constraints:
                    separate concerns into packages, establish a clear dependency direction,
                    and let the top-level package be the one-install entry point. The result
                    is not as elegant as npm namespaces, but it is predictable, maintainable,
                    and free of cycles.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The meta-package pattern in practice</h2>
                <p>
                    If you are designing a Python multi-package project and want the
                    one-install experience, here is the recipe:
                </p>
                <ol className="text-fd-muted-foreground">
                    <li><strong>Identify the production package.</strong> This is what users will pip install. It is the runtime, the library, the thing they import. Call it <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">yourproject-core</code> or <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">yourproject-lib</code>.</li>
                    <li><strong>Identify the developer tooling.</strong> CLI commands, code generators, dev servers, file watchers. These go in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">yourproject-cli</code>.</li>
                    <li><strong>Identify pure libraries.</strong> Packages that transform data without knowing about your runtime. These go at the bottom of the dependency chain with no internal dependencies.</li>
                    <li><strong>Make the production package depend on the CLI.</strong> Not the other way. The production package is the entry point. It declares the CLI as a dependency so pip installs everything. Use lazy imports in the CLI to avoid loading core until needed.</li>
                    <li><strong>No internal dependencies on pure libraries.</strong> Pure libraries should not depend on any of your other packages. They are standalone.</li>
                </ol>
                <p>
                    This pattern gives you the Better Auth one-install UX within Python's
                    packaging constraints. It is not a meta-package in the npm sense &mdash;
                    it is a dependency chain &mdash; but it achieves the same goal for the
                    end user.
                </p>
                <p>
                    All 45 tests pass. The repo is at <a href="https://github.com/pyrpc/pyrpc" className="underline hover:text-fd-foreground">github.com/pyrpc/pyrpc</a>.
                </p>
            </section>
        </article>
    )
}
