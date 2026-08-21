import Link from 'next/link'

export default function FromDeclarationToRuntimeModulePage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    From .d.ts to .ts: when types became a runtime module
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 9:00am</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    For the first ten releases, codegen wrote <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">__pyrpc.d.ts</code> into your client folder. A declaration file. In v0.12.0 that file became <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">__pyrpc.ts</code>, a real runtime module. The rename is one character, but it is the entire point of the release. This post explains why a declaration file could never carry what v0.12.0 needs.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The one thing a .d.ts cannot do</h2>
                <p>
                    TypeScript has two erasable things: type aliases and interfaces. A <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.d.ts</code> file is pure description, the compiler reads it, the runtime never sees it. That is fine when all you ship is shapes. It is useless when the file is supposed to hand the <em>running program</em> a value.
                </p>
                <p>
                    The framework adapters need to know, at runtime, whether a procedure is a query or a mutation so they can expose <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code> or <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code>. That knowledge is a value. A <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">const procedureKinds = {"{...}"}</code> must exist in the JS bundle. It cannot live in a declaration file.
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// declaration-only (impossible for values):
export const procedureKinds = ???   // .d.ts cannot hold a value`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Two channels, one file</h2>
                <p>
                    The pivot means the generated file now carries two things that used to be split across layers:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Types</code> interface, the compile-time channel the compiler uses for autocomplete and type errors.</li>
                    <li>The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">procedureKinds</code> const, the runtime channel the adapters read in their Proxy handlers.</li>
                </ul>
                <p>
                    A <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.ts</code> file is the only artifact that can be both: the compiler consumes it as types, and the bundler consumes it as code. That is why the extension matters.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The rename ripples outward</h2>
                <p>
                    Changing the emitted filename is a breaking change, and the ripples were intentional:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>The tsconfig <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">paths</code> alias now points at <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"./__pyrpc.ts"</code> instead of <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"./__pyrpc.d.ts"</code>.</li>
                    <li>Bundlers that ignore tsconfig paths for node_modules imports now need an explicit alias to the same file.</li>
                    <li>The generated file's header comment documents the new resolution contract, because the file has to actually <em>compile and run</em> now.</li>
                </ul>
                <p>
                    Every one of those ripples is downstream of a single insight: if adapters must branch on kinds at runtime, the codegen output must be runnable.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What did not change</h2>
                <p>
                    The consumer-facing shape stayed identical. You still write <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">import type &#123; Types &#125; from "@pyrpc/types"</code> and pass it to <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createReactClient&lt;Types&gt;</code>. The alias indirection means your imports never reference <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">__pyrpc.ts</code> by path, they reference <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code>, which resolves to the generated file. The runtime module is a replacement artifact behind a stable import surface.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The takeaway</h2>
                <p>
                    v0.12.0 is not a cosmetic refactor. It is the moment the generated artifact stopped being documentation for the compiler and became a first-class citizen of your bundle. From this release on, codegen output has a runtime responsibility, and everything downstream (bundler aliases, the throwing placeholder, externalized type packages) exists because of that single requirement.
                </p>
            </section>
        </article>
    )
}
