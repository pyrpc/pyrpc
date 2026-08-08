"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';


function CodePanel({ code, className }: { code: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const text = ref.current.textContent || '';
      setLines(text.split('\n').length);
    }
  }, [code]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={cn("contents", className)}
    >
      <div className="whitespace-pre text-center hl-ln border-r border-neutral-200 dark:border-[#1a1a1a] select-none leading-relaxed pb-12">
        {lines > 0 ? Array.from({ length: lines }, (_, i) => `${i + 1}\n`).join('') : ''}
      </div>
      <div ref={ref} className="pl-0 pr-8 whitespace-pre overflow-x-auto leading-relaxed pb-12 [&_pre]:inline [&_pre]:!bg-transparent [&_pre]:!p-0">
        {code}
      </div>
    </motion.div>
  );
}

export default function HeroSection({
  serverCode,
  generatedCode,
  clientCode,
}: {
  serverCode: ReactNode;
  generatedCode: ReactNode;
  clientCode: ReactNode;
}) {
  const [manager, setManager] = useState<'uv' | 'pip' | 'npm' | 'pnpm' | 'bun'>('uv');
  const [copied, setCopied] = useState(false);
  const [codeTab, setCodeTab] = useState<'server' | 'generated' | 'client'>('server');
  const [codeLoaded, setCodeLoaded] = useState(false);
  const userInteractedRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);

  const command = manager === 'uv' ? 'uv add pyrpc-core' :
    manager === 'pip' ? 'pip install pyrpc-core' :
      manager === 'npm' ? 'npm install @pyrpc/client' :
        manager === 'pnpm' ? 'pnpm add @pyrpc/client' :
          'bun add @pyrpc/client';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    setCodeLoaded(true);
    prefersReducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (userInteractedRef.current || prefersReducedMotionRef.current) return;
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
    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 w-full pt-[10.5rem] md:pt-[13.5rem] pb-24">
      {/* Left Column */}
      <div className="flex flex-col items-start gap-10 max-w-[480px]">
        <h1 className="relative text-[42px] md:text-[64px] font-normal leading-[48px] md:leading-[72px] tracking-tight text-neutral-900 dark:text-[var(--heading-dark)] heading-display">
          Type-safe APIs<br />for Python.
        </h1>
        <p className="text-[15px] md:text-[17px] leading-relaxed text-neutral-600 dark:text-white/80 max-w-xl">
          Build APIs in Python and consume them in TypeScript with full inference. No schemas. No drift. No OpenAPI.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/demo">
            <button className="px-6 py-2.5 bg-neutral-900 dark:bg-fd-foreground text-white dark:text-fd-background font-medium text-[13px] tracking-tight hover:opacity-90 transition-all active:scale-[0.98] rounded-md w-fit cursor-pointer">
              Try it live
            </button>
          </Link>
          <div className="flex w-full sm:w-auto items-center gap-3 border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-[#0f0f0f] px-4 py-2.5 font-mono text-[12px] text-neutral-700 dark:text-neutral-300 group/install hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors rounded-md">
            <span className="text-emerald-600/70 dark:text-emerald-500/60 select-none shrink-0">$</span>
            <span className="text-neutral-800 dark:text-white/85 tracking-tight flex-1">{command}</span>
            <button onClick={copyToClipboard} className="text-neutral-500 dark:text-neutral-600 hover:text-neutral-800 dark:hover:text-white transition-colors shrink-0 ml-1 cursor-pointer">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-neutral-300 dark:border-neutral-800">
              {['uv', 'pip'].map((m, i) => (
                <span key={m} className="flex items-center">
                  {i > 0 && <span className="text-neutral-300 dark:text-neutral-800 select-none mx-1.5">|</span>}
                  <button onClick={() => setManager(m as 'uv' | 'pip')} className={cn("text-[10px] uppercase tracking-widest transition-colors px-2 py-0.5 rounded cursor-pointer", manager === m ? "bg-neutral-300 dark:bg-neutral-700 text-neutral-800 dark:text-white font-bold" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300")}>{m}</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Code Viewer */}
      <div className="w-full max-w-[600px] lg:ml-auto code-block-hero">
        <div className="w-full border border-neutral-200 dark:border-[#1a1a1a] bg-neutral-50 dark:bg-black">
          <div className="border-b border-neutral-200 dark:border-[#1a1a1a]">
            <nav className="flex items-stretch px-3">
              {(['server', 'generated', 'client'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setCodeTab(tab); userInteractedRef.current = true; }}
                  className={cn(
                    "relative px-3 py-2.5 text-[11px] font-mono tracking-tight transition-colors duration-200 cursor-pointer",
                    codeTab === tab ? "text-neutral-900 dark:text-white" : "text-neutral-400 dark:text-white/45 hover:text-neutral-600 dark:hover:text-white/70"
                  )}
                >
                  {tab === 'server' ? 'server.py' : tab === 'generated' ? 'generated.ts' : 'client.ts'}
                  {codeTab === tab && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-900 dark:bg-white/90" />
                  )}
                </button>
              ))}
            </nav>
          </div>
          <div className="grid grid-cols-[40px_1fr] font-mono text-sm leading-none min-h-[340px]">
            {!codeLoaded && (
              <div className="col-span-2 flex items-center justify-center min-h-[340px]">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-neutral-600 rounded-full animate-pulse" />
                  <span className="w-2 h-2 bg-neutral-600 rounded-full animate-pulse [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-neutral-600 rounded-full animate-pulse [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <AnimatePresence mode="wait">
              {codeLoaded && codeTab === 'server' && <CodePanel key="server" code={serverCode} />}
              {codeLoaded && codeTab === 'generated' && <CodePanel key="generated" code={generatedCode} />}
              {codeLoaded && codeTab === 'client' && <CodePanel key="client" code={clientCode} />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
