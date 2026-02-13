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
        <div className="flex flex-col h-full bg-background overflow-hidden">
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
