import Link from 'next/link'

export default function VersionInThreePlacesPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    A version in three places
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 4:20pm</time>
                    <span>&middot;</span>
                    <span>6 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    A Python package in this repo has its version written in three different files. Each one serves a different consumer, and they must agree perfectly or the build breaks in a confusing way. This is why the release script touches all three.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The three homes</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# 1. pyproject.toml, the build metadata
[project]
version = "0.12.0"

# 2. src/pyrpc_core/__init__.py: the runtime value
__version__ = "0.12.0"

# 3. uv.lock: the workspace resolution
name = "pyrpc-core"
version = "0.12.0"`}
                </pre>
                <p>
                    Three copies of the same truth, three different consumers.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">pyproject.toml: the build identity</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">python -m build</code> reads <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">version</code> from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[project]</code> to name the wheel and sdist. PyPI keys its releases on this string. If it is wrong, you publish the wrong version, or, worse, collide with an existing one.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">__init__.py: the runtime truth</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">__version__</code> is the value a running Python process sees. The CLI prints it in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc version</code>, and the test for that command asserts the output contains <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"pyRPC version"</code>, deliberately not a specific number, because the test would otherwise break on every release. The two copies of the version are expected to stay equal but are consumed by entirely different systems.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The lockfile: the resolved truth</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">uv.lock</code> records every workspace member's version. When pyproject.toml changes but the lockfile does not, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">uv sync</code> reports the project as out of date, not an error, but a perpetually dirty working tree and confusing CI diffs. So the release process runs <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">uv lock</code> right after the bump, folding the version into the lockfile.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Could there be one source?</h2>
                <p>
                    Modern tooling offers a single-source option: read the version dynamically from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">__init__.py</code> via a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">dynamic = ["version"]</code> PEP 621 declaration. pyRPC does not do that, the release script's job is to make the three copies agree, and it prefers the plainest, most buildable shape. The tradeoff is accepted consciously: a script guarantees the invariant instead of a build-time indirection that can surprise packaging tools.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The invariant</h2>
                <p>
                    The rule the release process enforces: <em>after a bump, pyproject.toml, __init__.py, and uv.lock all read the same version.</em> The release script handles the first two; the lockfile sync handles the third. Three files, one truth, zero drift, that is the whole discipline.
                </p>
            </section>
        </article>
    )
}
