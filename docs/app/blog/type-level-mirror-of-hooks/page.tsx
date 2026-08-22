import Link from 'next/link'

export default function TypeLevelMirrorOfHooksPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    ProcedureHooksForKind: the type-level mirror
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 2:40pm</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The runtime Proxy reads kinds to decide what <em>exists</em>. But TypeScript must agree before your code even compiles, and it does, through a conditional type that mirrors the runtime selection one-for-one.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The three hook shapes</h2>
                <p>
                    The adapter defines three building blocks, each a mapped object type wrapping a TanStack Query hook:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`export type ProcedureQueryHooks<TProc> = {
  useQuery: <TData = ProcResult<TProc>>(
    input: QueryInput<TProc>,
    options?: Omit<UseQueryOptions<ProcResult<TProc>, Error, TData>, 'queryKey' | 'queryFn'>,
  ) => UseQueryResult<TData, Error>;
};

export type ProcedureMutationHooks<TProc> = {
  useMutation: <TContext = unknown>(
    options?: Omit<UseMutationOptions<ProcResult<TProc>, Error, QueryInput<TProc>, TContext>, 'mutationFn'>,
  ) => UseMutationResult<ProcResult<TProc>, Error, QueryInput<TProc>, TContext>;
};

export type ProcedureHooksBoth<TProc> = ProcedureQueryHooks<TProc> &
  ProcedureMutationHooks<TProc>;`}
                </pre>
                <p>
                    Note how the query and mutation inputs differ. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code> takes the input as its first argument and returns a result that may be <em>wider</em> than the procedure's (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&lt;TData&gt;</code>). <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code> takes only options and returns a result plus the imperative <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">mutate</code>. The two contracts are genuinely different, which is why exposing both on a mutation-only procedure is a real API leak, not a cosmetic one.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The selector</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`export type ProcedureHooksForKind<
  TProc extends AnyProc,
  TKind extends ProcedureKind | undefined,
> = TKind extends 'mutation'
  ? ProcedureMutationHooks<TProc>
  : TKind extends 'query'
    ? ProcedureQueryHooks<TProc>
    : ProcedureHooksBoth<TProc>;`}
                </pre>
                <p>
                    This is the type-level twin of the runtime guard. Where the Proxy asks <em>"is the kind mutation?"</em>, this conditional type asks the same question of a type parameter. The order matters: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">'mutation'</code> first, then <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">'query'</code>, then the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">undefined</code> fallback of both.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Wired into the client shape</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`export type ReactClient<TProcedures, TKinds = {}> = {
  [K in keyof TProcedures]: ProcedureHooksForKind<TProcedures[K], TKinds[K]>;
} & {
  Provider: ComponentType<ReactClientProviderProps>;
  useUtils: () => ReactClientUtils<TProcedures>;
  client: TProcedures;
};`}
                </pre>
                <p>
                    A mapped type walks every procedure key and applies <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ProcedureHooksForKind</code> with that procedure's inferred kind. The intersection adds the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Provider</code>/<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useUtils</code>/<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client</code> members, matching exactly which <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">prop in target</code> checks the Proxy short-circuits at runtime.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Mirror discipline</h2>
                <p>
                    The striking thing is how precisely the runtime and type systems parallel each other:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Runtime: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kind !== 'mutation'</code> → include <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code></li>
                    <li>Type: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">TKind extends 'mutation'</code> → exclude <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code></li>
                </ul>
                <p>
                    Same decision, two languages. Keeping the two mirrors in step is a discipline the codegen contract makes possible: because kinds come from a single generated artifact, the runtime branch and the type branch can never disagree about which hooks a procedure supports.
                </p>
            </section>
        </article>
    )
}
