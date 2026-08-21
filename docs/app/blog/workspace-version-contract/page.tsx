import Link from 'next/link'

export default function WorkspaceVersionContractPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The version contract between npm workspaces and uv
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 6:40pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The npm and Python sides of the repo never import each other's code. But they share a version number, and that number is an unenforced contract. Nothing in either package manager knows about the other, the agreement lives entirely in the release script and in human discipline. This post is about how that contract is structured and where it can quietly break.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The two dependency languages</h2>
                <p>
                    Python and npm express the same "depends on another package" idea differently:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# pyproject.toml (pyrpc-fastapi)
dependencies = ["pyrpc-core>=0.12.0"]

// package.json (@pyrpc/react)
"dependencies": { "@pyrpc/client": "^0.12.0" }`}
                </pre>
                <p>
                    One uses PEP 508 requirement strings, the other uses semver ranges with a caret. Neither syntax is shared, neither resolver coordinates with the other, and both package managers would happily resolve against a registry where the two ecosystems have drifted apart.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The contract is a convention</h2>
                <p>
                    pyRPC commits to a strong invariant: <em>all eleven packages ship the same version, and cross-package dependencies always reference that version.</em> The invariant is enforced by convention and tooling:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>One tag (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">v0.12.0</code>) names one release containing both ecosystems.</li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">release.mjs</code> sweeps both <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/*</code> ranges (npm) and, implicitly, the Python dependencies via the shared version.</li>
                    <li>Lockfiles are re-synced after every bump so both resolvers agree with the manifests.</li>
                </ul>
                <p>
                    The word "implicitly" is doing heavy lifting on the Python side: the script bumps versions but does not sweep PEP 508 requirement strings, because those use <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&gt;=0.12.0</code> bounds rather than exact versions, a range that remains satisfied as the version rises. The Python contract is looser by design.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Where drift could creep in</h2>
                <p>
                    The failure modes are exactly the ones the release flow guards against:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Bumping npm packages but forgetting the Python side → the tag ships half a version.</li>
                    <li>Bumping manifests but not the lockfiles → CI's locked resolution fails.</li>
                    <li>Hand-editing one package.json range → a published pair that cannot co-install.</li>
                </ul>
                <p>
                    None of these fail at bump time. They fail later (at publish, at CI, or at a user's install) which is why the process is mechanical and reviewed.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why coordinate at all?</h2>
                <p>
                    A monorepo could skip the contract entirely and let each package version independently. pyRPC chooses lockstep because the product is consumed as a system: you install a Python adapter and a TypeScript adapter that were designed together and are documented together. A shared version is the simplest possible compatibility statement, <em>everything from tag X works together</em>. It costs some flexibility and buys a guarantee users can verify by reading one number.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The lesson</h2>
                <p>
                    When two package managers share a monorepo, the version is a contract you must enforce because neither tool will. The enforcement points are a shared tag, a sweeping script, and lockfile syncing, mechanical steps that turn a fragile convention into a repeatable process.
                </p>
            </section>
        </article>
    )
}
