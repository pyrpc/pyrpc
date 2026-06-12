"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Check, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTASection() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-24 relative overflow-hidden border-t border-b border-neutral-200 dark:border-white/[0.08] bg-gradient-to-b from-neutral-100 to-neutral-50 dark:from-black dark:to-[#0a0a0a]">
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.08)_0%,transparent_60%)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_60%)]" />
      <div className="relative z-10 py-16 md:py-20 flex flex-col items-center text-center px-6">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4 }}
          className="text-3xl md:text-4xl font-bold tracking-tighter text-neutral-900 dark:text-white mb-4 heading-display"
        >
          Ready to ship type-safe APIs?
        </motion.h2>
        <p className="text-[15px] md:text-[17px] leading-relaxed text-neutral-600 dark:text-white/80 max-w-xl mx-auto font-sans mb-8">
          One command to get started. Define your procedures in Python, generate TypeScript clients, and ship in minutes.
        </p>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link href="/docs/get-started/installation">
            <button className="px-6 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black font-medium text-[13px] tracking-tight hover:opacity-90 transition-all active:scale-[0.98] rounded-md cursor-pointer">
              Get Started
            </button>
          </Link>
          <button
            onClick={() => {
              navigator.clipboard.writeText('uv add pyrpc-core');
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-2 px-5 py-2.5 border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-[#111] font-mono text-[13px] text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors rounded-md cursor-pointer"
          >
            <span className="text-neutral-400 dark:text-neutral-500 select-none">{'>'}</span>
            <span className="tracking-tight">uv add pyrpc-core</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 ml-1" /> : <Copy className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600 ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
}
