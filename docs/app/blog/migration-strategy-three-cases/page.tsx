import Link from 'next/link'

export default function MigrationStrategyPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Three cases, zero data loss: pyrpc&rsquo;s types migration strategy
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 6, 2026 at 8:30am</time>
                    <span>&middot;</span>
                    <span>10 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    When a user changes <code>client_root</code> in <code>pyrpc.json</code>,
                    the types file needs to move. The old location has a generated
                    <code>index.ts</code> file. The new location will need one too. What should
                    pyrpc do? Delete the old file? Move it? Keep both? Ask the user?
                    The answer depends on three questions:
                </p>
                <ol className="space-y-2">
                    <li>Does the old file still exist?</li>
                    <li>Does the new location already have a file?</li>
                    <li>If both exist, are they the same?</li>
                </ol>
                <p>
                    The answer to each question determines one of three migration strategies.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Case 1: Old missing, new empty</h2>
                <p>
                    This is the simplest case. If the old types file doesn&rsquo;t exist (maybe
                    the user never ran <code>pyrpc dev</code> before, or they already cleaned up),
                    there&rsquo;s nothing to migrate. pyrpc generates fresh types at the new
                    location and moves on.
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`if not os.path.isfile(old_path):
    return  # nothing to migrate, just generate fresh`}</pre>
                <p>
                    This early return is important &mdash; it means migration only fires when
                    there&rsquo;s actually something to migrate. No unnecessary prompts, no
                    spurious warnings.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Case 2: Old exists, new location is empty</h2>
                <p>
                    This happens when a user changes <code>client_root</code> from one directory
                    to another. The old types file is still sitting at the old path. The new path
                    doesn&rsquo;t have a types file yet &mdash; the directory might not even exist.
                </p>
                <p>
                    pyrpc prompts the user:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`? Types location changed.
  Old: project/old-frontend/node_modules/@pyrpc/types/src/index.ts
  New: project/new-frontend/node_modules/@pyrpc/types/src/index.ts

  Move generated types?  (Y/n)`}</pre>
                <p>
                    If the user says yes, pyrpc creates the directory structure at the new location
                    and moves the file using <code>shutil.move</code>. This preserves the file
                    exactly &mdash; same content, same permissions, same modification time. The
                    old directory is left in place (it may contain other files like
                    <code>package.json</code>).
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`if ans:
    os.makedirs(os.path.dirname(new_path), exist_ok=True)
    shutil.move(old_path, new_path)`}</pre>
                <p>
                    If the user says no, we leave the old file in place. The next
                    <code>regenerate()</code> call (triggered by the dev server starting up) will
                    write fresh types to the new location. The old file becomes orphaned but
                    doesn&rsquo;t cause any harm.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Case 3: Both locations have a file</h2>
                <p>
                    This is the most interesting case. Both the old and new locations already have
                    a generated <code>index.ts</code>. The question is: are they the same?
                </p>
                <p>
                    pyrpc uses SHA256 to compare them:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`if _hash_file(old_path) == _hash_file(new_path):
    # Identical content — remove old, keep new
    os.remove(old_path)
    console.print("Generated types already exist at new location.")
    console.print("Removed old copy.")`}</pre>
                <p>
                    <strong>Sub-case 3a: Identical content.</strong> Both files are the same. This
                    means the user already regenerated at the new location (perhaps by running
                    <code>pyrpc dev</code> after changing <code>client_root</code>, then changing
                    it back). pyrpc auto-cleans the old copy without prompting. The user doesn&rsquo;t
                    need to make a decision about two identical files.
                </p>
                <p>
                    <strong>Sub-case 3b: Different content.</strong> Both files exist and they&rsquo;re
                    different. This means the type definitions diverged &mdash; perhaps the server
                    was updated between the two generations, or a different version of pyrpc was
                    used. pyrpc can&rsquo;t auto-resolve this:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`? Generated types found in both locations.
  Recommended: Regenerate from the current server.

  What would you like to do?
  > Regenerate at new location and remove old location
    Keep both locations
    Cancel`}</pre>
                <p>
                    &ldquo;Regenerate at new location and remove old location&rdquo; is the
                    recommended default because the server-side <code>default_router</code> is the
                    authoritative source of truth. The cached types at either location may be stale.
                    By regenerating from the server, we guarantee the new location has the correct,
                    up-to-date types.
                </p>
                <p>
                    &ldquo;Keep both locations&rdquo; is for users who aren&rsquo;t sure yet. Both
                    files survive; neither is deleted. The dev server regenerates at the new location
                    on startup anyway.
                </p>
                <p>
                    &ldquo;Cancel&rdquo; aborts the operation. The dev server still starts, but no
                    migration happens. The user can manually resolve the situation later.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why not always auto-migrate?</h2>
                <p>
                    The conservative approach (prompt in case 2 and case 3b) is intentional. Types
                    files don&rsquo;t contain secrets, but they do represent work &mdash; and
                    deleting or moving them without consent would be a violation of the &ldquo;do
                    what I say, not what I <em>might</em> have said&rdquo; principle. The only
                    auto-migration is when we can prove the files are identical (case 3a) &mdash;
                    at which point deleting the duplicate is always safe.
                </p>
                <p>
                    Case 1 (old missing) doesn&rsquo;t need a prompt because there&rsquo;s nothing
                    to ask about. The file doesn&rsquo;t exist. pyrpc generates fresh types and
                    moves on.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Edge case: <code>KeyboardInterrupt</code> during migration</h2>
                <p>
                    Both <code>questionary.confirm().ask()</code> and
                    <code>questionary.select().ask()</code> return <code>None</code> when the user
                    presses Ctrl+C or Escape. pyrpc checks for this and treats it as &ldquo;cancel
                    silently&rdquo;:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`ans = questionary.confirm(...).ask()
if ans is None:
    return  # user cancelled — do nothing`}</pre>
                <p>
                    This means Ctrl+C during a migration prompt exits cleanly. The dev server
                    continues starting with the old config. No half-migrated state. No orphaned
                    files.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The full flow</h2>
                <p>
                    Here&rsquo;s the complete decision tree, from the moment <code>pyrpc dev</code>
                    detects a <code>client_root</code> change:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`1. Compare old_client_root vs new_client_root
   ↓ (different)
2. Check if old types file exists
   ↓ (no) → generate fresh, done
   ↓ (yes)
3. Check if new types file exists
   ↓ (no) → prompt: move? → yes: move file → no: generate fresh
   ↓ (yes)
4. Compare SHA256 of both files
   ↓ (same) → delete old, keep new → done
   ↓ (different) → prompt: regenerate/keep/cancel
                     → regenerate: delete old, generate fresh at new
                     → keep: do nothing
                     → cancel: do nothing`}</pre>
                <p>
                    Every path ends with a consistent state. No partial writes, no data loss,
                    and &mdash; in the three most common scenarios (first-time setup, identical
                    files, old file missing) &mdash; no prompt at all. The user only interacts
                    when a human judgment call is genuinely needed.
                </p>
            </section>
        </article>
    )
}
