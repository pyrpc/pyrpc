import Link from 'next/link'

export default function DjangoVueTutorialPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Django + Vue: async Django backend, Vue 3 composables
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 8, 2026 at 1:30pm</time>
                    <span>&middot;</span>
                    <span>9 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    This stack combines Django's backend maturity with Vue 3's Composition API and reactivity system. The server integration is a standard Django view, import <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">views</code>, and call <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">mount_django(urlpatterns)</code>. The Vue side uses TanStack Vue Query wrapped by <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/vue</code> to expose fully typed composables like <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useQuery</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">useMutation</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Server (same as django-react)</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# views.py
@rpc.query
async def greet(name: str = "World") -> dict:
    return {"message": f"Hello, {name}!", "framework": "Django"}

@rpc.query
async def read_item(item_id: int, q: str = None) -> dict:
    return {"item_id": item_id, "q": q}

@rpc.mutation
async def create_item(name: str, description: str = None) -> dict:
    return {"name": name, "description": description, "created": True}

# urls.py: must import views to trigger registration
from . import views
from pyrpc_django import mount_django
urlpatterns = [...]
mount_django(urlpatterns)

# settings.py: CORS
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Client</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// src/pyrpc.ts
import { createPyrpcVue } from "@pyrpc/vue"
import type { Types } from "@pyrpc/types"

export const pyrpc = createPyrpcVue<Types>({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
})
// src/main.ts
createApp(App).use(pyrpc.plugin).mount("#app")`}
                </pre>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`<!-- src/App.vue -->
<script setup lang="ts">
import { ref } from "vue"
import { pyrpc } from "./pyrpc"

const name = ref("")
const { data: greeting, isPending } = pyrpc.greet.createQuery(() => ({ name: "Django User" }))
const { data: item } = pyrpc.read_item.createQuery(() => ({ item_id: 42, q: "django-test" }))
const createItem = pyrpc.create_item.createMutation()
</script>

<template>
  <p v-if="isPending">Loading…</p>
  <pre v-else>{{ JSON.stringify(greeting) }}</pre>
  <pre>{{ JSON.stringify(item) }}</pre>
  <input v-model="name" />
  <button @click="createItem.mutate({ name })" :disabled="createItem.isPending.value">
    {{ createItem.isPending.value ? "Creating…" : "Create" }}
  </button>
  <pre v-if="createItem.isSuccess.value">{{ JSON.stringify(createItem.data.value) }}</pre>
</template>`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Run it</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`cd server && uv add pyrpc-core[django] && pyrpc dev --yes --module myproject.views
cd client && npm install && npm run dev`}
                </pre>
                <p>Open <strong>http://localhost:5173</strong>. Full source at <a href="https://github.com/pyrpc/pyrpc/tree/main/examples/django-vue" className="text-fd-foreground underline underline-offset-2">examples/django-vue</a>.</p>
            </section>
        </article>
    )
}
