import Link from 'next/link'

export default function V040ConfigPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 pyrpc.json: why we left pyproject.toml behind
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>June 6, 2026 at 8:00am</time>
 <span>&middot;</span>
 <span>9 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 Every Python web tool faces the same question eventually: where does the
 configuration live? The obvious answer, <code>pyproject.toml</code>,
 under <code>[tool.pyrpc]</code>, was pyrpc&rsquo;s first answer. It
 lasted through three minor versions before we pulled it out into a dedicated
 <code>pyrpc.json</code> file. This post explains why.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The original design: <code>[tool.pyrpc]</code></h2>
 <p>
 When pyrpc needed its first project-level configuration (the entry point module
 and framework choice), <code>pyproject.toml</code> was the natural home. It&rsquo;s
 the standard place for Python tool configuration. Black uses it. Ruff uses it.
 Pytest uses it. The pattern is well-understood.
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# pyproject.toml
[tool.pyrpc]
framework = "fastapi"
entry = "app.main:app"`}</pre>
 <p>
 The implementation was straightforward: use <code>tomllib</code> to parse the
 file, look under <code>tool.pyrpc</code>, and extract the values. Writing was
 more involved, parsing the TOML, finding the <code>[tool.pyrpc]</code>
 section, replacing it in-place, and serializing back to TOML format without a
 library (since Python&rsquo;s <code>tomllib</code> is read-only).
 </p>
 <p>
 This worked. But as pyrpc grew, three problems emerged that couldn&rsquo;t
 be fixed within the pyproject.toml paradigm.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Problem 1: The config writer was fragile</h2>
 <p>
 Writing <code>[tool.pyrpc]</code> back to <code>pyproject.toml</code> required
 a hand-written TOML serializer. Python&rsquo;s standard library has
 <code>tomllib</code> (parse only) and <code>tomlkit</code> (round-trip), but
 we didn&rsquo;t want to add a dependency just for config writing. The custom
 serializer worked for simple string values, but it didn&rsquo;t handle multiline
 strings, inline tables, or array values. Every edge case was a potential bug.
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# The hand-written serializer:
config_lines = ["[tool.pyrpc]\\n"]
for key, value in config.items():
 if isinstance(value, str):
 config_lines.append(f'{key} = "{value}"\\n')
 elif isinstance(value, bool):
 config_lines.append(f"{key} = {'true' if value else 'false'}\\n")

# Find [tool.pyrpc] in the file, replace section
start_idx = None
for i, line in enumerate(lines):
 if line.strip().startswith("[tool.pyrpc]"):
 start_idx = i
 break
# ... fragile in-place replacement`}</pre>
 <p>
 This was the kind of code that works until it doesn&rsquo;t. A user with
 comments in their <code>[tool.pyrpc]</code> section, or with non-standard
 formatting, would get corrupted config. We were one bug report away from
 a data-loss issue.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Problem 2: No clear file ownership</h2>
 <p>
 <code>pyproject.toml</code> belongs to the project build system. Other tools
 read from it. When pyrpc writes its config back, it touches every line of the
 file, re-serializing the entire <code>[tool.pyrpc]</code> section and
 potentially altering whitespace around it. A user running <code>pyrpc dev --reconfigure</code>
 could inadvertently trigger a reformat of their <code>pyproject.toml</code>,
 causing a confusing diff in unrelated sections.
 </p>
 <p>
 More subtly: if another tool also wrote to <code>pyproject.toml</code> between
 pyrpc&rsquo;s read and write, the hand-written serializer would clobber those
 changes. There was no merge logic, no atomic write, no backup.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Problem 3: Path semantics were ambiguous</h2>
 <p>
 The biggest problem wasn&rsquo;t technical, it was semantic. pyrpc
 needed a <code>client_root</code> field: a path to the TypeScript client
 project. Where is that path relative to? The config file? The current working
 directory? The project root?
 </p>
 <p>
 In <code>pyproject.toml</code>, there&rsquo;s no strong convention. Some tools
 resolve relative to <code>pyproject.toml</code>&rsquo;s directory. Others use
 <code>os.getcwd()</code>. The ambiguity meant every path-using function had to
 document its own resolution strategy, and users had to guess which one applied.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The solution: <code>pyrpc.json</code></h2>
 <p>
 A dedicated config file fixes all three problems:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`{
 "version": 1,
 "framework": "fastapi",
 "entrypoint": "app.main",
 "client_root": "../frontend"
}`}</pre>
 <p>
 <strong>Writing is trivial.</strong> <code>json.dump(config, f, indent=2)</code>
 is a single line. No hand-written serializer, no line-by-line parsing, no edge
 cases. JSON is lossless for the types pyrpc needs (strings, numbers, booleans).
 </p>
 <p>
 <strong>File ownership is clear.</strong> pyrpc owns <code>pyrpc.json</code>
 entirely. No other tool reads it. No other tool writes to it. There&rsquo;s
 zero risk of cross-tool clobbering. If the file is missing, pyrpc creates it.
 If it&rsquo;s corrupted, pyrpc shows an error and prompts for re-setup.
 </p>
 <p>
 <strong>Path semantics are unambiguous.</strong> All paths in
 <code>pyrpc.json</code> are resolved relative to the config file&rsquo;s
 directory. Resolution happens once, at config load time, and produces absolute
 paths. Downstream code never sees a relative path. This is documented and
 enforced:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _resolve_client_root(client_root: str, config_dir: str) -> str:
 p = os.path.join(config_dir, client_root) \\
 if not os.path.isabs(client_root) \\
 else client_root
 return os.path.normpath(p)`}</pre>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why JSON and not TOML or YAML?</h2>
 <p>
 JSON was chosen for three reasons:
 </p>
 <ol className="space-y-2">
 <li>
 <strong>Zero dependencies.</strong> <code>json</code> is in the Python
 standard library. TOML writing would require <code>tomlkit</code> or a
 custom serializer (which is how we got into this mess). YAML would require
 <code>PyYAML</code>.
 </li>
 <li>
 <strong>Idempotent writes.</strong> <code>json.dump</code> with
 <code>indent=2</code> produces deterministic output. Running
 <code>pyrpc dev --reconfigure</code> with the same values produces the
 same file. TOML writing libraries can reorder keys or reformat comments.
 </li>
 <li>
 <strong>Universal readability.</strong> Every language can parse JSON
 without a special library. If we ever build the client-side
 <code>npx pyrpc</code> CLI, it can read <code>pyrpc.json</code> without
 needing a TOML parser.
 </li>
 </ol>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The version field</h2>
 <p>
 You might wonder why there&rsquo;s a <code>"version": 1</code> in the file.
 It&rsquo;s future-proofing. If we ever change the config schema in a breaking
 way, the version field lets us detect old configs and (in theory) migrate them.
 For now, we always write version 1 and never read a file without it. It&rsquo;s
 a header, not a feature, but it&rsquo;s the kind of header that saves
 you from a painful migration two years from now.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What we lost</h2>
 <p>
 One thing: <code>pyproject.toml</code> is a well-known file. Developers know
 to look there for tool configuration. <code>pyrpc.json</code> is new and
 requires discovery. We mitigate this with the <code>pyrpc dev</code> setup
 wizard, which creates the file automatically on first run, most users
 never need to know the file exists.
 </p>
 <p>
 The <code>_find_pyrpc_json()</code> function walks up the directory tree
 (like ESLint&rsquo;s config resolution), so, like
 <code>pyproject.toml</code>, it works from any subdirectory:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _find_pyrpc_json() -> Path | None:
 path = Path.cwd()
 for parent in [path] + list(path.parents):
 candidate = parent / CONFIG_FILE
 if candidate.is_file():
 return candidate
 return None`}</pre>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The bottom line</h2>
 <p>
 Config files are infrastructure, not product. They should be boring. A
 single-file JSON config for a single-purpose tool is the most boring,
 most reliable choice. <code>pyproject.toml</code> is the right answer for
 tools that integrate deeply into the Python build system. pyrpc is not one
 of those tools, it&rsquo;s a cross-language RPC framework whose
 configuration concerns (framework, entrypoint, client path) have nothing
 to do with package building. A dedicated file is the honest architecture.
 </p>
 </section>
 </article>
 )
}
