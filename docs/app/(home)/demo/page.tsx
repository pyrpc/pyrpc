'use client'

import React, { useState } from 'react'
import { PlaygroundEditor } from '@/components/playground/PlaygroundEditor'
import { Inspector } from '@/components/playground/Inspector'
import { RequestFlow } from '@/components/playground/RequestFlow'
import { PerspectiveGrid } from '@/components/ui/perspective-grid'
import AnimatedButton from '@/components/ui/animated-button'
import * as Select from '@radix-ui/react-select'
import { ChevronDown, Play, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/cn'

const TEMPLATES = {
    server: {
        FastAPI: `@rpc\ndef add(a: int, b: int) -> int:\n    return a + b`,
        Flask: `@rpc\ndef add(a: int, b: int) -> int:\n    return a + b`,
        Django: `@rpc\ndef add(a: int, b: int) -> int:\n    return a + b`,
    },
    client: {
        TypeScript: `const result = await client.add.aio({ a: 1, b: 2 });\nconsole.log(result);`,
        React: `const { data } = useQuery(['add'], () => client.add({ a: 1, b: 2 }));`,
        NextJS: `export async function getServerSideProps() {\n  const result = await client.add({ a: 1, b: 2 });\n  return { props: { result } };\n}`,
    }
}

export default function PlaygroundPage() {
    const [serverLang, setServerLang] = useState('FastAPI')
    const [clientLang, setClientLang] = useState('TypeScript')
    const [serverCode, setServerCode] = useState(TEMPLATES.server.FastAPI)
    const [clientCode, setClientCode] = useState(TEMPLATES.client.TypeScript)
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
    const [logs, setLogs] = useState<string[]>([])
    const [request, setRequest] = useState<any>({ method: 'add', params: { a: 1, b: 2 }, id: 'rpc-1' })
    const [response, setResponse] = useState<any>(null)

    const handleRun = async () => {
        setStatus('running')
        setLogs(['Initializing RPC bridge...', 'Encoding request...', 'Dispatching to Python server...'])

        setTimeout(() => {
            setLogs(prev => [...prev, 'FastAPI processing...', 'Executing add(1, 2)', 'Returning result: 3'])
            setResponse({ result: 3, error: null, id: 'rpc-1' })
            setStatus('success')
        }, 2000)
    }

    const handleReset = () => {
        setStatus('idle')
        setLogs([])
        setResponse(null)
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Header Info */}
            <section className="relative w-full overflow-hidden border-b bg-background py-16 px-6">
                <PerspectiveGrid className="absolute inset-0 z-0" />
                <div className="relative z-10 max-w-5xl mx-auto space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Interactive Playground</h1>
                    <p className="max-w-2xl text-fd-muted-foreground uppercase tracking-tight font-mono text-sm leading-relaxed">
                        Experiment with pRPC in real-time. Define your server logic in Python and see how it reflects in your client.
                    </p>
                </div>
            </section>

            {/* Toolbar */}
            <div className="sticky top-[--fd-header-height] z-20 w-full border-b border-edge bg-background/80 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <FrameworkSelect
                            label="Server"
                            value={serverLang}
                            options={Object.keys(TEMPLATES.server)}
                            onChange={(v: string) => { setServerLang(v); setServerCode((TEMPLATES.server as any)[v]); }}
                        />
                        <FrameworkSelect
                            label="Client"
                            value={clientLang}
                            options={Object.keys(TEMPLATES.client)}
                            onChange={(v: string) => { setClientLang(v); setClientCode((TEMPLATES.client as any)[v]); }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleReset}
                            className="p-2 border border-edge hover:bg-muted/50 transition-colors"
                            title="Reset"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <AnimatedButton
                            onClick={handleRun}
                            disabled={status === 'running'}
                            className="px-6 py-2 uppercase tracking-widest font-mono text-xs font-bold gap-2 flex items-center"
                        >
                            <Play className={cn("w-3 h-3 fill-current", status === 'running' && "animate-pulse")} />
                            {status === 'running' ? 'Running...' : 'Run RPC'}
                        </AnimatedButton>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <main className="flex-1 flex flex-col">
                <div className="w-full flex-1 grid lg:grid-cols-2 divide-x divide-edge border-b border-edge bg-black">
                    <div className="h-[400px] lg:h-auto">
                        <PlaygroundEditor
                            label="SERVER.PY"
                            language="python"
                            code={serverCode}
                            onChange={(v) => setServerCode(v || '')}
                        />
                    </div>
                    <div className="h-[400px] lg:h-auto">
                        <PlaygroundEditor
                            label="CLIENT.TS"
                            language="typescript"
                            code={clientCode}
                            onChange={(v) => setClientCode(v || '')}
                        />
                    </div>
                </div>

                <div className="w-full grid lg:grid-cols-2 divide-x divide-edge h-[300px]">
                    <div>
                        <RequestFlow status={status} />
                    </div>
                    <div>
                        <Inspector request={request} response={response} logs={logs} />
                    </div>
                </div>
            </main>
        </div>
    )
}

function FrameworkSelect({ label, value, options, onChange }: any) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-fd-muted-foreground">{label}:</span>
            <Select.Root value={value} onValueChange={onChange}>
                <Select.Trigger className="inline-flex items-center gap-2 px-3 py-1 border border-edge bg-muted/20 text-[10px] font-bold uppercase tracking-widest font-mono hover:bg-muted/40 transition-colors outline-none">
                    <Select.Value />
                    <Select.Icon>
                        <ChevronDown className="w-3 h-3" />
                    </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                    <Select.Content className="overflow-hidden bg-background border border-edge shadow-xl z-50">
                        <Select.Viewport className="p-1">
                            {options.map((opt: string) => (
                                <Select.Item
                                    key={opt}
                                    value={opt}
                                    className="flex items-center px-6 py-2 text-[10px] font-bold uppercase tracking-widest font-mono outline-none cursor-pointer hover:bg-muted"
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
