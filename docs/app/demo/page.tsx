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

const TEMPLATES: any = {
    FastAPI: {
        server: `from pydantic import BaseModel\nfrom prpc import rpc\n\nclass User(BaseModel):\n    id: int\n    name: str\n\n@rpc\nasync def get_user(id: int) -> User:\n    return User(id=id, name="pRPC User")`,
        client: {
            NextJS: {
                TypeScript: `export async function getServerSideProps() {\n  const client = new PRPCClient("http://api.internal");\n  const user = await client.get_user(1);\n  return { props: { user } };\n}`,
                JavaScript: `export async function getServerSideProps() {\n  const client = new PRPCClient("http://api.internal");\n  const user = await client.get_user(1);\n  return { props: { user } };\n}`,
            },
            React: {
                TypeScript: `const { data: user } = useQuery(['user'], () => client.get_user(1));`,
                JavaScript: `const { data: user } = useQuery(['user'], () => client.get_user(1));`,
            }
        }
    },
    Flask: {
        server: `from prpc import rpc\n\n@rpc\ndef add(a: int, b: int) -> int:\n    return a + b`,
        client: {
            NextJS: {
                TypeScript: `export async function getServerSideProps() {\n  const client = new PRPCClient("http://api.internal");\n  const result = await client.add(10, 5);\n  return { props: { result } };\n}`,
                JavaScript: `export async function getServerSideProps() {\n  const client = new PRPCClient("http://api.internal");\n  const result = await client.add(10, 5);\n  return { props: { result } };\n}`,
            },
            React: {
                TypeScript: `const { data: result } = useQuery(['add'], () => client.add(10, 5));`,
                JavaScript: `const { data: result } = useQuery(['add'], () => client.add(10, 5));`,
            }
        }
    },
    Django: {
        server: `from prpc import rpc\n\n@rpc\ndef greet(name: str) -> str:\n    return f"Hello {name}"`,
        client: {
            NextJS: {
                TypeScript: `export async function getServerSideProps() {\n  const client = new PRPCClient("http://api.internal");\n  const msg = await client.greet("pRPC");\n  return { props: { msg } };\n}`,
                JavaScript: `export async function getServerSideProps() {\n  const client = new PRPCClient("http://api.internal");\n  const msg = await client.greet("pRPC");\n  return { props: { msg } };\n}`,
            },
            React: {
                TypeScript: `const { data: msg } = useQuery(['greet'], () => client.greet("pRPC"));`,
                JavaScript: `const { data: msg } = useQuery(['greet'], () => client.greet("pRPC"));`,
            }
        }
    }
}

