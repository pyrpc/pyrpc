import Link from 'next/link'

export default function DemoSandboxDesignPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="rounded-xl border border-fd-border bg-white/70 dark:bg-black/70 backdrop-blur-xl p-8 md:p-12">
            {/* Header */}
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Inside the Interactive Demo Sandbox
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>May 25, 2026</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            {/* Intro */}
            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The pyrpc playground at <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">/demo</code> lets you write Python server code with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@model</code> decorators, then call those procedures from TypeScript  -  all in the browser, with real-time autocomplete and type checking, no server required.
                </p>
                <p>
                    This post explains how the sandbox works under the hood, the key design decisions that shaped it, and how it compares to the actual pyrpc implementation (v<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">0.1.0-alpha.1</code> across all packages).
                </p>
            </section>

            <hr className="my-12 border-edge" />

            {/* Section 1: Architecture Overview */}
            <section className="space-y-5">
                <h2 className="text-lg font-bold tracking-tight">Architecture Overview</h2>
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                    <p>
                        The playground processes user code in three phases:
                    </p>
                    <ol>
                        <li><strong>Type Generation</strong>  -  Python server code is parsed client-side (regex-based) to extract <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@model</code> class fields and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code> function signatures, then converted to TypeScript declarations.</li>
                        <li><strong>Monaco Integration</strong>  -  The generated types are injected into Monaco Editor as virtual files at <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">/node_modules/@pyrpc/types/index.d.ts</code>, enabling real-time autocomplete and type errors on <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client.*</code> calls.</li>
                        <li><strong>Sandbox Execution</strong>  -  When the user clicks Run, client calls are extracted via regex, dispatched to a local API endpoint that parses the server code to construct mock return values, and the results are fed through a simulated <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">console.log</code>.</li>
                    </ol>
                </div>
            </section>

            <hr className="my-12 border-edge" />

            {/* Section 2: Phase 1  -  Type Generation */}
            <section className="space-y-5">
                <h2 className="text-lg font-bold tracking-tight">Phase 1: Client-Side Type Generation</h2>
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                    <p>
                        The type pipeline lives in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">docs/lib/parsePythonTypes.ts</code>. Three functions form the core:
                    </p>
                    <ul>
                        <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">parseServerCode(code)</code>  -  Uses regex to find <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@model</code> classes and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code> functions. Extracts field names and types for models, parameter names/types and return type for procedures.</li>
                        <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">introspectionToTypes(schema)</code>  -  Converts the parsed schema into TypeScript declaration strings. Python types like <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">int</code> become <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">number</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">list[X]</code> becomes <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">X[]</code>, model names reference the generated interfaces.</li>
                        <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">validateServerCode(code)</code>  -  Detects unknown decorators (e.g. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@procedure</code>), missing return type annotations, and empty model classes.</li>
                    </ul>
                    <p>
                        The output is a TypeScript source string containing <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">export interface User &#123; ... &#125;</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">export interface Types &#123; get_user(id: number): Promise&lt;User&gt;; ... &#125;</code>.
                    </p>
                </div>
            </section>

            <hr className="my-12 border-edge" />

            {/* Section 3: Phase 2  -  Monaco Integration */}
            <section className="space-y-5">
                <h2 className="text-lg font-bold tracking-tight">Phase 2: Monaco Editor Integration</h2>
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                    <p>
                        The critical design decision was <em>how</em> to feed these types into Monaco so that TypeScript's compiler can see them. Monaco provides <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">setExtraLibs</code> for declaring ambient types, but we found that files added via <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">setExtraLibs</code> are <strong>not</strong> visible to TypeScript's module resolution  -  <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">import type &#123; Types &#125; from &quot;@pyrpc/types&quot;</code> would fail to resolve.
                    </p>
                    <p>
                        The solution: use <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">monaco.editor.createModel()</code> to create actual editor models at the exact file paths TypeScript expects:
                    </p>
                    <ul>
                        <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">/node_modules/@pyrpc/types/index.d.ts</code>  -  Generated type declarations (updated live as server code changes)</li>
                        <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">/node_modules/@pyrpc/client/index.d.ts</code>  -  Static client SDK stubs (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createClient</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">PyRPCClient</code>, etc.)</li>
                    </ul>
                    <p>
                        The client editor model is set with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">path=&quot;/model.ts&quot;</code> so that TypeScript's NodeJs module resolution finds the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">/node_modules/...</code> models. After updating the types model, a no-op edit (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pushEditOperations</code>) forces the TypeScript worker to re-evaluate the program, updating diagnostics and completion data immediately  -  <strong>at compile time, not after clicking Run</strong>.
                    </p>
                    <p>
                        The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Omit&lt;PyRPCClient, &#39;rpc&#39;&gt;</code> type in the stubs hides the internal <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.rpc</code> property from autocomplete, so <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client.</code> shows only user-defined methods.
                    </p>
                </div>
            </section>

            <hr className="my-12 border-edge" />

            {/* Section 4: Phase 3  -  Sandbox Execution */}
            <section className="space-y-5">
                <h2 className="text-lg font-bold tracking-tight">Phase 3: Mock Sandbox Execution</h2>
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                    <p>
                        When the user clicks Run, the playground:
                    </p>
                    <ol>
                        <li><strong>Extracts client calls</strong>  -  <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">parseClientCalls</code> uses a global <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">matchAll</code> regex to find every <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client.method(...)</code> call in the client code.</li>
                        <li><strong>Dispatches to mock API</strong>  -  A lightweight proxy (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createSandboxClient</code>) sends each call as a POST to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">/api/sandbox/rpc</code> with the server code in a header.</li>
                        <li><strong>Parses server code</strong>  -  The mock endpoint re-parses the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code> function signatures and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@model</code> fields, then builds mock return values:</li>
                    </ol>
                    <ul>
                        <li>For <strong>model return types</strong>: creates an object with default-typed fields (e.g., <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">str</code> becomes <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&quot;Sample fieldName&quot;</code>), overrides with matching parameter values, then overrides with return value literals parsed from the function body (e.g. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">return User(id=id, name=&quot;Core User&quot;)</code> sets <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">name</code> to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&quot;Core User&quot;</code>).</li>
                        <li>For <strong>primitive return types</strong>: returns sensible defaults (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">int</code> = <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">42</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">str</code> = <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">&quot;mock_result&quot;</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">any</code> = computed from input).</li>
                    </ul>
                    <p>
                        Finally, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">simulateConsoleLogs</code> processes each <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">console.log(...)</code> call  -  supporting template literals (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{`Hello $\{name}`}</code>), <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">typeof()</code> expressions, dot-path resolution (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">user.name</code>), and proper handling of nested parentheses  -  and displays the output in a theme-aware terminal.
                    </p>
                </div>
            </section>

            <hr className="my-12 border-edge" />

            {/* Section 5: Validation */}
            <section className="space-y-5">
                <h2 className="text-lg font-bold tracking-tight">Live Validation</h2>
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                    <p>
                        The server editor validates code on every keystroke via a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useEffect</code> that calls <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">validateServerCode</code>. Detected issues are surfaced as Monaco error markers (red underlines) and also block the Start Server button:
                    </p>
                    <ul>
                        <li><strong>Unknown decorators</strong>  -  Any <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@name</code> that isn&apos;t <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc</code> or <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@model</code> triggers an error.</li>
                        <li><strong>Missing return type</strong>  -  <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@rpc def foo()</code> without a return type annotation is flagged.</li>
                        <li><strong>Empty model</strong>  -  A <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@model</code> class with no typed fields is flagged.</li>
                    </ul>
                    <p>
                        This validation mirrors what pyrpc-core would enforce at runtime, but shifted to edit-time for immediate feedback.
                    </p>
                </div>
            </section>

            <hr className="my-12 border-edge" />

            {/* Section 6: Comparison with Real pyrpc */}
            <section className="space-y-5">
                <h2 className="text-lg font-bold tracking-tight">Comparison with the Real pyrpc (v0.1.0-alpha.1)</h2>
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                    <p>
                        The sandbox simulates pyrpc&apos;s behaviour, but there are fundamental differences between the demo and the real framework:
                    </p>

                    <h3 className="text-sm font-bold text-fd-foreground mt-6">Type System</h3>
                    <table className="text-[11px] font-mono w-full border-collapse">
                        <thead>
                            <tr className="border-b border-edge">
                                <th className="text-left py-2 pr-4 font-bold text-fd-foreground">Aspect</th>
                                <th className="text-left py-2 pr-4 font-bold text-fd-foreground">Sandbox</th>
                                <th className="text-left py-2 font-bold text-fd-foreground">Real pyrpc</th>
                            </tr>
                        </thead>
                        <tbody className="text-fd-muted-foreground">
                            <tr className="border-b border-edge">
                                <td className="py-2 pr-4">Type parsing</td>
                                <td className="py-2 pr-4">Client-side regex</td>
                                <td className="py-2">Python AST via <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">pyrpc-codegen</code></td>
                            </tr>
                            <tr className="border-b border-edge">
                                <td className="py-2 pr-4">Supported types</td>
                                <td className="py-2 pr-4"><code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">int</code>, <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">str</code>, <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">bool</code>, <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">float</code>, <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">list[X]</code>, <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">dict[K,V]</code>, <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">Optional[X]</code>, <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">Union[X,Y]</code></td>
                                <td className="py-2">Full Python type system via Pydantic TypeAdapter</td>
                            </tr>
                            <tr className="border-b border-edge">
                                <td className="py-2 pr-4">Type validation</td>
                                <td className="py-2 pr-4">None (skip)</td>
                                <td className="py-2">Pydantic <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">TypeAdapter.validate_python()</code> on every call</td>
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Models</td>
                                <td className="py-2 pr-4">Parsed fields only</td>
                                <td className="py-2">Pydantic dataclasses with full validation, defaults, nesting</td>
                            </tr>
                        </tbody>
                    </table>

                    <h3 className="text-sm font-bold text-fd-foreground mt-6">Execution Model</h3>
                    <table className="text-[11px] font-mono w-full border-collapse">
                        <thead>
                            <tr className="border-b border-edge">
                                <th className="text-left py-2 pr-4 font-bold text-fd-foreground">Aspect</th>
                                <th className="text-left py-2 pr-4 font-bold text-fd-foreground">Sandbox</th>
                                <th className="text-left py-2 font-bold text-fd-foreground">Real pyrpc</th>
                            </tr>
                        </thead>
                        <tbody className="text-fd-muted-foreground">
                            <tr className="border-b border-edge">
                                <td className="py-2 pr-4">Runtime</td>
                                <td className="py-2 pr-4">None (mock results)</td>
                                <td className="py-2">Python  -  ASGI/Flask/FastAPI server</td>
                            </tr>
                            <tr className="border-b border-edge">
                                <td className="py-2 pr-4">Procedure execution</td>
                                <td className="py-2 pr-4">Regex-parsed signature + mock defaults</td>
                                <td className="py-2">Actual Python function call with Pydantic-validated params</td>
                            </tr>
                            <tr className="border-b border-edge">
                                <td className="py-2 pr-4">Return values</td>
                                <td className="py-2 pr-4">Constructed from return literals in body</td>
                                <td className="py-2">Actual function return value, validated by TypeAdapter</td>
                            </tr>
                            <tr className="border-b border-edge">
                                <td className="py-2 pr-4">Transport</td>
                                <td className="py-2 pr-4">Next.js API route (<code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">/api/sandbox/rpc</code>)</td>
                                <td className="py-2"><code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">PyRPCAsgiApp</code> / mounted on FastAPI/Flask</td>
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Adapter pattern</td>
                                <td className="py-2 pr-4">Template shows <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">mount_fastapi(app)</code> but ignored</td>
                                <td className="py-2"><code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">mount_fastapi(app)</code> registers actual HTTP routes</td>
                            </tr>
                        </tbody>
                    </table>

                    <h3 className="text-sm font-bold text-fd-foreground mt-6">Protocol &amp; Error Handling</h3>
                    <table className="text-[11px] font-mono w-full border-collapse">
                        <thead>
                            <tr className="border-b border-edge">
                                <th className="text-left py-2 pr-4 font-bold text-fd-foreground">Aspect</th>
                                <th className="text-left py-2 pr-4 font-bold text-fd-foreground">Sandbox</th>
                                <th className="text-left py-2 font-bold text-fd-foreground">Real pyrpc</th>
                            </tr>
                        </thead>
                        <tbody className="text-fd-muted-foreground">
                            <tr className="border-b border-edge">
                                <td className="py-2 pr-4">Protocol</td>
                                <td className="py-2 pr-4">JSON-RPC 2.0-like (simplified)</td>
                                <td className="py-2">JSON-RPC 2.0 with request/response envelopes</td>
                            </tr>
                            <tr className="border-b border-edge">
                                <td className="py-2 pr-4">Error codes</td>
                                <td className="py-2 pr-4">Basic HTTP + <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">-32600</code>/<code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">-32601</code>/<code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">-32603</code></td>
                                <td className="py-2">Full JSON-RPC 2.0 error codes + Pydantic validation errors</td>
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Introspection</td>
                                <td className="py-2 pr-4">Client-side regex (sync, instant)</td>
                                <td className="py-2">Server-side <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">GET /rpc</code> endpoint returning full schema</td>
                            </tr>
                        </tbody>
                    </table>

                    <h3 className="text-sm font-bold text-fd-foreground mt-6">Client SDK</h3>
                    <table className="text-[11px] font-mono w-full border-collapse">
                        <thead>
                            <tr className="border-b border-edge">
                                <th className="text-left py-2 pr-4 font-bold text-fd-foreground">Aspect</th>
                                <th className="text-left py-2 pr-4 font-bold text-fd-foreground">Sandbox</th>
                                <th className="text-left py-2 font-bold text-fd-foreground">Real pyrpc</th>
                            </tr>
                        </thead>
                        <tbody className="text-fd-muted-foreground">
                            <tr className="border-b border-edge">
                                <td className="py-2 pr-4">Implementation</td>
                                <td className="py-2 pr-4">Inline <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">Proxy</code> + <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">fetch</code> in <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">page.tsx</code></td>
                                <td className="py-2"><code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">@pyrpc/client</code> npm package with full Proxy-based API</td>
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Parameter passing</td>
                                <td className="py-2 pr-4">Single arg = positional; object = named</td>
                                <td className="py-2">Single non-array object = named params; array = positional</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <hr className="my-12 border-edge" />

            {/* Section 7: Key Design Decisions */}
            <section className="space-y-5">
                <h2 className="text-lg font-bold tracking-tight">Key Design Decisions</h2>
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                    <div className="border border-edge rounded-lg p-4 space-y-2">
                        <h3 className="text-sm font-bold text-fd-foreground"><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createModel</code> over <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">setExtraLibs</code></h3>
                        <p className="text-xs">
                            <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">setExtraLibs</code> files don&apos;t participate in module resolution. By creating real editor models at the resolved file paths, TypeScript&apos;s NodeJs resolution finds them correctly when the user types <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">import type &#123; Types &#125; from &quot;@pyrpc/types&quot;</code>.
                        </p>
                    </div>
                    <div className="border border-edge rounded-lg p-4 space-y-2">
                        <h3 className="text-sm font-bold text-fd-foreground">No Piston API</h3>
                        <p className="text-xs">
                            The original design used Piston (a remote code execution API) to run Python in a sandboxed container. Piston requires authentication and adds latency. The regex-based mock approach is instant, offline-capable, and sufficient for a type-first demo.
                        </p>
                    </div>
                    <div className="border border-edge rounded-lg p-4 space-y-2">
                        <h3 className="text-sm font-bold text-fd-foreground">Return value literal parsing</h3>
                        <p className="text-xs">
                            Rather than hardcoding return values per template, the sandbox parses the actual return statement (<code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">return User(id=id, name=&quot;Core User&quot;)</code>) to extract literal values. This makes it work with any user-defined server code without special-casing templates.
                        </p>
                    </div>
                    <div className="border border-edge rounded-lg p-4 space-y-2">
                        <h3 className="text-sm font-bold text-fd-foreground">No external npm dependencies for the sandbox</h3>
                        <p className="text-xs">
                            The sandbox avoids depending on <code className="text-[10px] font-mono bg-fd-muted px-1 py-0.5 rounded">@pyrpc/client</code> at build time by inlining a minimal proxy. This prevents resolution issues during Vercel deployment where workspace packages aren&apos;t available. The proxy mirrors the real client&apos;s parameter handling (positional vs named) so the demo accurately reflects the real developer experience.
                        </p>
                    </div>
                </div>
            </section>

            <hr className="my-12 border-edge" />

            {/* Footer */}
            <footer className="text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                <Link href="/blog" className="hover:text-fd-foreground transition-colors">&larr; Back to Blog</Link>
            </footer>
            </div>
        </article>
    )
}
