import Link from 'next/link'

export default function TheThrowingPlaceholderPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The placeholder that throws
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 12, 2026 at 10:40am</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Until <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev</code> runs for the first time, there is no generated module. Yet <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> must still exist on disk so imports resolve. The tension between "nothing is generated yet" and "imports must not crash" is solved by a placeholder, and since v0.12.0, that placeholder is a Proxy that throws.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The placeholder, complete</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`export type Types = Record<string, never>;

export type ProcedureKinds = Record<string, never>;

export const procedureKinds: ProcedureKinds = new Proxy(
  {} as ProcedureKinds,
  {
    get() {
      throw new Error(
        "pyRPC: '@pyrpc/types' is still the placeholder, the generated " +
          "__pyrpc.ts is not being resolved. Run \`pyrpc dev\` and make sure " +
          '"@pyrpc/types" resolves to your generated "./__pyrpc.ts" ...',
      );
    },
  },
);`}
                </pre>
                <p>
                    Three exports, three deliberate choices.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Types = Record&lt;string, never&gt;</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Record&lt;string, never&gt;</code> is an empty map: any key is <em>allowed</em> at the type level but has no usable value. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.get_user</code> typechecks as existing, but its type is effectively unusable, a deliberate mid-state between "the API does not exist" and "the API exists but is wrong". It keeps the import graph typeable before codegen while refusing to pretend the procedures are real.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The Proxy and its get trap</h2>
                <p>
                    The interesting part is the const. <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">procedureKinds</code> is not an empty object (it is a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Proxy</code> whose <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">get</code> handler unconditionally throws. Any property access) <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kinds.get_user</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">kinds["greet"]</code> (detonates with the error message.
                </p>
                <p>
                    Why a Proxy instead of a plain object? Because a plain empty object would look innocent. The whole point is that reading kinds from a placeholder is always a bug, and the Proxy converts that bug from a silent <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">undefined</code> into a loud, actionable failure.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The error message is a diagnosis</h2>
                <p>
                    The thrown error is not <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">"procedureKinds is unavailable"</code>. It states three things: the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> package is still the placeholder; the generated <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">__pyrpc.ts</code> is not being resolved; and the fix is to run <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc dev</code> and make sure the alias points at <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">./__pyrpc.ts</code>. The message names the mechanism (resolution) and the two resolution routes (tsconfig paths or a bundler alias), turning a stack trace into a checklist.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">When it fires</h2>
                <p>
                    The trap fires whenever a bundler resolved <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> to the real npm package instead of the alias target. In practice: a Vite or Turbopack project before the bundler alias was injected, or any project where the tsconfig alias never made it. That is exactly the failure mode the placeholder exists to surface.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The philosophy</h2>
                <p>
                    A placeholder is a promise that has not been fulfilled. The v0.12.0 placeholder refuses to fake fulfillment: if you touch the kinds before codegen has run, you find out the instant the module loads, with a message that tells you how to finish the setup. That is fail-closed engineering for an otherwise silent category of bug.
                </p>
            </section>
        </article>
    )
}
