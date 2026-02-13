'use client'

import React from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import { useTheme } from 'next-themes'

interface PlaygroundEditorProps {
    code: string
    language: 'python' | 'typescript'
    onChange?: (value: string | undefined) => void
    label?: string
}

export function PlaygroundEditor({ code, language, onChange, label }: PlaygroundEditorProps) {
    const { theme } = useTheme()

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        // Custom theme configuration if needed
        monaco.editor.defineTheme('prpc-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#000000',
                'editor.lineHighlightBackground': '#111111',
            }
        })

        monaco.editor.setTheme(theme === 'dark' ? 'prpc-dark' : 'vs')
    }

    return (
        <div className="flex flex-col h-full border border-edge bg-background overflow-hidden">
            {label && (
                <div className="px-4 py-2 border-b border-edge bg-muted/30 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-fd-muted-foreground">
                        {label}
                    </span>
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-edge" />
                        <div className="w-2 h-2 rounded-full bg-edge" />
                        <div className="w-2 h-2 rounded-full bg-edge" />
                    </div>
                </div>
            )}
            <div className="flex-1">
                <Editor
                    height="100%"
                    language={language}
                    value={code}
                    theme={theme === 'dark' ? 'vs-dark' : 'vs'}
                    onChange={onChange}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: 'var(--font-mono)',
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 16 },
                        glyphMargin: false,
                        folding: false,
                        lineDecorationsWidth: 10,
                        lineNumbersMinChars: 3,
                    }}
                />
            </div>
        </div>
    )
}
