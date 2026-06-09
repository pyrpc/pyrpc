"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Check,
  Copy,
  Play
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';

function QuickstartStep({ step, title, description, filename, children, terminal, lines }: {
  step: number;
  title: string;
  description: string;
  filename?: string;
  children: React.ReactNode;
  terminal?: React.ReactNode;
  lines?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      {/* Step number + title */}
      <div className="flex items-center gap-3 mb-6">
        <span className="font-mono text-[11px] text-fd-foreground/30 tracking-wider">
          0{step}
        </span>
        <div className="h-px w-6 bg-fd-border" />
        <h3 className="text-2xl md:text-3xl font-bold tracking-tighter text-fd-foreground">
          {title}
        </h3>
      </div>
      <p className="text-fd-foreground/50 text-[15px] leading-relaxed mb-8 max-w-xl font-sans">
        {description}
      </p>

      {/* Code block */}
      <div className="relative w-full">
        <div className="relative w-full border border-[#1a1a1a] bg-black overflow-hidden">
          {/* Title bar */}
          {filename && (
            <div className="border-b border-[#1a1a1a] px-4 py-2">
              <span className="text-[11px] font-mono text-neutral-500 tracking-tight">{filename}</span>
            </div>
          )}
          {/* Content */}
          <div className="flex">
            <div className="flex-1 min-w-0">
              {lines ? (
                <div className="grid grid-cols-[40px_1fr] font-mono text-[12px] leading-relaxed">
                  <div className="whitespace-pre text-center text-[#555] border-r border-[#1a1a1a] select-none leading-relaxed pb-6 pt-5">
                    {Array.from({ length: lines }, (_, i) => `${i + 1}\n`).join('')}
                  </div>
                  <div className="leading-relaxed pb-6 pt-5 px-8 text-neutral-300">
                    {children}
                  </div>
                </div>
              ) : (
                <div className="p-5 font-mono text-[12px] leading-relaxed">
                  {children}
                </div>
              )}
            </div>
            {terminal && (
              <div className="flex-1 min-w-0 border-l border-[#1a1a1a] pt-5 pb-4 px-4 font-mono text-[11px] leading-relaxed bg-black">
                {terminal}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const [manager, setManager] = useState<'uv' | 'pip' | 'npm' | 'pnpm' | 'bun'>('uv');
  const [copied, setCopied] = useState(false);
  const [codeTab, setCodeTab] = useState<'server' | 'generated' | 'client'>('server');
  const userInteractedRef = useRef(false);
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

  useEffect(() => {
    if (userInteractedRef.current) return;
    const interval = setInterval(() => {
      setCodeTab((prev) => {
        if (prev === 'server') return 'generated';
        if (prev === 'generated') return 'client';
        return 'server';
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-fd-foreground font-sans min-h-screen overflow-x-hidden">
      {/* Subtle radial glow top center */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(250,250,249,0.04)_0%,transparent_100%)]" />

      <div className="px-6 md:px-12 lg:px-20">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 w-full pt-28 md:pt-40 pb-40">

          {/* Left Column */}
          <div className="flex flex-col items-start gap-10 max-w-[480px]">

            {/* Headline */}
            <h1 className="text-[44px] md:text-[48px] font-normal leading-[54px] md:leading-[58px] tracking-tight text-neutral-900 dark:text-[#E8E8E8]" style={{ fontFamily: 'Geist, "Geist Fallback", sans-serif' }}>
              Type-safe APIs<br />for Python.
            </h1>

            {/* Description */}
            <p className="text-sm leading-relaxed text-neutral-600 dark:text-white/80 max-w-xl">
              Build APIs in Python and consume them in TypeScript with full inference. No schemas. No drift. No OpenAPI.
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
                      <button onClick={() => setManager(m as 'uv' | 'pip')} className={cn("text-[10px] uppercase tracking-widest transition-colors px-2 py-0.5 rounded", manager === m ? "bg-neutral-700 text-white font-bold" : "text-neutral-500 hover:text-neutral-300")}>{m}</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Code Viewer */}
          <div className="w-full max-w-[600px] lg:ml-auto">
            <div className="w-full border border-[#1a1a1a] bg-black">
              {/* Tab bar */}
              <div className="border-b border-[#1a1a1a]">
                <nav className="flex items-stretch px-3">
                  {(['server', 'generated', 'client'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => { setCodeTab(tab); userInteractedRef.current = true; }}
                      className={cn(
                        "relative px-3 py-2.5 text-[11px] font-mono tracking-tight transition-colors duration-200",
                        codeTab === tab ? "text-white" : "text-white/45 hover:text-white/70"
                      )}
                    >
                      {tab === 'server' ? 'server.py' : tab === 'generated' ? 'generated.ts' : 'client.ts'}
                      {codeTab === tab && (
                        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/90" />
                      )}
                    </button>
                  ))}
                </nav>
              </div>
              {/* Code body */}
              <div className="grid grid-cols-[40px_1fr] font-mono text-[12px] leading-[1.6] min-h-[340px]">
                <AnimatePresence mode="wait">
                  {codeTab === 'server' && (
                    <motion.div key="server" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="contents">
                      <div className="whitespace-pre text-center text-[#555] border-r border-[#1a1a1a] select-none leading-relaxed pb-12">{Array.from({ length: 13 }, (_, i) => `${i + 1}\n`).join('')}</div>
                      <div className="px-8 whitespace-pre overflow-hidden leading-relaxed pb-12 text-[#d7d7d7]">
                        <code><span className="text-[#b4b7ff]">from</span>{' '}pyrpc_core{' '}<span className="text-[#b4b7ff]">import</span>{' '}<span className="text-[#74c7ff]">rpc, model</span>{'\n'}{'\n'}<span className="text-[#d6b76c]">@model</span>{'\n'}<span className="text-[#b4b7ff]">class</span>{' '}<span className="text-[#74c7ff]">Team</span>:{'\n'}{'    '}id: <span className="text-[#86e1d8]">int</span>{'\n'}{'    '}name: <span className="text-[#86e1d8]">str</span>{'\n'}{'    '}members: <span className="text-[#86e1d8]">list</span>[<span className="text-[#86e1d8]">str</span>]{'\n'}{'    '}settings: <span className="text-[#86e1d8]">dict</span>[<span className="text-[#86e1d8]">str</span>, <span className="text-[#86e1d8]">bool</span>]{'\n'}{'\n'}<span className="text-[#d6b76c]">@rpc</span>{'\n'}<span className="text-[#b4b7ff]">def</span>{' '}<span className="text-[#74c7ff]">get_team</span>(id: <span className="text-[#86e1d8]">int</span>){' -> '}<span className="text-[#74c7ff]">Team</span>:{'\n'}{'    '}<span className="text-[#b4b7ff]">return</span>{' '}<span className="text-[#74c7ff]">Team</span>(id=<span className="text-[#8cd992]">1</span>, name=<span className="text-[#8cd992]">"Platform"</span>, ...){'\n'}</code>
                      </div>
                    </motion.div>
                  )}
                  {codeTab === 'generated' && (
                    <motion.div key="generated" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="contents">
                      <div className="whitespace-pre text-center text-[#555] border-r border-[#1a1a1a] select-none leading-relaxed pb-12">{Array.from({ length: 13 }, (_, i) => `${i + 1}\n`).join('')}</div>
                      <div className="px-8 whitespace-pre overflow-hidden leading-relaxed pb-12 text-[#d7d7d7]">
                        <code><span className="text-[#6c6c6c] italic">// Auto-generated from get_team</span>{'\n'}{'\n'}<span className="text-[#b4b7ff]">interface</span>{' '}<span className="text-[#86e1d8]">Team</span>{' {'}{'\n'}{'  '}id: <span className="text-[#86e1d8]">number</span>;{'\n'}{'  '}name: <span className="text-[#86e1d8]">string</span>;{'\n'}{'  '}members: <span className="text-[#86e1d8]">string</span>[];{'\n'}{'  '}settings: <span className="text-[#86e1d8]">Record</span>&lt;<span className="text-[#86e1d8]">string</span>, <span className="text-[#86e1d8]">boolean</span>&gt;;{'\n'}{'}'}{'\n'}{'\n'}<span className="text-[#b4b7ff]">interface</span>{' '}<span className="text-[#86e1d8]">Types</span>{' {'}{'\n'}{'  '}<span className="text-[#74c7ff]">get_team</span>(id: <span className="text-[#86e1d8]">number</span>): <span className="text-[#86e1d8]">Promise</span>&lt;<span className="text-[#86e1d8]">Team</span>&gt;;{'\n'}{'}'}{'\n'}</code>
                      </div>
                    </motion.div>
                  )}
                  {codeTab === 'client' && (
                    <motion.div key="client" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="contents">
                      <div className="whitespace-pre text-center text-[#555] border-r border-[#1a1a1a] select-none leading-relaxed pb-12">{Array.from({ length: 12 }, (_, i) => `${i + 1}\n`).join('')}</div>
                      <div className="px-8 whitespace-pre overflow-hidden leading-relaxed pb-12 text-[#d7d7d7]">
                        <code><span className="text-[#b4b7ff]">import</span>{' '}{'{'}{' '}<span className="text-[#74c7ff]">createClient</span>{' '}{'}'}{' '}<span className="text-[#b4b7ff]">from</span>{' '}<span className="text-[#8cd992]">"@pyrpc/client"</span>;{'\n'}<span className="text-[#b4b7ff]">import</span>{' '}<span className="text-[#b4b7ff]">type</span>{' '}{'{'}{' '}<span className="text-[#86e1d8]">Types</span>{' '}{'}'}{' '}<span className="text-[#b4b7ff]">from</span>{' '}<span className="text-[#8cd992]">"@pyrpc/types"</span>;{'\n'}{'\n'}<span className="text-[#b4b7ff]">const</span>{' '}client{' = '}<span className="text-[#74c7ff]">createClient</span>&lt;<span className="text-[#86e1d8]">Types</span>&gt;();{'\n'}{'\n'}<span className="text-[#6c6c6c] italic">// Autocomplete works across your stack</span>{'\n'}<span className="text-[#b4b7ff]">const</span>{' '}team{' = '}<span className="text-[#b4b7ff]">await</span>{' '}client.<span className="text-[#74c7ff]">get_team</span>(<span className="text-[#8cd992]">1</span>);{'\n'}<span className="text-[#6c6c6c] italic">//    ^? Team</span>{'\n'}{'\n'}console.<span className="text-[#74c7ff]">log</span>(team.members);{'\n'}<span className="text-[#6c6c6c] italic">//          ^? string[]</span>{'\n'}</code>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
           </div>
         </div>

        {/* Demo Section */}
        {/*
        <div className="my-40 relative max-w-[1100px] mx-auto">
          <div className="mb-12 flex flex-col items-center text-center">
            <div className="flex items-center gap-4 mb-4">
              <span
                className="font-mono text-[11px] text-fd-foreground/30 tracking-wider"
              >
                00
              </span>
              <div className="h-px w-8 bg-fd-border" />
              <span
                className="uppercase tracking-widest font-mono text-[11px] text-fd-foreground/30"
              >
                Demo
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-fd-foreground mb-6" style={{ fontFamily: 'Geist, "Geist Fallback", sans-serif' }}>
              See pyRPC in action.
            </h2>
          </div>

          <div className="flex flex-col items-center gap-4">
            <span className="font-mono text-[11px] text-neutral-500 tracking-tight">pyrpc · demo</span>
            <div className="relative w-full rounded-[4px] overflow-hidden border border-neutral-800 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.7)] cursor-pointer">
              <img
                src="/branding/svg/pyrpc_thumbnail_v3.svg"
                alt="pyRPC Demo - Python to TypeScript type-safe RPC"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-14 h-14 rounded-full bg-white/90 dark:bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 text-black dark:text-white ml-0.5" />
                </div>
              </div>
            </div>
            <span className="font-mono text-[12px] text-fd-foreground/40 tracking-tight">Python → TypeScript. Live in the browser.</span>
          </div>
        </div>
        */}

        {/* Features Section Header */}

        <div className="mt-40 mb-16 flex flex-col items-center text-center max-w-[1100px] mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-fd-foreground mb-6" style={{ fontFamily: 'Geist, "Geist Fallback", sans-serif' }}>
            Everything you need.
          </h2>
          <p className="text-fd-foreground/50 text-sm md:text-base leading-relaxed font-sans">
            Python defines the types. TypeScript consumes them, automatically.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-40 border border-fd-border rounded-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative bg-white dark:bg-black overflow-hidden shadow-2xl max-w-[1100px] mx-auto">



          {[
            {
              id: "01",
              title: "Cross-language contracts.",
              description: "Define once in Python. Get fully typed TypeScript contracts automatically.",
            },
            {
              id: "02",
              title: "Full IDE autocompletion.",
              description: "Your Python procedures appear as typed methods. Rename a procedure and TypeScript flags every broken call.",
            },
            {
              id: "03",
              title: "Invalid Inputs? Blocked.",
              description: "Bad data throws before it hits your logic - always. Powered by Pydantic v2.",
            },
            {
              id: "04",
              title: "Monorepo or Separate Repos - both work.",
              description: "In a monorepo? The server writes typed contracts directly to the client. Separate repos? The client fetches them via HTTP at build time.",
            },
            {
              id: "05",
              title: "Universal Adapters.",
              description: "Bring your own framework - FastAPI, Flask, Django, or raw ASGI. pyRPC fits your stack.",
            },
            {
              id: "06",
              title: "Sync and async - both work.",
              description: "Write sync or async procedures - pyRPC detects the right calling convention automatically.",
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
              <p className="text-fd-foreground/50 text-[13px] leading-relaxed max-w-[26ch]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Works With Section */}
      <div className="my-40 max-w-[1100px] mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-fd-foreground mb-6" style={{ fontFamily: 'Geist, "Geist Fallback", sans-serif' }}>
            Fits your stack.
          </h2>
          <p className="text-fd-foreground/50 text-sm md:text-base leading-relaxed font-sans">
            pyRPC adapts to whatever backend and frontend you already use.
          </p>
        </div>

        <div className="flex items-start gap-16 justify-center">
          <div className="flex flex-col items-center gap-5">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-fd-foreground/30">Python</span>
            <div className="flex items-center gap-6">
              {[
                { name: 'FastAPI', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg' },
                { name: 'Flask', icon: 'https://cdn.simpleicons.org/flask' },
                { name: 'Django', icon: 'https://cdn.simpleicons.org/django' },
              ].map((fw) => (
                <span key={fw.name} className="flex flex-col items-center gap-1.5">
                  <img src={fw.icon} alt="" className="w-6 h-6" />
                  <span className="text-[10px] font-mono text-fd-foreground/50">{fw.name}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="w-px self-stretch bg-fd-border" />
          <div className="flex flex-col items-center gap-5">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-fd-foreground/30">TypeScript</span>
            <div className="flex items-center gap-6">
              {[
                { name: 'Next.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' },
                { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
                { name: 'Vue', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg' },
                { name: 'Svelte', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg' },
              ].map((fw) => (
                <span key={fw.name} className="flex flex-col items-center gap-1.5">
                  <img src={fw.icon} alt="" className="w-6 h-6" />
                  <span className="text-[10px] font-mono text-fd-foreground/50">{fw.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quickstart Section */}

      <div className="my-40 relative w-full">
        <div className="mb-24 flex flex-col items-center text-center max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter text-fd-foreground mb-6" style={{ fontFamily: 'Geist, "Geist Fallback", sans-serif' }}>Ship in Three commands.</h2>
          <p className="text-fd-foreground/50 text-sm md:text-base leading-relaxed font-sans max-w-2xl">From zero to a running pyRPC server with a type-safe TypeScript client in under two minutes.</p>
        </div>

        <div className="flex flex-col gap-24 max-w-5xl mx-auto">

          {/* Step 1 - Install */}
          <QuickstartStep
            step={1}
            title="Add pyRPC to your Python project."
            description="One command installs the core runtime with Pydantic-powered validation, async support, and framework adapters."
            filename="server.py"
            lines={5}
            terminal={
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-neutral-600">$</span>{' '}<span className="text-neutral-200">uv add pyrpc-core</span>
                  </div>
                  <button onClick={() => copyQuickstart('uv add pyrpc-core', 1)} className="text-neutral-600 hover:text-neutral-300 transition-colors">
                    {copiedStep === 1 ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="text-neutral-600">Resolved 8 packages in 320ms</div>
                <div className="text-neutral-600">Installed 4 packages in 45ms</div>
                <div className="text-neutral-600">+ pyrpc-core==0.3.0</div>
                <div className="text-neutral-600">+ pydantic==2.7.1</div>
                <div className="mt-2"><span className="text-neutral-600">$</span> <span className="inline-block w-[7px] h-[14px] bg-neutral-500 animate-pulse" /></div>
              </div>
            }
          >
            <div className="whitespace-pre-wrap leading-relaxed">
              <code>
                <span className="text-[#b4b7ff]">from</span>{' '}pyrpc_core{' '}<span className="text-[#b4b7ff]">import</span>{' '}<span className="text-[#74c7ff]">rpc</span>{'\n'}
                {'\n'}
                <span className="text-[#d6b76c]">@rpc</span>{'\n'}
                <span className="text-[#b4b7ff]">def</span>{' '}<span className="text-[#74c7ff]">greet</span>(name: <span className="text-[#86e1d8]">str</span>){' '}<span className="text-[#6c6c6c]">-&gt;</span>{' '}<span className="text-[#86e1d8]">str</span>:{'\n'}
                {'    '}<span className="text-[#b4b7ff]">return</span>{' '}<span className="text-[#8cd992]">{'f"Hello {name}!"'}</span>
              </code>
            </div>
          </QuickstartStep>

          {/* Step 2 - Dev Server */}
          <QuickstartStep
            step={2}
            title="Start the pyRPC dev server."
            description="Types are generated automatically as your server runs."
            filename="@pyrpc/types"
            lines={7}
            terminal={
              <div className="space-y-1">
                <div><span className="text-neutral-600">$</span> <span className="text-neutral-200">pyrpc dev</span></div>
                <div className="text-neutral-600">Starting pyRPC dev server...</div>
                <div className="text-neutral-600">Found 1 procedure</div>
                <div><span className="text-emerald-600">✓</span> <span className="text-neutral-200">Serving at http://localhost:8000</span></div>
                <div className="mt-2"><span className="text-neutral-600">$</span> <span className="inline-block w-[7px] h-[14px] bg-neutral-500 animate-pulse" /></div>
              </div>
            }
          >
            <div className="whitespace-pre-wrap leading-relaxed">
              <code>
                <span className="text-[#6c6c6c] italic">/**</span>{'\n'}
                <span className="text-[#6c6c6c] italic">{' *'} Auto-generated by pyrpc dev.</span>{'\n'}
                <span className="text-[#6c6c6c] italic">{' */'}</span>{'\n'}
                {'\n'}
                <span className="text-[#b4b7ff]">export</span>{' '}<span className="text-[#b4b7ff]">interface</span>{' '}<span className="text-[#74c7ff]">Types</span> {'{'}
                {'\n'}{'  '}<span className="text-[#74c7ff]">greet</span>(name: <span className="text-[#86e1d8]">string</span>): <span className="text-[#86e1d8]">Promise</span>&lt;<span className="text-[#86e1d8]">string</span>&gt;;{'\n'}
                {'}'}
              </code>
            </div>
          </QuickstartStep>

          {/* Step 3 - Consume */}
          <QuickstartStep
            step={3}
            title="Ship type-safe TypeScript clients."
            description="Install the client package in your frontend project. Types flow from Python to TypeScript — no manual codegen, no schema drift."
            filename="client.ts"
            lines={8}
            terminal={
              <div className="space-y-1">
                <div><span className="text-neutral-600">$</span> <span className="text-neutral-200">npm install @pyrpc/client</span></div>
                <div className="text-neutral-600">Resolved 12 packages in 1.4s</div>
                <div className="text-neutral-600">+ @pyrpc/client@0.3.0</div>
                <div className="text-neutral-600">+ @pyrpc/types@0.3.0</div>
                <div className="mt-2"><span className="text-neutral-600">$</span> <span className="inline-block w-[7px] h-[14px] bg-neutral-500 animate-pulse" /></div>
              </div>
            }
          >
            <div className="whitespace-pre-wrap leading-relaxed">
              <code>
                <span className="text-[#b4b7ff]">import</span>{' '}{'{'}{' '}<span className="text-[#74c7ff]">createClient</span>{' '}{'}'}{' '}<span className="text-[#b4b7ff]">from</span>{' '}<span className="text-[#8cd992]">"@pyrpc/client"</span>;{'\n'}
                <span className="text-[#b4b7ff]">import</span>{' '}<span className="text-[#b4b7ff]">type</span>{' '}{'{'}{' '}<span className="text-[#86e1d8]">Types</span>{' '}{'}'}{' '}<span className="text-[#b4b7ff]">from</span>{' '}<span className="text-[#8cd992]">"@pyrpc/types"</span>;{'\n'}
                {'\n'}
                <span className="text-[#b4b7ff]">const</span>{' '}client = <span className="text-[#74c7ff]">createClient</span>&lt;<span className="text-[#86e1d8]">Types</span>&gt;();{'\n'}
                {'\n'}
                <span className="text-[#b4b7ff]">const</span>{' '}result = <span className="text-[#b4b7ff]">await</span> client.<span className="text-[#74c7ff]">greet</span>(<span className="text-[#8cd992]">"World"</span>);{'\n'}
                console.<span className="text-[#74c7ff]">log</span>(result);{' '}<span className="text-[#6c6c6c] italic">// "Hello World!"</span>{'\n'}
              </code>
            </div>
          </QuickstartStep>

        </div>
      </div>

      {/* CTA Section - Full width dark section like PayKit */}
      <div className="mt-40 border-t border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-black">
        <div className="py-16 md:py-20 flex flex-col items-center text-center px-6">
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
