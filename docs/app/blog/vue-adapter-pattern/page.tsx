import Link from 'next/link'

export default function TheVueAdapterPatternPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The Vue adapter: same contract, Vue-native patterns
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 7:30am</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/vue</code> adapter follows the same architecture as React — one transport, TanStack Query on top — but uses Vue-native patterns: plugins instead of providers, composables instead of hooks.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Setup</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`import { createPyrpcVue } from "@pyrpc/vue"
import type { Types } from "@pyrpc/types"
import { procedureKinds } from "@pyrpc/types"

const api = createPyrpcVue<Types>({
  baseUrl: "http://localhost:8000",
  kinds: procedureKinds,
})`}
                </pre>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createPyrpcVue</code> returns an object with a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">plugin</code> property that registers TanStack's VueQueryPlugin.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Plugin instead of Provider</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// main.ts
import { createApp } from "vue"
import { api } from "./lib/pyrpc"

const app = createApp(App)
app.use(api.plugin)
app.mount("#app")`}
                </pre>
                <p>
                    One <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">app.use(api.plugin)</code> call. No wrapper components. The plugin handles QueryClient setup internally.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Composables, not hooks</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`<script setup>
import { api } from "@/lib/pyrpc"

const { data } = api.get_user.useQuery({ userId: 1 })
</script>

<template>
  <p>{{ data?.name ?? "Loading..." }}</p>
</template>`}
                </pre>
                <p>
                    Vue uses Composition API composables. Same kind-based resolution: queries get <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code>, mutations get <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What stays the same vs React</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li>One transport: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">createClient</code> underneath</li>
                    <li>Same <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Types</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">procedureKinds</code></li>
                    <li>Same query key format: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">["pyrpc", procedureName, input?]</code></li>
                    <li>Same kind-based hook resolution</li>
                </ul>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What is different</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Plugin instead of Provider component</li>
                    <li>Vue 3 Composition API instead of React hooks</li>
                    <li>Standard Vue templates instead of JSX</li>
                    <li><code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">reactive()</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">computed()</code> for derived state</li>
                </ul>

                <p>
                    The adapter is intentionally thin. If you understand the React adapter, you understand this one — the framework-specific part is just the integration pattern.
                </p>

                <p>
                    <Link href="/docs/client/vue" className="text-fd-foreground underline underline-offset-2">Vue docs</Link> · <Link href="/blog/vue-svelte-adapters" className="text-fd-foreground underline underline-offset-2">Vue and Svelte adapters</Link>
                </p>
            </section>
        </article>
    )
}
