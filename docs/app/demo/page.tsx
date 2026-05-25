'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { createClient } from '@pyrpc/client'
import { PlaygroundEditor } from '@/components/playground/PlaygroundEditor'
import * as Select from '@radix-ui/react-select'
import { ChevronDown, RotateCcw, Server, Play, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useTheme } from 'next-themes'
import { fetchIntrospection, validateServerCode } from '@/lib/parsePythonTypes'
import type { ValidationError } from '@/lib/parsePythonTypes'

const TEMPLATES: any = {
    Core: {
        server: `from pyrpc_core import rpc, model\n\n@model\nclass User:\n    id: int\n    name: str\n\n@rpc\ndef get_user(id: int) -> User:\n    return User(id=id, name="Core User")`,
        client: `import { createClient } from "@pyrpc/client"\nimport type { Types } from "@pyrpc/types"\n\nconst client = createClient<Types>({ baseUrl: "/rpc" })\n\nconst user = await client.get_user(1);\n\nconsole.log(user.name);`
    },
    FastAPI: {
        server: `from fastapi import FastAPI\nfrom pyrpc_fastapi import mount_fastapi, rpc, model\n\napp = FastAPI()\n\n@model\nclass User:\n    id: int\n    name: str\n\n@rpc\ndef get_user(id: int) -> User:\n    return User(id=id, name="FastAPI User")\n\nmount_fastapi(app)`,
        client: `import { createClient } from "@pyrpc/client"\nimport type { Types } from "@pyrpc/types"\n\nconst client = createClient<Types>({ baseUrl: "/rpc" })\n\nconst user = await client.get_user(1);\n\nconsole.log(user.name);`
    },
    Flask: {
        server: `from flask import Flask\nfrom pyrpc_flask import mount_flask, rpc, model\n\napp = Flask(__name__)\n\n@model\nclass User:\n    id: int\n    name: str\n\n@rpc\ndef get_user(id: int) -> User:\n    return User(id=id, name="Flask User")\n\nmount_flask(app)`,
        client: `import { createClient } from "@pyrpc/client"\nimport type { Types } from "@pyrpc/types"\n\nconst client = createClient<Types>({ baseUrl: "/rpc" })\n\nconst user = await client.get_user(1);\n\nconsole.log(user.name);`
    }
}

