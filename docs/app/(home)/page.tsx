"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  Check, 
  Copy, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Search, 
  Package, 
  Activity, 
  Grid2X2,
  GitBranch,
  Globe,
  ArrowUpRight,
  Play
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
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

      <h3 className="text-2xl md:text-3xl font-bold tracking-tighter text-fd-foreground mb-2" style={{ fontFamily: 'Geist, "Geist Fallback", sans-serif' }}>
        {title}
      </h3>
      <p className="text-fd-foreground/50 text-[15px] leading-relaxed mb-8 max-w-xl font-sans">
        {description}
      </p>

      {/* IDE Panel */}
      <div className="relative mt-auto w-full">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-indigo-500/[0.06] blur-[100px] rounded-full pointer-events-none" />
        <div className="relative w-full border border-neutral-800 rounded-md bg-[#0c0c0c] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.7)] overflow-hidden">
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
          <div className="flex min-h-[300px]">
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
    </motion.div>
  );
}

export default function HomePage() {
  const [manager, setManager] = useState<'uv' | 'pip' | 'npm' | 'pnpm' | 'bun'>('uv');
  const [copied, setCopied] = useState(false);
  const [codeTab, setCodeTab] = useState<'server' | 'client'>('server');
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

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
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 w-full pt-28 md:pt-40 pb-40">

             {/* Left Column */}
             <div className="flex flex-col items-start gap-10 max-w-[480px]">

              {/* Headline - single line */}
              <h1 className="text-[44px] md:text-[48px] font-normal leading-[54px] md:leading-[58px] tracking-tight text-neutral-900 dark:text-[#E8E8E8]" style={{ fontFamily: 'Geist, "Geist Fallback", sans-serif' }}>
                tRPC for{" "}
                <span className="text-neutral-500 dark:text-white/40">Python backends.</span>
              </h1>

              {/* Description */}
              <p
                className="max-w-xl text-[18px] leading-[28px] font-normal text-neutral-600 dark:text-white/80"
                style={{ fontFamily: 'Geist, "Geist Fallback", sans-serif' }}
              >
                tRPC-level type safety for teams shipping Python backends with TypeScript frontends. No schemas, no drift, no boilerplate.
              </p>

              {/* Try it live + Install command badge */}
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/docs/get-started/installation">
                  <button className="px-6 py-2.5 bg-fd-foreground text-fd-background dark:text-black font-medium text-[13px] tracking-tight hover:opacity-90 transition-all active:scale-[0.98] rounded-md w-fit">
                    Try it live
                  </button>
                </Link>
                <div className="flex w-full sm:w-auto items-center gap-3 border border-neutral-800 bg-[#0f0f0f] px-4 py-2.5 font-mono text-[12px] text-neutral-300 group/install hover:border-neutral-700 transition-colors rounded-md">
                <span className="text-emerald-500/60 select-none shrink-0">$</span>
                <span className="text-white/85 tracking-tight flex-1">{command}</span>
                <button onClick={copyToClipboard} className="text-neutral-600 hover:text-white transition-colors shrink-0 ml-1">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <div className="flex items-center gap-2 pl-3 border-l border-neutral-800">
                  {['uv', 'pip'].map((m, i) => (
                    <span key={m} className="flex items-center">
                      {i > 0 && <span className="text-neutral-800 select-none mx-1.5">|</span>}
                      <button onClick={() => setManager(m as 'uv' | 'pip')} className={cn("text-[10px] uppercase tracking-widest transition-colors", manager === m ? "text-white font-bold" : "text-neutral-600 hover:text-neutral-400")}>{m}</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            </div>

            {/* Right Column - Code Window */}
            <div className="relative w-full max-w-[600px] lg:ml-auto">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-500/[0.07] blur-[80px] rounded-full pointer-events-none" />
              <div className="relative w-full border border-neutral-800 rounded-md bg-[#0c0c0c] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.7)] overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#161616] border-b border-neutral-800">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  {/* File tabs */}
                  <div className="flex items-center bg-[#111111] border border-neutral-800 p-0.5 rounded-md">
                    <button onClick={() => setCodeTab('server')} className={cn("px-4 py-1 text-[10px] font-bold font-mono tracking-widest uppercase transition-all rounded-md", codeTab === 'server' ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300")}>server.py</button>
                    <button onClick={() => setCodeTab('client')} className={cn("px-4 py-1 text-[10px] font-bold font-mono tracking-widest uppercase transition-all rounded-md", codeTab === 'client' ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300")}>client.ts</button>
                  </div>
                  <div className="w-[44px]" />
                </div>
                {/* Code body */}
                {codeTab === 'server' ? (
                  <div className="grid grid-cols-[40px_1fr] font-mono text-[12px] leading-[1.6] bg-[#080808] py-8">
                    <div className="flex flex-col text-neutral-500/40 border-r border-neutral-800/50 select-none text-center leading-relaxed">{Array.from({ length: 9 }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
                    <div className="px-8 whitespace-pre text-neutral-400 overflow-hidden leading-relaxed">
                      <code><span className="text-purple-400">from</span>{' '}pyrpc_core{' '}<span className="text-purple-400">import</span>{' '}<span className="text-white">rpc, model</span>{'\n'}{'\n'}<span className="text-sky-400">@model</span>{'\n'}<span className="text-purple-400">class</span>{' '}<span className="text-sky-400">User</span>:{'\n'}{'    '}id:{' '}<span className="text-pink-400">int</span>{'\n'}{'    '}name:{' '}<span className="text-pink-400">str</span>{'\n'}{'    '}email:{' '}<span className="text-pink-400">str</span>{'\n'}{'\n'}<span className="text-sky-400">@rpc</span>{'\n'}<span className="text-purple-400">def</span>{' '}<span className="text-sky-400">get_user</span>(id:{' '}<span className="text-pink-400">int</span>){' '}<span className="text-neutral-600">-&gt;</span>{' '}<span className="text-sky-400">User</span>:{'\n'}{'    '}<span className="text-purple-400">return</span>{' '}<span className="text-sky-400">User</span>(id=id, name=<span className="text-emerald-400">"Alice"</span>, email=<span className="text-emerald-400">"alice@example.com"</span>)</code>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-[40px_1fr] font-mono text-[12px] leading-[1.6] bg-[#080808] py-8">
                    <div className="flex flex-col text-neutral-500/40 border-r border-neutral-800/50 select-none text-center leading-relaxed">{Array.from({ length: 8 }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
                    <div className="px-8 whitespace-pre text-neutral-400 overflow-hidden leading-relaxed">
                      <code><span className="text-purple-400">import</span>{' '}{'{'}{' '}<span className="text-sky-400">createClient</span>{' '}{'}'}{' '}<span className="text-purple-400">from</span>{' '}<span className="text-emerald-400">"@pyrpc/client"</span>;{'\n'}<span className="text-purple-400">import</span>{' '}<span className="text-purple-400">type</span>{' '}{'{'}{' '}<span className="text-sky-400">Types</span>{' '}{'}'}{' '}<span className="text-purple-400">from</span>{' '}<span className="text-emerald-400">"@pyrpc/types"</span>;{'\n'}{'\n'}<span className="text-purple-400">const</span>{' '}client = <span className="text-sky-400">createClient</span>&lt;<span className="text-sky-400">Types</span>&gt;();{'\n'}{'\n'}<span className="text-purple-400">const</span>{' '}user = <span className="text-purple-400">await</span> client.<span className="text-sky-400">get_user</span>(<span className="text-pink-400">1</span>);{'\n'}<span className="text-neutral-600 italic">// name, email - fully typed from Python model</span>{'\n'}<span className="text-white">console</span>.<span className="text-sky-400">log</span>(user.name, user.email);</code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Demo Section */}
          <div className="my-40 relative max-w-[1100px] mx-auto">
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
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-fd-foreground mb-6" style={{ fontFamily: 'Geist, "Geist Fallback", sans-serif' }}>
                See pyRPC in action.
              </h2>
              <p className="text-fd-foreground/50 text-sm md:text-base leading-relaxed font-sans">
                Server, client, and types - in one pane.
              </p>
            </div>
            
            <div className="flex justify-center w-full">
              <div className="relative w-full max-w-[700px] rounded-md overflow-hidden border border-neutral-800 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.7)] group cursor-pointer">
                <img 
                  src="/branding/svg/pyrpc_thumbnail_v3.svg" 
                  alt="pyRPC Demo - Python to TypeScript type-safe RPC"
                  className="w-full h-auto blur-[2px] group-hover:blur-0 transition-all duration-500"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-all duration-300">
                  <div className="w-14 h-14 rounded-full bg-white/90 dark:bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 text-black dark:text-white ml-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section Header */}

          <div className="my-40 flex flex-col items-center text-center max-w-[1100px] mx-auto">
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
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-fd-foreground mb-6" style={{ fontFamily: 'Geist, "Geist Fallback", sans-serif' }}>
              Everything you need. Zero boilerplate.
            </h2>
            <p className="text-fd-foreground/50 text-sm md:text-base leading-relaxed font-sans">
               Move fast, catch bugs at compile-time, and focus on building features instead of manual contract files. Python defines the types. TypeScript consumes them, automatically.
            </p>
          </div>

          {/* Features Grid */}
          <div className="mb-40 border border-fd-border rounded-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative bg-white dark:bg-black overflow-hidden shadow-2xl max-w-[1100px] mx-auto">
            


            {[
              {
                id: "01",
                title: "Monorepo or Separate Repos — both work.",
                description: "In a monorepo? The server writes typed contracts directly to the client. Separate repos? The client fetches them via HTTP at build time.",
                visual: (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/5 border border-amber-500/20">
                      <GitBranch className="w-3 h-3 text-amber-500" />
                      <span className="text-[9px] text-amber-500 font-bold tracking-tighter uppercase">Workspace</span>
                    </div>
                    <span className="text-neutral-600 text-[10px]">|</span>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-sky-500/5 border border-sky-500/20">
                      <Globe className="w-3 h-3 text-sky-500" />
                      <span className="text-[9px] text-sky-500 font-bold tracking-tighter uppercase">Server</span>
                    </div>
                  </div>
                )
              },
              {
                id: "02",
                title: "Full IDE autocompletion.",
                description: "Your Python procedures appear as typed methods in VS Code, WebStorm, and any TypeScript-aware editor. Rename a procedure in Python and TypeScript flags every broken call.",
                visual: (
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-fd-foreground/60">client.</span>
                    <span className="text-sky-400">get_user</span>
                    <span className="text-neutral-600">(</span>
                    <span className="text-pink-400">id</span>
                    <span className="text-neutral-600">)</span>
                  </div>
                )
              },
              {
                id: "03",
                title: "Invalid Inputs? Blocked.",
                description: "Bad data throws before it hits your logic — always. Powered by Pydantic v2.",
                visual: (
                  <div className="px-2 py-1 rounded bg-emerald-500/5 border border-emerald-500/20">
                    <span className="text-[9px] text-emerald-500 font-bold tracking-tighter uppercase">Strict Validation</span>
                  </div>
                )
              },
              {
                id: "04",
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
                id: "05",
                title: "Universal Adapters.",
                description: "Bring your own framework — FastAPI, Flask, Django, or raw ASGI. pyRPC fits your stack.",
                visual: (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-fd-foreground/5 border border-fd-border flex items-center justify-center text-[10px] font-bold">FA</div>
                    <div className="w-6 h-6 rounded bg-fd-foreground/5 border border-fd-border flex items-center justify-center text-[10px] font-bold">FL</div>
                    <div className="w-6 h-6 rounded bg-fd-foreground/5 border border-fd-border flex items-center justify-center text-[10px] font-bold">DJ</div>
                  </div>
                )
              },
              {
                id: "06",
                title: "Sync and async — both work.",
                description: "Write sync or async procedures — pyRPC detects the right calling convention automatically.",
                visual: (
                  <div className="flex gap-1 items-end h-6">
                    {[30, 70, 45, 95, 60].map((h, i) => (
                      <div key={i} className="w-1 bg-gradient-to-t from-blue-500/40 to-blue-500/10 rounded-full" style={{ height: `${h}%` }} />
                    ))}
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
                <p className="text-fd-foreground/50 text-[13px] leading-relaxed mb-12 max-w-[30ch]">{feature.description}</p>
                <div className="mt-auto">
                  {feature.visual}
                </div>
              </div>
            ))}
          </div>
        </div>

          {/* Works With Section */}
          <div className="my-40 max-w-[1100px] mx-auto">
            <div className="flex flex-col items-center text-center mb-16">
              <div className="flex items-center gap-4 mb-4">
                <span style={{ fontFamily: '"Geist Mono", "Geist Mono Fallback"', fontSize: '11px', fontWeight: 400, lineHeight: '16.5px', color: 'lab(67.9697 -3.85058 -3.02824)' }}>02</span>
                <div className="h-px w-8 bg-fd-border" />
                <span className="uppercase tracking-widest" style={{ fontFamily: '"Geist Mono", "Geist Mono Fallback"', fontSize: '11px', fontWeight: 400, lineHeight: '16.5px', color: 'lab(67.9697 -3.85058 -3.02824)' }}>Works With</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-fd-foreground mb-6" style={{ fontFamily: 'Geist, "Geist Fallback", sans-serif' }}>
                Fits your stack.
              </h2>
              <p className="text-fd-foreground/50 text-sm md:text-base leading-relaxed font-sans">
                pyRPC adapts to whatever backend and frontend you already use.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-fd-border rounded-lg p-8 bg-white dark:bg-[#0a0a0a]">
                <h3 className="text-lg font-semibold tracking-tight text-fd-foreground mb-2" style={{ fontFamily: 'Geist, "Geist Fallback", sans-serif' }}>
                  Python Backends
                </h3>
                <p className="text-fd-foreground/50 text-[13px] leading-relaxed mb-6">Drop pyRPC into any Python web framework.</p>
                <div className="flex flex-wrap gap-3">
                  {[{ name: 'FastAPI', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg' }, { name: 'Flask', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg' }, { name: 'Django', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg' }, { name: 'Starlette', icon: null }, { name: 'ASGI', icon: null }].map((fw) => (
                    <span key={fw.name} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold tracking-tight border border-fd-border rounded-md bg-fd-foreground/5 text-fd-foreground/70">
                      {fw.icon && <img src={fw.icon} alt="" className="w-3.5 h-3.5 shrink-0" />}
                      {fw.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="border border-fd-border rounded-lg p-8 bg-white dark:bg-[#0a0a0a]">
                <h3 className="text-lg font-semibold tracking-tight text-fd-foreground mb-2" style={{ fontFamily: 'Geist, "Geist Fallback", sans-serif' }}>
                  TypeScript Frontends
                </h3>
                <p className="text-fd-foreground/50 text-[13px] leading-relaxed mb-6">Works with any framework that speaks fetch.</p>
                <div className="flex flex-wrap gap-3">
                  {[{ name: 'Next.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' }, { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' }, { name: 'Vue', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg' }, { name: 'Svelte', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg' }, { name: 'Any Fetch', icon: null }].map((fw) => (
                    <span key={fw.name} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold tracking-tight border border-fd-border rounded-md bg-fd-foreground/5 text-fd-foreground/70">
                      {fw.icon && <img src={fw.icon} alt="" className="w-3.5 h-3.5 shrink-0" />}
                      {fw.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quickstart Section */}

          <div className="my-40 relative w-full">
            <div className="mb-24 flex flex-col items-center text-center max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-4">
                <span style={{ fontFamily: '"Geist Mono", "Geist Mono Fallback"', fontSize: '11px', fontWeight: 400, lineHeight: '16.5px', color: 'lab(67.9697 -3.85058 -3.02824)' }}>03</span>
                <div className="h-px w-8 bg-fd-border" />
                <span className="uppercase tracking-widest" style={{ fontFamily: '"Geist Mono", "Geist Mono Fallback"', fontSize: '11px', fontWeight: 400, lineHeight: '16.5px', color: 'lab(67.9697 -3.85058 -3.02824)' }}>Quickstart</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter text-fd-foreground mb-6" style={{ fontFamily: 'Geist, "Geist Fallback", sans-serif' }}>Ship in Three commands.</h2>
              <p className="text-fd-foreground/50 text-sm md:text-base leading-relaxed font-sans max-w-2xl">From zero to a running pyRPC server with a type-safe TypeScript client in under two minutes.</p>
            </div>

            <div className="flex flex-col gap-24 max-w-5xl mx-auto">

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
                    <div><span className="text-emerald-500">$</span> <span className="text-neutral-300">uv add pyrpc-core</span></div>
                    <div className="text-neutral-600">Resolved 8 packages in 320ms</div>
                    <div className="text-neutral-600">Installed 4 packages in 45ms</div>
                    <div> <span className="text-emerald-400">+</span> pyrpc-core<span className="text-neutral-600">==0.3.0</span></div>
                    <div> <span className="text-emerald-400">+</span> pydantic<span className="text-neutral-600">==2.7.1</span></div>
                    <div className="mt-2"><span className="text-emerald-500">$</span> <span className="inline-block w-[7px] h-[14px] bg-neutral-500 animate-pulse" /></div>
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
                      <span className="text-neutral-600">{' *'} Auto-generated by pyrpc dev.</span>{'\n'}
                      <span className="text-neutral-600">{' */'}</span>{'\n'}
                      {'\n'}
                      <span className="text-purple-400">export</span>{' '}<span className="text-purple-400">interface</span>{' '}<span className="text-sky-400">Types</span> {'{'}
                      {'\n'}{'  '}<span className="text-sky-400">get_user</span>(id: <span className="text-pink-400">number</span>): <span className="text-sky-400">Promise</span>&lt;<span className="text-sky-400">User</span>&gt;;{'\n'}
                      {'}'}
                    </code>
                  </div>
                )}
                terminal={(
                  <div className="font-mono text-[11px] leading-[1.7] text-neutral-400 space-y-1">
                    <div><span className="text-emerald-500">$</span> <span className="text-neutral-300">pyrpc dev</span></div>
                    <div className="text-neutral-600 mt-1">Starting pyRPC dev server...</div>
                    <div className="text-neutral-600">Found <span className="text-pink-400">1</span> procedure</div>
                    <div className="mt-1"><span className="text-emerald-400">✓</span> <span className="text-neutral-300">Serving at http://localhost:8000</span></div>
                    <div className="mt-2"><span className="text-emerald-500">$</span> <span className="inline-block w-[7px] h-[14px] bg-neutral-500 animate-pulse" /></div>
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
                    <div><span className="text-emerald-500">$</span> <span className="text-neutral-300">npm install @pyrpc/client</span></div>
                    <div className="text-neutral-600">Resolved 12 packages in 1.4s</div>
                    <div> <span className="text-emerald-400">+</span> @pyrpc/client<span className="text-neutral-600">==0.3.0</span></div>
                    <div> <span className="text-emerald-400">+</span> @pyrpc/types<span className="text-neutral-600">==0.3.0</span></div>
                    <div className="mt-1"><span className="text-emerald-500">$</span> <span className="inline-block w-[7px] h-[14px] bg-neutral-500 animate-pulse" /></div>
                  </div>
                )}
              />

            </div>
          </div>

        {/* CTA Section - Full width dark section like PayKit */}
        <div className="mt-40 border-t border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-black">
          <div className="py-24 md:py-32 flex flex-col items-center text-center px-6">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-neutral-900 dark:text-white mb-4" style={{ fontFamily: 'Geist, "Geist Fallback", sans-serif' }}>
          Ready to ship type-safe APIs?
        </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm md:text-base leading-relaxed font-sans max-w-lg mb-8">
              One command to get started. Define your procedures in Python, generate TypeScript clients, and ship in minutes.
            </p>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <Link href="/docs/get-started/installation">
                <button className="px-6 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black font-medium text-[13px] tracking-tight hover:opacity-90 transition-all active:scale-[0.98] rounded-md">
                  Get Started
                </button>
              </Link>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('uv add pyrpc-core');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-2 px-5 py-2.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#111] font-mono text-[13px] text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors rounded-md"
              >
                <span className="text-neutral-400 dark:text-neutral-500 select-none">{'>'}</span>
                <span className="tracking-tight">uv add pyrpc-core</span>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 ml-1" /> : <Copy className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600 ml-1" />}
              </button>
            </div>
            </div>
          </div>

      <div className="h-4" />

    </div>
  );
}
