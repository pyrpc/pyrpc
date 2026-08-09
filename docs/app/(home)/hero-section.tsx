"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

const LATEST_VERSION = 'v0.10.1';

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText('uv add pyrpc-core');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    // Full viewport hero — BackgroundWaves (fixed, z-0) shows through
    <div className="relative min-h-[100dvh] w-full flex flex-col">

      {/* Content lifted up so the section below peeks — Neon pattern */}
      <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 lg:px-20 pb-28 md:pb-40">

        {/* Badge */}
        <Link
          href="/changelog"
          className="inline-flex items-center gap-2 mb-6 group"
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: '#34d59a' }}
          />
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors">
            {LATEST_VERSION} — What&apos;s new
          </span>
        </Link>

        {/* Headline */}
        <h1 className="text-[48px] md:text-[68px] lg:text-[80px] font-normal leading-[1.02] tracking-[-0.03em] text-neutral-900 dark:text-white mb-8 max-w-[900px] heading-display">
          Type-safe APIs<br />for Python.
        </h1>

        {/* CTAs */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/docs/get-started/installation">
            <button
              className="px-6 py-2.5 rounded-full font-medium text-[14px] tracking-tight text-black transition-all active:scale-[0.97] cursor-pointer hover:opacity-85"
              style={{ backgroundColor: '#34d59a' }}
            >
              Get started
            </button>
          </Link>
          <Link href="/docs">
            <button className="px-6 py-2.5 rounded-full border border-neutral-300 dark:border-white/20 text-neutral-700 dark:text-white font-medium text-[14px] tracking-tight hover:bg-neutral-100/60 dark:hover:bg-white/[0.07] hover:border-neutral-400 dark:hover:border-white/30 transition-all cursor-pointer backdrop-blur-sm">
              Read the docs
            </button>
          </Link>

          {/* Install inline */}
          <div
            className="hidden sm:flex items-center gap-2 border border-neutral-200 dark:border-white/[0.1] bg-white/70 dark:bg-black/40 backdrop-blur-sm px-4 py-2.5 rounded-full transition-colors ml-2"
          >
            <span className="text-neutral-400 dark:text-neutral-600 select-none font-mono text-[12px]">$</span>
            <span className="font-mono text-[12px] text-neutral-800 dark:text-neutral-200 tracking-tight select-all">
              uv add pyrpc-core
            </span>
            <button
              onClick={copyToClipboard}
              className="ml-1 text-neutral-400 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
              aria-label="Copy install command"
            >
              {copied
                ? <Check className="w-3.5 h-3.5" style={{ color: '#34d59a' }} />
                : <Copy className="w-3.5 h-3.5" />
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
