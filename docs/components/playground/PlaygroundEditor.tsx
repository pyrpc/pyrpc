'use client'

import React, { useRef, useEffect } from 'react'
import Editor, { OnMount, Monaco } from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import type { ValidationError } from '@/lib/parsePythonTypes'

interface PlaygroundEditorProps {
    code: string
    language: 'python' | 'typescript'
    onChange?: (value: string | undefined) => void
    label?: string
    serverTypes?: string
    serverErrors?: ValidationError[]
}

const PYRPC_CLIENT_STUBS = `
export interface ClientOptions {
    baseUrl?: string;
    headers?: Record<string, string> | (() => Promise<Record<string, string>>);
}

export interface RpcError {
    code: number;
    message: string;
    data?: unknown;
}

export function createClient<T = any>(options?: ClientOptions): T;
`;

export function PlaygroundEditor({ code, language, onChange, serverTypes, serverErrors }: PlaygroundEditorProps) {
    const { theme } = useTheme()
    const monacoRef = useRef<Monaco | null>(null)
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

    function ensureTypesModel(monaco: Monaco, types: string | undefined) {
        const typesUri = monaco.Uri.parse('/node_modules/@pyrpc/types/index.d.ts')
        const existing = monaco.editor.getModel(typesUri)
        if (existing) {
            if (types) {
                existing.setValue(types)
            } else {
                existing.dispose()
            }
            return
        }
        if (types) {
            monaco.editor.createModel(types, 'typescript', typesUri)
        }
    }

    function handleBeforeMount(monaco: Monaco) {
        if (language !== 'typescript') return

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ESNext,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.ESNext,
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            strict: true,
            noImplicitAny: true,
            strictNullChecks: true,
        })

        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
        })

        // Create @pyrpc/client stubs model
        const clientUri = monaco.Uri.parse('/node_modules/@pyrpc/client/index.d.ts')
        if (!monaco.editor.getModel(clientUri)) {
            monaco.editor.createModel(PYRPC_CLIENT_STUBS, 'typescript', clientUri)
        }

        // Create @pyrpc/types model if types provided
        ensureTypesModel(monaco, serverTypes)
    }

    useEffect(() => {
        const monaco = monacoRef.current
        if (!monaco) return
        ensureTypesModel(monaco, serverTypes)
    }, [serverTypes])

    useEffect(() => {
        const monaco = monacoRef.current
        const editor = editorRef.current
        if (!monaco || !editor) return
        const model = editor.getModel()
        if (!model) return
        if (language !== 'python') return
        if (!serverErrors || serverErrors.length === 0) {
            monaco.editor.setModelMarkers(model, 'validation', [])
            return
        }
        const markers = serverErrors.map((err) => ({
            severity: monaco.MarkerSeverity.Error,
            message: err.message,
            startLineNumber: err.line,
            startColumn: err.column,
            endLineNumber: err.line,
            endColumn: err.column + 20,
        }))
        monaco.editor.setModelMarkers(model, 'validation', markers)
    }, [serverErrors, language])

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        monacoRef.current = monaco
        editorRef.current = editor

        monaco.editor.defineTheme('pyrpc-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '5a6478', fontStyle: 'italic' },
                { token: 'keyword', foreground: 'c792ea' },
                { token: 'string', foreground: 'c3e88d' },
                { token: 'number', foreground: 'f78c6c' },
                { token: 'type', foreground: '89ddff' },
            ],
            colors: {
                'editor.background': '#090909',
                'editor.lineHighlightBackground': '#111111',
                'editor.selectionBackground': '#1e3a5f',
                'editorCursor.foreground': '#82aaff',
                'editorLineNumber.foreground': '#2d3347',
                'editorLineNumber.activeForeground': '#4a5578',
            }
        })

        const activeTheme = theme === 'dark' ? 'pyrpc-dark' : 'vs'
        monaco.editor.setTheme(activeTheme)
    }

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            <div className="flex-1">
                <Editor
                    height="100%"
                    language={language}
                    value={code}
                    path={language === 'typescript' ? '/model.ts' : undefined}
                    theme={theme === 'dark' ? 'pyrpc-dark' : 'vs'}
                    onChange={onChange}
                    beforeMount={handleBeforeMount}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: 'var(--font-mono), "JetBrains Mono", "Fira Code", monospace',
                        fontLigatures: true,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 16, bottom: 32 },
                        glyphMargin: false,
                        folding: false,
                        lineDecorationsWidth: 10,
                        lineNumbersMinChars: 3,
                        suggestOnTriggerCharacters: true,
                        quickSuggestions: {
                            other: true,
                            comments: false,
                            strings: false,
                        },
                        parameterHints: { enabled: true },
                        wordBasedSuggestions: 'currentDocument',
                    }}
                />
            </div>
        </div>
    )
}
