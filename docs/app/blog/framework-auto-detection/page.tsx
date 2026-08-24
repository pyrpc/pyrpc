import Link from 'next/link'

export default function FrameworkAutoDetectionPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 Framework auto-detection: reading the room from config files
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 8, 2026 at 9:00am</time>
 <span>&middot;</span>
 <span>7 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 When <code>pyrpc dev</code> needs to know what frontend framework you use, it does not ask.
 It looks at your filesystem. The presence of a <code>next.config.ts</code> or a
 <code>vite.config.js</code> is a far more reliable signal than anything a user might type,
 and the detection logic is tiny enough to live in one function.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 The signature table
 </h2>
 <p>
 Detection starts from a flat mapping of config filenames to canonical framework labels:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`_FRAMEWORK_SIGNATURES: list[tuple[str, str]] = [
 ("next.config.ts", "Next.js"),
 ("next.config.js", "Next.js"),
 ("next.config.mjs", "Next.js"),
 ("nuxt.config.ts", "Nuxt"),
 ("nuxt.config.js", "Nuxt"),
 ("svelte.config.js", "Svelte"),
 ("svelte.config.ts", "Svelte"),
 ("vite.config.ts", "Vite"),
 ("vite.config.js", "Vite"),
 ("astro.config.mjs", "Astro"),
]`}</pre>
 <p>
 Every framework above has exactly one unavoidable config file, the file its own tooling
 requires at the project root. That makes the table stable: it will only grow when a framework
 adds a new supported config extension, and it will never produce false positives the way
 scanning <code>package.json</code> dependencies would.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Checking one directory
 </h2>
 <p>
 Checking a single directory is a linear scan of the table:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _detect_framework(root: str) -> str | None:
 """Return framework_label if a known config file is found."""
 for filename, label in _FRAMEWORK_SIGNATURES:
 if (Path(root) / filename).exists():
 return label
 return None`}</pre>
 <p>
 The order matters. <code>next.config.ts</code> is checked before <code>next.config.js</code>
 because a project that has both is using TypeScript and should be labeled accordingly. It
 also does no content parsing, existence is the signal, which keeps the check cheap and
 immune to config-file syntax changes.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Walking the tree, pruning as you go
 </h2>
 <p>
 The setup wizard and <code>dev --yes</code> need to find frontends <em>anywhere</em> in the
 project, not just at the root. <code>_find_frontend_projects</code> does a full tree walk, but
 it prunes the directories it descends into while walking, so it never even enters
 <code>node_modules</code> or your virtualenv:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`def _find_frontend_projects(root: str) -> list[tuple[str, str]]:
 _skip = {"node_modules", "__pycache__", ".venv", "venv", "env", "dist", "build", ".git", ".next"}
 projects = []
 for dirpath, dirnames, filenames in os.walk(root):
 dirnames[:] = [d for d in dirnames if d not in _skip and not d.startswith(".")]
 fw = _detect_framework(dirpath)
 if fw:
 rel = os.path.relpath(dirpath, root)
 if rel == ".":
 projects.append((".", fw))
 else:
 projects.append((f"./{rel}", fw))
 return projects`}</pre>
 <p>
 Two details are easy to miss. First, <code>dirnames[:] = [...]</code> mutates the list
 <code>os.walk</code> uses to plan its descent, pruned directories are never
 <code>stat</code>-ed, let alone scanned. Second, the skip set includes
 <code>".next"</code> (Next.js build output) and any dot-directory, which matters because a
 <code>.next</code> directory inside the tree might otherwise contain something that looks
 like a config. Results are normalized to <code>"./rel"</code> form (or <code>"."</code> for
 the root itself) so they can be written straight into <code>pyrpc.json</code>.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
 Where the signal feeds in
 </h2>
 <p>
 Detection powers three behaviors:
 </p>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>The wizard</strong>, pre-fills client root and framework when exactly one project is found, or offers multi-select when several are.</li>
 <li><strong><code>dev --yes</code></strong>, with exactly one detected project, config is written with no prompts at all.</li>
 <li><strong>Error quality</strong>, with several projects and no explicit <code>--client</code>, <code>dev --yes</code> refuses to guess and lists the candidates with the exact flag to disambiguate.</li>
 </ul>
 <p>
 The framework label ends up as a single informational field in <code>pyrpc.json</code>. It is
 a record of the setup decision, not a runtime dependency, the generated types and the
 tsconfig alias work the same regardless of framework, which is exactly why the detection can
 afford to be a lightweight heuristic.
 </p>
 <p>
 Read the full
 <Link href="/changelog" className="text-fd-foreground underline"> changelog</Link>
 for the complete list of changes.
 </p>
 </section>
 </article>
 )
}
