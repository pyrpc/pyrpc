"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Github, Check, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function HomePage() {
  const [manager, setManager] = useState<'uv' | 'pip' | 'npm' | 'pnpm' | 'bun'>('uv');
  const [copied, setCopied] = useState(false);
  const [codeTab, setCodeTab] = useState<'server' | 'client'>('server');

  useEffect(() => {
    if (codeTab === 'server') {
      setManager('uv');
    } else {
      setManager('npm');
    }
  }, [codeTab]);

  const command = manager === 'uv' ? 'uv add pyrpc-server' :
    manager === 'pip' ? 'pip install pyrpc-server' :
    manager === 'npm' ? 'npm install @pyrpc/client' :
    manager === 'pnpm' ? 'pnpm add @pyrpc/client' :
    'bun add @pyrpc/client';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#000000] text-fd-foreground font-sans min-h-screen overflow-x-hidden">
      {/* Subtle radial glow top center */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(250,250,249,0.04)_0%,transparent_100%)]" />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-[1400px] mx-auto min-h-screen">
        
        {/* Vertical architectural grid lines — pinned to container edges */}
        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-neutral-200 dark:bg-white/[0.08]" />
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-neutral-200 dark:bg-white/[0.08]" />
        
        {/* Horizontal divider lines — using w-screen to ensure full-width regardless of container */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-[1px] bg-neutral-200 dark:bg-white/[0.08]" />

        <div className="px-6 md:px-12 lg:px-20">
          {/* Hero Section */}
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 w-full pt-20 md:pt-32 pb-24">

            {/* Left Column */}
            <div className="flex flex-col items-start gap-10">

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
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tighter text-fd-foreground max-w-[15ch]">
                End-to-end <br />
                <span className="text-fd-muted-foreground/40">type safety.</span>
              </h1>

              {/* Description */}
              <p
                className="max-w-lg text-neutral-600 dark:text-neutral-400 text-sm md:text-base leading-relaxed"
                style={{ fontFamily: 'Geist, "Geist Fallback", sans-serif' }}
              >
                Seamless bridge between your Python backend and TypeScript frontend with zero-cost abstractions. Build faster, break less.
              </p>

              <div className="flex items-center gap-4 flex-wrap mt-2">
                {/* Get Started */}
                <Link href="/docs/get-started/installation">
                  <button
                    className="px-8 py-3 bg-fd-foreground text-fd-background dark:text-black font-bold uppercase tracking-widest text-[11px] hover:opacity-90 transition-all active:scale-[0.98]"
                  >
                    Get Started
                  </button>
                </Link>

                {/* GitHub */}
                <Link
                  href="https://github.com/pyrpc/pyrpc"
                  className="inline-flex items-center gap-2 text-neutral-500 hover:text-fd-foreground transition-colors px-6 py-3 border border-fd-border hover:bg-white/[0.03] uppercase tracking-widest text-[11px] font-bold"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </Link>
              </div>
            </div>

            {/* Right Column — Code Window */}
            <div className="relative w-full max-w-[600px] lg:ml-auto">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-500/[0.07] blur-[80px] rounded-full pointer-events-none" />

              <div className="relative w-full border border-neutral-800 bg-[#0a0a0a] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)]">
                {/* Window chrome */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-[#0f0f0f]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                  </div>

                  {/* File tabs */}
                  <div className="flex items-center bg-neutral-900 border border-neutral-800 p-0.5 rounded-full">
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
                  <div className="grid grid-cols-[40px_1fr] font-mono text-[13px] leading-relaxed bg-[#080808] py-8">
                    <div className="flex flex-col text-neutral-500/40 border-r border-neutral-800/50 select-none text-center leading-relaxed">
                      {Array.from({ length: 10 }, (_, i) => <span key={i}>{i + 1}</span>)}
                    </div>
                    <div className="px-8 whitespace-pre text-neutral-400 overflow-hidden leading-relaxed">
                      <code>
                        <span className="text-purple-400">from</span>{' '}pyrpc{' '}<span className="text-purple-400">import</span>{' '}<span className="text-white">rpc</span>{'\n'}
                        <span className="text-purple-400">from</span>{' '}pydantic{' '}<span className="text-purple-400">import</span>{' '}<span className="text-white">BaseModel</span>{'\n'}
                        {'\n'}
                        <span className="text-purple-400">class</span>{' '}<span className="text-sky-400">User</span>(BaseModel):{'\n'}
                        {'    '}id:{' '}<span className="text-pink-400">int</span>{'\n'}
                        {'    '}name:{' '}<span className="text-pink-400">str</span>{'\n'}
                        {'\n'}
                        <span className="text-sky-400">@rpc</span>{'\n'}
                        <span className="text-purple-400">async def</span>{' '}<span className="text-sky-400">get_user</span>(id:{' '}<span className="text-pink-400">int</span>) <span className="text-neutral-600">-&gt;</span>{' '}<span className="text-sky-400">User</span>:{'\n'}
                        {'    '}<span className="text-purple-400">return</span>{' '}<span className="text-sky-400">User</span>(id=id, name=<span className="text-emerald-400">"pyRPC User"</span>)
                      </code>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-[40px_1fr] font-mono text-[13px] leading-relaxed bg-[#080808] py-8">
                    <div className="flex flex-col text-neutral-500/40 border-r border-neutral-800/50 select-none text-center leading-relaxed">
                      {Array.from({ length: 10 }, (_, i) => <span key={i}>{i + 1}</span>)}
                    </div>
                    <div className="px-8 whitespace-pre text-neutral-400 overflow-hidden leading-relaxed">
                      <code>
                        <span className="text-purple-400">import</span>{' '}{'{'}{' '}<span className="text-sky-400">createClient</span>{' '}{'}'}{' '}<span className="text-purple-400">from</span>{' '}<span className="text-emerald-400">"@pyrpc/client"</span>;{'\n'}
                        <span className="text-purple-400">import</span>{' '}<span className="text-purple-400">type</span>{' '}{'{'}{' '}<span className="text-sky-400">AppRouter</span>{' '}{'}'}{' '}<span className="text-purple-400">from</span>{' '}<span className="text-emerald-400">"./server"</span>;{'\n'}
                        {'\n'}
                        <span className="text-purple-400">const</span>{' '}client = <span className="text-sky-400">createClient</span>&lt;<span className="text-sky-400">AppRouter</span>&gt;({'{'}{'\n'}
                        {'  '}baseUrl:{' '}<span className="text-emerald-400">"http://localhost:8000"</span>{'\n'}
                        {'}'});{'\n'}
                        {'\n'}
                        <span className="text-purple-400">const</span>{' '}user = <span className="text-purple-400">await</span> client.<span className="text-sky-400">get_user</span>(<span className="text-pink-400">1</span>);{'\n'}
                        {'\n'}
                        <span className="text-white">console</span>.<span className="text-sky-400">log</span>(user.<span className="text-white">name</span>);{' '}<span className="text-neutral-600 italic">// fully typed</span>
                      </code>
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal Snippet */}
              <div className="mt-4 flex w-full justify-between items-center border border-neutral-800 bg-[#0f0f0f] px-4 py-2.5 font-mono text-sm text-neutral-300 group/terminal hover:border-neutral-700 transition-colors">
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
                          >{m}</button>
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
                          >{m}</button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Top Frameworks Divider */}
          <div className="relative h-px w-full my-12">
            <div className="absolute left-1/2 -translate-x-1/2 w-screen top-0 h-px bg-neutral-200 dark:bg-white/[0.08]" />
          </div>

          {/* Works With Section */}
          <div className="pb-24 relative">
            <p className="text-fd-muted-foreground font-mono text-[11px] uppercase tracking-[0.2em] mb-8">
              Compatible with your stack
            </p>
            <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
              {/* PYTHON BACKENDS */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-blue-500/5 to-transparent border border-white/[0.03]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-fd-foreground shrink-0">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.403 18.232l-2.035-6.52H6.942l6.505-8.544 1.83 5.48h3.78l-6.654 9.584z"/>
                </svg>
                <span className="font-semibold text-fd-foreground text-sm tracking-tight">FastAPI</span>
              </div>

              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-neutral-500/5 to-transparent border border-white/[0.03]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-fd-foreground shrink-0">
                  <path d="M7.746 12.336L3.102 20.37A2 2 0 004.834 23.4h14.331a2 2 0 001.732-3.03l-4.643-8.034V5.4H17a.6.6 0 000-1.2H7a.6.6 0 000 1.2h.746v6.936zM15.05 5.4v7.264l4.135 7.153a.8.8 0 01-.693 1.212H5.508a.8.8 0 01-.693-1.212l4.136-7.153V5.4h6.098z"/>
                </svg>
                <span className="font-semibold text-fd-foreground text-sm tracking-tight">Flask</span>
              </div>

              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-emerald-500/5 to-transparent border border-white/[0.03]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-fd-foreground shrink-0">
                  <path d="M11.146 0h3.924v18.165c-2.013.382-3.491.535-5.096.535-4.791 0-7.288-2.166-7.288-6.32 0-4.002 2.65-6.6 6.753-6.6.637 0 1.121.05 1.707.203zm0 9.143a3.894 3.894 0 0 0-1.325-.204c-1.988 0-3.134 1.223-3.134 3.365 0 2.09 1.096 3.236 3.109 3.236.433 0 .79-.025 1.35-.102V9.142zM21.314 6.06v11.818c0 4.103-.306 6.07-1.197 7.77-.84 1.646-1.987 2.69-4.334 3.84l-3.644-1.732c2.347-1.1 3.493-2.043 4.182-3.511.739-1.52.968-3.29.968-7.876V6.061h4.025zM17.39.022h3.924v4.026H17.39z"/>
                </svg>
                <span className="font-semibold text-fd-foreground text-sm tracking-tight">Django</span>
              </div>

              <div className="w-px h-4 bg-neutral-800 mx-1 hidden md:block" />

              {/* JS/TS FRONTENDS (Grouped by family) */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-sky-500/5 to-transparent border border-white/[0.03]">
                <svg viewBox="-11.5 -10.23174 23 20.46348" fill="currentColor" className="w-5 h-5 text-fd-foreground shrink-0">
                  <circle cx="0" cy="0" r="2.05" />
                  <g stroke="currentColor" strokeWidth="1" fill="none">
                    <ellipse rx="11" ry="4.2"/>
                    <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
                    <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
                  </g>
                </svg>
                <span className="font-semibold text-fd-foreground text-sm tracking-tight">React</span>
              </div>

              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-white/5 to-transparent border border-white/[0.03]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-fd-foreground shrink-0">
                  <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.573 0z"/>
                </svg>
                <span className="font-semibold text-fd-foreground text-sm tracking-tight">Next.js</span>
              </div>

              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-emerald-500/5 to-transparent border border-white/[0.03]">
                <svg viewBox="0 0 256 221" fill="currentColor" className="w-5 h-5 text-fd-foreground shrink-0">
                  <path d="M204.8 0H256L128 220.8L0 0h51.2L128 132.48L204.8 0z"/>
                </svg>
                <span className="font-semibold text-fd-foreground text-sm tracking-tight">Vue</span>
              </div>

              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-emerald-400/5 to-transparent border border-white/[0.03]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-fd-foreground shrink-0">
                  <path d="M12 0L0 24h4.8L12 9.6L19.2 24H24L12 0z"/>
                </svg>
                <span className="font-semibold text-fd-foreground text-sm tracking-tight">Nuxt</span>
              </div>

              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-orange-500/5 to-transparent border border-white/[0.03]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-fd-foreground shrink-0">
                  <path d="M23.498 6.186a11.393 11.393 0 00-6.186-5.688L12.186 0 6.186.498a11.393 11.393 0 00-5.688 6.186L0 11.814l.498 6.002a11.393 11.393 0 00 6.186 5.688l5.5 1.496 6.002-.498a11.393 11.393 0 00 5.688-6.186l1.126-5.502-.502-6.628z"/>
                </svg>
                <span className="font-semibold text-fd-foreground text-sm tracking-tight">Svelte</span>
              </div>
            </div>
          </div>
        </div>

        {/* RE-IMPLEMENTED FOOTER LINE */}
        <div className="relative h-px w-full mt-32">
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-screen h-px bg-neutral-200 dark:bg-white/[0.08]" />
        </div>

        {/* Extra space below */}
        <div className="h-16" />
      </div>
    </div>
  );
}
