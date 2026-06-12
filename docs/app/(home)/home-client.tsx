"use client";

import { motion } from 'framer-motion';
import HeroSection from "./hero-section";
import QuickstartSection from "./quickstart-section";
import CTASection from "./cta-section";
import type { ReactNode } from 'react';

export default function HomeClient({
  serverCode,
  generatedCode,
  clientCode,
  snippet1,
  snippet2,
  snippet3,
}: {
  serverCode: ReactNode;
  generatedCode: ReactNode;
  clientCode: ReactNode;
  snippet1: ReactNode;
  snippet2: ReactNode;
  snippet3: ReactNode;
}) {
  return (
    <div className="text-fd-foreground font-sans min-h-screen overflow-x-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(250,250,249,0.04)_0%,transparent_100%)]" />

      <div className="px-6 md:px-12 lg:px-20">
        <HeroSection
          serverCode={serverCode}
          generatedCode={generatedCode}
          clientCode={clientCode}
        />

        <div className="mt-20 mb-16 flex flex-col items-center text-center max-w-[1100px] mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4 }}
            className="relative text-[28px] md:text-[40px] font-normal leading-[34px] md:leading-[48px] tracking-tight text-neutral-900 dark:text-[var(--heading-dark)] mb-6 heading-display"
          >
            Everything you need.
          </motion.h2>
          <p className="text-[15px] md:text-[17px] leading-relaxed text-neutral-600 dark:text-white/80 max-w-xl mx-auto font-sans">
            Python defines the types. TypeScript consumes them, automatically.
          </p>
        </div>

        <div className="mb-20 border border-fd-border rounded-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative bg-white dark:bg-black overflow-hidden shadow-2xl max-w-[1100px] mx-auto">
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
              title: "Modular Routers.",
              description: "Organize procedures into isolated routers with prefixes. Merge them into a clean, namespaced root router.",
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

      <div className="my-20 max-w-[1100px] mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4 }}
            className="relative text-[28px] md:text-[40px] font-normal leading-[34px] md:leading-[48px] tracking-tight text-neutral-900 dark:text-[var(--heading-dark)] mb-6 heading-display"
          >
            Fits your stack.
          </motion.h2>
          <p className="text-[15px] md:text-[17px] leading-relaxed text-neutral-600 dark:text-white/80 max-w-xl mx-auto font-sans">
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
              <span className="flex flex-col items-center gap-1.5">
                <img src="https://cdn.simpleicons.org/typescript" alt="" className="w-6 h-6" />
                <span className="text-[10px] font-mono text-fd-foreground/50">TypeScript</span>
              </span>
              <span className="flex flex-col items-center gap-1.5 opacity-40 relative saturate-[0.3]">
                <div className="relative">
                  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="" className="w-6 h-6" />
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-neutral-700/90 text-[7px] text-neutral-300 px-1.5 py-[1px] rounded-full whitespace-nowrap">Coming soon</span>
                </div>
                <span className="text-[10px] font-mono text-fd-foreground/35">React</span>
              </span>
              <span className="flex flex-col items-center gap-1.5 opacity-40 relative saturate-[0.3]">
                <div className="relative">
                  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" alt="" className="w-6 h-6" />
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-neutral-700/90 text-[7px] text-neutral-300 px-1.5 py-[1px] rounded-full whitespace-nowrap">Coming soon</span>
                </div>
                <span className="text-[10px] font-mono text-fd-foreground/35">Next.js</span>
              </span>
              <span className="flex flex-col items-center gap-1.5 opacity-40 relative saturate-[0.3]">
                <div className="relative">
                  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg" alt="" className="w-6 h-6" />
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-neutral-700/90 text-[7px] text-neutral-300 px-1.5 py-[1px] rounded-full whitespace-nowrap">Coming soon</span>
                </div>
                <span className="text-[10px] font-mono text-fd-foreground/35">Vue</span>
              </span>
              <span className="flex flex-col items-center gap-1.5 opacity-40 relative saturate-[0.3]">
                <div className="relative">
                  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg" alt="" className="w-6 h-6" />
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-neutral-700/90 text-[7px] text-neutral-300 px-1.5 py-[1px] rounded-full whitespace-nowrap">Coming soon</span>
                </div>
                <span className="text-[10px] font-mono text-fd-foreground/35">Svelte</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <QuickstartSection
        snippet1={snippet1}
        snippet2={snippet2}
        snippet3={snippet3}
      />

      <CTASection />
    </div>
  );
}
