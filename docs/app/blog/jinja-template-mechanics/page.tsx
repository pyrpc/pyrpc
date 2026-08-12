import Link from 'next/link'

export default function JinjaTemplateMechanicsPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Inside the codegen template
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 9:40am</time>
                    <span>&middot;</span>
                    <span>9 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Codegen is a small engine with three moving parts: a JSON-Schema collector, a type-converter, and a Jinja2 template. The template — <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client.ts.j2</code> — is where the Python schema dict becomes the TypeScript module. This post walks it top to bottom.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The data: a schema dict</h2>
                <p>
                    The engine receives <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">schemas</code>, a dict of procedure name to schema object. Each schema carries <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">parameters</code>, a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">return_type</code>, a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kind</code>, and a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">doc</code> string. The template renders once per procedure.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The Types interface</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`export type Types = {
  {% for name, schema in schemas.items() %}
  /**
   * {{ schema.doc or "No documentation available." }}
   * @kind {{ schema.kind | default("query") }}
   */
  {{ name }}: (({% for param in schema.parameters %}...{% endfor %}) => Promise<...>) & {
    readonly _pyrpcKind: "{{ schema.kind | default("query") }}";
  };
  {% endfor %}
}`}
                </pre>
                <p>
                    Three details hide in that block. First, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">schema.doc or "No documentation available."</code> — the Python docstring is lifted into a JSDoc comment, so hover text in your editor mirrors the server-side documentation. Second, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@kind</code> records the procedure kind in the comment as a human-readable copy. Third, the intersection with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">readonly _pyrpcKind</code> brands the type so it can be recovered at the type level later.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Type conversion happens in filters</h2>
                <p>
                    The template does not compute types. It delegates to two Jinja filters registered in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">generate_typescript_client</code>:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`env.filters["pytype_to_ts"] = _pytype_to_ts
env.filters["return_type_to_ts"] = _return_type_to_ts`}
                </pre>
                <p>
                    Keeping conversion in filters, rather than precomputing strings in Python, means the template stays declarative: it says <em>where</em> a type goes, the filter decides <em>how</em> to render it. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">default("query")</code> filter chained in the same spot is the safety net for procedures registered with bare <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code>, which carry no explicit kind.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The runtime map</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`export type ProcedureKinds = {
  {% for name, schema in schemas.items() %}
  {{ name }}: "{{ schema.kind | default("query") }}";
  {% endfor %}
};

export const procedureKinds = {
  {% for name, schema in schemas.items() %}
  {{ name }}: "{{ schema.kind | default("query") }}",
  {% endfor %}
} as const satisfies ProcedureKinds;`}
                </pre>
                <p>
                    The const uses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">as const</code> to freeze literal types and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">satisfies ProcedureKinds</code> to prove the value conforms to the declared shape. The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@internal</code> doc tag marks both as implementation detail, not public API.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Assembly</h2>
                <p>
                    The template output is one half of the file. The other half — the model interfaces for complex schemas — comes from <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">jsonschema_ts</code>. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">assemble(models=..., procedures=..., banner="")</code> concatenates them. The template is deliberately procedural-only: model extraction is delegated to the library, procedure wiring stays hand-rolled, and the two meet in one artifact.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why a template at all</h2>
                <p>
                    String concatenation in Python would produce the same bytes but none of the readability. A template keeps the output's shape visible — you can read the TypeScript structure without mentally executing Python. That matters because the output is the API surface developers stare at most. The template is the spec, and the spec is meant to be read.
                </p>
            </section>
        </article>
    )
}
