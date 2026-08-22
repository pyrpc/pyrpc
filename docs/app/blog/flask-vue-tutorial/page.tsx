import Link from 'next/link'

export default function FlaskVueTutorialPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Flask + Vue: zero-ceremony Python backend, Vue 3 frontend
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 8, 2026 at 11:30am</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Flask + Vue is one of the leanest stacks in the examples, a minimal Python server, a Vite-powered Vue 3 frontend, and pyRPC bridging them with full type safety. The setup is nearly identical to the FastAPI + Vue example; only the import paths and default port differ.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The server</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# server/main.py
from flask import Flask
from flask_cors import CORS
from pyrpc_core import rpc
from pyrpc_flask import mount_flask

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])  # Vite default

@rpc.query
def greet(name: str = "World") -> dict:
    return {"message": f"Hello, {name}!", "framework": "Flask"}

@rpc.query
def read_item(item_id: int, q: str = None) -> dict:
    return {"item_id": item_id, "q": q}

@rpc.mutation
def create_item(name: str, description: str = None) -> dict:
    return {"name": name, "description": description, "created": True}

mount_flask(app)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Client setup</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`// src/pyrpc.ts
import { createPyrpcVue } from "@pyrpc/vue"
import type { Types } from "@pyrpc/types"

export const pyrpc = createPyrpcVue<Types>({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:5000",
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
const { data: greeting, isPending } = pyrpc.greet.createQuery()
const { data: item } = pyrpc.read_item.createQuery(() => ({ item_id: 42, q: "test" }))
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
{`cd server && uv add pyrpc-core[flask] && pyrpc dev --yes
cd client && npm install && npm run dev`}
                </pre>
                <p>Open <strong>http://localhost:5173</strong>. Full source at <a href="https://github.com/pyrpc/pyrpc/tree/main/examples/flask-vue" className="text-fd-foreground underline underline-offset-2">examples/flask-vue</a>.</p>
            </section>
        </article>
    )
}
