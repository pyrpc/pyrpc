import Link from 'next/link'

export default function VueSvelteAdaptersPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Vue and Svelte adapters: same contract, stack-native setup
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 5:00am</time>
                    <span>&middot;</span>
                    <span>9 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/vue</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/svelte</code> wrap the same <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/client</code> + procedure kinds. Setup follows each ecosystem’s TanStack Query conventions, we don’t invent a second provider model.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Vue</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`import { createApp } from "vue"
import { createPyrpcVue } from "@pyrpc/vue"
import type { Types } from "@pyrpc/types"

export const api = createPyrpcVue<Types>({ baseUrl: "http://localhost:8000" })
createApp(App).use(api.plugin).mount("#app")

// in a component
const { data } = api.greet.useQuery({ name: "Ada" })`}
                </pre>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.plugin</code> registers TanStack’s <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">VueQueryPlugin</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Svelte</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`import { createSvelteClient } from "@pyrpc/svelte"
import type { Types } from "@pyrpc/types"

export const api = createSvelteClient<Types>({ baseUrl: "http://localhost:8000" })

// + TanStack Svelte QueryClientProvider around the app
const query = api.greet.createQuery({ name: "Ada" })`}
                </pre>
                <p>
                    Svelte Query uses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createQuery</code> / <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createMutation</code> instead of <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">use*</code>, we follow that naming on purpose.
                </p>

                <p>
                    <Link href="/docs/client/adapters/vue" className="text-fd-foreground underline underline-offset-2">Vue docs</Link> · <Link href="/docs/client/adapters/svelte" className="text-fd-foreground underline underline-offset-2">Svelte docs</Link>
                </p>
            </section>
        </article>
    )
}
