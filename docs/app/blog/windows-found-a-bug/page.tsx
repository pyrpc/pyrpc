import Link from 'next/link'

export default function WindowsFoundABugPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The Windows CI leg found a real bug on day one
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 2:00pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The strongest argument for expanding a CI matrix is that you do not know what it will find. We
                    added Windows and macOS legs to the Python suite alongside 3.12 and 3.13, mostly on principle:
                    file watchers and path handling are environment-dependent, and the project had shipped watcher
                    bugs before. Within one pull request, the Windows leg caught a first-run crash affecting every
                    Windows user of pyrpc dev. Here is the anatomy.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The crash</h2>
                <p>
                    Three Windows legs failed identically in under forty seconds. Five tsconfig tests died with:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`FileNotFoundError: [WinError 2] The system cannot find the file specified`}</pre>
                <p>
                    raised from inside jsonc-edit, the dependency that lets pyRPC inject its <code>@pyrpc/types</code>{' '}
                    alias into comment-bearing tsconfig files without destroying them. On Linux and macOS the same
                    tests passed. Classic matrix payoff: same code, different platform, different truth.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The mechanism</h2>
                <p>
                    jsonc-edit bootstraps a persistent Node daemon for its underlying parser. Before starting, it
                    installs a pinned parser version by invoking <code>npm install</code> as an unqualified name in
                    a fresh cache directory. That is where the platforms part ways:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>POSIX:</strong> npm is a script with a node shebang; exec resolves it fine.</li>
                    <li><strong>Windows:</strong> npm is npm.cmd, a batch file. CreateProcess cannot execute batch files directly, so the spawn fails with WinError 2 before npm ever runs.</li>
                </ul>
                <p>
                    The failure only manifests when the bootstrap cache is cold, which is precisely the situation of
                    every new user running <code>pyrpc dev</code> on Windows for the first time. Warm caches hid the
                    bug from anyone with an established checkout.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The fix went upstream</h2>
                <p>
                    Because jsonc-edit is ours, the right fix lived there, not in a compatibility shim around it.
                    Version 0.2.1 resolves the npm executable through shutil.which (finding npm.cmd) and routes
                    execution through COMSPEC on Windows. pyrpc-core&rsquo;s dependency floor moved to 0.2.1 so the
                    shipped package cannot resolve the broken line. A tempting local patch existed, but wrapping a
                    library&rsquo;s internals to hide its bug just distributes the bug to every other consumer while
                    making ours look healthy.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The rest of the haul</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Error paths now print forward slashes everywhere.</strong> Windows users saw <code>app\\main.py:2</code> in the actionable import-error hint; greppable output should not depend on os.sep. Normalized once at the reporting boundary.</li>
                    <li><strong>Symlink fixtures skip on Windows,</strong> where creating them requires elevated privileges. The autocomplete jail tests assert everything else unconditionally and symlink behavior conditionally.</li>
                    <li><strong>The gate pattern kept merges possible:</strong> nine matrix legs feed one aggregate job named test-python, which is the exact check-run name branch protection requires. Renaming checks silently breaks every open PR, so the aggregate exists to absorb future matrix growth.</li>
                </ul>

                <p>
                    Cost of the whole expansion: one workflow file, two test guards, one path normalization. Return:
                    a shipped-user-facing crash fixed within the hour of first exposure. Matrices are cheap insurance
                    until they are expensive evidence.
                </p>
            </section>
        </article>
    )
}
