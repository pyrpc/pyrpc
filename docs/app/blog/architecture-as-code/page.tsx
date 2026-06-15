import Link from 'next/link'

export default function ArchitectureAsCodePost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Architecture as Code: Mapping pyrpc with LikeC4
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 15, 2026 at 12:00pm</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    pyrpc has grown to <strong>7 packages</strong>, <strong>30+ internal components</strong>, and <strong>4 framework adapters</strong>. Understanding how it all fits together means bouncing between READMEs, docstrings, and source files. We wanted a single source of truth for the architecture &mdash; one that stays in sync with the code, is reviewable in PRs, and can be explored interactively.
                </p>
                <p>
                    We found it in <Link href="https://likec4.dev" className="text-fd-foreground underline">LikeC4</Link> &mdash; an open-source tool that treats architecture as code. LikeC4 uses the C4 model (Context, Container, Component, Code) to describe systems at multiple levels of detail. You write plain-text <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.c4</code> files, and LikeC4 renders them as interactive diagrams.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why architecture-as-code matters</h2>
                <p>
                    Traditional architecture documentation (draw.io, Excalidraw, Google Slides) has a fundamental problem: it lives outside the codebase. When the code changes, the diagrams get stale. Nobody updates them because that means finding the source file, opening the right tool, and manually dragging boxes around.
                </p>
                <p>
                    Architecture-as-code fixes this:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li><strong>Version-controlled</strong> &mdash; <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">architecture/pyrpc.c4</code> lives in the repo alongside the code</li>
                    <li><strong>PR-reviewable</strong> &mdash; changes to the architecture ship with the code that causes them</li>
                    <li><strong>Multi-level</strong> &mdash; one file describes the system landscape, containers, components, and dynamic flows</li>
                    <li><strong>Interactive</strong> &mdash; <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">npx likec4 start architecture</code> opens a browser with navigable diagrams</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What we built</h2>
                <p>
                    We installed LikeC4 as an npm dev dependency and created a single 580-line <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">architecture/pyrpc.c4</code> file. It contains:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li><strong>5 element kinds</strong> &mdash; actor, system, container, component, storage</li>
                    <li><strong>30+ model elements</strong> &mdash; every package, subpackage, and key class</li>
                    <li><strong>25+ relationships</strong> &mdash; data flows, HTTP calls, function invocations</li>
                    <li><strong>5 static views</strong> &mdash; system landscape, containers, core internals, codegen pipeline, client internals, adapter comparison</li>
                    <li><strong>3 dynamic views</strong> &mdash; RPC call flow, codegen flow, dev loop flow</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How the C4 model maps to pyrpc</h2>
                <p>
                    The C4 model defines four abstraction levels. Here's how we mapped pyrpc:
                </p>
                <ol className="list-decimal pl-6 space-y-2 text-sm">
                    <li><strong>Level 1: System Landscape</strong> &mdash; Python Developer, TypeScript Developer, JSON-RPC 2.0 Protocol, and pyrpc as a black-box system.</li>
                    <li><strong>Level 2: Container Diagram</strong> &mdash; All 7 packages (pyrpc-core, pyrpc-fastapi, pyrpc-flask, pyrpc-django-adapter, pyrpc-codegen, @pyrpc/client, @pyrpc/types) with their HTTP and function-call relationships.</li>
                    <li><strong>Level 3: Component Diagrams</strong> &mdash; Deep dives into pyrpc-core (Router, Procedure, Interpreter, CLI, ASGI, 10 components total), pyrpc-codegen (5-component pipeline), and @pyrpc/client (Proxy dispatch, CLI sync, postinstall).</li>
                    <li><strong>Dynamic Views</strong> &mdash; Sequence-style diagrams showing the RPC call flow, code generation pipeline, and dev loop workflow.</li>
                </ol>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What we learned from the exercise</h2>
                <p>
                    The process of writing the diagrams had me having an overview of the big picture of pyrpc:
                </p>
                <p>
                    <strong>The adapter pattern is beautifully consistent.</strong> Each adapter &mdash; <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">mount_fastapi()</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">mount_flask()</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">mount_django()</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">PyRPCAsgiApp</code> &mdash; follows the exact same "thin shell" pattern: translate HTTP into <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">handle_request()</code> calls, zero protocol logic. The Flask adapter uniquely uses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">anyio.run()</code> to bridge sync Flask to the async interpreter.
                </p>
                <p>
                    <strong>The codegen pipeline has a hidden npm dependency.</strong> <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">generate_typescript_client()</code> depends on the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jsonschema_ts</code> npm package for converting Pydantic JSON schemas to TypeScript interfaces &mdash; but this dependency only exists at generation time. Meanwhile, the standalone Node.js CLI (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">cli.js</code>) duplicates the type conversion logic because it must work without Python installed.
                </p>
                <p>
                    <strong>The dev loop is a state machine.</strong> The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev</code> command isn't just starting a server. It's 12 steps: read config &rarr; import module &rarr; watch files &rarr; debounce changes &rarr; reload module &rarr; regenerate types &rarr; update console. Mapping this as a dynamic view revealed the full complexity.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How to explore the diagrams</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
                    {`# Start the interactive LikeC4 server
npx likec4 start architecture

# Or build static HTML
npx likec4 build architecture --output-dir architecture/dist`}
                </pre>
                <p>
                    Open <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">http://localhost:5173</code> and start with the System Landscape view for the big picture, then zoom into the Container Diagram, then drill into specific packages.
                </p>
                <p>
                    Read the next post in this series for a guided visual tour of every diagram.
                </p>
            </section>
        </article>
    )
}
