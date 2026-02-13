'use client'

import React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/cn'

interface InspectorProps {
    request: any
    response: any
    logs: string[]
}

export function Inspector({ request, response, logs }: InspectorProps) {
    return (
        <div className="flex flex-col h-full border border-edge bg-background overflow-hidden">
            <Tabs.Root defaultValue="request" className="flex flex-col h-full">
                <Tabs.List className="flex border-b border-edge bg-muted/30">
                    <Tabs.Trigger
                        value="request"
                        className={cn(
                            "px-6 py-3 text-[10px] font-bold uppercase tracking-widest font-mono transition-colors",
                            "data-[state=active]:bg-background data-[state=active]:border-r data-[state=active]:border-edge",
                            "hover:text-foreground text-fd-muted-foreground"
                        )}
                    >
                        Request
                    </Tabs.Trigger>
                    <Tabs.Trigger
                        value="response"
                        className={cn(
                            "px-6 py-3 text-[10px] font-bold uppercase tracking-widest font-mono transition-colors",
                            "data-[state=active]:bg-background data-[state=active]:border-x data-[state=active]:border-edge",
                            "hover:text-foreground text-fd-muted-foreground"
                        )}
                    >
                        Response
                    </Tabs.Trigger>
                    <Tabs.Trigger
                        value="logs"
                        className={cn(
                            "px-6 py-3 text-[10px] font-bold uppercase tracking-widest font-mono transition-colors",
                            "data-[state=active]:bg-background data-[state=active]:border-x data-[state=active]:border-edge",
                            "hover:text-foreground text-fd-muted-foreground"
                        )}
                    >
                        Logs
                    </Tabs.Trigger>
                </Tabs.List>

                <div className="flex-1 overflow-auto p-4 font-mono text-xs">
                    <Tabs.Content value="request" className="outline-none h-full">
                        <pre className="text-blue-400 dark:text-blue-300">
                            {JSON.stringify(request, null, 2)}
                        </pre>
                    </Tabs.Content>
                    <Tabs.Content value="response" className="outline-none h-full">
                        <pre className="text-green-400 dark:text-green-300">
                            {JSON.stringify(response, null, 2)}
                        </pre>
                    </Tabs.Content>
                    <Tabs.Content value="logs" className="outline-none h-full">
                        <div className="space-y-1">
                            {logs.map((log, i) => (
                                <div key={i} className="text-fd-muted-foreground border-l border-edge pl-3">
                                    <span className="text-fd-muted-foreground/50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                    {log}
                                </div>
                            ))}
                            {logs.length === 0 && <div className="text-fd-muted-foreground/50 italic">No logs yet...</div>}
                        </div>
                    </Tabs.Content>
                </div>
            </Tabs.Root>
        </div>
    )
}
