"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import HeroSection from "./hero-section";
import QuickstartSection from "./quickstart-section";
import CTASection from "./cta-section";
import type { ReactNode } from 'react';

// ── CompatDot ─────────────────────────────────────────────────────────────────
// Theme-aware tooltip using fd (Fumadocs) CSS variables so it matches
// both light and dark mode correctly without hardcoded color values.

const EXAMPLE_LINKS: Record<string, { github: string; docs: string }> = {
  'FastAPI+React':   { github: 'https://github.com/pyrpc/pyrpc/tree/main/examples/fastapi-react',   docs: '/docs/client/react' },
  'FastAPI+Next.js': { github: 'https://github.com/pyrpc/pyrpc/tree/main/examples/fastapi-nextjs',  docs: '/docs/client/nextjs' },
  'FastAPI+Vue':     { github: 'https://github.com/pyrpc/pyrpc/tree/main/examples/fastapi-vue',     docs: '/docs/client/vue' },
  'FastAPI+Svelte':  { github: 'https://github.com/pyrpc/pyrpc/tree/main/examples/fastapi-svelte',  docs: '/docs/client/svelte' },
  'Flask+React':     { github: 'https://github.com/pyrpc/pyrpc/tree/main/examples/flask-react',     docs: '/docs/client/react' },
  'Flask+Next.js':   { github: 'https://github.com/pyrpc/pyrpc/tree/main/examples/flask-nextjs',    docs: '/docs/client/nextjs' },
  'Flask+Vue':       { github: 'https://github.com/pyrpc/pyrpc/tree/main/examples/flask-vue',       docs: '/docs/client/vue' },
  'Flask+Svelte':    { github: 'https://github.com/pyrpc/pyrpc/tree/main/examples/flask-svelte',    docs: '/docs/client/svelte' },
  'Django+React':    { github: 'https://github.com/pyrpc/pyrpc/tree/main/examples/django-react',    docs: '/docs/client/react' },
  'Django+Next.js':  { github: 'https://github.com/pyrpc/pyrpc/tree/main/examples/django-nextjs',   docs: '/docs/client/nextjs' },
  'Django+Vue':      { github: 'https://github.com/pyrpc/pyrpc/tree/main/examples/django-vue',      docs: '/docs/client/vue' },
  'Django+Svelte':   { github: 'https://github.com/pyrpc/pyrpc/tree/main/examples/django-svelte',   docs: '/docs/client/svelte' },
};