export default function PlaygroundPage() {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])
    const isDark = mounted ? resolvedTheme === 'dark' : false
    const [serverLang, setServerLang] = useState('Core')
    const [serverCode, setServerCode] = useState(TEMPLATES.Core.server)
    const [clientCode, setClientCode] = useState(TEMPLATES.Core.client)
    const [serverTypes, setServerTypes] = useState<string>(() => fetchIntrospection(TEMPLATES.Core.server))
    const [serverStarting, setServerStarting] = useState(false)
    const [serverRunning, setServerRunning] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
    const [logs, setLogs] = useState<string[]>([])
    const [response, setResponse] = useState<any>(null)
    const [serverErrors, setServerErrors] = useState<ValidationError[]>([])

    const getServerStatus = () => {
        if (serverStarting) return { label: 'Starting...', cls: 'border-yellow-500/50 bg-yellow-500 animate-pulse' }
        if (serverRunning) return { label: 'Running', cls: 'bg-green-500' }
        if (serverError) return { label: 'Error', cls: 'bg-red-500' }
        return { label: 'Idle', cls: 'bg-gray-500' }
    }

    const handleStartServer = useCallback(() => {
        setServerStarting(true)
        setServerError(null)

        const validationErrors = validateServerCode(serverCode)
        setServerErrors(validationErrors)

        if (validationErrors.length > 0) {
            setServerError(`${validationErrors.length} validation error(s) found — fix them before starting`)
            setServerStarting(false)
            setServerRunning(false)
            return
        }

        try {
            const tsDeclarations = fetchIntrospection(serverCode)
            setServerTypes(tsDeclarations)
            setServerRunning(true)
        } catch (err: any) {
            setServerError(err?.message ?? 'Failed to start server')
            setServerRunning(false)
        } finally {
            setServerStarting(false)
        }
    }, [serverCode])

    const handleChangeFramework = useCallback((v: string) => {
        setServerLang(v)
        setServerCode(TEMPLATES[v].server)
        setServerErrors([])
        setServerTypes(fetchIntrospection(TEMPLATES[v].server))
        setServerRunning(true)
        setServerError(null)
        const newClientCode = TEMPLATES[v].client
        setClientCode(newClientCode)
    }, [])

    const parseClientCalls = (code: string): { method: string; params: any[] }[] => {
        const calls: { method: string; params: any[] }[] = [];
        const regex = /client\.(\w+)\(([^)]*)\)/g;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(code)) !== null) {
            const method = match[1];
            const argsStr = match[2].trim();
            let params: any[] = [];
            if (argsStr) {
                try {
                    if (argsStr.startsWith('{') && argsStr.endsWith('}')) {
                        const jsonStr = argsStr.replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
                        params = [JSON.parse(jsonStr)];
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
            calls.push({ method, params });
        }
        return calls;
    }

    /** Extract the full argument of a console.log() call, handling nested parens. */
    function extractLogArg(code: string, startIdx: number): string {
        let depth = 1
        let i = startIdx
        while (depth > 0 && i < code.length) {
            if (code[i] === '(') depth++
            else if (code[i] === ')') depth--
            if (depth > 0) i++
        }
        return code.slice(startIdx, i)
    }

    /** Resolve a simple JS expression against varMap (e.g. user.name → varMap['user']?.name). */
    function resolveExpr(expr: string, varMap: Record<string, any>): any {
        const parts = expr.split('.')
        let val: any = varMap[parts[0]]
        for (let i = 1; i < parts.length && val != null; i++) {
            val = val[parts[i]]
        }
        return val
    }

    const simulateConsoleLogs = (code: string, results: Record<string, any>): string[] => {
        // Strip comments and map variables
        const clean = code.replace(/\/\/.*$/gm, '')
        const varMap: Record<string, any> = {}
        const varRegex = /const\s+(\w+)\s*=\s*await\s+client\.(\w+)\(/g
        let vm: RegExpExecArray | null
        while ((vm = varRegex.exec(clean)) !== null) {
            varMap[vm[1]] = results[vm[2]]
        }

        const lines: string[] = []
        const logStartRegex = /console\.log\(/g
        let match: RegExpExecArray | null
        while ((match = logStartRegex.exec(clean)) !== null) {
            const arg = extractLogArg(clean, match.index + match[0].length)

            // Handle typeof(expr)
            const typeofMatch = arg.match(/^typeof\s*\((.+)\)$/)
            if (typeofMatch) {
                const val = resolveExpr(typeofMatch[1].trim(), varMap)
                lines.push(typeof val)
                continue
            }

            // Handle template literals: `text ${expr} more`
            if (arg.startsWith('`') && arg.endsWith('`')) {
                const interpolated = arg.replace(/\$\{(\w+(?:\.\w+)*)\}/g, (_, expr: string) => {
                    const val = resolveExpr(expr, varMap)
                    return val !== undefined ? String(val) : `$\{${expr}}`
                })
                lines.push(interpolated.replace(/^`|`$/g, ''))
                continue
            }

            // Handle plain strings
            if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
                lines.push(arg.slice(1, -1))
                continue
            }

            // Handle object access: user.name
            if (arg.includes('.')) {
                const val = resolveExpr(arg, varMap)
                lines.push(val != null ? String(val) : arg)
                continue
            }

            // Handle plain variable
            const val = varMap[arg]
            lines.push(val !== undefined ? String(val) : arg)
        }
        return lines
    }

    const handleRun = async () => {
        const calls = parseClientCalls(clientCode)
        if (calls.length === 0) {
            setLogs(['No client.function() calls found in the editor'])
            setStatus('error')
            return
        }
        setStatus('running')
        setLogs(['$ pyRPC bridge active', `$ Encoding ${serverLang} source...`, '$ Dispatching to sandbox...'])

        try {
            const client = createClient({
                baseUrl: '/api/sandbox',
                headers: {
                    'X-Server-Code': btoa(unescape(encodeURIComponent(serverCode)))
                }
            });
            const allResults: Record<string, any> = {};
            for (const call of calls) {
                const result = await (client as any)[call.method](...call.params);
                allResults[call.method] = result;
            }
            const consoleLines = simulateConsoleLogs(clientCode, allResults)
            setLogs((prev: string[]) => [...prev, ...consoleLines])
            setResponse({ result: allResults, error: null })
            setStatus('success')
        } catch (err: any) {
            const msg = err?.message ?? String(err);
            setLogs((prev: string[]) => [...prev, `✗ Error: ${msg}`]);
            setResponse({ result: null, error: { message: msg } })
            setStatus('error');
        }
    }

    const handleReset = () => {
        setClientCode(TEMPLATES[serverLang].client)
        setServerCode(TEMPLATES[serverLang].server)
        setServerErrors([])
        setServerTypes(fetchIntrospection(TEMPLATES[serverLang].server))
        setServerRunning(true)
        setServerError(null)
        setStatus('idle')
        setLogs([])
        setResponse(null)
    }

    useEffect(() => {
        setServerErrors(validateServerCode(serverCode))
    }, [serverCode])

    const serverStatus = getServerStatus()

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-background overflow-hidden mb-4 mx-4">
            {/* Header with Reset */}
            <div className="max-w-5xl mx-auto w-full shrink-0 border-b border-edge">
                <div className="flex items-center justify-between px-4 py-3">
                    <h1 className="text-sm font-bold tracking-tight uppercase font-mono opacity-30">Interactive Playground</h1>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] font-mono border border-edge bg-fd-secondary/50 hover:bg-fd-secondary/80 transition-colors text-fd-secondary-foreground"
                    >
                        <RotateCcw className="w-2.5 h-2.5" />
                        Reset
                    </button>
                </div>
            </div>

            {/* Editors */}
            <div className="flex-1 min-h-0 flex flex-col max-w-5xl w-full mx-auto border-x border-edge overflow-hidden">
                <div className="flex-[13] min-h-0 grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-edge overflow-hidden">
                    <div className="flex flex-col overflow-hidden">
                        <div className="px-4 py-2 border-b border-edge bg-fd-muted/30 flex items-center justify-between shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono text-fd-foreground">Server Logic</span>
                            <div className="flex items-center gap-3">
                                <FrameworkSelect
                                    label="Provider"
                                    value={serverLang}
                                    options={Object.keys(TEMPLATES)}
                                    onChange={handleChangeFramework}
                                />
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <PlaygroundEditor
                                language="python"
                                code={serverCode}
                                onChange={(v: string | undefined) => setServerCode(v || '')}
                                serverErrors={serverErrors}
                            />
                            <div className="absolute bottom-3 left-3 z-10">
                                <span className="text-[8px] font-mono uppercase tracking-[0.15em] text-fd-muted-foreground/50">Step 1: Write server code &amp; Start</span>
                            </div>
                            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
                                {serverError && (
                                    <span className="text-[9px] font-mono text-red-400">{serverError}</span>
                                )}
                                <div className="flex items-center gap-1.5 px-2 py-1 border border-edge bg-muted/30 text-[9px] font-bold uppercase tracking-[0.15em] font-mono">
                                    <div className={cn('w-1.5 h-1.5 rounded-full', serverStatus.cls)} />
                                    {serverStatus.label}
                                </div>
                                <button
                                    onClick={handleStartServer}
                                    disabled={serverStarting}
                                    className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] font-mono border border-edge bg-fd-secondary hover:bg-fd-secondary/80 transition-colors text-fd-secondary-foreground disabled:opacity-50 shadow-sm"
                                >
                                    {serverStarting ? (
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    ) : (
                                        <Server className="w-2.5 h-2.5" />
                                    )}
                                    {serverStarting ? 'Starting...' : 'Start'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <div className="px-4 py-2 border-b border-edge bg-fd-muted/30 flex items-center justify-between shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono text-fd-foreground">Client Implementation</span>
                            <div className="flex items-center gap-3">
                                <div className="px-2 py-0.5 border border-edge bg-fd-secondary/30 text-[9px] font-bold uppercase tracking-[0.2em] font-mono text-fd-muted-foreground select-none">
                                    TypeScript
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <PlaygroundEditor
                                language="typescript"
                                code={clientCode}
                                onChange={(v: string | undefined) => setClientCode(v || '')}
                                serverTypes={serverTypes}
                            />
                            <div className="absolute bottom-3 left-3 z-10">
                                <span className="text-[8px] font-mono uppercase tracking-[0.15em] text-fd-muted-foreground/50">Step 2: Write client code &amp; Run</span>
                            </div>
                            <div className="absolute bottom-3 right-3 z-10">
                                <button
                                    onClick={handleRun}
                                    disabled={status === 'running'}
                                    className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] font-mono border border-edge bg-green-600/20 hover:bg-green-600/30 text-green-400 transition-colors disabled:opacity-30 shadow-sm"
                                >
                                    {status === 'running' ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Play className="w-3 h-3" />
                                    )}
                                    {status === 'running' ? 'Running...' : 'Run'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terminal */}
                <div className={cn(
                    'flex-[7] min-h-0 border-t border-edge flex flex-col',
                    isDark ? 'bg-[#090909]' : 'bg-[#f5f5f5]'
                )}>
                    <div className={cn(
                        'flex items-center gap-2 px-4 py-1.5 border-b shrink-0',
                        isDark ? 'border-[#1a1a2e]' : 'border-gray-200'
                    )}>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5555]/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ffaa33]/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#33cc66]/60" />
                        </div>
                        <span className={cn(
                            'text-[10px] font-bold uppercase tracking-wider font-mono ml-2',
                            isDark ? 'text-[#5a6478]' : 'text-[#6b7280]'
                        )}>Client Output</span>
                        <span className={cn(
                            'text-[9px] font-mono ml-auto px-2 py-0.5 border border-edge',
                            status === 'running' ? 'border-yellow-500/50' : 
                            status === 'success' ? 'border-green-500/50' :
                            status === 'error' ? 'border-red-500/50' :
                            isDark ? 'border-[#1a1a2e]' : 'border-gray-200'
                        )}>
                            {status === 'running' ? 'RUNNING' : 
                             status === 'success' ? 'SUCCESS' : 
                             status === 'error' ? 'ERROR' : 'READY'}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto px-3 pt-3 pb-0 font-mono text-[11px] leading-relaxed">
                        {logs.length === 0 && status === 'idle' && (
                            <div className={isDark ? 'text-[#2d3347]' : 'text-[#9ca3af]'}>
                                <span className="text-[#33cc66]">$</span> pyRPC sandbox ready. Click Run to execute.
                            </div>
                        )}
                        {logs.map((line, i) => (
                            <div key={i} className={cn(
                                'whitespace-pre-wrap',
                                line.startsWith('✗') && 'text-[#ff5555]',
                                line.startsWith('✓') && 'text-[#33cc66]',
                                line.startsWith('$') && 'text-[#5a6478]',
                                !line.startsWith('✗') && !line.startsWith('✓') && !line.startsWith('$') && (isDark ? 'text-[#c9d1d9]' : 'text-[#374151]')
                            )}>
                                <span className="text-[#33cc66] mr-2">$</span>
                                {line.replace(/^\$\s*/, '')}
                            </div>
                        ))}
                        {response?.error && (
                            <div className={cn(
                                'mt-2 pt-2 border-t',
                                isDark ? 'border-[#1a1a2e]' : 'border-gray-200'
                            )}>
                                <div className={cn(
                                    'text-[9px] uppercase tracking-wider mb-1',
                                    isDark ? 'text-[#5a6478]' : 'text-[#6b7280]'
                                )}>Error</div>
                                <pre className="text-[#ff5555]">{response.error.message}</pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>
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
