"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Github, 
  Check, 
  Copy, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Search, 
  Package, 
  Activity, 
  Grid2X2 
} from 'lucide-react';
import { cn } from '@/lib/cn';

function QuickstartStep({ step, label, tag, title, description, code, codeFile, terminal, command, copiedStep, onCopy }: {
  step: number;
  label: string;
  tag: string;
  title: string;
  description: string;
  code: React.ReactNode;
  codeFile: string;
  terminal: React.ReactNode;
  command?: string;
  copiedStep?: number | null;
  onCopy?: (text: string, step: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "mb-32 last:mb-0 transition-all duration-700 ease-out max-w-[1000px] mx-auto",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      )}
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <span
          style={{
            fontFamily: '"Geist Mono", "Geist Mono Fallback"',
            fontSize: '11px',
            fontWeight: 400,
            lineHeight: '16.5px',
            color: 'lab(67.9697 -3.85058 -3.02824)'
          }}
        >
          0{step}
        </span>
        <div className="h-px w-6 bg-fd-border" />
        <span
          className="uppercase tracking-widest"
          style={{
            fontFamily: '"Geist Mono", "Geist Mono Fallback"',
            fontSize: '11px',
            fontWeight: 400,
            lineHeight: '16.5px',
            color: 'lab(67.9697 -3.85058 -3.02824)'
          }}
        >
          {label}
        </span>
        <span className="text-sky-400 text-[10px] uppercase tracking-widest font-bold">{tag}</span>
      </div>

      <h3 className="text-2xl md:text-3xl font-bold tracking-tighter text-fd-foreground mb-2">
        {title}
      </h3>
      <p className="text-fd-foreground/50 text-[15px] leading-relaxed mb-8 max-w-xl font-sans">
        {description}
      </p>

      {/* IDE Panel */}
      <div className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-indigo-500/[0.06] blur-[100px] rounded-full pointer-events-none" />
        <div className="relative w-full border border-neutral-800 rounded-lg bg-[#0c0c0c] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.7)] overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center px-4 py-2.5 bg-[#161616] border-b border-neutral-800">
            <div className="flex gap-1.5 mr-4">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            </div>
            <span className="text-[11px] font-mono text-neutral-500 tracking-tight">~/projects/pyrpc · {label.toLowerCase()}</span>
          </div>

          {/* Tab bar */}
          <div className="flex items-center bg-[#111111] border-b border-neutral-800 overflow-x-auto">
            <div className="px-4 py-2 text-[10px] font-mono bg-[#0c0c0c] text-neutral-300 border-r border-neutral-800 cursor-default select-none">
              {codeFile}
            </div>
            <div className="px-4 py-2 text-[10px] font-mono text-neutral-600 border-r border-neutral-800 cursor-default select-none">
              terminal
            </div>
            <div className="flex-1" />
          </div>

          {/* Main content: code + terminal split */}
          <div className="flex min-h-[320px]">
            {/* Code editor panel */}
            <div className="flex-1 bg-[#0e0e0e] p-5 font-mono text-[12px] leading-[1.7] overflow-hidden border-r border-neutral-800">
              {code}
            </div>

            {/* Terminal panel */}
            <div className="w-[45%] bg-[#0a0a0a] p-4 font-mono text-[11px] leading-[1.7] overflow-hidden flex flex-col">
              <div className="flex-1">
                {terminal}
              </div>
              {command && onCopy && (
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-800 group/cmd">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 overflow-hidden min-w-0">
                    <span className="text-emerald-500/60 shrink-0">$</span>
                    <code className="truncate">{command}</code>
                  </div>
                  <button onClick={() => onCopy(command, step)} className="text-neutral-600 hover:text-white transition-colors shrink-0 ml-2">
                    {copiedStep === step ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#161616] border-t border-neutral-800 text-[10px] font-mono select-none">
            <div className="flex items-center gap-4 text-neutral-600">
              <span className="text-emerald-500">●</span>
              <span>main</span>
              <span className="text-neutral-700">|</span>
              <span>pyrpc</span>
            </div>
            <div className="flex items-center gap-4 text-neutral-600">
              <span>UTF-8</span>
              <span className="text-neutral-700">|</span>
              <span>{step <= 2 ? 'Python 3.12' : 'Node 20'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [manager, setManager] = useState<'uv' | 'pip' | 'npm' | 'pnpm' | 'bun'>('uv');
  const [copied, setCopied] = useState(false);
  const [codeTab, setCodeTab] = useState<'server' | 'client'>('server');
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  useEffect(() => {
    if (codeTab === 'server') {
      setManager('uv');
    } else {
      setManager('npm');
    }
  }, [codeTab]);

  const command = manager === 'uv' ? 'uv add pyrpc-core' :
    manager === 'pip' ? 'pip install pyrpc-core' :
    manager === 'npm' ? 'npm install @pyrpc/client' :
    manager === 'pnpm' ? 'pnpm add @pyrpc/client' :
    'bun add @pyrpc/client';


  const copyQuickstart = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="text-fd-foreground font-sans min-h-screen overflow-x-hidden">
      {/* Subtle radial glow top center */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(250,250,249,0.04)_0%,transparent_100%)]" />

      <div className="px-6 md:px-12 lg:px-20">
        {/* Hero Section */}
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 w-full pt-20 md:pt-32 pb-40">
 
             {/* Left Column */}
             <div className="flex flex-col items-start gap-10 max-w-[480px]">

              {/* Beta Pill */}
              <div
                className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-fd-border bg-neutral-100 dark:bg-white/[0.03]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                <span className="text-neutral-600 dark:text-neutral-400 font-mono text-[11px] uppercase tracking-widest">
                  Public Beta
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-[0.88] tracking-tighter text-fd-foreground">
                <span className="block">Python APIs.</span>
                <span className="block whitespace-nowrap text-fd-muted-foreground/50">Typed end-to-end.</span>
              </h1>

              {/* Description */}
              <p
                className="max-w-xl text-neutral-600 dark:text-neutral-400 text-sm md:text-base leading-relaxed"
                style={{ fontFamily: 'Geist, "Geist Fallback", sans-serif' }}
              >
                Define procedures in Python. Consume them in TypeScript with full type safety -- without schema drift or code generation.
              </p>

              <div className="flex items-center gap-4 flex-wrap mt-2">
                {/* Get Started */}
                <Link href="/docs/get-started/installation">
                  <button
                    className="px-6 py-2.5 bg-fd-foreground text-fd-background dark:text-black font-medium text-[13px] tracking-tight hover:opacity-90 transition-all active:scale-[0.98] rounded-md w-fit"
                  >
                    Get Started
                  </button>
                </Link>

                {/* GitHub */}
                <Link
                  href="https://github.com/pyrpc/pyrpc"
                  className="inline-flex items-center gap-2 text-neutral-500 hover:text-fd-foreground transition-colors px-6 py-2.5 border border-fd-border hover:bg-white/[0.03] text-[13px] font-medium tracking-tight rounded-md w-fit"
                >
                  <Github className="w-4 h-4" />
                  <span>View on GitHub</span>
                </Link>
              </div>

            </div>

            {/* Right Column - Code Window */}
            <div className="relative w-full max-w-[600px] lg:ml-auto">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-500/[0.07] blur-[80px] rounded-full pointer-events-none" />

              <div className="relative w-full border border-neutral-800 rounded-lg bg-[#0c0c0c] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.7)] overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#161616] border-b border-neutral-800">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  </div>

                  {/* File tabs */}
                  <div className="flex items-center bg-[#111111] border border-neutral-800 p-0.5 rounded-full">
                    <button
                      onClick={() => setCodeTab('server')}
                      className={cn(
                        "px-4 py-1 text-[10px] font-bold font-mono tracking-widest uppercase transition-all rounded-full",
                        codeTab === 'server' ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"
                      )}
                    >
                      server.py
                    </button>
                    <button
                      onClick={() => setCodeTab('client')}
                      className={cn(
                        "px-4 py-1 text-[10px] font-bold font-mono tracking-widest uppercase transition-all rounded-full",
                        codeTab === 'client' ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"
                      )}
                    >
                      client.ts
                    </button>
                  </div>

                  <div className="w-[44px]" />
                </div>

                {/* Code body */}
                {codeTab === 'server' ? (
                  <div className="grid grid-cols-[40px_1fr] font-mono text-[12px] leading-[1.6] bg-[#080808] py-8">
                    <div className="flex flex-col text-neutral-500/40 border-r border-neutral-800/50 select-none text-center leading-relaxed">
                      {Array.from({ length: 10 }, (_, i) => <span key={i}>{i + 1}</span>)}
                    </div>
                    <div className="px-8 whitespace-pre text-neutral-400 overflow-hidden leading-relaxed">
                      <code>
                        <span className="text-purple-400">from</span>{' '}pyrpc_core{' '}<span className="text-purple-400">import</span>{' '}<span className="text-white">rpc, model</span>{'\n'}
                        {'\n'}
                        <span className="text-sky-400">@model</span>{'\n'}
                        <span className="text-purple-400">class</span>{' '}<span className="text-sky-400">User</span>:{'\n'}
                        {'    '}id:{' '}<span className="text-pink-400">int</span>{'\n'}
                        {'    '}name:{' '}<span className="text-pink-400">str</span>{'\n'}
                        {'\n'}
                        <span className="text-sky-400">@rpc</span>{'\n'}
                        <span className="text-purple-400">def</span>{' '}<span className="text-sky-400">get_user</span>(id:{' '}<span className="text-pink-400">int</span>) <span className="text-neutral-600">-&gt;</span>{' '}<span className="text-sky-400">User</span>:{'\n'}
                        {'    '}<span className="text-purple-400">return</span>{' '}<span className="text-sky-400">User</span>(id=id, name=<span className="text-emerald-400">"Paul Graham"</span>)
                      </code>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-[40px_1fr] font-mono text-[12px] leading-[1.6] bg-[#080808] py-8">
                    <div className="flex flex-col text-neutral-500/40 border-r border-neutral-800/50 select-none text-center leading-relaxed">
                      {Array.from({ length: 9 }, (_, i) => <span key={i}>{i + 1}</span>)}
                    </div>
                    <div className="px-8 whitespace-pre text-neutral-400 overflow-hidden leading-relaxed">
                      <code>
                        <span className="text-purple-400">import</span>{' '}{'{'}{' '}<span className="text-sky-400">createClient</span>{' '}{'}'}{' '}<span className="text-purple-400">from</span>{' '}<span className="text-emerald-400">"@pyrpc/client"</span>;{'\n'}
                        <span className="text-purple-400">import</span>{' '}<span className="text-purple-400">type</span>{' '}{'{'}{' '}<span className="text-sky-400">Types</span>{' '}{'}'}{' '}<span className="text-purple-400">from</span>{' '}<span className="text-emerald-400">"@pyrpc/types"</span>;{'\n'}
                        {'\n'}
                        <span className="text-purple-400">const</span>{' '}client = <span className="text-sky-400">createClient</span>&lt;<span className="text-sky-400">Types</span>&gt;();{'\n'}
                        {'\n'}
                        <span className="text-purple-400">const</span>{' '}user = <span className="text-purple-400">await</span> client.<span className="text-sky-400">get_user</span>(<span className="text-pink-400">1</span>);{'\n'}
                        {'\n'}
                        <span className="text-neutral-600 italic">// "Paul Graham"</span>{'\n'}
                        <span className="text-white">console</span>.<span className="text-sky-400">log</span>(user.<span className="text-white">name</span>);{' '}<span className="text-neutral-600 italic">// Fully typed!</span>
                      </code>
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal Snippet Stack */}
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex w-full justify-between items-center border border-neutral-800 bg-[#0f0f0f] px-4 py-2.5 font-mono text-[11px] text-neutral-300 group/terminal hover:border-neutral-700 transition-colors">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={copyToClipboard}>
                    <span className="text-emerald-500/60 select-none">$</span>
                    <span className="text-white/85 tracking-tight">{command}</span>
                    <span className="opacity-0 group-hover/terminal:opacity-100 transition-opacity ml-1">
                      {copied
                        ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                        : <Copy className="w-3.5 h-3.5 text-neutral-600" />}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pl-3 border-l border-neutral-800">
                    {codeTab === 'server' ? (
                      <>
                        {(['uv', 'pip'] as const).map((m, i) => (
                          <div key={m} className="flex items-center">
                            {i > 0 && <span className="text-neutral-800 select-none mx-2">|</span>}
                            <button
                              onClick={() => setManager(m)}
                              className={cn("text-[10px] uppercase tracking-widest transition-colors", manager === m ? "text-white font-bold" : "text-neutral-600 hover:text-neutral-400")}
                            >
                              {m}
                            </button>
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        {(['npm', 'pnpm', 'bun'] as const).map((m, i) => (
                          <div key={m} className="flex items-center">
                            {i > 0 && <span className="text-neutral-800 select-none mx-2">|</span>}
                            <button
                              onClick={() => setManager(m)}
                              className={cn("text-[10px] uppercase tracking-widest transition-colors", manager === m ? "text-white font-bold" : "text-neutral-600 hover:text-neutral-400")}
                            >
                              {m}
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {codeTab === 'server' && (
                  <div className="flex w-full justify-between items-center border border-neutral-800/50 bg-[#080808] px-4 py-2.5 font-mono text-[11px] text-neutral-500 group/codegen hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-500/30 select-none">$</span>
                      <span className="text-neutral-400/80 tracking-tight">pyrpc dev</span>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-neutral-700 font-bold select-none">
                      Dev Server
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Demo Section */}
          <div className="my-40 relative">
            <div className="mb-16 flex flex-col items-center text-center">
              <div className="flex items-center gap-4 mb-4">
                <span 
                  style={{
                    fontFamily: '"Geist Mono", "Geist Mono Fallback"',
                    fontSize: '11px',
                    fontWeight: 400,
                    lineHeight: '16.5px',
                    color: 'lab(67.9697 -3.85058 -3.02824)'
                  }}
                >
                  00
                </span>
                <div className="h-px w-8 bg-fd-border" />
                <span 
                  className="uppercase tracking-widest"
                  style={{
                    fontFamily: '"Geist Mono", "Geist Mono Fallback"',
                    fontSize: '11px',
                    fontWeight: 400,
                    lineHeight: '16.5px',
                    color: 'lab(67.9697 -3.85058 -3.02824)'
                  }}
                >
                  Demo
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-fd-foreground mb-6">
                See pyRPC in action.
              </h2>
              <p className="max-w-xl text-fd-foreground/50 text-sm md:text-base leading-relaxed font-sans">
                Server, client, and types - in one pane.
              </p>
            </div>
            
            <div className="flex justify-center w-full px-4">
{/* Right Column - IDE Terminal */}
            <div className="relative w-full max-w-[1000px] mx-auto">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-indigo-500/[0.06] blur-[100px] rounded-full pointer-events-none" />

              <div className="relative w-full border border-neutral-800 rounded-lg bg-[#0c0c0c] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.7)] overflow-hidden">
                
                {/* Title bar */}
                <div className="flex items-center px-4 py-2.5 bg-[#161616] border-b border-neutral-800">
                  <div className="flex gap-1.5 mr-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="text-[11px] font-mono text-neutral-500 tracking-tight">~/projects/pyrpc · pyrpc info</span>
                </div>

                {/* Tab bar */}
                <div className="flex items-center bg-[#111111] border-b border-neutral-800 overflow-x-auto">
                  {[
                    { name: 'server.py', active: false },
                    { name: 'router.py', active: false },
                    { name: 'client.ts', active: false },
                    { name: 'pyrpc-terminal', active: true },
                  ].map((tab) => (
                    <div 
                      key={tab.name}
                      className={cn(
                        "px-4 py-2 text-[10px] font-mono border-r border-neutral-800 shrink-0 cursor-default select-none",
                        tab.active 
                          ? "bg-[#0c0c0c] text-neutral-300 border-b-0 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-[#0c0c0c]"
                          : "text-neutral-600 hover:text-neutral-400"
                      )}
                    >
                      {tab.name}
                    </div>
                  ))}
                  <div className="flex-1" />
                </div>

                {/* Main content: sidebar + terminal */}
                <div className="flex min-h-[360px]">
                  
                  {/* File tree sidebar */}
                  <div className="hidden sm:block w-[160px] border-r border-neutral-800 bg-[#0e0e0e] py-3 px-2 text-[10px] font-mono text-neutral-600 select-none shrink-0 overflow-hidden">
                    <div className="text-neutral-500 font-bold uppercase tracking-wider text-[9px] px-2 mb-2">Explorer</div>
                    <div className="space-y-px">
                      <div className="px-2 py-0.5 text-neutral-500">▾ pyrpc</div>
                      <div className="px-4 py-0.5 text-neutral-600">▾ pyrpc_core</div>
                      <div className="px-6 py-0.5 hover:text-neutral-400">__init__.py</div>
                      <div className="px-6 py-0.5 hover:text-neutral-400">engine.py</div>
                      <div className="px-6 py-0.5 hover:text-neutral-400">router.py</div>
                      <div className="px-6 py-0.5 hover:text-neutral-400">types.py</div>
                      <div className="px-4 py-0.5 text-neutral-600">▾ pyrpc_fastapi</div>
                      <div className="px-6 py-0.5 hover:text-neutral-400">adapter.py</div>
                      <div className="px-4 py-0.5 text-neutral-600">▾ pyrpc_flask</div>
                      <div className="px-6 py-0.5 hover:text-neutral-400">adapter.py</div>
                      <div className="px-4 py-0.5 text-neutral-600">▸ pyrpc_codegen</div>
                      <div className="px-4 py-0.5 text-neutral-600">▸ tests</div>
                      <div className="px-2 py-0.5 hover:text-neutral-400">pyproject.toml</div>
                      <div className="px-2 py-0.5 hover:text-neutral-400">README.md</div>
                      <div className="px-2 py-0.5 hover:text-neutral-400">LICENSE</div>
                    </div>
                  </div>

                  {/* Terminal pane */}
                  <div className="flex-1 bg-[#0a0a0a] p-4 font-mono text-[11px] leading-[1.7] overflow-hidden">
                    {/* Command prompt */}
                    <div className="text-neutral-500 mb-3">
                      <span className="text-emerald-500">❯</span>{' '}
                      <span className="text-sky-400">pyrpc</span>{' '}
                      <span className="text-neutral-400">info</span>
                    </div>

                    {/* pyrpc info output */}
                    <div className="text-neutral-500 space-y-0 whitespace-pre">
                      <div className="text-blue-400 mb-1">{'  '}╭─────────────────────────────────────╮</div>
                      <div className="text-blue-400">{'  '}│{'  '}<span className="text-white font-bold">pyRPC</span>{' - '}<span className="text-neutral-400">type-safe RPC for Python</span>{'  '}│</div>
                      <div className="text-blue-400 mb-1">{'  '}╰─────────────────────────────────────╯</div>
                      <div><span className="text-neutral-600">  Version:</span>{'       '}<span className="text-emerald-400">0.3.0</span></div>
                      <div><span className="text-neutral-600">  Engine:</span>{'        '}<span className="text-neutral-300">Pydantic v2 + TypeAdapter</span></div>
                      <div><span className="text-neutral-600">  Protocol:</span>{'      '}<span className="text-neutral-300">JSON-RPC 2.0</span></div>
                      <div><span className="text-neutral-600">  Transport:</span>{'     '}<span className="text-neutral-300">ASGI</span></div>
                      <div><span className="text-neutral-600">  Adapters:</span>{'      '}<span className="text-sky-400">FastAPI</span>{', '}<span className="text-sky-400">Flask</span>{', '}<span className="text-sky-400">Django</span>{', '}<span className="text-neutral-500">Standalone</span></div>
                      <div><span className="text-neutral-600">  Codegen:</span>{'        '}<span className="text-neutral-300">Python → TypeScript</span></div>
                      <div><span className="text-neutral-600">  Client:</span>{'        '}<span className="text-emerald-400">@pyrpc/client</span>{' + '}<span className="text-emerald-400">@pyrpc/types</span></div>
                      <div><span className="text-neutral-600">  Async:</span>{'          '}<span className="text-emerald-400">✓</span>{' '}<span className="text-neutral-300">auto-detect sync/async</span></div>
                      <div><span className="text-neutral-600">  Validation:</span>{'    '}<span className="text-emerald-400">✓</span>{' '}<span className="text-neutral-300">runtime (Pydantic)</span></div>
                      <div><span className="text-neutral-600">  Type Safety:</span>{'   '}<span className="text-emerald-400">✓</span>{' '}<span className="text-neutral-300">compile-time (TypeScript)</span></div>
                      <div className="mt-2"><span className="text-neutral-600">  Procedures:</span>{'    '}<span className="text-pink-400">1</span>{' '}<span className="text-neutral-500">registered</span></div>
                      <div><span className="text-neutral-600">  Routers:</span>{'        '}<span className="text-pink-400">2</span>{' '}<span className="text-neutral-500">mounted</span></div>
                    </div>

                    {/* client call */}
                    <div className="mt-4 text-neutral-500">
                      <span className="text-emerald-500">❯</span>{' '}
                      <span className="text-neutral-400">cat client.ts {'&&'} node client.ts</span>
                    </div>
                    <div className="mt-1 whitespace-pre text-neutral-500 space-y-0.5">
                      <div><span className="text-sky-400">const</span> user = <span className="text-purple-400">await</span> client.<span className="text-sky-400">get_user</span>(<span className="text-pink-400">1</span>);</div>
                      <div>console.<span className="text-sky-400">log</span>(user);</div>
                      <div className="mt-2"><span className="text-emerald-400">{'{ id: 1, name: "'}</span><span className="text-emerald-600">Alice</span><span className="text-emerald-400">{'" }'}</span></div>
                    </div>

                    {/* Waiting cursor */}
                    <div className="mt-3 text-neutral-500">
                      <span className="text-emerald-500">❯</span>{' '}
                      <span className="inline-block w-[7px] h-[14px] bg-neutral-500 animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Status bar */}
                <div className="flex items-center justify-between px-4 py-1.5 bg-[#161616] border-t border-neutral-800 text-[10px] font-mono select-none">
                  <div className="flex items-center gap-4 text-neutral-600">
                    <span className="text-emerald-500">●</span>
                    <span>main</span>
                    <span className="text-neutral-700">|</span>
                    <span>pyrpc</span>
                  </div>
                  <div className="flex items-center gap-4 text-neutral-600">
                    <span>Python 3.12</span>
                    <span className="text-neutral-700">|</span>
                    <span>zsh</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Features Section Header */}

          <div className="my-40 flex flex-col items-center text-center">
            <div className="flex items-center gap-4 mb-4">
              <span 
                style={{
                  fontFamily: '"Geist Mono", "Geist Mono Fallback"',
                  fontSize: '11px',
                  fontWeight: 400,
                  lineHeight: '16.5px',
                  color: 'lab(67.9697 -3.85058 -3.02824)'
                }}
              >
                01
              </span>
              <div className="h-px w-8 bg-fd-border" />
              <span 
                className="uppercase tracking-widest"
                style={{
                  fontFamily: '"Geist Mono", "Geist Mono Fallback"',
                  fontSize: '11px',
                  fontWeight: 400,
                  lineHeight: '16.5px',
                  color: 'lab(67.9697 -3.85058 -3.02824)'
                }}
              >
                Features
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-fd-foreground mb-6">
              Everything you need. Zero boilerplate.
            </h2>
            <p className="max-w-xl text-fd-foreground/50 text-sm md:text-base leading-relaxed font-sans">
              tRPC-level type safety for teams shipping Python backends with TypeScript frontends. Move fast, catch bugs at compile-time, and focus on building features instead of manual contract files.
            </p>
          </div>

          {/* Features Grid */}
          <div className="mb-40 border border-fd-border rounded-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative bg-white/70 dark:bg-[#0E1010] backdrop-blur-xl overflow-hidden shadow-2xl max-w-[1200px] mx-auto">
            


            {[
              {
                id: "01",
                title: "Cross-language contracts.",
                description: "Define once in Python. Get fully typed TypeScript contracts automatically.",
                visual: (
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono text-sky-400 font-bold">.py</span>
                    <span className="text-neutral-600 text-[10px]">→</span>
                    <span className="text-[10px] font-mono text-blue-400 font-bold">.ts</span>
                  </div>
                )
              },
              {
                id: "02",
                title: "Powered by Pydantic v2",
                description: "Runtime validation and serialization built in by default.",
                visual: (
                  <div className="px-2 py-1 rounded bg-emerald-500/5 border border-emerald-500/20">
                    <span className="text-[9px] text-emerald-500 font-bold tracking-tighter uppercase">Strict Validation</span>
                  </div>
                )
              },
              {
                id: "03",
                title: "Universal Adapters.",
                description: "Drop pyRPC into FastAPI, Flask, Django, or any standard ASGI server.",
                visual: (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-fd-foreground/5 border border-fd-border flex items-center justify-center text-[10px] font-bold">FA</div>
                    <div className="w-6 h-6 rounded bg-fd-foreground/5 border border-fd-border flex items-center justify-center text-[10px] font-bold">FL</div>
                    <div className="w-6 h-6 rounded bg-fd-foreground/5 border border-fd-border flex items-center justify-center text-[10px] font-bold">DJ</div>
                  </div>
                )
              },
              {
                id: "04",
                title: "Modular Routing.",
                description: "Organize your API using nested routers, prefixes, and clean namespacing.",
                visual: (
                  <div className="flex items-center gap-2 text-[10px] font-mono text-blue-400/60">
                    <span>users</span>
                    <span className="text-fd-foreground/20">/</span>
                    <span>auth</span>
                    <span className="text-fd-foreground/20">/</span>
                    <span className="text-blue-400">login()</span>
                  </div>
                )
              },
              {
                id: "05",
                title: "Async-First Core.",
                description: "High-concurrency performance with native async/await support throughout.",
                visual: (
                  <div className="flex gap-1 items-end h-6">
                    {[30, 70, 45, 95, 60].map((h, i) => (
                      <div key={i} className="w-1 bg-gradient-to-t from-blue-500/40 to-blue-500/10 rounded-full" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                )
              },
              {
                id: "06",
                title: "JSON-RPC 2.0.",
                description: "Built on a predictable, standardized protocol for robust error handling.",
                visual: (
                  <div className="px-2 py-1 border border-fd-border bg-fd-foreground/[0.02] rounded flex items-center gap-2">
                    <span className="text-[9px] font-mono text-fd-foreground/40 tracking-widest">code: -32601</span>
                  </div>
                )
              }
            ].map((feature) => (
              <div 
                key={feature.id} 
                className="group p-8 border-r border-b border-fd-border relative transition-all overflow-hidden"
              >

                
                <span className="text-fd-foreground/20 font-mono text-[10px] mb-8 block uppercase tracking-widest group-hover:text-fd-foreground/40 transition-colors">{feature.id}</span>
                <h3 className="mb-2 font-sans text-[17px] font-medium tracking-tight text-fd-foreground">
                  {feature.title}
                </h3>
                <p className="text-fd-foreground/50 text-[13px] leading-relaxed mb-12 max-w-[28ch]">{feature.description}</p>
                <div className="mt-auto">
                  {feature.visual}
                </div>
              </div>
            ))}
          </div>
        </div>

          {/* Works With Section - Infinite Marquee */}

          <div className="my-40 relative">
            <div className="mb-16 flex flex-col items-center text-center">
              <div className="flex items-center gap-4 mb-4">
                <span 
                  style={{
                    fontFamily: '"Geist Mono", "Geist Mono Fallback"',
                    fontSize: '11px',
                    fontWeight: 400,
                    lineHeight: '16.5px',
                    color: 'lab(67.9697 -3.85058 -3.02824)'
                  }}
                >
                  02
                </span>
                <div className="h-px w-8 bg-fd-border" />
                <span 
                  className="uppercase tracking-widest"
                  style={{
                    fontFamily: '"Geist Mono", "Geist Mono Fallback"',
                    fontSize: '11px',
                    fontWeight: 400,
                    lineHeight: '16.5px',
                    color: 'lab(67.9697 -3.85058 -3.02824)'
                  }}
                >
                  Ecosystem
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-fd-foreground">
                Compatible with your stack
              </h2>
            </div>
            
            <div className="relative overflow-hidden group py-4 max-w-[1200px] mx-auto">

              <div className="flex animate-marquee whitespace-nowrap gap-12 items-center">
                {[1, 2, 3].map((loop) => (
                  <div key={loop} className="flex shrink-0 items-center gap-16">
                    <div className="flex items-center gap-2.5 hover:opacity-100 opacity-60 transition-opacity">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-fd-foreground shrink-0">
                        <path d="M14.25.3v3.151h-3.5c-3.61 0-3.5 1.539-3.5 1.539v2.712h7.101s3.81 0 3.81 5.338v5.651c0 5.338-4.11 5.338-4.11 5.338H11.75c-3.61 0-4-.534-4-3.725V20.15h3.5v-3.205c0-3.327-.149-3.327 3-3.327h3.635c.302 0 .5-.199.5-.499v-7.112c0-.3-.199-.5-.499-.5h-10s-4.001 0-4.001-5.338v-5.651c0-5.338 4.612-5.338 4.612-5.338h3.353zm-1.75 2.151c-.414 0-.75.336-.75.75s.336.75.75.75.75-.336.75-.75-.336-.75-.75-.75zm-3.5 16.5c.414 0 .75-.336.75-.75s-.336-.75-.75-.75-.75.336-.75.75.336.75.75.75z" />
                      </svg>
                      <span className="font-semibold text-fd-foreground text-[15px] tracking-tight">Python</span>
                    </div>

                    <div className="flex items-center gap-2.5 hover:opacity-100 opacity-60 transition-opacity">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-fd-foreground shrink-0">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.403 18.232l-2.035-6.52H6.942l6.505-8.544 1.83 5.48h3.78l-6.654 9.584z"/>
                      </svg>
                      <span className="font-semibold text-fd-foreground text-[15px] tracking-tight">FastAPI</span>
                    </div>

                    <div className="flex items-center gap-2.5 hover:opacity-100 opacity-60 transition-opacity">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-fd-foreground shrink-0">
                        <path d="M7.746 12.336L3.102 20.37A2 2 0 004.834 23.4h14.331a2 2 0 001.732-3.03l-4.643-8.034V5.4H17a.6.6 0 000-1.2H7a.6.6 0 000 1.2h.746v6.936zM15.05 5.4v7.264l4.135 7.153a.8.8 0 01-.693 1.212H5.508a.8.8 0 01-.693-1.212l4.136-7.153V5.4h6.098z"/>
                      </svg>
                      <span className="font-semibold text-fd-foreground text-[15px] tracking-tight">Flask</span>
                    </div>

                    <div className="flex items-center gap-2.5 hover:opacity-100 opacity-60 transition-opacity">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-fd-foreground shrink-0">
                        <path d="M11.146 0h3.924v18.165c-2.013.382-3.491.535-5.096.535-4.791 0-7.288-2.166-7.288-6.32 0-4.002 2.65-6.6 6.753-6.6.637 0 1.121.05 1.707.203zm0 9.143a3.894 3.894 0 0 0-1.325-.204c-1.988 0-3.134 1.223-3.134 3.365 0 2.09 1.096 3.236 3.109 3.236.433 0 .79-.025 1.35-.102V9.142zM21.314 6.06v11.818c0 4.103-.306 6.07-1.197 7.77-.84 1.646-1.987 2.69-4.334 3.84l-3.644-1.732c2.347-1.1 3.493-2.043 4.182-3.511.739-1.52.968-3.29.968-7.876V6.061h4.025zM17.39.022h3.924v4.026H17.39z"/>
                      </svg>
                      <span className="font-semibold text-fd-foreground text-[15px] tracking-tight">Django</span>
                    </div>

                    <div className="flex items-center gap-2.5 hover:opacity-100 opacity-60 transition-opacity">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-fd-foreground shrink-0">
                        <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0H1.125zm17.363 9.75c.612 0 1.154.037 1.627.111v2.111c-.524-.149-1.067-.223-1.627-.223-1.214 0-1.82.448-1.82 1.343 0 .338.113.601.339.79.227.188.593.313 1.101.376l.951.111c.825.09 1.477.322 1.956.699.479.377.718.919.718 1.626 0 .962-.321 1.726-.962 2.292-.641.566-1.534.848-2.679.848-.68 0-1.333-.054-1.959-.161v-2.223c.657.248 1.43.371 2.32.371 1.056 0 1.583-.349 1.583-1.048 0-.315-.159-.554-.477-.717-.318-.162-.793-.274-1.426-.336l-.852-.09c-.866-.105-1.547-.361-2.043-.769-.496-.408-.744-.991-.744-1.748 0-.895.312-1.583.938-2.065.626-.482 1.493-.723 2.602-.723zm-11.859.186h7.626v1.988h-2.73v9.088h-2.164v-9.088h-2.732V9.936z"/>
                      </svg>
                      <span className="font-semibold text-fd-foreground text-[15px] tracking-tight">TypeScript</span>
                    </div>

                    <div className="flex items-center gap-2.5 hover:opacity-100 opacity-60 transition-opacity">
                      <svg viewBox="-11.5 -10.23174 23 20.46348" fill="currentColor" className="w-5 h-5 text-fd-foreground shrink-0">
                        <circle cx="0" cy="0" r="2.05" />
                        <g stroke="currentColor" strokeWidth="1" fill="none">
                          <ellipse rx="11" ry="4.2"/>
                          <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
                          <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
                        </g>
                      </svg>
                      <span className="font-semibold text-fd-foreground text-[15px] tracking-tight">React</span>
                    </div>

                    <div className="flex items-center gap-2.5 hover:opacity-100 opacity-60 transition-opacity">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-fd-foreground shrink-0">
                        <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.573 0z"/>
                      </svg>
                      <span className="font-semibold text-fd-foreground text-[15px] tracking-tight">Next.js</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Quickstart Section */}

          <div className="my-40 relative max-w-[1200px] mx-auto">
            <div className="mb-24 flex flex-col items-center text-center">
              <div className="flex items-center gap-4 mb-4">
                <span 
                  style={{
                    fontFamily: '"Geist Mono", "Geist Mono Fallback"',
                    fontSize: '11px',
                    fontWeight: 400,
                    lineHeight: '16.5px',
                    color: 'lab(67.9697 -3.85058 -3.02824)'
                  }}
                >
                  03
                </span>
                <div className="h-px w-8 bg-fd-border" />
                <span 
                  className="uppercase tracking-widest"
                  style={{
                    fontFamily: '"Geist Mono", "Geist Mono Fallback"',
                    fontSize: '11px',
                    fontWeight: 400,
                    lineHeight: '16.5px',
                    color: 'lab(67.9697 -3.85058 -3.02824)'
                  }}
                >
                  Quickstart
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-fd-foreground mb-6">
                Get started in 30 seconds
              </h2>
              <p className="max-w-xl text-fd-foreground/50 text-sm md:text-base leading-relaxed font-sans">
                Three commands. Full type safety across Python and TypeScript.
              </p>
            </div>

            {/* Step 1 - Install */}
            <QuickstartStep
              step={1}
              label="Install"
              tag="Server"
              title="Add pyRPC to your Python project."
              description="One command installs the core runtime with Pydantic-powered validation, async support, and framework adapters."
              command="uv add pyrpc-core"
              copiedStep={copiedStep}
              onCopy={copyQuickstart}
              codeFile="main.py"
              code={(
                <div className="whitespace-pre text-neutral-400 leading-relaxed">
                  <code>
                    <span className="text-purple-400">from</span>{' '}pyrpc_core{' '}<span className="text-purple-400">import</span>{' '}<span className="text-sky-400">rpc, model</span>{'\n'}
                    {'\n'}
                    <span className="text-sky-400">@model</span>{'\n'}
                    <span className="text-purple-400">class</span>{' '}<span className="text-sky-400">User</span>:{'\n'}
                    {'    '}id:{' '}<span className="text-pink-400">int</span>{'\n'}
                    {'    '}name:{' '}<span className="text-pink-400">str</span>{'\n'}
                    {'\n'}
                    <span className="text-sky-400">@rpc</span>{'\n'}
                    <span className="text-purple-400">def</span>{' '}<span className="text-sky-400">get_user</span>(id:{' '}<span className="text-pink-400">int</span>) <span className="text-neutral-600">-&gt;</span>{' '}<span className="text-sky-400">User</span>:{'\n'}
                    {'    '}<span className="text-purple-400">return</span>{' '}<span className="text-sky-400">User</span>(id=id, name=<span className="text-emerald-400">"Alice"</span>){'\n'}
                  </code>
                </div>
              )}
              terminal={(
                <div className="font-mono text-[11px] leading-[1.7] text-neutral-400 space-y-1">
                  <div><span className="text-emerald-500">❯</span> <span className="text-neutral-300">uv add pyrpc-core</span></div>
                  <div className="text-neutral-600">Resolved 8 packages in 320ms</div>
                  <div className="text-neutral-600">Installed 4 packages in 45ms</div>
                   <div> <span className="text-emerald-400">+</span> pyrpc-core<span className="text-neutral-600">=={`0.3.0`}</span></div>
                  <div> <span className="text-emerald-400">+</span> pydantic<span className="text-neutral-600">=={`2.7.1`}</span></div>
                  <div> <span className="text-emerald-400">+</span> typing-extensions<span className="text-neutral-600">=={`4.12.0`}</span></div>
                  <div className="mt-2"><span className="text-emerald-500">❯</span> <span className="inline-block w-[7px] h-[14px] bg-neutral-500 animate-pulse" /></div>
                </div>
              )}
            />

            {/* Step 2 - Dev Server */}
            <QuickstartStep
              step={2}
              label="Dev"
              tag="Server"
              title="Start the pyRPC dev server."
              description="Launch the development server with instant schema codegen - your RPC endpoints are served and a JSON schema is generated automatically."
              command="pyrpc dev"
              copiedStep={copiedStep}
              onCopy={copyQuickstart}
              codeFile="@pyrpc/types"
              code={(
                <div className="whitespace-pre text-neutral-400 leading-relaxed">
                  <code>
                    <span className="text-neutral-600">/**</span>{'\n'}
                    <span className="text-neutral-600">{' *'} Auto-generated by `pyrpc dev`.</span>{'\n'}
                    <span className="text-neutral-600">{' *'} @see https://pyrpc.com/docs/plugins/prpc-codegen</span>{'\n'}
                    <span className="text-neutral-600">{' */'}</span>{'\n'}
                    {'\n'}
                    <span className="text-purple-400">export</span>{' '}<span className="text-purple-400">interface</span>{' '}<span className="text-sky-400">Types</span> {'{'}{'\n'}
                    {'  '}<span className="text-neutral-600">/** Get a user by their ID. */</span>{'\n'}
                    {'  '}<span className="text-sky-400">get_user</span>(id: <span className="text-pink-400">number</span>): <span className="text-sky-400">Promise</span>&lt;<span className="text-sky-400">User</span>&gt;;{'\n'}
                    {'}'}{'\n'}
                  </code>
                </div>
              )}
              terminal={(
                <div className="font-mono text-[11px] leading-[1.7] text-neutral-400 space-y-1">
                  <div><span className="text-emerald-500">❯</span> <span className="text-neutral-300">pyrpc dev</span></div>
                  <div className="text-neutral-600 mt-1">Starting pyRPC dev server...</div>
                  <div className="text-neutral-600">Scanning module: <span className="text-sky-400">app.main</span></div>
                  <div className="text-neutral-600">Found <span className="text-pink-400">1</span> procedure, <span className="text-pink-400">1</span> model</div>
                  <div className="text-neutral-600">{'  '}└─ <span className="text-sky-400">get_user</span>{'  (id: int) → User'}</div>
                  <div className="mt-1"><span className="text-emerald-400">✓</span> <span className="text-neutral-300">Schema generated - serving at http://localhost:8000</span></div>
                  <div className="mt-2"><span className="text-emerald-500">❯</span> <span className="inline-block w-[7px] h-[14px] bg-neutral-500 animate-pulse" /></div>
                </div>
              )}
            />

            {/* Step 3 - Consume */}
            <QuickstartStep
              step={3}
              label="Consume"
              tag="Client"
              title="Ship type-safe TypeScript clients."
              description="Install the client package in your frontend project. Types are generated by pyrpc dev - no manual codegen, no schema drift."
              command="npm install @pyrpc/client"
              copiedStep={copiedStep}
              onCopy={copyQuickstart}
              codeFile="client.ts"
              code={(
                <div className="whitespace-pre text-neutral-400 leading-relaxed">
                  <code>
                    <span className="text-purple-400">import</span>{' '}{'{'}{' '}<span className="text-sky-400">createClient</span>{' '}{'}'}{' '}<span className="text-purple-400">from</span>{' '}<span className="text-emerald-400">"@pyrpc/client"</span>;{'\n'}
                    <span className="text-purple-400">import</span>{' '}<span className="text-purple-400">type</span>{' '}{'{'}{' '}<span className="text-sky-400">Types</span>{' '}{'}'}{' '}<span className="text-purple-400">from</span>{' '}<span className="text-emerald-400">"@pyrpc/types"</span>;{'\n'}
                    {'\n'}
                    <span className="text-purple-400">const</span>{' '}client = <span className="text-sky-400">createClient</span>&lt;<span className="text-sky-400">Types</span>&gt;();{'\n'}
                    {'\n'}
                    <span className="text-purple-400">const</span>{' '}user = <span className="text-purple-400">await</span> client.<span className="text-sky-400">get_user</span>(<span className="text-pink-400">1</span>);{'\n'}
                    console.<span className="text-sky-400">log</span>(user.name);{' '}<span className="text-neutral-600 italic">// Fully typed!</span>{'\n'}
                  </code>
                </div>
              )}
              terminal={(
                <div className="font-mono text-[11px] leading-[1.7] text-neutral-400 space-y-1">
                  <div><span className="text-emerald-500">❯</span> <span className="text-neutral-300">npm install @pyrpc/client</span></div>
                  <div className="text-neutral-600 mt-1">Fetching schema from <span className="text-sky-400">http://localhost:8000</span></div>
                  <div className="text-neutral-600">Generating TypeScript client...</div>
                  <div className="text-neutral-600">{'  '}→ <span className="text-emerald-400">client.get_user</span>{'(id: number): Promise<User>'}</div>
                  <div className="mt-1"><span className="text-emerald-400">✓</span> <span className="text-neutral-300">Added 1 package in 2.1s</span></div>
                  <div className="mt-2"><span className="text-emerald-500">❯</span> <span className="inline-block w-[7px] h-[14px] bg-neutral-500 animate-pulse" /></div>
                </div>
              )}
            />
          </div>

        {/* CTA Section */}

        <div className="my-40 max-w-[1240px] mx-auto px-6">
          <div className="relative overflow-hidden rounded-2xl border border-fd-border bg-white/70 dark:bg-[#0E1010] backdrop-blur-xl p-8 md:p-12 text-center shadow-2xl">

            <div className="relative z-10 flex flex-col items-center">
              <div className="flex items-center gap-4 mb-6">
                <span 
                  style={{
                    fontFamily: '"Geist Mono", "Geist Mono Fallback"',
                    fontSize: '11px',
                    fontWeight: 400,
                    lineHeight: '16.5px',
                    color: 'lab(67.9697 -3.85058 -3.02824)'
                  }}
                >
                  04
                </span>
                <div className="h-px w-8 bg-fd-border" />
                <span 
                  className="uppercase tracking-widest"
                  style={{
                    fontFamily: '"Geist Mono", "Geist Mono Fallback"',
                    fontSize: '11px',
                    fontWeight: 400,
                    lineHeight: '16.5px',
                    color: 'lab(67.9697 -3.85058 -3.02824)'
                  }}
                >
                  Ship it
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-fd-foreground mb-6 max-w-2xl">
                One source of truth. <br /> 
                <span className="text-fd-foreground/30 text-3xl md:text-4xl">Across Python and TypeScript.</span>
              </h2>
              <p className="text-fd-foreground/50 text-base md:text-lg mb-10 max-w-2xl leading-relaxed font-sans mx-auto">
                Build APIs once in Python. Ship type-safe clients everywhere - without OpenAPI, gRPC, or manual contract files.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link href="/docs/get-started/installation">
                  <button className="px-8 py-3 bg-fd-foreground text-fd-background dark:text-black font-medium text-[14px] tracking-tight hover:opacity-90 transition-all active:scale-[0.98] rounded-md w-fit">
                    Start Building
                  </button>
                </Link>
                <a href="https://github.com/pyrpc/pyrpc" target="_blank" rel="noreferrer">
                  <button className="flex items-center px-8 py-3 border border-fd-border text-fd-foreground font-medium text-[14px] tracking-tight hover:bg-fd-foreground/5 transition-all rounded-md w-fit">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-2.5">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                    View on GitHub
                  </button>
                </a>
              </div>
            </div>

            {/* Accent Glows */}
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full" />
          </div>
        </div>

      <div className="h-4" />

    </div>
  );
}