function CompatDot({ server, client }: { server: string; client: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const key = `${server}+${client}`;
  const links = EXAMPLE_LINKS[key];

  // Standard click-outside to close — no fragile onBlur
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center justify-center">
      <button
        onClick={() => setOpen(v => !v)}
        className="group/dot inline-flex items-center justify-center w-8 h-8 rounded-full cursor-pointer focus:outline-none"
        aria-label={`${server} + ${client} — view example`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500/60 ring-2 ring-emerald-500/15 group-hover/dot:bg-emerald-500 group-hover/dot:ring-emerald-500/35 group-hover/dot:scale-110 transition-all duration-150" />
      </button>

      {open && links && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-max">
          {/* Uses fd tokens: works in both light and dark without hardcoding */}
          <div className="bg-fd-popover border border-fd-border rounded-lg px-3 py-2.5 shadow-lg">
            <p className="text-[11px] font-mono text-fd-foreground/70 mb-2 text-center whitespace-nowrap">
              {server} + {client}
            </p>
            <div className="flex items-center gap-2">
              <a
                href={links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-fd-muted hover:bg-fd-accent transition-colors text-[10px] font-mono text-fd-foreground/70 hover:text-fd-foreground whitespace-nowrap"
                onClick={e => e.stopPropagation()}
              >
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="opacity-60 shrink-0">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                Example
              </a>
              <a
                href={links.docs}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-fd-muted hover:bg-fd-accent transition-colors text-[10px] font-mono text-fd-foreground/70 hover:text-fd-foreground whitespace-nowrap"
                onClick={e => e.stopPropagation()}
              >
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="opacity-60 shrink-0">
                  <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V3.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z" />
                </svg>
                Docs
              </a>
            </div>
          </div>
          {/* Theme-aware caret using a CSS border trick tied to fd-border */}
          <div className="absolute top-full left-1/2 -translate-x-1/2">
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-fd-border" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Individual framework marquee — separate logos, not pairs ─────────────────

const FRAMEWORKS = [
  { name: 'FastAPI', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg', invert: false },
  { name: 'Flask',   icon: 'https://cdn.simpleicons.org/flask',  invert: true  },
  { name: 'Django',  icon: 'https://cdn.simpleicons.org/django', invert: true  },
  { name: 'React',   icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',   invert: false },
  { name: 'Next.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg', invert: true  },
  { name: 'Vue',     icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',   invert: false },
  { name: 'Svelte',  icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg',  invert: false },
];

function FrameworkMarquee() {
  const tripled = [...FRAMEWORKS, ...FRAMEWORKS, ...FRAMEWORKS];
  return (
    <div className="relative w-full overflow-hidden py-3 border-y border-fd-border/50 bg-neutral-50/30 dark:bg-black/20">
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-white dark:from-fd-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-white dark:from-fd-background to-transparent pointer-events-none" />
      <motion.div
        className="flex items-center gap-12 w-max"
        animate={{ x: ['0%', '-33.333%'] }}
        transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
      >
        {tripled.map((fw, i) => (
          <span key={i} className="flex items-center gap-2.5 shrink-0">
            <img
              src={fw.icon}
              alt={fw.name}
              width={16}
              height={16}
              className={`w-4 h-4 opacity-45${fw.invert ? ' dark:invert' : ''}`}
            />
            <span className="text-[11px] font-mono text-fd-foreground/35">{fw.name}</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function StatsStrip() {
  const stats = [
    { value: 'v0.10.1', label: 'latest release' },
    { value: 'MIT', label: 'license' },
    { value: 'Python 3.11+', label: 'required' },
    { value: '12', label: 'framework combos' },
  ];
  return (
    <div className="border-b border-fd-border/50 bg-white dark:bg-black">
      <div className="max-w-[1100px] mx-auto px-6 md:px-12 lg:px-20 py-5">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
          {stats.map(s => (
            <div key={s.label} className="flex items-baseline gap-2">
              <span className="font-mono text-[14px] font-medium text-neutral-900 dark:text-white">{s.value}</span>
              <span className="text-[11px] text-neutral-400 dark:text-neutral-600">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Before/After pain section ─────────────────────────────────────────────────

function PainSection() {
  return (
    <div className="py-24 max-w-[1100px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-12"
      >
        <h2 className="text-[28px] md:text-[36px] font-normal leading-tight tracking-tight text-neutral-900 dark:text-[var(--heading-dark)] heading-display mb-4">
          You wrote the types twice. Now you don&apos;t.
        </h2>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-400 max-w-[44ch] mx-auto">
          Two codebases, one type contract. pyRPC keeps Python and TypeScript in sync automatically.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-px bg-fd-border rounded-xl overflow-hidden border border-fd-border">
        {/* Before */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-[#0a0a0a] p-6"
        >
          <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-600 uppercase tracking-widest mb-4">Before</p>
          <pre className="text-[11.5px] font-mono leading-relaxed text-neutral-500 dark:text-neutral-500 overflow-x-auto whitespace-pre-wrap">{`# Python — define in one language
@app.post("/user/{id}")
async def get_user(id: int) -> UserResponse:
    return await db.get_user(id)

// TypeScript — rewrite by hand, drift over time
async function getUser(id: number): Promise<{
  id: number
  name: string
  email: string   // ← is this still accurate?
}> {
  const res = await fetch(\`/user/\${id}\`)
  return res.json() as any  // ← unsafe cast
}`}</pre>
        </motion.div>

        {/* After */}
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-white dark:bg-[#0a0a0a] p-6"
        >
          <p className="text-[10px] font-mono uppercase tracking-widest mb-4" style={{ color: '#34d59a' }}>With pyRPC</p>
          <pre className="text-[11.5px] font-mono leading-relaxed text-neutral-600 dark:text-neutral-300 overflow-x-auto whitespace-pre-wrap">{`# Python — one decorator, that's it
@rpc.query
async def get_user(id: int) -> User:
    return await db.get_user(id)

// TypeScript — auto-generated, always current
const { data } = api.get_user.useQuery({ id: 1 })
//     ^? { id: number; name: string; email: string }
//  fully typed · no cast · no drift · no maintenance`}</pre>
        </motion.div>
      </div>
    </div>
  );
}

// ── Features data ─────────────────────────────────────────────────────────────

const supportingFeatures = [
  { title: "Full IDE autocompletion.",        description: "Rename a Python procedure and TypeScript flags every broken call site instantly." },
  { title: "Bad inputs blocked.",             description: "Pydantic v2 validates every request before it reaches your logic. Always." },
  { title: "Zero manual codegen.",            description: "pyrpc dev watches your files and regenerates types on every save." },
  { title: "Universal server adapters.",      description: "FastAPI, Flask, Django, or raw ASGI. Mount with one line." },
  { title: "Modular routers.",               description: "Namespace procedures into isolated routers. Merge them at the root." },
];

// ── Framework grid data — all 7, individually ─────────────────────────────────

const ALL_FRAMEWORKS = [
  { name: 'FastAPI', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg', invert: false, href: '/docs/server/adapters/fastapi' },
  { name: 'Flask',   icon: 'https://cdn.simpleicons.org/flask',  invert: true,  href: '/docs/server/adapters/flask'  },
  { name: 'Django',  icon: 'https://cdn.simpleicons.org/django', invert: true,  href: '/docs/server/adapters/django' },
  { name: 'React',   icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',   invert: false, href: '/docs/client/react'   },
  { name: 'Next.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg', invert: true,  href: '/docs/client/nextjs'  },
  { name: 'Vue',     icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',   invert: false, href: '/docs/client/vue'     },
  { name: 'Svelte',  icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg',  invert: false, href: '/docs/client/svelte'  },
];

// ── HomeClient ────────────────────────────────────────────────────────────────

export default function HomeClient({
  serverCode, generatedCode, clientCode, snippet1, snippet2, snippet3,
}: {
  serverCode: ReactNode; generatedCode: ReactNode; clientCode: ReactNode;
  snippet1: ReactNode;   snippet2: ReactNode;      snippet3: ReactNode;
}) {
  return (
    <div className="text-fd-foreground font-sans min-h-screen overflow-x-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(250,250,249,0.04)_0%,transparent_100%)]" />

      {/* 1. Hero — full viewport, waves show through, text bottom-left */}
      <HeroSection serverCode={serverCode} generatedCode={generatedCode} clientCode={clientCode} />

      {/* 2. Stats strip */}
      <StatsStrip />

      {/* 3. Framework marquee — coverage proof, full width */}
      <FrameworkMarquee />

      {/* 3. Before/After pain moment */}
      <div className="px-6 md:px-12 lg:px-20">
        <PainSection />
      </div>

      {/* 4. Demo video */}
      <div className="px-6 md:px-12 lg:px-20">
        <div className="mb-16 flex flex-col items-center text-center max-w-[1100px] mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4 }}
            className="text-[28px] md:text-[36px] font-normal leading-tight tracking-tight text-neutral-900 dark:text-[var(--heading-dark)] mb-10 heading-display"
          >
            See pyRPC in action.
          </motion.h2>
          <div className="w-full rounded-xl overflow-hidden border border-fd-border shadow-xl bg-black">
            <video autoPlay muted loop playsInline className="w-full h-auto block">
              <source src="/demo/pyrpc_demo.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </div>

      {/* 5. Features — asymmetric: one large hero card + 5 supporting */}
      <div className="px-6 md:px-12 lg:px-20">
        <div className="mt-4 mb-6 flex flex-col items-center text-center max-w-[1100px] mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4 }}
            className="text-[28px] md:text-[36px] font-normal leading-tight tracking-tight text-neutral-900 dark:text-[var(--heading-dark)] mb-4 heading-display"
          >
            One decorator. Full type safety.
          </motion.h2>
          <p className="text-[15px] md:text-[17px] leading-relaxed text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
            Python defines the types. TypeScript consumes them, automatically.
          </p>
        </div>

        <div className="mb-20 border border-fd-border rounded-xl overflow-hidden bg-white dark:bg-black max-w-[1100px] mx-auto">
          {/* Large card — no eyebrow, heading carries its own weight */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5 }}
            className="group p-10 md:p-14 border-b border-fd-border relative overflow-hidden bg-neutral-50 dark:bg-[#050505]"
          >
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-start">
              <div>
                <h3 className="mb-3 text-[22px] md:text-[26px] font-medium tracking-tight text-fd-foreground leading-tight">
                  Cross-language type contracts.
                </h3>
                <p className="text-fd-foreground/55 text-[14px] leading-relaxed">
                  Define once in Python. TypeScript gets the full type signature automatically — parameters, return types, nested models. No schemas to write, no types to maintain.
                </p>
              </div>
              <div className="font-mono text-[11px] leading-relaxed bg-neutral-100 dark:bg-[#0c0c0c] border border-fd-border/60 rounded-lg p-5 overflow-x-auto">
                <div className="text-emerald-600/70 dark:text-emerald-500/50 mb-1 text-[10px]"># Python</div>
                <div className="text-fd-foreground/70"><span className="text-purple-600/80 dark:text-purple-400/70">@rpc.query</span></div>
                <div className="text-fd-foreground/70"><span className="text-blue-600/70 dark:text-blue-400/60">def</span> get_user(id: <span className="text-orange-500/70">int</span>) -&gt; <span className="text-orange-500/70">User</span>: ...</div>
                <div className="mt-4 text-fd-foreground/25 text-[10px] mb-1">// TypeScript — auto-generated</div>
                <div className="text-fd-foreground/70">api.get_user.<span className="text-blue-500/70">useQuery</span>(<span className="text-orange-400/70">{"{ id: 1 }"}</span>)</div>
                <div className="text-fd-foreground/35 text-[10px] mt-0.5">//  ^? {"{ id: number; name: string }"}</div>
              </div>
            </div>
          </motion.div>

          {/* 5 supporting cards — no eyebrow numbers, headings stand alone */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {supportingFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="p-8 border-r border-b border-fd-border"
              >
                <h3 className="mb-2 text-[15px] font-medium tracking-tight text-fd-foreground">
                  {feature.title}
                </h3>
                <p className="text-fd-foreground/50 text-[13px] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Connect your framework — icon grid */}
      <div className="py-20 border-t border-fd-border bg-neutral-50/30 dark:bg-[#030303]">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4 }}
            className="mb-3"
          >
            <h2 className="text-[28px] md:text-[36px] font-normal leading-tight tracking-tight text-neutral-900 dark:text-white mb-3 heading-display">
              Connect your framework.
            </h2>
            <p className="text-[15px] text-neutral-500 dark:text-neutral-400 max-w-[52ch]">
              Browse our{' '}
              <a href="/docs/server/adapters/fastapi" className="underline underline-offset-2 decoration-neutral-300 dark:decoration-neutral-700 hover:decoration-current transition-colors">server adapter</a>
              {' '}and{' '}
              <a href="/docs/client/react" className="underline underline-offset-2 decoration-neutral-300 dark:decoration-neutral-700 hover:decoration-current transition-colors">client guide</a>
              {' '}docs for full setup details.
            </p>
          </motion.div>

          {/* Icon grid layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-10">
            {ALL_FRAMEWORKS.map((fw, i) => (
              <motion.a
                key={fw.name}
                href={fw.href}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="group flex items-center gap-3 px-4 py-3.5 rounded-lg border border-neutral-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] hover:bg-neutral-50 dark:hover:bg-white/[0.06] hover:border-neutral-300 dark:hover:border-white/[0.12] transition-all"
              >
                <div className="w-8 h-8 rounded-md flex items-center justify-center bg-neutral-100 dark:bg-white/[0.06] shrink-0">
                  <img
                    src={fw.icon}
                    alt={fw.name}
                    width={18}
                    height={18}
                    className={`w-[18px] h-[18px]${fw.invert ? ' dark:invert' : ''}`}
                  />
                </div>
                <span className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                  {fw.name}
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Quickstart */}
      <div className="px-6 md:px-12 lg:px-20">
        <QuickstartSection snippet1={snippet1} snippet2={snippet2} snippet3={snippet3} />
      </div>

      {/* 8. CTA */}
      <CTASection />
    </div>
  );
}
