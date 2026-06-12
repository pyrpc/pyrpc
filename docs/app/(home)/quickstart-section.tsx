"use client";

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

function QuickstartStep({ step, title, description, filename, children, terminal, lines }: {
  step: number;
  title: string;
  description: string;
  filename?: string;
  children: ReactNode;
  terminal?: ReactNode;
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
      <div className="flex items-center gap-3 mb-6">
        <span className="font-mono text-[11px] text-fd-foreground/30 tracking-wider">
          0{step}
        </span>
        <div className="h-px w-6 bg-fd-border" />
        <h3 className="relative text-2xl md:text-3xl font-medium tracking-tight text-neutral-900 dark:text-[var(--heading-dark)] heading-display">
          {title}
        </h3>
      </div>
      <p className="text-[13px] md:text-[14px] leading-relaxed text-neutral-600 dark:text-white/80 mb-8 max-w-xl font-sans">
        {description}
      </p>

      <div className="relative w-full code-block-hero">
        <div className="relative w-full border border-neutral-200 dark:border-[#1a1a1a] bg-neutral-50 dark:bg-black overflow-hidden">
          {filename && (
            <div className="border-b border-neutral-200 dark:border-[#1a1a1a] px-4 py-2">
              <span className="text-[11px] font-mono text-neutral-500 tracking-tight">{filename}</span>
            </div>
          )}
          <div className="flex">
            <div className="flex-1 min-w-0 overflow-x-auto">
              {lines ? (
                <div className="grid grid-cols-[40px_1fr] font-mono text-sm leading-relaxed">
                  <div className="whitespace-pre text-center hl-ln border-r border-neutral-200 dark:border-[#1a1a1a] select-none leading-relaxed pb-6 pt-5">
                    {Array.from({ length: lines }, (_, i) => `${i + 1}\n`).join('')}
                  </div>
                  <div className="overflow-x-auto whitespace-pre-wrap leading-relaxed pb-6 pt-5 pl-4 pr-8">
                    {children}
                  </div>
                </div>
              ) : (
                <div className="p-5 text-sm leading-relaxed whitespace-pre-wrap">
                  {children}
                </div>
              )}
            </div>
            {terminal && (
              <div className="flex-1 min-w-0 border-l border-neutral-200 dark:border-[#1a1a1a] p-4 font-mono text-[12px] leading-relaxed bg-neutral-100/60 dark:bg-[#0f0f0f]/60 overflow-x-auto">
                {terminal}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function QuickstartSection({
  snippet1,
  snippet2,
  snippet3,
}: {
  snippet1: ReactNode;
  snippet2: ReactNode;
  snippet3: ReactNode;
}) {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const copyQuickstart = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="mt-32 mb-20 relative w-full">
      <div className="mb-20 flex flex-col items-center text-center max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4 }}
          className="relative text-[28px] md:text-[40px] font-normal leading-[34px] md:leading-[48px] tracking-tight text-neutral-900 dark:text-[var(--heading-dark)] mb-6 heading-display"
        >
          Ship in Three commands.
        </motion.h2>
        <p className="text-[15px] md:text-[17px] leading-relaxed text-neutral-600 dark:text-white/80 max-w-2xl mx-auto font-sans whitespace-nowrap">From zero to a running pyRPC server with a type-safe TypeScript client in under two minutes.</p>
      </div>

      <div className="flex flex-col gap-20 max-w-5xl mx-auto">
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
                  <span className="text-neutral-500 dark:text-neutral-600">$</span>{' '}<span className="text-neutral-800 dark:text-neutral-200">uv add pyrpc-core</span>
                </div>
                <button onClick={() => copyQuickstart('uv add pyrpc-core', 1)} className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer">
                  {copiedStep === 1 ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="text-neutral-600 dark:text-neutral-500">Resolved 8 packages in 320ms</div>
              <div className="text-neutral-600 dark:text-neutral-500">Installed 4 packages in 45ms</div>
              <div className="text-neutral-600 dark:text-neutral-500">+ pyrpc-core==0.3.0</div>
              <div className="text-neutral-600 dark:text-neutral-500">+ pydantic==2.7.1</div>
              <div className="mt-2"><span className="text-neutral-500 dark:text-neutral-600">$</span> <span className="inline-block w-[7px] h-[14px] bg-neutral-500 animate-pulse" /></div>
            </div>
          }
        >
          {snippet1}
        </QuickstartStep>

        <QuickstartStep
          step={2}
          title="Start the pyRPC dev server."
          description="Types are generated automatically as your server runs."
          filename="@pyrpc/types"
          lines={7}
          terminal={
            <div className="space-y-1">
              <div><span className="text-neutral-500 dark:text-neutral-600">$</span> <span className="text-neutral-800 dark:text-neutral-200">pyrpc dev</span></div>
              <div className="text-neutral-600 dark:text-neutral-500">Starting pyRPC dev server...</div>
              <div className="text-neutral-600 dark:text-neutral-500">Found 1 procedure</div>
              <div><span className="text-emerald-600 dark:text-emerald-500">✓</span> <span className="text-neutral-800 dark:text-neutral-200">Serving at http://localhost:8000</span></div>
              <div className="mt-2"><span className="text-neutral-500 dark:text-neutral-600">$</span> <span className="inline-block w-[7px] h-[14px] bg-neutral-500 animate-pulse" /></div>
            </div>
          }
        >
          {snippet2}
        </QuickstartStep>

        <QuickstartStep
          step={3}
          title="Ship type-safe TypeScript clients."
          description="Install the client package in your frontend project. Types flow from Python to TypeScript - no manual codegen, no schema drift."
          filename="client.ts"
          lines={8}
          terminal={
            <div className="space-y-1">
              <div><span className="text-neutral-500 dark:text-neutral-600">$</span> <span className="text-neutral-800 dark:text-neutral-200">npm install @pyrpc/client</span></div>
              <div className="text-neutral-600 dark:text-neutral-500">Resolved 12 packages in 1.4s</div>
              <div className="text-neutral-600 dark:text-neutral-500">+ @pyrpc/client@0.3.0</div>
              <div className="text-neutral-600 dark:text-neutral-500">+ @pyrpc/types@0.3.0</div>
              <div className="mt-2"><span className="text-neutral-500 dark:text-neutral-600">$</span> <span className="inline-block w-[7px] h-[14px] bg-neutral-500 animate-pulse" /></div>
            </div>
          }
        >
          {snippet3}
        </QuickstartStep>
      </div>
    </div>
  );
}
