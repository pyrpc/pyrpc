import BlogLayout from '@/components/blog-layout'

export default function Post() {
    return (
        <BlogLayout
            title="Why we merged pyrpc-cli back into pyrpc-core"
            date="June 2, 2026 at 6:30pm"
            readTime="7 min"
        >
            <p>
                When we first set up pyRPC's package structure, we made a deliberate choice to split it into <strong>three</strong> separate packages: <code>pyrpc-core</code>, <code>pyrpc-cli</code>, and <code>pyrpc-codegen</code>. The reason was a circular dependency between core and codegen that prevented <code>pip install</code> from working in a mono-package design.
            </p>
            <p>
                Today, we're reversing that decision. <code>pyrpc-cli</code> no longer exists as a separate package. Its source lives directly inside <code>pyrpc-core</code>. The dependency chain went from three packages back to two:
            </p>
            <pre>{`Before (3 packages):  pyrpc-core → pyrpc-cli → pyrpc-codegen
After (2 packages):   pyrpc-core → pyrpc-codegen`}</pre>
            <p>
                <code>pip install pyrpc-core</code> now gives you the runtime, the CLI, and the codegen library — all in one command.
            </p>

            <h2>The original problem</h2>
            <p>
                The circular dependency was real: <code>pyrpc-core</code> needed introspection logic that lived in <code>pyrpc-codegen</code>, and <code>pyrpc-codegen</code> needed core types for its schema models. You couldn't install either without the other already being installed.
            </p>
            <p>
                The classic fix — extract the CLI into a middle package — worked perfectly. <code>pyrpc-cli</code> became the bridge that both sides could depend on without cycles. We documented this in detail in our earlier post on circular dependency resolution.
            </p>

            <h2>What changed</h2>
            <p>
                The key insight came when we refactored <code>pyrpc-codegen</code> into a pure library. We stripped out <em>all</em> pyrpc-core dependencies — no runtime types, no router references, nothing. Just Jinja2 templates, JSON Schema input, and TypeScript output.
            </p>
            <p>
                At that point, <code>pyrpc-codegen</code> had zero pyrpc imports. The circular dependency simply <em>stopped existing</em>. The middle package was no longer needed — and maintaining a separate package meant more CI time, more version bumps, and more cognitive load for contributors.
            </p>

            <h2>The trade-offs</h2>
            <p>
                The original reason for keeping the CLI separate was to avoid dragging <code>typer</code>, <code>rich</code>, <code>uvicorn</code>, and <code>watchfiles</code> into the core runtime. Users who only wanted the protocol library shouldn't have to install CLI dependencies.
            </p>
            <p>
                We decided that trade-off was no longer worth it. Here's why:
            </p>
            <ul>
                <li><strong>Every real user wants the CLI.</strong> In practice, everyone who installed pyrpc-core also installed pyrpc-cli. The split was theoretical purity at the cost of practical complexity.</li>
                <li><strong>Extra dependencies are optional at runtime.</strong> The CLI entry point lazy-imports typer and rich. If you never call <code>pyrpc</code>, those packages are loaded but never imported — a small disk footprint with zero import-time cost.</li>
                <li><strong>One package is simpler to maintain.</strong> One version number, one changelog, one CI pipeline. Contributors don't need to learn which package to edit.</li>
            </ul>

            <h2>The new package story</h2>
            <p>Here's what the landscape looks like now:</p>
            <pre>{`pip install pyrpc-core     # → runtime + CLI + codegen
pip install pyrpc-codegen  # → codegen library only (standalone)
npm install @pyrpc/client  # → TypeScript client (unchanged)`}</pre>
            <p>
                <code>pyrpc-codegen</code> remains a standalone package for frontend-only setups or CI pipelines that don't need the Python runtime. But for most users, <code>pip install pyrpc-core</code> is the only command they'll ever need.
            </p>

            <h2>What we learned</h2>
            <p>
                The three-package split was the right decision at the time — it solved a real packaging problem. But as the design evolved, the constraint that motivated the split disappeared. Revisiting old decisions when the underlying constraints change is not backtracking; it's engineering hygiene.
            </p>
            <p>
                If you were using <code>pyrpc-cli</code> directly, your workflow doesn't change. The <code>pyrpc</code> command is still there, still does the same things. You just install one package instead of two.
            </p>
        </BlogLayout>
    )
}
