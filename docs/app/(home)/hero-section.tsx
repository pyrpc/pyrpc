"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

const LATEST_VERSION = 'v0.10.1';

function CodePanel({ code }: { code: ReactNode }) {
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
      className="contents"
    >
      <div className="whitespace-pre text-right text-neutral-300 dark:text-neutral-700 border-r border-neutral-200 dark:border-[#1e1e1e] select-none leading-[1.7] pb-6 text-[11px] px-3 pt-5 w-9">
        {lines > 0 ? Array.from({ length: lines }, (_, i) => `${i + 1}\n`).join('') : ''}
      </div>
      <div
        ref={ref}
        className="pl-4 pr-6 whitespace-pre overflow-x-auto leading-[1.7] pb-6 pt-5 text-[12.5px] [&_pre]:inline [&_pre]:!bg-transparent [&_pre]:!p-0"
      >
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
  const [copied, setCopied] = useState(false);
  const [codeTab, setCodeTab] = useState<'server' | 'generated' | 'client'>('server');
  const [codeLoaded, setCodeLoaded] = useState(false);
  const userInteractedRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText('uv add pyrpc-core');
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
      setCodeTab(prev =>
        prev === 'server' ? 'generated' : prev === 'generated' ? 'client' : 'server'
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 w-full pt-[9rem] md:pt-[12rem] pb-20">

      {/* Left column */}
      <div className="flex flex-col items-start gap-7 max-w-[480px]">

        {/* Version pill */}
        <Link
          href="/changelog"
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all text-[11px] font-mono group"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-neutral-700 dark:text-neutral-300 font-medium">{LATEST_VERSION}</span>
          <span className="text-neutral-400 dark:text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-colors">
            What&apos;s new &#8594;
          </span>
        </Link>

        {/* Headline + subtext */}
        <div className="flex flex-col gap-4">
          <h1 className="text-[44px] md:text-[64px] font-normal leading-[1.04] tracking-tight text-neutral-900 dark:text-[var(--heading-dark)] heading-display">
            Type-safe APIs<br />for Python.
          </h1>
          <p className="text-[16px] leading-relaxed text-neutral-500 dark:text-neutral-400 max-w-[36ch]">
            Write Python procedures, get fully-typed TypeScript clients. No schemas, no drift, no OpenAPI.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link href="/docs/get-started/installation">
            <button className="px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium text-[13px] tracking-tight hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors active:scale-[0.98] rounded-md cursor-pointer">
              Get started
            </button>
          </Link>
          <Link href="/demo">
            <button className="px-5 py-2.5 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-[13px] tracking-tight hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors rounded-md cursor-pointer">
              Live demo
            </button>
          </Link>
        </div>

        {/* Install command — single line, uv default */}
        <div className="flex items-center gap-2.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0a0a0a] px-4 py-2.5 rounded-md group hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors w-full sm:w-auto">
          <span className="text-neutral-400 dark:text-neutral-600 select-none font-mono text-[12px]">$</span>
          <span className="font-mono text-[12px] text-neutral-800 dark:text-neutral-200 tracking-tight flex-1 select-all">
            uv add pyrpc-core
          </span>
          <button
            onClick={copyToClipboard}
            className="text-neutral-400 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer shrink-0"
            aria-label="Copy install command"
          >
            {copied
              ? <Check className="w-3.5 h-3.5 text-emerald-500" />
              : <Copy className="w-3.5 h-3.5" />
            }
          </button>
        </div>

        {/* pip footnote */}
        <p className="text-[11px] text-neutral-400 dark:text-neutral-600 font-mono -mt-4">
          or: pip install pyrpc-core
        </p>
      </div>

      {/* Right column — code viewer */}
      <div className="w-full max-w-[600px] lg:ml-auto">
        <div className="w-full border border-neutral-200 dark:border-[#1e1e1e] bg-white dark:bg-[#0d0d0d] rounded-lg overflow-hidden shadow-sm dark:shadow-none">
          {/* Tab bar */}
          <div className="border-b border-neutral-200 dark:border-[#1e1e1e] bg-neutral-50 dark:bg-[#0a0a0a]">
            <nav className="flex items-stretch px-2">
              {(['server', 'generated', 'client'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setCodeTab(tab); userInteractedRef.current = true; }}
                  className={cn(
                    "relative px-3 py-2.5 text-[11px] font-mono tracking-tight transition-colors duration-150 cursor-pointer",
                    codeTab === tab
                      ? "text-neutral-900 dark:text-white"
                      : "text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400"
                  )}
                >
                  {tab === 'server' ? 'server.py' : tab === 'generated' ? 'generated.ts' : 'client.ts'}
                  {codeTab === tab && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-neutral-900 dark:bg-white/70"
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Code area */}
          <div className="grid grid-cols-[36px_1fr] font-mono min-h-[360px]">
            {!codeLoaded && (
              <div className="col-span-2 flex items-center justify-center min-h-[360px]">
                <div className="flex gap-1.5">
                  {[0, 150, 300].map(d => (
                    <span
                      key={d}
                      style={{ animationDelay: `${d}ms` }}
                      className="w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full animate-pulse"
                    />
                  ))}
                </div>
              </div>
            )}
            <AnimatePresence mode="wait">
              {codeLoaded && codeTab === 'server'    && <CodePanel key="server"    code={serverCode} />}
              {codeLoaded && codeTab === 'generated' && <CodePanel key="generated" code={generatedCode} />}
              {codeLoaded && codeTab === 'client'    && <CodePanel key="client"    code={clientCode} />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
