'use client'

import React, { useState, useEffect } from 'react'
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
    const parseClientCode = (code: string) => {
        const match = code.match(/client\.(\w+)\(([^)]*)\)/);
        if (!match) return null;

        const method = match[1];
        const argsStr = match[2].trim();
        let params: any = [];

        if (argsStr) {
            try {
                // Try to handle simple positional args or a single object arg
                if (argsStr.startsWith('{') && argsStr.endsWith('}')) {
                    // Very rough 'convert to JSON' for simple objects
                    const jsonStr = argsStr.replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
                    params = JSON.parse(jsonStr);
                } else {
                    params = argsStr.split(',').map(s => {
                        const t = s.trim();
                        if (!isNaN(Number(t))) return Number(t);
                        if (t.startsWith('"') || t.startsWith("'")) return t.slice(1, -1);
                        return t;
                    });
                }
            } catch {
                params = [argsStr];
            }
        }
        return { method, params };
    }

    const parseServerCode = (code: string, methodName: string, reqParams: any) => {
        // 1. Extract parameter names from the function signature
        // async def get_user(id: int) -> User:
        const sigRegex = new RegExp(`(?:async\\s+)?def\\s+${methodName}\\s*\\((.*?)\\)`, 'm');
        const sigMatch = code.match(sigRegex);
        const paramNames: string[] = [];

        if (sigMatch) {
            const paramsStr = sigMatch[1].trim();
            if (paramsStr) {
                paramsStr.split(',').forEach((p: string) => {
                    const name = p.split(':')[0].trim();
                    if (name) paramNames.push(name);
                });
            }
        }

        // 2. Map request params (positional or named) to names
        const varMap: Record<string, any> = {};
        if (Array.isArray(reqParams)) {
            paramNames.forEach((name: string, i: number) => {
                if (i < reqParams.length) varMap[name] = reqParams[i];
            });
        } else if (typeof reqParams === 'object' && reqParams !== null) {
            Object.assign(varMap, reqParams);
        }

        // 3. Look for the return statement
        const returnRegex = new RegExp(`(?:async\\s+)?def\\s+${methodName}\\s*\\(.*?\\).*?:[\\s\\S]*?return\\s+(.*)`, 'm');
        const match = code.match(returnRegex);
        if (!match) return null;

        let returnExpr = match[1].trim();
        // Remove trailing comments or logic on the same line
        returnExpr = returnExpr.split('#')[0].trim();
        if (returnExpr.endsWith(')')) {
            // Check if it's a multiline model call or nested
        }

        // 4. Resolve the return expression
        // Handling User(id=id, name="pRPC User")
        if (returnExpr.includes('(')) {
            const modelMatch = returnExpr.match(/\w+\((.*)\)/);
            if (modelMatch) {
                const attrs: any = {};
                modelMatch[1].split(',').forEach((attr: string) => {
                    const parts = attr.split('=').map(s => s.trim());
                    if (parts.length === 2) {
                        const [k, v] = parts;
                        if (!isNaN(Number(v))) attrs[k] = Number(v);
                        else if (v.startsWith('"') || v.startsWith("'")) attrs[k] = v.slice(1, -1);
                        else if (varMap.hasOwnProperty(v)) attrs[k] = varMap[v];
                        else attrs[k] = v;
                    }
                });
                return attrs;
            }
        }

        // Handling {"id": id, 'name': name}
        if (returnExpr.startsWith('{') && returnExpr.endsWith('}')) {
            const content = returnExpr.slice(1, -1);
            const attrs: any = {};
            content.split(',').forEach((pair: string) => {
                const parts = pair.split(':').map(s => s.trim());
                if (parts.length === 2) {
                    let [k, v] = parts;
                    // Clean keys: "id" -> id
                    if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) k = k.slice(1, -1);

                    if (!isNaN(Number(v))) attrs[k] = Number(v);
                    else if (v.startsWith('"') || v.startsWith("'")) attrs[k] = v.slice(1, -1);
                    else if (varMap.hasOwnProperty(v)) attrs[k] = varMap[v];
                    else attrs[k] = v;
                }
            });
            return attrs;
        }

        // Handling f"Hello {name}"
        if (returnExpr.startsWith('f"') || returnExpr.startsWith("f'")) {
            const template = returnExpr.slice(2, -1);
            return template.replace(/{(\w+)}/g, (_, p) => varMap[p] ?? p);
        }

        // Handling literals or variables
        if (!isNaN(Number(returnExpr))) return Number(returnExpr);
        if (returnExpr.startsWith('"') || returnExpr.startsWith("'")) return returnExpr.slice(1, -1);
        if (varMap.hasOwnProperty(returnExpr)) return varMap[returnExpr];

        return returnExpr;
    }

    const getMockData = (method: string, params: any, code: string) => {
        // First try to parse the actual server code
        const dynamicResult = parseServerCode(code, method, params);

        const paramsDisplay = Array.isArray(params)
            ? params.map((p: any) => typeof p === 'string' ? `'${p}'` : p).join(', ')
            : JSON.stringify(params);

        if (dynamicResult !== null) {
            return {
                logMethod: `${method}(${paramsDisplay})`,
                result: dynamicResult
            }
        }

        // Fallback to template results if parsing fails or return is too complex
        switch (method) {
            case 'get_user':
                const id = Array.isArray(params) ? params[0] : (params?.id || 1);
                return {
                    logMethod: `get_user(id=${id})`,
                    result: { id: Number(id), name: "pRPC User" }
                }
            case 'greet':
                const name = Array.isArray(params) ? params[0] : (params?.name || "pRPC");
                return {
                    logMethod: `greet(name='${name}')`,
                    result: `Hello ${name}`
                }
            case 'add':
                const valA = Array.isArray(params) ? params[0] : params?.a;
                const valB = Array.isArray(params) ? params[1] : params?.b;
                const a = isNaN(Number(valA)) ? 0 : Number(valA);
                const b = isNaN(Number(valB)) ? 0 : Number(valB);
                return {
                    logMethod: `add(a=${a}, b=${b})`,
                    result: a + b
                }
            default:
                return {
                    logMethod: `${method}(${paramsDisplay})`,
                    result: { status: "success", data: "Received custom RPC call" }
                }
        }
    }

    const [request, setRequest] = useState<any>(() => {
        const extracted = parseClientCode(TEMPLATES.FastAPI.client.React.TypeScript) || { method: 'get_user', params: [1] };
        return { method: extracted.method, params: extracted.params, id: 'rpc-1' };
    });
    const [response, setResponse] = useState<any>(null)

    useEffect(() => {
        const extracted = parseClientCode(clientCode)
        if (extracted) {
            setRequest((prev: any) => ({ ...prev, method: extracted.method, params: extracted.params }))
        }
    }, [clientCode])

    const handleRun = async () => {
        setStatus('running')

        // 1. Extract call from client code
        const extracted = parseClientCode(clientCode) || { method: 'add', params: [1, 2] }

        // 2. Extract signature from server code to map positional args to named ones
        const sigRegex = new RegExp(`(?:async\\s+)?def\\s+${extracted.method}\\s*\\((.*?)\\)`, 'm');
        const sigMatch = serverCode.match(sigRegex);
        const paramNames: string[] = [];
        if (sigMatch && sigMatch[1].trim()) {
            sigMatch[1].split(',').forEach((p: string) => {
                const name = p.split(':')[0].trim();
                if (name && name !== 'self' && name !== 'cls') paramNames.push(name);
            });
        }

        // 3. Map positional args to named params (mimics TS codegen behavior)
        let wireParams: any = {};
        if (Array.isArray(extracted.params)) {
            paramNames.forEach((name: string, i: number) => {
                if (i < (extracted.params as any[]).length) {
                    wireParams[name] = (extracted.params as any[])[i];
                }
            });
        } else {
            wireParams = extracted.params;
        }

        const mock = getMockData(extracted.method, wireParams, serverCode)

        // 4. Use codegen-style ID
        const rpcId = Math.random().toString(36).substring(7);
        const currentRequest = { method: extracted.method, params: wireParams, id: rpcId }
        setRequest(currentRequest)

        setLogs(['Initializing RPC bridge...', 'Encoding request...', 'Dispatching to Python server...'])

        setTimeout(() => {
            setLogs((prev: string[]) => [
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
        const extracted = parseClientCode(clientCode) || { method: 'get_user', params: [1] }
        setRequest({ method: extracted.method, params: extracted.params, id: 'rpc-1' })
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
                    <div className="flex flex-col items-start gap-3">
                        <div className="flex">
                            <span className="flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-mono font-bold tracking-[0.2em] bg-fd-primary text-fd-primary-foreground uppercase shadow-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Currently in Beta Preview
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tighter uppercase leading-none">
                            Interactive<br />Playground
                        </h1>
                    </div>
                    <p className="max-w-2xl text-fd-muted-foreground uppercase tracking-[0.1em] font-mono text-xs leading-relaxed">
                        Experiment with pRPC in real-time. Define your server logic in Python and see how it reflects in your client.
                    </p>
                </div>
            </section>

            {/* Toolbar */}
            <div className="sticky top-[--fd-header-height] z-20 w-full border-b border-edge bg-background/80 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 border border-edge bg-muted/30 text-[10px] font-bold uppercase tracking-[0.2em] font-mono text-fd-foreground">
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
                            className="px-6 py-2 uppercase tracking-[0.2em] font-mono text-xs font-bold gap-2 flex items-center"
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
                    <div className="grid lg:grid-cols-2 divide-x divide-edge border-b border-edge bg-fd-card/50 overflow-hidden">
                        <div className="h-[300px] lg:h-[380px] flex flex-col">
                            <div className="px-4 py-2 border-b border-edge bg-fd-muted/30 flex items-center justify-between shrink-0">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono text-fd-foreground">Server Logic</span>
                                <FrameworkSelect
                                    label="Provider"
                                    value={serverLang}
                                    options={Object.keys(TEMPLATES)}
                                    onChange={(v: string) => {
                                        setServerLang(v);
                                        setServerCode(TEMPLATES[v].server);
                                        const newClientCode = TEMPLATES[v].client[clientFramework][clientLanguage];
                                        setClientCode(newClientCode);
                                        const extracted = parseClientCode(newClientCode) || { method: 'get_user', params: { id: 1 } };
                                        setRequest({ method: extracted.method, params: extracted.params, id: 'rpc-1' });
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
                            <div className="px-4 py-2 border-b border-edge bg-fd-muted/30 flex items-center justify-between shrink-0">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono text-fd-foreground">Client Implementation</span>
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
            {label && <span className="text-[9px] font-bold uppercase tracking-[0.2em] font-mono text-fd-muted-foreground">{label}:</span>}
            <Select.Root value={value} onValueChange={onChange}>
                <Select.Trigger className="inline-flex items-center gap-2 px-2 py-0.5 border border-edge bg-fd-secondary text-[9px] font-bold uppercase tracking-[0.2em] font-mono hover:bg-fd-secondary/80 transition-colors outline-none text-fd-secondary-foreground shadow-sm">
                    <Select.Value />
                    <Select.Icon>
                        <ChevronDown className="w-2.5 h-2.5 opacity-50" />
                    </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                    <Select.Content className="overflow-hidden bg-fd-popover border border-edge shadow-xl z-50 min-w-[var(--radix-select-trigger-width)]">
                        <Select.Viewport className="p-1">
                            {options.map((opt: string) => (
                                <Select.Item
                                    key={opt}
                                    value={opt}
                                    className="flex items-center px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] font-mono outline-none cursor-pointer text-fd-popover-foreground data-[highlighted]:bg-fd-accent data-[highlighted]:text-fd-accent-foreground data-[state=checked]:bg-fd-primary data-[state=checked]:text-fd-primary-foreground transition-colors"
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
