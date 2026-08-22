import Link from 'next/link'

export default function PytypeToTsGrammarPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Parsing Python type strings into TypeScript
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 10:00am</time>
                    <span>&middot;</span>
                    <span>10 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Somewhere between a Python annotation like <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">dict[str, list[int | None]]</code> and a TypeScript signature like <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Record&lt;string, (number | null)[]&gt;</code> sits a string parser. It is 120 lines, recursive, and it has to get the grammar right without ever seeing an AST.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The type map</h2>
                <p>
                    The base cases are a lookup table. Python runtime types arrive as their <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">repr</code>, e.g. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&lt;class 'int'&gt;</code>, and introspection stores them as strings:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`_TYPE_MAP = {
  "int": "number", "float": "number", "str": "string",
  "bool": "boolean", "None": "null", "NoneType": "null", "Any": "any",
}`}
                </pre>
                <p>
                    A <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&lt;class '...'&gt;</code> repr is unwrapped, its dotted prefix stripped, and the leaf name looked up. Unknown classes fall through to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_to_safe_name</code>, which transliterates any Unicode name to ASCII and PascalCases it, a User model becomes <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">User</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The recursive grammar</h2>
                <p>
                    Everything non-trivial is a prefix match on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">typing.</code>-stripped strings:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Optional[X]</code> → <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">X | null</code></li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Union[...]</code> → a pipe union, with null collapsing</li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">List[X]</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">list[X]</code> → <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">X[]</code></li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Dict[K, V]</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">dict[K, V]</code> → <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Record&lt;K, V&gt;</code></li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Tuple[...]</code> → a TS tuple <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">[A, B]</code></li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Set[X]</code> → <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Set&lt;X&gt;</code></li>
                </ul>
                <p>
                    The recursion is what makes it composable: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">list[dict[str, Optional[int]]]</code> walks down through four levels because each rule calls <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_pytype_to_ts</code> on its inner content.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The depth-aware splitter</h2>
                <p>
                    Splitting a union by comma naively would shred nested generics: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Union[dict[str, int], None]</code> has a comma inside the dict. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">_split_type_args</code> walks the string tracking bracket depth and only cuts commas at depth zero:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`for c in s:
    if c in "[(": depth += 1
    elif c in "])": depth -= 1
    elif c == "," and depth == 0: parts.append(current); current = ""
    else: current += c`}
                </pre>
                <p>
                    The same trick that makes the parser correct is also its ceiling: it understands nesting, not types. It will split any balanced bracket structure, but it will not typecheck the contents.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Null collapsing</h2>
                <p>
                    Python's <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Optional[X]</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Union[X, None]</code> are the same thing. The Union branch normalizes them: it renders the non-null members joined by pipes and tacks <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">| null</code> onto the end. That produces the idiomatic <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">string | number | null</code> instead of the awkward <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">null | string | number</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The escape hatch</h2>
                <p>
                    Everything unparseable returns <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">any</code>. That is a deliberate tradeoff: failing hard on an exotic annotation would make codegen unusable for the long tail of typing idioms, so the parser degrades to untyped and lets the developer refine by hand. The cost (losing type safety on that one procedure) is visible in the generated file, which keeps it honest.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why strings and not an AST</h2>
                <p>
                    The annotation strings come from runtime introspection, not from parsing source. Holding an AST would mean either executing <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">typing.get_type_hints</code> and reflecting the resulting objects, or walking the module's AST and losing forward references. The string form is the stable, portable currency between introspection and codegen, and a 120-line recursive parser is a small price for not coupling to a specific Python version's typing internals.
                </p>
            </section>
        </article>
    )
}
