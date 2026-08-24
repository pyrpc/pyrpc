import Link from 'next/link'

export default function IntrospectionImportsYourCode() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Introspection that imports your code, on purpose
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026 at 11:00am</time>
                    <span>&middot;</span>
                    <span>5 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    An agent asks what APIs exist in this project. There are two ways to answer: parse Python files hoping to infer decorator semantics, or import the module and ask the runtime. pyRPC chose the runtime years ago when it built the registry; the MCP simply refuses to reinvent a worse version.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why static analysis loses here</h2>
                <p>
                    pyRPC procedures are compiled objects. At decoration time the framework inspects signatures, pre-builds pydantic TypeAdapters per parameter, captures docstrings, records async-ness and kind. Conditional registration, dynamic module layout, and Django's views pattern all fall out naturally at import. A parser sees none of it. Worse, a parser's answer diverges from what the server actually serves, and divergence between believed and real APIs is precisely the bug class type-safe RPC exists to kill.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The chain we reused</h2>
                <p>
                    The MCP context loader composes five pieces that already existed: find_config walks up the tree for pyrpc.json, parse_backend validates the nested backend section into a frozen BackendSpec, resolve_types_module picks the module whose import registers procedures (with Django required to declare one), importlib brings it into the process, and get_registry_schema serializes the router. Zero new introspection logic was written; the MCP is a lens on machinery the dev server already trusts.
                </p>
                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The consequence worth stating</h2>
                <p>
                    Importing user code is privileged. It runs in the user's environment with the user's permissions because the user's own client launched the process, which is the same contract as running pyrpc dev. What the MCP adds is discipline around failure: if the module will not import, the agent receives a structured error naming the module, the exception, and the two config fields that might be wrong, rather than half of a traceback. Ground truth is worth the responsibility, and the responsibility is handled explicitly rather than assumed.
                </p>
            </section>
        </article>
    )
}
