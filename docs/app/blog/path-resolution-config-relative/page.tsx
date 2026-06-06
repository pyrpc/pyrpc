import Link from 'next/link'

export default function PathResolutionPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Path resolution in pyrpc: config-relative, not CWD-relative
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 6, 2026 at 8:15am</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    One of the most deceptively hard problems in pyrpc&rsquo;s design was path
                    resolution. The question sounds simple: &ldquo;When a user sets
                    <code>client_root: &quot;../frontend&quot;</code> in their config file,
                    where exactly is that path relative to?&rdquo; The answer determines whether
                    <code>pyrpc dev</code> works from a project subdirectory, whether monorepo
                    setups are ergonomic, and whether the generated types end up in the right place.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The default trap</h2>
                <p>
                    The naive approach is to resolve relative to <code>os.getcwd()</code>. This is
                    what most Python tools do. It works fine when the user runs the tool from the
                    project root. But pyrpc users often work from subdirectories:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`project/
  server/
    main.py
    pyrpc.json     # client_root: "../frontend"
  frontend/
    src/
      client.ts
    node_modules/
      @pyrpc/types/src/index.ts

# User runs from server/:
cd project/server
pyrpc dev

# With os.getcwd() resolution, "../frontend" → project/server/../frontend
# → project/frontend ✓  (works by accident in this case)

# With config-relative resolution, "../frontend" → project/server/../frontend
# → project/frontend ✓  (same result)`}</pre>
                <p>
                    In this case both approaches work. The difference appears when the config file
                    is in a different location than expected, or when the user runs pyrpc from
                    outside the project.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why os.getcwd() is wrong</h2>
                <p>
                    Consider a monorepo with <code>pyrpc.json</code> at the root, and the user
                    runs <code>cd server &amp;&amp; pyrpc dev</code>:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`monorepo/
  pyrpc.json       # client_root: "frontend"
  server/
    main.py
  frontend/
    node_modules/
      @pyrpc/types/src/index.ts

# User runs from server/:
cd monorepo/server
pyrpc dev

# With os.getcwd() resolution: "frontend" → monorepo/server/frontend ✗
# (nowhere near the actual frontend project)

# With config-relative resolution: "frontend" → monorepo/frontend ✓
# (from pyrpc.json's directory, which is monorepo/)`}</pre>
                <p>
                    The <code>_find_pyrpc_json()</code> function walks up from CWD to find the
                    config file, so it finds <code>monorepo/pyrpc.json</code>. But the path
                    resolution still depends on whether we use the config file&rsquo;s directory
                    or the CWD. Using the config file&rsquo;s directory is the only correct answer
                    &mdash; it makes the config file a self-contained unit whose meaning doesn&rsquo;t
                    change based on where the user happens to be standing.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The resolution pipeline</h2>
                <p>
                    pyrpc&rsquo;s path resolution happens in a strict pipeline, once, at config
                    load time:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`1. Find pyrpc.json (walk up from CWD)
2. Determine config_dir = os.path.dirname(pyrpc.json)
3. For each path in config:
     if os.path.isabs(path): use as-is
     else: os.path.join(config_dir, path)
4. Normalize (os.path.normpath)
5. Pass absolute paths everywhere downstream`}</pre>
                <p>
                    This means step 5 is critical: <strong>no downstream code ever receives a
                    relative path.</strong> Once config is loaded, every path is absolute. The
                    <code>types_output</code> path is derived from <code>client_root</code> at load
                    time and stored as an absolute path:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`new_client_root = _resolve_client_root(
    client_root_raw, config_dir
)
new_types_output = os.path.join(
    new_client_root,
    "node_modules/@pyrpc/types/src/index.ts"
)

# Both are absolute before any function sees them`}</pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The <code>save_typescript_client()</code> enforcement</h2>
                <p>
                    To make sure no caller accidentally passes a relative path, the codegen API
                    itself rejects relative paths at the boundary:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def save_typescript_client(schemas, output_path):
    if not os.path.isabs(output_path):
        raise ValueError(
            "save_typescript_client requires an absolute path"
        )
    # ... write file`}</pre>
                <p>
                    This is a &ldquo;fail fast&rdquo; contract. The old code silently joined
                    relative paths with <code>os.getcwd()</code>, which was a time bomb &mdash;
                    it worked by accident depending on CWD, then broke when called from a different
                    context. The explicit error makes the contract visible and forces every caller
                    to think about path resolution.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The types output convention</h2>
                <p>
                    The types output path isn&rsquo;t stored in <code>pyrpc.json</code>. It&rsquo;s
                    derived from <code>client_root</code> by convention:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`{client_root}/node_modules/@pyrpc/types/src/index.ts`}</pre>
                <p>
                    Why hardcode this path instead of making it configurable? Two reasons:
                </p>
                <ol className="space-y-2">
                    <li>
                        <strong>The monorepo convention.</strong> This is where npm installs the
                        <code>@pyrpc/types</code> package. The types file lives inside the installed
                        package, which means <code>{`import type { Types } from "@pyrpc/types"`}</code>
                        works without any path configuration in TypeScript&rsquo;s
                        <code>tsconfig.json</code> paths or import aliases.
                    </li>
                    <li>
                        <strong>One fewer config knob.</strong> Every configurable path is a decision
                        the user has to make. By making the convention rigid, we eliminate a class
                        of &ldquo;where did my types go?&rdquo; bugs. Users who need a custom
                        location can use <code>pyrpc codegen --output</code> for one-off generation.
                    </li>
                </ol>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Two things we got right from the start</h2>
                <p>
                    First, <code>os.path.normpath</code> is applied to every resolved path. This
                    eliminates <code>..</code> segments and normalizes separators &mdash; critical
                    for cross-platform correctness and for comparing paths in the migration logic.
                    <code>&quot;../frontend&quot;</code> and <code>&quot;../frontend/&quot;</code> and
                    <code>&quot;../frontend/./&quot;</code> all normalize to the same string.
                </p>
                <p>
                    Second, absolute paths in the config file pass through unchanged. If a user
                    sets <code>&quot;client_root&quot;: &quot;C:/Projects/frontend&quot;</code>,
                    it&rsquo;s used as-is. The config-relative resolution only applies to relative
                    paths. This means users in CI environments can hardcode absolute paths without
                    worrying about the config file location.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The principle</h2>
                <p>
                    Path resolution follows one rule: <strong>a config file is a self-contained
                    unit.</strong> All paths in it are meaningful relative to the file itself, not
                    to the user&rsquo;s terminal location. This is the same rule that Docker
                    follows (<code>docker-compose.yml</code> paths are relative to the compose
                    file), that Webpack follows (<code>context</code> defaults to the config
                    directory), and that Terraform follows (module paths are relative to the
                    <code>.tf</code> file). It&rsquo;s a well-established convention in tools
                    that have config files &mdash; and it&rsquo;s the convention pyrpc now follows.
                </p>
            </section>
        </article>
    )
}
