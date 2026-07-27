import Link from 'next/link'

export default function TheProcedureKindsTestSuitePage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Testing procedure kinds: what we covered
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 8:45am</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Adding procedure kinds touched four layers: Python core, codegen, TypeScript types, and the adapter proxy. Each layer needed its own tests. Here is what we wrote and why.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Python: test_decorators.py</h2>
                <p>
                    Tests that <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.query</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc.mutation</code> set the correct kind on the procedure:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`def test_query_sets_kind():
    @rpc.query
    def get_user(user_id: int) -> dict: ...
    assert get_user.kind == ProcedureKind.QUERY

def test_mutation_sets_kind():
    @rpc.mutation
    def update_user(user_id: int, name: str) -> dict: ...
    assert update_user.kind == ProcedureKind.MUTATION

def test_bare_rpc_defaults_to_query():
    @rpc
    def greet(name: str) -> str: ...
    assert greet.kind == ProcedureKind.QUERY`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Python: test_introspection.py</h2>
                <p>
                    Tests that the introspection schema includes the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kind</code> field:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`def test_introspection_includes_kind():
    schema = get_registry_schema()
    assert schema["procedures"]["greet"]["kind"] == "query"
    assert schema["procedures"]["update_user"]["kind"] == "mutation"`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Python: test_registry.py (Router.merge)</h2>
                <p>
                    Tests that <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Router.merge()</code> combines procedures correctly:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`def test_merge_combines_procedures():
    r1 = Router()
    @r1.rpc
    def a() -> str: ...

    r2 = Router()
    @r2.rpc
    def b() -> str: ...

    main = Router()
    main.merge(r1)
    main.merge(r2)

    assert "a" in main.procedures
    assert "b" in main.procedures`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">TypeScript: codegen tests</h2>
                <p>
                    Tests that codegen outputs <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">ProcedureKinds</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">procedureKinds</code> correctly:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`test("emits procedureKinds in generated output", () => {
  const output = codegen(schema)
  expect(output).toContain("ProcedureKinds")
  expect(output).toContain('greet: "query"')
  expect(output).toContain('update_user: "mutation"')
})`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">TypeScript: adapter tests</h2>
                <p>
                    Tests for <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createReactClient</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createNextClient</code>, etc. verify that:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>With <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kinds</code>, query procedures expose <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code></li>
                    <li>With <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kinds</code>, mutation procedures expose <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code></li>
                    <li>Without <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kinds</code>, both hooks exist</li>
                    <li>Provider is exported and renders children</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this matters</h2>
                <p>
                    Each layer is tested independently. If someone changes the Python decorator, the decorator tests catch it. If codegen output breaks, the codegen tests catch it. If the adapter's Proxy misresolves kinds, the adapter tests catch it. No single test tries to cover the whole stack.
                </p>

                <p>
                    <Link href="/docs/server/procedures" className="text-fd-foreground underline underline-offset-2">Procedures docs</Link> · <Link href="/blog/procedure-kinds-end-to-end" className="text-fd-foreground underline underline-offset-2">End-to-end flow</Link>
                </p>
            </section>
        </article>
    )
}
