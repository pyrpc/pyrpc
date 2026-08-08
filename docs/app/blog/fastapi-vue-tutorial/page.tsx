import Link from 'next/link'

export default function FastApiVueTutorialPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    FastAPI + Vue: TanStack Vue Query with a Python backend
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 8, 2026 at 10:00am</time>
                    <span>&middot;</span>
                    <span>9 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    The Vue adapter works differently from React in one key way: instead of a <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{'<api.Provider>'}</code> component, you register <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">pyrpc.plugin</code> on your Vue app. Everything else — typed queries, mutations, reactive args — follows Vue 3 Composition API conventions.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Project layout</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`fastapi-vue/
  server/
    main.py             ← FastAPI app (same as React example)
    pyrpc.json
  client/
    src/
      pyrpc.ts          ← createPyrpcVue setup
      main.ts           ← createApp().use(pyrpc.plugin)
      App.vue           ← createQuery / createMutation calls`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Client setup</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// src/pyrpc.ts
import { createPyrpcVue } from "@pyrpc/vue"
import type { Types } from "@pyrpc/types"

export const pyrpc = createPyrpcVue<Types>({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
})`}
                </pre>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// src/main.ts
import { createApp } from "vue"
import App from "./App.vue"
import { pyrpc } from "./pyrpc"

createApp(App).use(pyrpc.plugin).mount("#app")`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Using the composables</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`<!-- src/App.vue -->
<script setup lang="ts">
import { ref } from "vue"
import { pyrpc } from "./pyrpc"

const name = ref("")

// @rpc.query → createQuery
const { data: greeting, isPending } = pyrpc.read_root.createQuery()

// pass reactive args as a getter so they re-fetch on change
const { data: item } = pyrpc.read_item.createQuery(
  () => ({ item_id: 42, q: "test" })
)

// @rpc.mutation → createMutation
const createItem = pyrpc.create_item.createMutation()

const handleCreate = () => {
  if (name.value.trim()) {
    createItem.mutate({ name: name.value, description: \`Item: \${name.value}\` })
    name.value = ""
  }
}
</script>

<template>
  <div>
    <p v-if="isPending">Loading…</p>
    <pre v-else>{{ JSON.stringify(greeting) }}</pre>

    <pre>{{ JSON.stringify(item) }}</pre>

    <input v-model="name" placeholder="Item name" />
    <button @click="handleCreate" :disabled="createItem.isPending.value">
      {{ createItem.isPending.value ? "Creating…" : "Create" }}
    </button>
    <pre v-if="createItem.isSuccess.value">
      {{ JSON.stringify(createItem.data.value) }}
    </pre>
  </div>
</template>`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Key differences from React</h2>
                <p>
                    <strong>Plugin vs Provider.</strong> Vue uses <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">app.use(pyrpc.plugin)</code> instead of a JSX Provider component. The plugin registers TanStack Vue Query under the hood.
                </p>
                <p>
                    <strong>Reactive values.</strong> Reactive data comes back as <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Ref</code> values. Access them with <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">.value</code> in <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{'<script>'}</code>, directly in templates.
                </p>
                <p>
                    <strong>Reactive args.</strong> Pass query args as a getter function (<code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">{'() => ({ ... })'}</code>) so TanStack Vue Query tracks reactive dependencies and re-fetches automatically.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Run it</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# Terminal 1
cd server && uv add pyrpc-core[fastapi] && pyrpc dev

# Terminal 2
cd client && npm install && npm run dev`}
                </pre>
                <p>Open <strong>http://localhost:5173</strong>.</p>
            </section>
        </article>
    )
}