export default function PlaygroundPage() {
    const [serverLang, setServerLang] = useState('FastAPI')
    const [clientFramework, setClientFramework] = useState('React')
    const [clientLanguage, setClientLanguage] = useState('TypeScript')
    const [serverCode, setServerCode] = useState(TEMPLATES.FastAPI.server)
    const [clientCode, setClientCode] = useState(TEMPLATES.FastAPI.client.React.TypeScript)
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
    const [logs, setLogs] = useState<string[]>([])
    const [request, setRequest] = useState<any>({ method: 'get_user', params: { id: 1 }, id: 'rpc-1' })
    const [response, setResponse] = useState<any>(null)

    const getMockData = (lang: string) => {
        switch (lang) {
            case 'FastAPI':
                return {
                    method: 'get_user',
                    params: { id: 1 },
                    logMethod: 'get_user(1)',
                    result: { id: 1, name: "pRPC User" }
                }
            case 'Django':
                return {
                    method: 'greet',
                    params: { name: "pRPC" },
                    logMethod: "greet(name='pRPC')",
                    result: "Hello pRPC"
                }
            default:
                return {
                    method: 'add',
                    params: { a: 1, b: 2 },
                    logMethod: 'add(a=1, b=2)',
                    result: 3
                }
        }
    }

    const handleRun = async () => {
        setStatus('running')
        const mock = getMockData(serverLang)

        const rpcId = `rpc-${Math.floor(Math.random() * 1000)}`
        const currentRequest = { method: mock.method, params: mock.params, id: rpcId }
        setRequest(currentRequest)

        setLogs(['Initializing RPC bridge...', 'Encoding request...', 'Dispatching to Python server...'])

        setTimeout(() => {
            setLogs(prev => [
                ...prev,
                `${serverLang} adapter processing...`,
                `Executing procedure: ${mock.logMethod}`,
                `Result: ${JSON.stringify(mock.result)}`
            ])
            setResponse({ result: mock.result, error: null, id: rpcId })
            setStatus('success')
        }, 1500)
    }

    const handleReset = () => {
        setStatus('idle')
        setLogs([])
        setResponse(null)
        const mock = getMockData(serverLang)
        setRequest({ method: mock.method, params: mock.params, id: 'rpc-1' })
    }

    const updateClientCode = (framework: string, language: string) => {
        setClientCode(TEMPLATES[serverLang].client[framework][language]);
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
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 border border-edge bg-muted/20 text-[10px] font-bold uppercase tracking-widest font-mono text-fd-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Live Session
                        </div>
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
            <main className="flex-1 border-b border-edge bg-background">
                <div className="max-w-5xl mx-auto border-x border-edge flex flex-col min-h-[calc(100vh-theme(height.header)-16rem)]">
                    <div className="grid lg:grid-cols-2 divide-x divide-edge border-b border-edge bg-black overflow-hidden">
                        <div className="h-[300px] lg:h-[380px] flex flex-col">
                            <div className="px-4 py-2 border-b border-edge bg-muted/10 flex items-center justify-between shrink-0">
                                <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-fd-muted-foreground">Server Logic</span>
                                <FrameworkSelect
                                    label="Provider"
                                    value={serverLang}
                                    options={Object.keys(TEMPLATES)}
                                    onChange={(v: string) => {
                                        setServerLang(v);
                                        setServerCode(TEMPLATES[v].server);
                                        setClientCode(TEMPLATES[v].client[clientFramework][clientLanguage]);
                                        const mock = getMockData(v);
                                        setRequest({ method: mock.method, params: mock.params, id: 'rpc-1' });
                                        setResponse(null);
                                        setStatus('idle');
                                    }}
                                />
                            </div>
                            <div className="flex-1">
                                <PlaygroundEditor
                                    language="python"
                                    code={serverCode}
                                    onChange={(v: string | undefined) => setServerCode(v || '')}
                                />
                            </div>
                        </div>
                        <div className="h-[300px] lg:h-[380px] flex flex-col">
                            <div className="px-4 py-2 border-b border-edge bg-muted/10 flex items-center justify-between shrink-0">
                                <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-fd-muted-foreground">Client Implementation</span>
                                <div className="flex items-center gap-3">
                                    <FrameworkSelect
                                        value={clientFramework}
                                        options={['React', 'NextJS']}
                                        onChange={(v: string) => { setClientFramework(v); updateClientCode(v, clientLanguage); }}
                                    />
                                    <FrameworkSelect
                                        value={clientLanguage}
                                        options={['TypeScript', 'JavaScript']}
                                        onChange={(v: string) => { setClientLanguage(v); updateClientCode(clientFramework, v); }}
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <PlaygroundEditor
                                    language="typescript"
                                    code={clientCode}
                                    onChange={(v: string | undefined) => setClientCode(v || '')}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 divide-x divide-edge h-[300px]">
                        <div className="bg-muted/5">
                            <RequestFlow status={status} />
                        </div>
                        <div className="bg-background">
                            <Inspector request={request} response={response} logs={logs} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function FrameworkSelect({ label, value, options, onChange }: any) {
    return (
        <div className="flex items-center gap-2">
            {label && <span className="text-[9px] font-bold uppercase tracking-tight font-mono text-fd-muted-foreground/60">{label}:</span>}
            <Select.Root value={value} onValueChange={onChange}>
                <Select.Trigger className="inline-flex items-center gap-2 px-2 py-0.5 border border-edge bg-muted/20 text-[9px] font-bold uppercase tracking-widest font-mono hover:bg-muted/40 transition-colors outline-none">
                    <Select.Value />
                    <Select.Icon>
                        <ChevronDown className="w-2.5 h-2.5" />
                    </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                    <Select.Content className="overflow-hidden bg-background border border-edge shadow-xl z-50">
                        <Select.Viewport className="p-1">
                            {options.map((opt: string) => (
                                <Select.Item
                                    key={opt}
                                    value={opt}
                                    className="flex items-center px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest font-mono outline-none cursor-pointer hover:bg-muted"
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
