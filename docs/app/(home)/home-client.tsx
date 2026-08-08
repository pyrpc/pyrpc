"use client";

import { motion } from 'framer-motion';
import HeroSection from "./hero-section";
import QuickstartSection from "./quickstart-section";
import CTASection from "./cta-section";
import type { ReactNode } from 'react';

const COMBOS = [
  "FastAPI + React", "FastAPI + Next.js", "FastAPI + Vue", "FastAPI + Svelte",
  "Flask + React", "Flask + Next.js", "Flask + Vue", "Flask + Svelte",
  "Django + React", "Django + Next.js", "Django + Vue", "Django + Svelte",
];

function FrameworkMarquee() {
  const doubled = [...COMBOS, ...COMBOS];
  return (
    <div className="relative w-full overflow-hidden py-3 border-y border-fd-border/50 bg-neutral-50/50 dark:bg-black/30">
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-neutral-50 dark:from-fd-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-neutral-50 dark:from-fd-background to-transparent pointer-events-none" />
      <motion.div
        className="flex gap-8 w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 32, ease: "linear", repeat: Infinity }}
      >
        {doubled.map((combo, i) => (
          <span key={i} className="text-[11px] font-mono text-fd-foreground/35 tracking-wide whitespace-nowrap">
            {combo}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

const supportingFeatures = [
  {
    id: "02",
    title: "Full IDE autocompletion.",
    description: "Rename a Python procedure and TypeScript flags every broken call site instantly.",
  },
  {
    id: "03",
    title: "Bad inputs blocked at the boundary.",
    description: "Pydantic v2 validates every request before it reaches your logic.",
  },
  {
    id: "04",
    title: "Zero manual codegen.",
    description: "pyrpc dev watches your files and regenerates types on every save.",
  },
  {
    id: "05",
    title: "Universal server adapters.",
    description: "FastAPI, Flask, Django, or raw ASGI. Mount with one line.",
  },
  {
    id: "06",
    title: "Modular routers.",
    description: "Namespace procedures into isolated routers. Merge them at the root.",
  },
];

const pythonServers = [
  { name: 'FastAPI', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg' },
  { name: 'Flask', icon: 'https://cdn.simpleicons.org/flask' },
  { name: 'Django', icon: 'https://cdn.simpleicons.org/django' },
];

const tsClients = [
  { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
  { name: 'Next.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' },
  { name: 'Vue', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg' },
  { name: 'Svelte', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg' },
];

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
      </div>

      {/* 12-combo marquee - shows coverage at a glance */}
      <FrameworkMarquee />

      <div className="px-6 md:px-12 lg:px-20">

        {/* Demo video */}
        <div className="mt-20 mb-16 flex flex-col items-center text-center max-w-[1100px] mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4 }}
            className="relative text-[28px] md:text-[40px] font-normal leading-[34px] md:leading-[48px] tracking-tight text-neutral-900 dark:text-[var(--heading-dark)] mb-10 heading-display"
          >
            See pyRPC in action.
          </motion.h2>
          <div className="w-full rounded-xl overflow-hidden border border-fd-border shadow-2xl bg-black transition-shadow duration-500 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)] dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <video autoPlay muted loop playsInline className="w-full h-auto block">
              <source src="/demo/pyrpc_demo.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Features - asymmetric: one large featured card + 5 supporting */}
        <div className="mt-20 mb-6 flex flex-col items-center text-center max-w-[1100px] mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4 }}
            className="relative text-[28px] md:text-[40px] font-normal leading-[34px] md:leading-[48px] tracking-tight text-neutral-900 dark:text-[var(--heading-dark)] mb-4 heading-display"
          >
            Everything you need.
          </motion.h2>
          <p className="text-[15px] md:text-[17px] leading-relaxed text-neutral-600 dark:text-white/80 max-w-xl mx-auto font-sans">
            Python defines the types. TypeScript consumes them, automatically.
          </p>
        </div>

        <div className="mb-20 border border-fd-border rounded-xl overflow-hidden shadow-2xl bg-white dark:bg-black max-w-[1100px] mx-auto">
          {/* Large featured card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5 }}
            className="group p-10 md:p-14 border-b border-fd-border relative overflow-hidden bg-neutral-50 dark:bg-[#050505]"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_50%_60%_at_5%_50%,rgba(0,0,0,0.02)_0%,transparent_100%)] dark:bg-[radial-gradient(ellipse_50%_60%_at_5%_50%,rgba(255,255,255,0.015)_0%,transparent_100%)]" />
            <span className="text-fd-foreground/15 font-mono text-[10px] mb-6 block uppercase tracking-widest group-hover:text-fd-foreground/35 transition-colors">01</span>
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-start">
              <div>
                <h3 className="mb-3 font-sans text-[22px] md:text-[26px] font-medium tracking-tight text-fd-foreground leading-tight">
                  Cross-language type contracts.
                </h3>
                <p className="text-fd-foreground/55 text-[14px] leading-relaxed">
                  Define once in Python. TypeScript gets the full type signature automatically - parameters, return types, nested models. No schemas to write, no types to maintain by hand.
                </p>
              </div>
              <div className="font-mono text-[11px] leading-relaxed bg-neutral-100 dark:bg-[#0c0c0c] border border-fd-border/60 rounded-lg p-5 overflow-x-auto">
                <div className="text-emerald-600/80 dark:text-emerald-500/60 mb-1 text-[10px]"># Python</div>
                <div className="text-fd-foreground/70"><span className="text-purple-600/80 dark:text-purple-400/80">@rpc.query</span></div>
                <div className="text-fd-foreground/70"><span className="text-blue-600/70 dark:text-blue-400/70">def</span> get_user(id: <span className="text-orange-500/70">int</span>) -&gt; <span className="text-orange-500/70">User</span>: ...</div>
                <div className="mt-4 text-fd-foreground/30 text-[10px] mb-1">// TypeScript - auto-generated</div>
                <div className="text-fd-foreground/70">api.get_user.useQuery(<span className="text-orange-400/70">{"{ id: 1 }"}</span>)</div>
                <div className="text-fd-foreground/35 text-[10px] mt-0.5">//  ^? {"{ id: number; name: string }"}</div>
              </div>
            </div>
          </motion.div>

          {/* 5 supporting cards in 3-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {supportingFeatures.map((feature, i) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="group p-8 border-r border-b border-fd-border relative transition-all overflow-hidden"
              >
                <span className="text-fd-foreground/20 font-mono text-[10px] mb-8 block uppercase tracking-widest group-hover:text-fd-foreground/40 transition-colors">{feature.id}</span>
                <h3 className="mb-2 font-sans text-[16px] font-medium tracking-tight text-fd-foreground">
                  {feature.title}
                </h3>
                <p className="text-fd-foreground/50 text-[13px] leading-relaxed max-w-[28ch]">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      {/* Fits your stack - full-bleed section with compatibility matrix */}
      <div className="py-20 border-t border-fd-border bg-neutral-50/60 dark:bg-[#040404]">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 lg:px-0">
          <div className="flex flex-col items-center text-center mb-14">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4 }}
              className="relative text-[28px] md:text-[40px] font-normal leading-[34px] md:leading-[48px] tracking-tight text-neutral-900 dark:text-[var(--heading-dark)] mb-4 heading-display"
            >
              Fits your stack.
            </motion.h2>
            <p className="text-[15px] md:text-[17px] leading-relaxed text-neutral-600 dark:text-white/80 max-w-[480px] mx-auto font-sans">
              pyRPC works with the Python server and TypeScript frontend you already use. No lock-in.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse mx-auto max-w-[640px]">
              <thead>
                <tr>
                  <th className="pb-5 pr-8 w-[140px]" />
                  {tsClients.map(fw => (
                    <th key={fw.name} className="pb-5 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <img src={fw.icon} alt={fw.name} className="w-5 h-5" />
                        <span className="text-[10px] font-mono text-fd-foreground/45">{fw.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pythonServers.map((server, si) => (
                  <tr key={server.name} className="border-t border-fd-border/50">
                    <td className="py-4 pr-8">
                      <div className="flex items-center gap-2.5">
                        <img src={server.icon} alt={server.name} className="w-4 h-4" />
                        <span className="text-[12px] font-mono text-fd-foreground/55">{server.name}</span>
                      </div>
                    </td>
                    {tsClients.map(client => (
                      <td key={client.name} className="py-4 text-center">
                        <span className="inline-flex items-center justify-center w-5 h-5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500/70 ring-2 ring-emerald-500/20" />
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-8 text-center text-[11px] font-mono text-fd-foreground/30 tracking-wide">
            12 working examples in the repo
          </p>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-20">
        <QuickstartSection
          snippet1={snippet1}
          snippet2={snippet2}
          snippet3={snippet3}
        />
      </div>

      <CTASection />
    </div>
  );
}
