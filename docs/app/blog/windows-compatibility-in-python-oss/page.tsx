import Link from 'next/link'

export default function WindowsCompatPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Windows compatibility in a Python OSS project: what we learned
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 2, 2026</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The first time someone ran <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc pull</code> on Windows, it crashed with
                    a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">UnicodeEncodeError</code>. The CLI output contained a checkmark character
                    that Windows terminals could not render. We fixed that specific bug, but
                    it opened a broader question: how do you maintain cross-platform
                    compatibility in a Python OSS project when most of your team develops
                    on macOS or Linux?
                </p>
                <p>
                    This post documents the Windows-specific issues we hit, the fixes we
                    applied, and the policies we adopted to prevent them from recurring.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">1. The Unicode problem</h2>
                <p>
                    Windows terminals default to the system code page, which on US-English
                    systems is <strong>cp1252</strong> (Windows-1252). This encoding supports
                    basic Latin characters but not the broader Unicode range. macOS and Linux
                    terminals default to UTF-8, which covers everything.
                </p>
                <p>
                    The practical consequence: any non-ASCII character in your CLI output,
                    template files, or log messages will crash on Windows. The characters
                    that bit us:
                </p>
                <ul className="text-fd-muted-foreground">
                    <li><strong>Unicode checkmark</strong> (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">\u2713</code>) &mdash; used in CLI output to indicate success. Replaced with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[OK]</code>.</li>
                    <li><strong>Em dash</strong> (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">\u2014</code>) &mdash; used in generated TypeScript comments as section separators. Replaced with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">---</code>.</li>
                    <li><strong>Right arrow</strong> (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">\u2192</code>) &mdash; used in help text. Replaced with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">-&gt;</code>.</li>
                    <li><strong>Bullet characters</strong> &mdash; used in Rich table rendering. Rich handles these internally, but only if the terminal supports them.</li>
                </ul>
                <p>
                    Rich (the library we use for CLI rendering) detects terminal encoding and
                    falls back to ASCII replacements automatically &mdash; but only for its
                    own output. Our custom strings containing Unicode characters bypass Rich's
                    detection and go straight to stdout, where they crash on cp1252.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">2. LF vs CRLF in git</h2>
                <p>
                    Git on Windows defaults to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">core.autocrlf = true</code>, which converts
                    LF to CRLF on checkout and CRLF to LF on commit. This means every file
                    touched on Windows produces git warnings:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`warning: in the working copy of 'file.py', LF will be replaced by CRLF
the next time Git touches it`}
                </pre>
                <p>
                    These warnings are harmless but noisy. They also cause problems if a
                    contributor on macOS edits a file that was last touched on Windows &mdash;
                    the diff shows every line ending changed.
                </p>
                <p>
                    The standard fix is a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.gitattributes</code> file that forces LF for
                    Python files and other text types:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`*.py      text eol=lf
*.toml    text eol=lf
*.json    text eol=lf
*.md      text eol=lf
*.ts      text eol=lf
*.tsx     text eol=lf
*.js      text eol=lf
*.css     text eol=lf
*.html    text eol=lf`}
                </pre>
                <p>
                    We added this to the repository. It ensures that regardless of the
                    contributor's operating system, files are stored as LF in git and
                    checked out as LF on disk. No warnings, no spurious diffs, no
                    CRLF contamination.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">3. Path separators</h2>
                <p>
                    Python's <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">os.path</code> module handles path separators transparently,
                    but there are edge cases:
                </p>
                <ul className="text-fd-muted-foreground">
                    <li><strong>Module paths in CLI arguments.</strong> A user on Windows might write <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">app\main.py</code>. We normalize with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">os.path.normpath</code> before passing to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">importlib</code>, which expects dot-separated module paths.</li>
                    <li><strong>Temp directory paths.</strong> <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">tempfile.TemporaryDirectory</code> returns paths with backslashes on Windows. These need <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pathlib.PurePosixPath</code> conversion when passed to Jinja2 templates that generate TypeScript import paths.</li>
                    <li><strong>Forward slashes in generated code.</strong> TypeScript import paths should always use forward slashes, even on Windows. We explicitly convert backslashes to forward slashes in generated <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">import</code> statements.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">4. The file watcher</h2>
                <p>
                    We use <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">watchfiles</code> for the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev</code> file watcher. On
                    Windows, it uses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ReadDirectoryChangesW</code> under the hood (via Rust's
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">notify</code> crate). This is the native Windows API for directory change
                    notification &mdash; no polling, no CPU overhead.
                </p>
                <p>
                    The issue we hit: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">watchfiles</code> on Windows has a known limitation with
                    network drives and certain anti-virus software that intercepts file
                    operations. If a user's project is on a network drive, the watcher might
                    not detect changes reliably. We documented this in the CLI help text and
                    added a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">--poll-interval</code> fallback flag for <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">watchdog</code>-based
                    polling.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">5. The no-special-chars policy</h2>
                <p>
                    After the Unicode crash, we codified a policy in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">CONTRIBUTING.md</code>:
                </p>
                <blockquote className="border-l-2 border-fd-muted-foreground pl-4 italic">
                    No emojis, no em-dashes, no Unicode special characters anywhere in the
                    codebase. This includes CLI output, template files, log messages, and
                    comments. These bugs are silent on macOS and Linux and only surface on
                    Windows at the worst possible moment.
                </blockquote>
                <p>
                    This applies to the Python codebase (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">packages/</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">tests/</code>).
                    The documentation site (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">docs/</code>) has no such restriction because
                    it is rendered by Next.js and served as HTML, where Unicode is expected.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">6. Testing on Windows</h2>
                <p>
                    The hard truth is that you cannot maintain Windows compatibility without
                    running tests on Windows. We run the full test suite on Windows via
                    GitHub Actions:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`# .github/workflows/test.yml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: \${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
      - run: uv sync
      - run: uv run pytest`}
                </pre>
                <p>
                    Cross-platform CI is not optional. Every PR runs against all three
                    operating systems. A macOS-only project that accepts Windows users
                    contributions without Windows CI is going to break Windows regularly.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Lessons learned</h2>
                <ol className="text-fd-muted-foreground">
                    <li><strong>Assume cp1252, not UTF-8.</strong> Windows terminals do not render Unicode by default. Test your CLI output on a clean Windows VM before adding decorative characters.</li>
                    <li><strong>Add .gitattributes early.</strong> The LF/CRLF warning is harmless but noisy. Force LF for text files from the start. Adding it later means a one-time cleanup commit that touches every file.</li>
                    <li><strong>Use pathlib, not os.path.</strong> <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pathlib.Path</code> handles separator normalization internally. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">os.path.join</code> produces backslashes on Windows that may not be what you want.</li>
                    <li><strong>Document known limitations.</strong> Network drives, anti-virus, and Windows-specific performance issues should be documented so users know what to expect.</li>
                    <li><strong>CI on all three OSes.</strong> Window-specific bugs cannot be caught by macOS or Linux testing. The CI matrix must include Windows.</li>
                </ol>
                <p>
                    All 45 tests pass on Windows, macOS, and Linux. The repo is at
                    <a href="https://github.com/pyrpc/pyrpc" className="underline hover:text-fd-foreground">github.com/pyrpc/pyrpc</a>.
                </p>
            </section>
        </article>
    )
}
