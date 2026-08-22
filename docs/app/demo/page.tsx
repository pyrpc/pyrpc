'use client'

import React, { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { PlaygroundEditor } from '@/components/playground/PlaygroundEditor'
import * as Select from '@radix-ui/react-select'
import { ChevronDown, RotateCcw, Play, Loader2, Terminal, Code2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useTheme } from 'next-themes'
import { fetchIntrospection, validateServerCode } from '@/lib/parsePythonTypes'
import type { ValidationError } from '@/lib/parsePythonTypes'

const TEMPLATES: any = {
    Core: {
        server: `from pyrpc_core import rpc, model\n\n@model\nclass User:\n    id: int\n    name: str\n    email: str\n\n@rpc\ndef get_user(id: int) -> User:\n    return User(id=id, name="Core User", email="core@pyrpc.com")`,
        client: {
            Vanilla: `import { createClient, httpBatchLink } from "@pyrpc/client"\nimport type { Types } from "@pyrpc/types"\n\nconst client = createClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// Hover get_user to check the types or change parameters!\nconst user = await client.get_user(1);\nconsole.log(\`User email is: \${user.email}\`);`,
            React: `import { createReactClient, httpBatchLink } from "@pyrpc/react"\nimport type { Types } from "@pyrpc/types"\n\nconst api = createReactClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// Wrap your app with <api.Provider>, then:\nexport function UserProfile() {\n  const { data, isLoading } = api.get_user.useQuery(1)\n  if (isLoading) return <div>Loading...</div>\n  return <div>{data?.email}</div>\n}`,
            Vue: `import { createVueClient, httpBatchLink } from "@pyrpc/vue"\nimport type { Types } from "@pyrpc/types"\n\nconst api = createVueClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// Register TanStack Vue Query with app.use(api.plugin), then:\nconst { data, isLoading } = api.get_user.useQuery(1)\nconsole.log(data?.email)`,
            Svelte: `import { createSvelteClient, httpBatchLink } from "@pyrpc/svelte"\nimport type { Types } from "@pyrpc/types"\n\nconst api = createSvelteClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// In a Svelte component:\nconst query = api.get_user.createQuery(1)\nconsole.log($query.data?.email)`,
            'Next.js': `import { createNextClient, httpBatchLink } from "@pyrpc/next"\nimport type { Types } from "@pyrpc/types"\n\nconst api = createNextClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// Server Component, prefetch with RSC:\n// await api.prefetch.get_user(1)\n\n// Client Component:\nexport function UserProfile() {\n  const { data, isLoading } = api.get_user.useQuery(1)\n  if (isLoading) return <div>Loading...</div>\n  return <div>{data?.email}</div>\n}`
        }
    },
    FastAPI: {
        server: `from fastapi import FastAPI\nfrom pyrpc_fastapi import mount_fastapi, rpc, model\n\napp = FastAPI()\n\n@model\nclass Post:\n    id: int\n    title: str\n    published: bool\n\n@rpc\ndef get_post(id: int) -> Post:\n    return Post(id=id, title="FastAPI and pyRPC Integration", published=True)\n\nmount_fastapi(app)`,
        client: {
            Vanilla: `import { createClient, httpBatchLink } from "@pyrpc/client"\nimport type { Types } from "@pyrpc/types"\n\nconst client = createClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// Try changing a field type in server.py and view changes here!\nconst post = await client.get_post(42);\nconsole.log(\`Post: \${post.title} (Published: \${post.published})\`);`,
            React: `import { createReactClient, httpBatchLink } from "@pyrpc/react"\nimport type { Types } from "@pyrpc/types"\n\nconst api = createReactClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// Wrap your app with <api.Provider>, then:\nexport function PostViewer() {\n  const { data, isLoading } = api.get_post.useQuery(42)\n  if (isLoading) return <div>Loading...</div>\n  return <div>{data?.title}</div>\n}`,
            Vue: `import { createVueClient, httpBatchLink } from "@pyrpc/vue"\nimport type { Types } from "@pyrpc/types"\n\nconst api = createVueClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// Register TanStack Vue Query with app.use(api.plugin), then:\nconst { data, isLoading } = api.get_post.useQuery(42)\nconsole.log(data?.title)`,
            Svelte: `import { createSvelteClient, httpBatchLink } from "@pyrpc/svelte"\nimport type { Types } from "@pyrpc/types"\n\nconst api = createSvelteClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// In a Svelte component:\nconst query = api.get_post.createQuery(42)\nconsole.log($query.data?.title)`,
            'Next.js': `import { createNextClient, httpBatchLink } from "@pyrpc/next"\nimport type { Types } from "@pyrpc/types"\n\nconst api = createNextClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// Server Component, prefetch with RSC:\n// await api.prefetch.get_post(42)\n\n// Client Component:\nexport function PostViewer() {\n  const { data, isLoading } = api.get_post.useQuery(42)\n  if (isLoading) return <div>Loading...</div>\n  return <div>{data?.title}</div>\n}`
        }
    },
    Flask: {
        server: `from flask import Flask\nfrom pyrpc_flask import mount_flask, rpc, model\n\napp = Flask(__name__)\n\n@model\nclass Project:\n    id: int\n    name: str\n    stars: int\n\n@rpc\ndef get_project(id: int) -> Project:\n    return Project(id=id, name="pyRPC Flask Project", stars=1200)\n\nmount_flask(app)`,
        client: {
            Vanilla: `import { createClient, httpBatchLink } from "@pyrpc/client"\nimport type { Types } from "@pyrpc/types"\n\nconst client = createClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// Edit get_project return type on the left to see errors here\nconst project = await client.get_project(1);\nconsole.log(\`Project \${project.name} has \${project.stars} stars.\`);`,
            React: `import { createReactClient, httpBatchLink } from "@pyrpc/react"\nimport type { Types } from "@pyrpc/types"\n\nconst api = createReactClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// Wrap your app with <api.Provider>, then:\nexport function ProjectStats() {\n  const { data, isLoading } = api.get_project.useQuery(1)\n  if (isLoading) return <div>Loading...</div>\n  return <div>{data?.name} - {data?.stars} stars</div>\n}`,
            Vue: `import { createVueClient, httpBatchLink } from "@pyrpc/vue"\nimport type { Types } from "@pyrpc/types"\n\nconst api = createVueClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// Register TanStack Vue Query with app.use(api.plugin), then:\nconst { data, isLoading } = api.get_project.useQuery(1)\nconsole.log(\`\${data?.name} has \${data?.stars} stars\`)`,
            Svelte: `import { createSvelteClient, httpBatchLink } from "@pyrpc/svelte"\nimport type { Types } from "@pyrpc/types"\n\nconst api = createSvelteClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// In a Svelte component:\nconst query = api.get_project.createQuery(1)\nconsole.log($query.data?.name)`,
            'Next.js': `import { createNextClient, httpBatchLink } from "@pyrpc/next"\nimport type { Types } from "@pyrpc/types"\n\nconst api = createNextClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// Server Component, prefetch with RSC:\n// await api.prefetch.get_project(1)\n\n// Client Component:\nexport function ProjectStats() {\n  const { data, isLoading } = api.get_project.useQuery(1)\n  if (isLoading) return <div>Loading...</div>\n  return <div>{data?.name} - {data?.stars} stars</div>\n}`
        }
    },
    Django: {
        server: `from django.urls import path\nfrom pyrpc_django import mount_django, rpc, model\n\n@model\nclass Product:\n    id: int\n    name: str\n    price: float\n\n@rpc\ndef get_product(id: int) -> Product:\n    return Product(id=id, name="pyRPC Merch", price=29.99)\n\nurlpatterns = [\n    path("rpc/", mount_django()),\n]`,
        client: {
            Vanilla: `import { createClient, httpBatchLink } from "@pyrpc/client"\nimport type { Types } from "@pyrpc/types"\n\nconst client = createClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// Django adapter ready!\nconst product = await client.get_product(123);\nconsole.log(\`\${product.name} costs $\${product.price}\`);`,
            React: `import { createReactClient, httpBatchLink } from "@pyrpc/react"\nimport type { Types } from "@pyrpc/types"\n\nconst api = createReactClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// Wrap your app with <api.Provider>, then:\nexport function ProductView() {\n  const { data, isLoading } = api.get_product.useQuery(123)\n  if (isLoading) return <div>Loading...</div>\n  return <div>{data?.name} - $\${data?.price}</div>\n}`,
            Vue: `import { createVueClient, httpBatchLink } from "@pyrpc/vue"\nimport type { Types } from "@pyrpc/types"\n\nconst api = createVueClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// Register TanStack Vue Query with app.use(api.plugin), then:\nconst { data, isLoading } = api.get_product.useQuery(123)\nconsole.log(\`\${data?.name} costs $\${data?.price}\`)`,
            Svelte: `import { createSvelteClient, httpBatchLink } from "@pyrpc/svelte"\nimport type { Types } from "@pyrpc/types"\n\nconst api = createSvelteClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// In a Svelte component:\nconst query = api.get_product.createQuery(123)\nconsole.log($query.data?.price)`,
            'Next.js': `import { createNextClient, httpBatchLink } from "@pyrpc/next"\nimport type { Types } from "@pyrpc/types"\n\nconst api = createNextClient<Types>({\n  links: [httpBatchLink({ url: "/rpc" })],\n})\n\n// Server Component, prefetch with RSC:\n// await api.prefetch.get_product(123)\n\n// Client Component:\nexport function ProductView() {\n  const { data, isLoading } = api.get_product.useQuery(123)\n  if (isLoading) return <div>Loading...</div>\n  return <div>{data?.name} - $\${data?.price}</div>\n}`
        }
    }
}

export default function PlaygroundPage() {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])
    const isDark = mounted ? resolvedTheme === 'dark' : false
    const [serverLang, setServerLang] = useState('Core')
    const [clientLang, setClientLang] = useState('Vanilla')
    const [serverCode, setServerCode] = useState(TEMPLATES.Core.server)
    const [clientCode, setClientCode] = useState(TEMPLATES.Core.client.Vanilla)
    const [serverTypes, setServerTypes] = useState<string>(() => fetchIntrospection(TEMPLATES.Core.server))
    const [serverErrors, setServerErrors] = useState<ValidationError[]>([])

    // Debounced real-time compilation of Python types into Monaco TypeScript context
    useEffect(() => {
        const timer = setTimeout(() => {
            const validationErrors = validateServerCode(serverCode)
            setServerErrors(validationErrors)

            if (validationErrors.length === 0) {
                try {
                    const tsDeclarations = fetchIntrospection(serverCode)
                    setServerTypes(tsDeclarations)
                } catch (err) {
                    // Ignore transient parsing errors during active typing
                }
            }
        }, 200)

        return () => clearTimeout(timer)
    }, [serverCode])

    const handleChangeFramework = useCallback((v: string) => {
        setServerLang(v)
        setServerCode(TEMPLATES[v].server)
        setServerErrors([])
        setServerTypes(fetchIntrospection(TEMPLATES[v].server))
        setClientCode(TEMPLATES[v].client[clientLang])
    }, [clientLang])

    const handleChangeClient = useCallback((v: string) => {
        setClientLang(v)
        setClientCode(TEMPLATES[serverLang].client[v])
    }, [serverLang])

    const handleReset = () => {
        setClientCode(TEMPLATES[serverLang].client[clientLang])
        setServerCode(TEMPLATES[serverLang].server)
        setServerErrors([])
        setServerTypes(fetchIntrospection(TEMPLATES[serverLang].server))
    }

    return (
        <div className="relative min-h-[calc(100svh-6.5rem)] pt-14 md:pt-24 pb-16 overflow-hidden">

            <div className="relative max-w-[1200px] mx-auto px-6 flex flex-col gap-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight leading-tight text-fd-foreground">
                            Interactive Playground
                        </h1>
                        <p className="mt-4 text-sm text-fd-muted-foreground leading-relaxed max-w-xl">
                            Define your types and procedures in Python on the left. Watch TypeScript autocomplete and code validation update automatically on the right.
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium tracking-tight rounded-md border border-neutral-200 bg-white hover:bg-neutral-100 dark:border-[#262626] dark:bg-[#161616] dark:hover:bg-[#262626] transition-colors text-fd-foreground cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset
                        </button>
                    </div>
                </div>

                {/* Split Workspace Editor Card */}
                <div className="border border-[#262626] bg-[#101010] rounded-lg overflow-hidden flex flex-col">
                    {/* IDE Header Bar */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#262626] border-b border-[#262626] bg-[#101010]">
                        <div className="flex items-center justify-between px-4 py-2">
                            <div className="flex items-center gap-2">
                                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" className="w-4 h-4" />
                                <span className="text-[11px] font-mono font-medium text-neutral-200">server.py</span>
                            </div>
                            <FrameworkSelect
                                value={serverLang}
                                options={Object.keys(TEMPLATES)}
                                onChange={handleChangeFramework}
                            />
                        </div>
                        <div className="flex items-center justify-between px-4 py-2">
                            <div className="flex items-center gap-2">
                                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" className="w-4 h-4" />
                                <span className="text-[11px] font-mono font-medium text-neutral-200">client.ts</span>
                            </div>
                            <FrameworkSelect
                                value={clientLang}
                                options={Object.keys(TEMPLATES.Core.client)}
                                onChange={handleChangeClient}
                            />
                        </div>
                    </div>

                    {/* Side-by-Side Monaco Editor Panes */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#262626] h-[380px]">
                        <div className="relative h-full overflow-hidden">
                            <PlaygroundEditor
                                language="python"
                                code={serverCode}
                                onChange={(v: string | undefined) => setServerCode(v || '')}
                                serverErrors={serverErrors}
                            />
                            {serverErrors.length > 0 && (
                                <div className="absolute bottom-3 left-3 right-3 bg-[#101010]/80 border border-red-500/20 px-3 py-1.5 rounded text-[10px] text-red-400 font-mono backdrop-blur">
                                    {serverErrors[0].message}
                                </div>
                            )}
                        </div>
                        <div className="h-full overflow-hidden">
                            <PlaygroundEditor
                                language="typescript"
                                code={clientCode}
                                onChange={(v: string | undefined) => setClientCode(v || '')}
                                serverTypes={serverTypes}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FrameworkSelect({ label, value, options, onChange }: any) {
    return (
        <div className="flex items-center gap-2">
            {label && <span className="text-[10px] font-semibold text-neutral-500 font-sans">{label}:</span>}
            <Select.Root value={value} onValueChange={onChange}>
                <Select.Trigger className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-[#262626] bg-[#161616] hover:bg-[#262626] transition-colors outline-none text-neutral-300 cursor-pointer">
                    <Select.Value />
                    <Select.Icon>
                        <ChevronDown className="w-3 h-3 opacity-60" />
                    </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                    <Select.Content
                        position="popper"
                        sideOffset={4}
                        className="min-w-[160px] bg-white dark:bg-[#0a0a0a] rounded-lg border border-neutral-200 dark:border-white/[0.08] shadow-xl p-1.5 z-[100] animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
                    >
                        <Select.Viewport className="p-0">
                            {options.map((opt: string) => (
                                <Select.Item
                                    key={opt}
                                    value={opt}
                                    className="flex items-center px-2 py-1.5 text-[13px] font-medium outline-none cursor-default rounded-md text-fd-muted-foreground data-[highlighted]:bg-fd-accent data-[highlighted]:text-fd-foreground data-[state=checked]:text-fd-foreground transition-colors"
                                >
                                    <Select.ItemText>{opt}</Select.ItemText>
                                </Select.Item>
                            ))}
                        </Select.Viewport>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>
        </div>
    )
}
