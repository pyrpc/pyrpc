"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Github, Check, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function HomePage() {
  const [manager, setManager] = useState<'uv' | 'pip' | 'npm' | 'pnpm' | 'bun'>('uv');
  const [copied, setCopied] = useState(false);
  const [codeTab, setCodeTab] = useState<'server' | 'client'>('server');

  // Avoid hydration mismatch
  useEffect(() => {
    // Component is now mounted
  }, []);

  // Update manager when tab changes
  useEffect(() => {
    if (codeTab === 'server') {
      setManager('uv');
    } else {
      setManager('npm');
    }
  }, [codeTab]);

  const command = manager === 'uv' ? 'uv add prpc' : 
                  manager === 'pip' ? 'pip install prpc' :
                  manager === 'npm' ? 'npm install @prpc/client' :
                  manager === 'pnpm' ? 'pnpm add @prpc/client' :
                  'bun add @prpc/client';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#000000] text-foreground font-sans selection:bg-white/10">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03)_0%,transparent_50%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none" />

      {/* Outer wrapper with margin to allow lines to cross */}
      <div className="relative z-10 flex flex-col mx-4 md:mx-6 lg:mx-8">

        {/* Crossing Border Lines - Even more subtle */}
        <div className="absolute bottom-0 left-[-24px] right-[-24px] h-[1px] bg-white/[0.06]" />
        <div className="absolute left-0 top-[-24px] bottom-[-24px] w-[1px] bg-white/[0.06]" />
        <div className="absolute right-0 top-[-24px] bottom-[-24px] w-[1px] bg-white/[0.06]" />

        {/* Content Container */}
        <div className="relative flex flex-col p-4 md:p-6 lg:p-8 pt-6 md:pt-8">

          {/* Hero Section */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 max-w-7xl mx-auto w-full mt-12 md:mt-20">

            {/* Left Column */}
            <div className="flex flex-col items-start space-y-10">
              {/* Beta Pill */}
              <div className="flex items-center gap-3 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[11px] text-neutral-400 font-medium tracking-tight">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                <span>Public Beta</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tighter text-white max-w-[15ch]">
                End-to-end{'\n'}
                <span className="bg-gradient-to-r from-white via-white to-white/30 bg-clip-text text-transparent">type safety.</span>
              </h1>
              <p className="text-base md:text-lg text-neutral-400 leading-relaxed max-w-md tracking-tight">
                Seamless bridge between your Python backend and TypeScript frontend with zero-cost abstractions.
              </p>

              <div className="flex items-center gap-6">
                {/* Get Started Button - Linear Style */}
                <Link href="/docs/get-started/installation">
                  <button className="px-8 py-2.5 bg-white text-black font-semibold text-base rounded-none hover:bg-neutral-200 transition-all active:scale-[0.98]">
                    Get Started
                  </button>
                </Link>

                {/* View on GitHub Button */}
                <Link
                  href="https://github.com/pRPC-dev/prpc"
                  className="flex items-center gap-2.5 text-neutral-400 hover:text-white transition-colors group px-6 py-2.5 rounded-none border border-white/10 hover:bg-white/5 font-medium text-base"
                >
                  <Github className="w-5 h-5" />
                  <span>View on GitHub</span>
                </Link>
              </div>
            </div>

            {/* Right Column - Code Window */}
            <div className="relative w-full max-w-[600px] lg:ml-auto">
              {/* Subtle Glow Behind Code Panel */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[80%] max-h-[80%] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

              <div className="relative w-full rounded-none border border-white/10 bg-white/[0.02] backdrop-blur-sm shadow-[0_40px_80px_-15px_rgba(0,0,0,0.9)] p-2">
                <div className="flex flex-col rounded-none border border-white/5 overflow-hidden bg-black/90">

                  {/* Tabbed Header */}
                  <div className="flex items-center justify-between px-5 py-3 bg-white/[0.02] border-b border-white/5">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                      <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                      <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                    </div>

                    {/* Pill Tabs */}
                    <div className="flex items-center bg-white/[0.03] border border-white/5 p-0.5 rounded-full">
                      <button
                        onClick={() => setCodeTab('server')}
                        className={cn(
                          "px-4 py-1 text-[10px] font-bold font-mono tracking-widest uppercase transition-all rounded-full",
                          codeTab === 'server' ? "bg-white/10 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300"
                        )}
                      >
                        server.py
                      </button>
                      <button
                        onClick={() => setCodeTab('client')}
                        className={cn(
                          "px-4 py-1 text-[10px] font-bold font-mono tracking-widest uppercase transition-all rounded-full",
                          codeTab === 'client' ? "bg-white/10 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300"
                        )}
                      >
                        client.ts
                      </button>
                    </div>

                    <div className="w-8" />
                  </div>

                  {/* Code Content */}
                  <div className="relative">
                    {codeTab === 'server' ? (
                      <div className="p-0 font-mono text-[13px] leading-relaxed flex overflow-hidden bg-[#080808]">
                        <div className="flex flex-col py-8 px-0 text-neutral-600 bg-white/[0.01] border-r border-white/5 select-none text-center w-12 shrink-0">
                          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
                        </div>
                        <div className="p-8 whitespace-pre text-neutral-400 w-full overflow-hidden">
                          <code>
                            <span className="text-purple-400">from</span> prpc <span className="text-purple-400">import</span> <span className="text-white">rpc</span>{'\n'}
                            <span className="text-purple-400">from</span> pydantic <span className="text-purple-400">import</span> <span className="text-white">BaseModel</span>{'\n'}
                            {'\n'}
                            <span className="text-purple-400">class</span> <span className="text-sky-400">User</span>(BaseModel):{'\n'}
                            {'    '}id: <span className="text-pink-400">int</span>{'\n'}
                            {'    '}name: <span className="text-pink-400">str</span>{'\n'}
                            {'\n'}
                            <span className="text-sky-400">@rpc</span>{'\n'}
                            <span className="text-purple-400">async def</span> <span className="text-sky-400">get_user</span>(id: <span className="text-pink-400">int</span>) <span className="text-neutral-500">-&gt;</span> <span className="text-sky-400">User</span>:{'\n'}
                            {'    '}<span className="text-purple-400">return</span> <span className="text-sky-400">User</span>(id=id, name=<span className="text-emerald-400">"pRPC User"</span>)
                          </code>
                        </div>
                      </div>
                    ) : (
                      <div className="p-0 font-mono text-[13px] leading-relaxed flex overflow-hidden bg-[#080808]">
                        <div className="flex flex-col py-8 px-0 text-neutral-600 bg-white/[0.01] border-r border-white/5 select-none text-center w-12 shrink-0">
                          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
                        </div>
                        <div className="p-8 whitespace-pre text-neutral-400 w-full overflow-hidden">
                          <code>
                            <span className="text-purple-400">import</span> {'{'} <span className="text-sky-400">createClient</span> {'}'} <span className="text-purple-400">from</span> <span className="text-emerald-400">"@prpc/client"</span>;{'\n'}
                            {'\n'}
                            <span className="text-purple-400">const</span> client = <span className="text-sky-400">createClient</span>();{'\n'}
                            <span className="text-purple-400">const</span> user = <span className="text-purple-400">await</span> client.<span className="text-sky-400">get_user</span>(<span className="text-pink-400">1</span>);{'\n'}
                            {'\n'}
                            <span className="text-white">console</span>.<span className="text-sky-400">log</span>(user.<span className="text-white">name</span>); <span className="text-neutral-600 italic">// Type-safe!</span>{'\n'}
                            {'\n'}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Terminal Snippet */}
              <div className="mt-6 flex w-full justify-between items-center gap-4 rounded-md border border-white/10 bg-[#1e1e1e] px-4 py-2 font-mono text-sm text-neutral-300 group/terminal transition-all hover:border-white/20 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={copyToClipboard}
                >
                  <span className="text-emerald-500/70 select-none">&gt;</span>
                  <span className="text-white/90 tracking-tight">{command}</span>
                  <div className="opacity-0 group-hover/terminal:opacity-100 transition-opacity ml-1 flex items-center">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                  {codeTab === 'server' ? (
                    <>
                      <button
                        onClick={() => setManager('uv')}
                        className={cn(
                          "text-[10px] uppercase tracking-widest transition-colors",
                          manager === 'uv' ? "text-white font-bold" : "text-neutral-500 hover:text-neutral-300"
                        )}
                      >
                        uv
                      </button>
                      <span className="text-neutral-700 select-none">|</span>
                      <button
                        onClick={() => setManager('pip')}
                        className={cn(
                          "text-[10px] uppercase tracking-widest transition-colors",
                          manager === 'pip' ? "text-white font-bold" : "text-neutral-500 hover:text-neutral-300"
                        )}
                      >
                        pip
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setManager('npm')}
                        className={cn(
                          "text-[10px] uppercase tracking-widest transition-colors",
                          manager === 'npm' ? "text-white font-bold" : "text-neutral-500 hover:text-neutral-300"
                        )}
                      >
                        npm
                      </button>
                      <span className="text-neutral-700 select-none">|</span>
                      <button
                        onClick={() => setManager('pnpm')}
                        className={cn(
                          "text-[10px] uppercase tracking-widest transition-colors",
                          manager === 'pnpm' ? "text-white font-bold" : "text-neutral-500 hover:text-neutral-300"
                        )}
                      >
                        pnpm
                      </button>
                      <span className="text-neutral-700 select-none">|</span>
                      <button
                        onClick={() => setManager('bun')}
                        className={cn(
                          "text-[10px] uppercase tracking-widest transition-colors",
                          manager === 'bun' ? "text-white font-bold" : "text-neutral-500 hover:text-neutral-300"
                        )}
                      >
                        bun
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Works With Section */}
          <div className="mt-32 border-t border-white/5 pt-12">
            <h3 className="text-neutral-500 font-bold text-xs uppercase tracking-[0.2em] mb-10">
              Compatible with your favorite frameworks
            </h3>
            <div className="flex flex-wrap items-center gap-x-12 gap-y-8 opacity-50 hover:opacity-100 transition-opacity duration-700">
              <span className="font-semibold text-white text-xl tracking-tight">FastAPI</span>
              {/* <span className="font-semibold text-white text-xl tracking-tight">Django</span> */}
              <span className="font-semibold text-white text-xl tracking-tight">Flask</span>
              <span className="font-semibold text-white text-xl tracking-tight">React</span>
              <span className="font-semibold text-white text-xl tracking-tight">Next.js</span>
              {/* <span className="font-semibold text-white text-xl tracking-tight">SvelteKit</span> */}
              {/* <span className="font-semibold text-white text-xl tracking-tight">Vue</span> */}
              {/* <span className="font-semibold text-white text-xl tracking-tight">Nuxt</span> */}
              {/* <span className="font-semibold text-white text-xl tracking-tight">Solid</span> */}
              {/* <span className="font-semibold text-white text-xl tracking-tight">Astro</span> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
