import Image from 'next/image'
import Link from 'next/link'

export default function ExplicitBackendConfigPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Explicit beats magic: declaring your backend in pyrpc.json
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 22, 2026 at 3:00pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    v0.13.0&rsquo;s headline change looks bureaucratic &mdash; a JSON schema edit. It is actually a
                    philosophy change about who the source of truth is. The old config described your{' '}
                    <strong>frontend</strong> and implied your backend from imports; the new one declares both.
                </p>

                <Image src="/blog/backend-config-flow.svg" alt="Diagram: flat legacy pyrpc.json flows through the wizard prompts into the nested backend/clients schema" width={880} height={440} className="my-4 w-full h-auto rounded-lg border border-[#26262b]" />

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What changed, concretely</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`{
  "backend": {
    "framework": "flask",
    "entrypoint": "main:app",
    "types_module": "main"
  },
  "clients": [
    { "framework": "Next.js", "root": "../frontend" }
  ]
}`}</pre>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>framework</strong> selects the native dev server (uvicorn / flask run / manage.py runserver).</li>
                    <li><strong>entrypoint</strong> is framework-specific by design: a <code>module[:app]</code> target for FastAPI/Flask/ASGI, a filesystem path to <code>manage.py</code> for Django. One name, honest semantics per framework.</li>
                    <li><strong>types_module</strong> names where registration happens (see its own post).</li>
                    <li><strong>clients[]</strong> carries a framework each, killing the old <code>&quot;Mixed&quot;</code> pseudo-framework that existed only because one field served many roots.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Sniffing demoted from oracle to default</h2>
                <p>
                    Auto-detection still exists &mdash; it is good UX. What changed is its authority:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Interactive:</strong> sniffing preselects the wizard&rsquo;s framework choice. You press Enter to confirm or arrow away. Detection is a suggestion, never a decision.</li>
                    <li><strong><code>--yes</code>:</strong> sniff-or-error. If markers (<code>mount_fastapi(</code>, <code>mount_flask(</code>, <code>mount_django(</code>, <code>PyRPCAsgiApp</code>) are absent, the command exits nonzero with guidance instead of guessing. CI gets determinism, not vibes.</li>
                    <li><strong>Invalid input fails before anything else:</strong> <code>--framework express</code> exits immediately with the four valid choices &mdash; before config loading, before module resolution.</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Validation as a data model, not scattered ifs</h2>
                <p>
                    Parsing lives in one place producing an immutable value:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`@dataclass(frozen=True)
class BackendSpec:
    framework: str
    entrypoint: str
    types_module: str | None = None

spec = parse_backend(cfg)   # None for absent/invalid/legacy`}</pre>
                <p>
                    Three payoffs fell out of this shape. Bare entrypoints normalize once (<code>&quot;main&quot;</code>{' '}
                    becomes <code>main:app</code>) so every consumer sees canonical form. Dataclass equality gives{' '}
                    the live-reload watcher free, precise diffing. And legacy configs are simply{' '}
                    <code>parse_backend() is None</code> &mdash; no migration code paths, no version field to
                    maintain: an unreadable file is treated as unconfigured, rewritten in place on next run.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The trade we made on purpose</h2>
                <p>
                    Yes, first runs now answer one more question. In exchange: no more inferring servers from import
                    graphs, no silent wrong-framework launches, configs readable at a glance, and every flag{' '}
                    (<code>--framework</code>, <code>--module</code>, <code>--client</code>) maps to exactly one{' '}
                    schema key. Explicitness is not ceremony here &mdash; it is what makes the other features
                    (native runners, live restarts) safe to ship.
                </p>
            </section>
        </article>
    )
}
