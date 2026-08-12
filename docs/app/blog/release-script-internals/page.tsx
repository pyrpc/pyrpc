import Link from 'next/link'

export default function ReleaseScriptInternalsPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    release.mjs: one command, eleven packages
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 4:00pm</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Releasing pyRPC means bumping the version in eleven packages across two ecosystems at once. Doing that by hand is an invitation to drift — one package at 0.12.0 and another at 0.11.1, with a broken publish chain as the reward. The fix is a 85-line Node script that walks the packages directory and rewrites every version marker.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The entry point</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`node scripts/release.mjs 0.12.0

// the script even tolerates a stray 'v':
const cleanVersion = newVersion.replace(/^v/, '');`}
                </pre>
                <p>
                    One argument, zero flags. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">v</code>-stripping is a small ergonomic touch with a real purpose: the release workflow is described as <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">git tag v0.12.0</code> everywhere, so a user copy-pasting the tag into the script gets the right result either way.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The walk</h2>
                <p>
                    The script reads the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">packages/</code> directory and, for every directory, applies up to three independent edits:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li><strong>package.json</strong> — if present, set <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">version</code>.</li>
                    <li><strong>pyproject.toml</strong> — if present, regex-replace the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">version = "..."</code> line.</li>
                    <li><strong>src/&lt;pkg&gt;/__init__.py</strong> — if present and contains <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">__version__</code>, rewrite it.</li>
                </ul>
                <p>
                    Existence checks make the walk safe for heterogeneous packages: an npm-only package gets one edit, a Python-only package gets two, and nothing breaks because a file is missing.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The dependency sweep</h2>
                <p>
                    The most subtle part is not the version itself — it is every <em>reference</em> to the version from inside the other packages:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`for (const section of ['dependencies', 'peerDependencies']) {
  for (const name of Object.keys(ranges)) {
    if (name.startsWith('@pyrpc/')) {
      ranges[name] = \`^\${cleanVersion}\`;
    }
  }
}`}
                </pre>
                <p>
                    Every internal <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/*</code> range is swept to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">^0.12.0</code>. If this step were skipped, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/react</code> could be published at 0.12.0 while still depending on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client@^0.11.0</code> — a broken version pair on the registry. The prefix check means third-party dependencies are never touched.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The root pyproject</h2>
                <p>
                    The workspace root also carries a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyproject.toml</code> used by uv, and it gets the same regex treatment as the package-level ones. The root version is a workspace-coordination value, not a published artifact, but keeping it in lockstep avoids confusing <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">uv lock</code> diffs.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What the script does not do</h2>
                <p>
                    The script ends by printing the follow-up commands: commit, tag, push. It deliberately does not create the tag itself. That decision keeps a human in the loop at the one point where a mistake is unrecoverable (a pushed tag triggers the publish pipeline). The script is idempotent machinery; the tag is a conscious act.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The lesson</h2>
                <p>
                    Version synchronization is a mechanical problem, so it gets a mechanical solution. The script's value is not cleverness — it is completeness: eleven packages, both ecosystems, dependency ranges included, root workspace included. A checklist you can run is a checklist that cannot be half-executed.
                </p>
            </section>
        </article>
    )
}
