"use client";

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Quickstart, steps in a left column; clicking one swaps the code window
 * on the right. The window matches the hero IDE: always dark, Vesper theme.
 */
const PYTHON_ICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg';
const TS_ICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg';

const Command = ({ children }: { children: React.ReactNode }) => (
  <code className="inline-block rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 font-mono text-[13px] font-medium text-neutral-800 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/90">
    {children}
  </code>
);

export default function QuickstartSection({
  snippet1,
  snippet2,
  snippet3,
  text1,
  text2,
  text3,
}: {
  snippet1: ReactNode;
  snippet2: ReactNode;
  snippet3: ReactNode;
  text1: string;
  text2: string;
  text3: string;
}) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  const STEPS = [
    {
      label: 'Install pyRPC',
      filename: 'server.py',
      icon: PYTHON_ICON,
      description: (
        <>
          <Command>uv add pyrpc-core</Command> installs the core runtime with Pydantic-powered validation and async support.
        </>
      ),
      code: snippet1,
      text: text1,
    },
    {
      label: 'Generate types',
      filename: '__pyrpc.ts',
      icon: TS_ICON,
      description: (
        <>
          <Command>pyrpc dev</Command> serves your procedures and regenerates the TypeScript types on every save.
        </>
      ),
      code: snippet2,
      text: text2,
    },
    {
      label: 'Call it from TypeScript',
      filename: 'client.ts',
      icon: TS_ICON,
      description: (
        <>
          Install <Command>@pyrpc/client</Command> in your frontend. Full inference, no manual codegen, no schema drift.
        </>
      ),
      code: snippet3,
      text: text3,
    },
  ];

  const step = STEPS[active];

  const copy = () => {
    navigator.clipboard.writeText(step.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-16 w-full border-t border-neutral-200 pt-8 dark:border-white/[0.1] md:mt-20 md:pt-10">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4 }}
          className="text-xl font-semibold tracking-tight leading-snug text-neutral-900 dark:text-[var(--heading-dark)]"
        >
          Ship in three commands.
        </motion.h2>
        <p className="font-sans text-sm leading-relaxed text-neutral-600 dark:text-white/80">
          From zero to a type-safe API in under two minutes.
        </p>
      </div>

      <div className="mx-auto flex flex-col md:flex-row max-w-[1200px] gap-8 px-6 pt-10 md:gap-0 md:px-10">
        {/* Step list and description */}
        <div className="w-full flex-shrink-0 flex flex-col md:w-[320px] lg:w-[360px] md:border-l md:border-r md:border-foreground/[0.08] dark:md:border-white/[0.06]">
          {STEPS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => {
                setActive(i);
                setCopied(false);
              }}
              className={`relative cursor-pointer border-t border-foreground/[0.08] dark:border-white/[0.06] px-4 py-4 md:px-6 md:py-5 text-left transition-colors ${
                active === i
                  ? 'bg-foreground/[0.02]'
                  : 'hover:bg-foreground/[0.015]'
              }`}
            >
              {active === i && (
                <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-neutral-900 dark:bg-white" />
              )}
              <span
                className={`font-mono text-[11px] uppercase tracking-wider ${
                  active === i ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-white/50'
                }`}
              >
                {s.label}
              </span>
            </button>
          ))}
          <div className="border-t border-foreground/[0.08] dark:border-white/[0.06]"></div>

          {/* Active Description */}
          <div className="mt-auto px-4 pt-6 pb-1 md:px-6 md:pt-8 text-sm leading-relaxed text-neutral-600 dark:text-white/70">
            {step.description}
          </div>
        </div>

        {/* Code window, theme aware: light surface in light mode, near-black in dark */}
        <div className="w-full min-w-0 flex-1 md:pl-10 lg:pl-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="w-full"
            >
              <div className="w-full overflow-hidden border border-foreground/[0.08] bg-neutral-50 dark:bg-black dark:border-white/[0.06]">
                <div className="flex items-center justify-between border-b border-foreground/[0.08] px-4 py-2 dark:border-white/[0.06]">
                  <span className="flex items-center gap-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={step.icon} alt="" className="h-3.5 w-3.5" />
                    <span className="font-mono text-[11px] text-neutral-500 dark:text-[#8a8a8a]">{step.filename}</span>
                  </span>
                  <button
                    onClick={copy}
                    aria-label="Copy code"
                    className="cursor-pointer text-neutral-500 transition-colors hover:text-neutral-900 dark:text-[#8a8a8a] dark:hover:text-[#dcdcdc]"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-[#97c983]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <div className="h-[460px] overflow-x-auto whitespace-pre p-5 font-mono text-sm leading-[1.75]">
                  {step.code}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
