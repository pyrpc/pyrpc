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
export interface HttpLinkOptions {
    url: string;
}

export function httpBatchLink(options: HttpLinkOptions): Link;

export interface Link {
    readonly kind: 'terminating';
}

export interface ClientOptions {
    links: Link[];
}

export interface RpcError {
    code: number;
    message: string;
    data?: unknown;
}

export function createClient<T = any>(options: ClientOptions): T;
`;

const PYRPC_REACT_STUBS = `
export interface Link {
    readonly kind: 'terminating';
}

export interface ClientOptions {
    links: Link[];
}

export declare function httpLink(options: { url: string }): Link;

export declare function httpBatchLink(options: { url: string }): Link;

export declare function createReactClient<T = any>(options?: ClientOptions): any;

export declare function PyRPCProvider(props?: any): any;
`;

const PYRPC_VUE_STUBS = `
export interface Link {
    readonly kind: 'terminating';
}

export interface ClientOptions {
    links: Link[];
}

export declare function httpLink(options: { url: string }): Link;

export declare function httpBatchLink(options: { url: string }): Link;

export declare function createVueClient<T = any>(options?: ClientOptions): any;

export declare function createPyrpcVue<T = any>(options?: ClientOptions): any;
`;

const PYRPC_SVELTE_STUBS = `
export interface Link {
    readonly kind: 'terminating';
}

export interface ClientOptions {
    links: Link[];
}

export declare function httpLink(options: { url: string }): Link;

export declare function httpBatchLink(options: { url: string }): Link;

export declare function createSvelteClient<T = any>(options?: ClientOptions): any;
`;

const PYRPC_NEXT_STUBS = `
export interface Link {
    readonly kind: 'terminating';
}

export interface ClientOptions {
    links: Link[];
}

export declare function httpLink(options: { url: string }): Link;

export declare function httpBatchLink(options: { url: string }): Link;

export declare function createNextClient<T = any>(options?: ClientOptions): any;

export declare function HydrateClient(props?: any): any;
`;

export function PlaygroundEditor({ code, language, onChange, serverTypes, serverErrors }: PlaygroundEditorProps) {
    const { theme } = useTheme()
    const monacoRef = useRef<Monaco | null>(null)
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

    function ensureTypesModel(monaco: Monaco, types: string | undefined) {
        const typesPath = 'file:///node_modules/@pyrpc/types/index.d.ts'
        if (types) {
            monaco.languages.typescript.typescriptDefaults.addExtraLib(types, typesPath)
        }
    }

    function handleBeforeMount(monaco: Monaco) {
        if (language !== 'typescript') return

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ESNext,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.ESNext,
            jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            strict: true,
            noImplicitAny: false,
            strictNullChecks: false,
        })

        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
        })

        // Register @pyrpc package stubs as resolvable modules
        const stubs: [string, string][] = [
            ['@pyrpc/client', PYRPC_CLIENT_STUBS],
            ['@pyrpc/react', PYRPC_REACT_STUBS],
            ['@pyrpc/vue', PYRPC_VUE_STUBS],
            ['@pyrpc/svelte', PYRPC_SVELTE_STUBS],
            ['@pyrpc/next', PYRPC_NEXT_STUBS],
        ]
        for (const [pkg, source] of stubs) {
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
                source,
                `file:///node_modules/${pkg}/index.d.ts`,
            )
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

        // Same syntax voice as the hero/docs windows (lib/shiki-themes)
        monaco.editor.defineTheme('pyrpc-light', {
            base: 'vs',
            inherit: false,
            rules: [
                { token: 'comment', foreground: 'a1a1a1', fontStyle: 'italic' },
                { token: 'keyword', foreground: '171717' },
                { token: 'string', foreground: '047857' },
                { token: 'number', foreground: '047857' },
                { token: 'type', foreground: '737373', fontStyle: 'italic' },
                { token: 'type.identifier', foreground: '737373', fontStyle: 'italic' },
                { token: 'identifier', foreground: '404040' },
                { token: 'delimiter', foreground: 'a3a3a3' },
                { token: 'operator', foreground: '525252' },
            ],
            colors: {
                'editor.background': '#fafafa',
                'editor.foreground': '#404040',
                'editor.lineHighlightBackground': '#f0f0f0',
                'editor.selectionBackground': '#e5e5e5',
                'editorCursor.foreground': '#171717',
                'editorLineNumber.foreground': '#a3a3a3',
                'editorLineNumber.activeForeground': '#525252',
                'editorBracketHighlight.foreground1': '#a3a3a3',
                'editorBracketHighlight.foreground2': '#a3a3a3',
                'editorBracketHighlight.foreground3': '#a3a3a3',
                'editorBracketHighlight.foreground4': '#a3a3a3',
                'editorBracketHighlight.foreground5': '#a3a3a3',
                'editorBracketHighlight.foreground6': '#a3a3a3',
            }
        })

        monaco.editor.defineTheme('pyrpc-dark', {
            base: 'vs-dark',
            inherit: false,
            rules: [
                { token: 'comment', foreground: '6b6b6b', fontStyle: 'italic' },
                { token: 'keyword', foreground: 'e8e8e8' },
                { token: 'string', foreground: '97c983' },
                { token: 'number', foreground: '97c983' },
                { token: 'type', foreground: 'a3a3a3', fontStyle: 'italic' },
                { token: 'type.identifier', foreground: 'a3a3a3', fontStyle: 'italic' },
                { token: 'identifier', foreground: 'dcdcdc' },
                { token: 'delimiter', foreground: '7a7a7a' },
                { token: 'operator', foreground: 'c9c9c9' },
            ],
            colors: {
                'editor.background': '#000000',
                'editor.foreground': '#dcdcdc',
                'editor.lineHighlightBackground': '#0d0d0d',
                'editor.selectionBackground': '#262626',
                'editorCursor.foreground': '#ffffff',
                'editorLineNumber.foreground': '#404040',
                'editorLineNumber.activeForeground': '#7a7a7a',
                'editorBracketHighlight.foreground1': '#7a7a7a',
                'editorBracketHighlight.foreground2': '#7a7a7a',
                'editorBracketHighlight.foreground3': '#7a7a7a',
                'editorBracketHighlight.foreground4': '#7a7a7a',
                'editorBracketHighlight.foreground5': '#7a7a7a',
                'editorBracketHighlight.foreground6': '#7a7a7a',
            }
        })

        const activeTheme = theme === 'dark' ? 'pyrpc-dark' : 'pyrpc-light'
        monaco.editor.setTheme(activeTheme)
    }

    return (
        <div className="flex flex-col h-full bg-neutral-50 dark:bg-black overflow-hidden">
            <div className="flex-1">
                <Editor
                    height="100%"
                    language={language}
                    value={code}
                    path={language === 'typescript' ? '/model.ts' : undefined}
                    theme={theme === 'dark' ? 'pyrpc-dark' : 'pyrpc-light'}
                    onChange={onChange}
                    beforeMount={handleBeforeMount}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: false },
                        bracketPairColorization: { enabled: false },
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
