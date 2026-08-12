import Link from 'next/link'

export default function RuntimeKindConsumptionPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    How adapters read procedureKinds at runtime
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 2:20pm</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    When you write <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.update_user.useMutation(...)</code>, two systems cooperate. The compiler already knows the hook exists (the type channel), but the running program must actually <em>produce</em> that hook. That production happens in a Proxy <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">get</code> trap, reading the runtime kinds map.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The import</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`import { procedureKinds as generatedKinds } from '@pyrpc/types';`}
                </pre>
                <p>
                    This is the value import that made v0.12.0 a runtime-module release. It is not <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">import type</code> — the adapter needs the actual object, so the bundler must resolve <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> to the generated file. The alias, the node_modules gap, the throwing placeholder: all of it exists to make this one line resolve correctly.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The override seam</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`const { kinds: kindsOverride, ...clientOptions } = options;
const kinds = (kindsOverride ?? generatedKinds) as ProcedureKindMap<TProcedures>;`}
                </pre>
                <p>
                    The adapter reads codegen output by default but lets a caller inject kinds explicitly. This is the testability valve: in a unit test with no generated module in sight, the test passes a literal kinds map and never touches the Proxy.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The Proxy that assembles hooks</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`return new Proxy(root as object, {
  get(target, prop: string | symbol) {
    if (typeof prop !== 'string') return undefined;
    if (prop in target) return target[prop];

    const kind = kinds?.[prop] as 'query' | 'mutation' | undefined;
    return createProcedureHooks(client, prop, kind);
  },
});`}
                </pre>
                <p>
                    Property access on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api</code> is intercepted. Real members (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Provider</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useUtils</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client</code>) short-circuit. Everything else is treated as a procedure name, its kind is looked up in the runtime map, and a hook bundle is created on demand.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The kind decides the hooks</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`function createProcedureHooks(client, procedure, kind) {
  if (kind !== 'mutation') {
    hooks.useQuery = (input, options) => useQuery({
      ...options,
      queryKey: getProcedureQueryKey(procedure, input),
      queryFn: () => callProcedure(fn, input),
    });
  }
  if (kind !== 'query') {
    hooks.useMutation = (options) => useMutation({
      ...options,
      mutationFn: (input) => callProcedure(fn, input),
    });
  }
  return hooks;
}`}
                </pre>
                <p>
                    The comparisons are deliberately inverted. A mutation kind suppresses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code> (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kind !== 'mutation'</code> is false); a query kind suppresses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code>. And <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">undefined</code> — the unknown or unkinded case — passes both guards, yielding both hooks. The runtime default is permissive, matching the type-level <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">undefined</code> fallback.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The single point of truth</h2>
                <p>
                    Notice the call flow: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">queryKey</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">callProcedure</code> are shared between both hook kinds. The only difference between query and mutation hooks is <em>which TanStack Query hook wraps the same underlying call</em> — which is exactly the kind knowledge the generated module supplies. The runtime channel's whole job is one lookup per procedure access: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kinds?.[prop]</code>.
                </p>
            </section>
        </article>
    )
}
