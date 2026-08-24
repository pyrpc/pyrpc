"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Check, Copy, Eye, X } from 'lucide-react';
import { cn } from '@/lib/cn';

const PYTHON_ICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg';
const TS_ICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg';

/* Syntax tokens, theme aware like the rest of the site:
   light mode draws near-ink monochrome with a green accent,
   dark mode keeps the Vesper palette on the near-black surface. */
const CODE = 'text-neutral-700 dark:text-[#dcdcdc]';
const PUNCT = 'text-neutral-400 dark:text-[#7a7a7a]';
const KW = 'font-medium text-neutral-900 dark:text-[#e8e8e8]';
const FN = 'text-neutral-600 dark:text-[#c9c9c9]';
const STR = 'text-emerald-700 dark:text-[#97c983]';
const TYPE = 'italic text-neutral-500 dark:text-[#a3a3a3]';
const DIM = 'text-neutral-400 dark:text-[#6b6b6b]';

const AGENT_PROMPT = `Set up pyRPC in my project and connect my Python backend to my TypeScript frontend with end-to-end type safety.

Install pyrpc-core (use uv if the project already uses it, otherwise pip). If I have FastAPI or Django configured, mount the RPC router into my existing app instead of creating a new one. Create server.py with a few @model schemas and @rpc procedures. Run pyrpc dev to generate the typed client.

On the frontend, install @pyrpc/client, create api.ts with createClient<Types>() and httpBatchLink pointing at my server URL, then replace any hand-written fetch calls with typed api.<procedure> calls.`;

const MCP_COMMAND = 'pyrpc mcp';

function LineNumbers({ count }: { count: number }) {
  return (
    <div
      aria-hidden
      className="select-none border-r border-foreground/[0.08] pb-6 pl-4 pr-3 pt-4 text-right font-mono text-sm leading-[1.7] text-neutral-400 dark:text-[#4d4d4d]"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>{i + 1}</div>
      ))}
    </div>
  );
}

function ServerCode() {
  return (
    <div className="font-mono text-sm leading-[1.7]">
      <div>
        <span className={KW}>from</span> <span className={CODE}>pyrpc_core</span> <span className={KW}>import</span> <span className={CODE}>rpc, model</span>
      </div>
      <div>&nbsp;</div>
      <div>
        <span className={DIM}>@model</span>
      </div>
      <div>
        <span className={KW}>class</span> <span className={FN}>Post</span><span className={PUNCT}>:</span>
      </div>
      <div>
        &nbsp;&nbsp;&nbsp;&nbsp;<span className={CODE}>id</span><span className={PUNCT}>:</span> <span className={TYPE}>int</span>
      </div>
      <div>
        &nbsp;&nbsp;&nbsp;&nbsp;<span className={CODE}>title</span><span className={PUNCT}>:</span> <span className={TYPE}>str</span>
      </div>
      <div>
        &nbsp;&nbsp;&nbsp;&nbsp;<span className={CODE}>published</span><span className={PUNCT}>:</span> <span className={TYPE}>bool</span> <span className={PUNCT}>=</span> <span className={KW}>False</span>
      </div>
      <div>&nbsp;</div>
      <div>
        <span className={DIM}>@rpc</span>
      </div>
      <div>
        <span className={KW}>def</span> <span className={FN}>get_post</span><span className={PUNCT}>(</span><span className={CODE}>id</span><span className={PUNCT}>:</span> <span className={TYPE}>int</span><span className={PUNCT}>)</span> <span className={KW}>-&gt;</span> <span className={FN}>Post</span><span className={PUNCT}>:</span>
      </div>
      <div>
        &nbsp;&nbsp;&nbsp;&nbsp;<span className={KW}>return</span> <span className={FN}>Post</span><span className={PUNCT}>(</span><span className={CODE}>id</span><span className={PUNCT}>=</span><span className={CODE}>id</span><span className={PUNCT}>,</span> <span className={CODE}>title</span><span className={PUNCT}>=</span><span className={STR}>&quot;Hello pyRPC&quot;</span><span className={PUNCT}>)</span>
      </div>
    </div>
  );
}

function ClientCode() {
  return (
    <div className="font-mono text-sm leading-[1.7]">
      <div>
        <span className={KW}>import</span> <span className={PUNCT}>{'{'}</span> <span className={FN}>createClient</span><span className={PUNCT}>,</span> <span className={FN}>httpBatchLink</span> <span className={PUNCT}>{'}'}</span> <span className={KW}>from</span> <span className={STR}>&quot;@pyrpc/client&quot;</span><span className={PUNCT}>;</span>
      </div>
      <div>
        <span className={KW}>import type</span> <span className={PUNCT}>{'{'}</span> <span className={FN}>Types</span> <span className={PUNCT}>{'}'}</span> <span className={KW}>from</span> <span className={STR}>&quot;@pyrpc/types&quot;</span><span className={PUNCT}>;</span>
      </div>
      <div>&nbsp;</div>
      <div>
        <span className={KW}>const</span> <span className={CODE}>api</span> <span className={KW}>=</span> <span className={FN}>createClient</span><span className={PUNCT}>&lt;</span><span className={FN}>Types</span><span className={PUNCT}>&gt;</span><span className={PUNCT}>({'{'}</span>
      </div>
      <div>
        &nbsp;&nbsp;<span className={CODE}>links</span><span className={PUNCT}>:</span> <span className={PUNCT}>[</span>
      </div>
      <div>
        &nbsp;&nbsp;&nbsp;&nbsp;<span className={FN}>httpBatchLink</span><span className={PUNCT}>({'{'}</span>
      </div>
      <div>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className={CODE}>url</span><span className={PUNCT}>:</span> <span className={STR}>&quot;http://localhost:8000&quot;</span><span className={PUNCT}>,</span>
      </div>
      <div>
        &nbsp;&nbsp;&nbsp;&nbsp;<span className={PUNCT}>{'}'}),</span>
      </div>
      <div>
        &nbsp;&nbsp;<span className={PUNCT}>],</span>
      </div>
      <div><span className={PUNCT}>{'}'});</span></div>
      <div>&nbsp;</div>
      <div>
        <span className={KW}>const</span> <span className={CODE}>post</span> <span className={KW}>=</span> <span className={KW}>await</span> <span className={CODE}>api</span><span className={PUNCT}>.</span><span className={FN}>get_post</span><span className={PUNCT}>({'{'}</span> <span className={CODE}>id</span><span className={PUNCT}>:</span> <span className={TYPE}>1</span> <span className={PUNCT}>{'}'});</span>
      </div>
      <div>
        <span className={CODE}>post</span><span className={PUNCT}>.</span><span className={CODE}>title</span><span className={PUNCT}>;</span>
        <span className={DIM}>{' // '}<span className="underline decoration-dotted underline-offset-4">string</span></span>
      </div>
    </div>
  );
}

const CODE_TABS = [
  { label: 'server.py', icon: PYTHON_ICON, code: <ServerCode />, lines: 11 },
  { label: 'client.ts', icon: TS_ICON, code: <ClientCode />, lines: 13 },
];

function AgentCopyButton({ text, withText }: { text: string; withText?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      aria-label="Copy"
      className={cn(
        "shrink-0 cursor-pointer transition-colors",
        withText
          ? "flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
          : "p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
      )}
    >
      {copied ? <Check className={cn("h-3 w-3", !withText && "text-[#5a8a4a] dark:text-[#97c983]")} /> : <Copy className="h-3 w-3" />}
      {withText && <span>{copied ? "Copied" : "Copy prompt"}</span>}
    </button>
  );
}

function PromptModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  // Portal to body so the dialog escapes <main>'s stacking context and
  // layers above the fixed site header like every other overlay.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full agent prompt"
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6"
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-2xl rounded-md border border-foreground/[0.08] bg-neutral-50 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.15)] dark:border-white/[0.06] dark:bg-[#0a0a0a] dark:shadow-[0_24px_80px_-24px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 py-3 pl-5 pr-3 dark:border-white/[0.08]">
          <h3 className="text-sm font-medium tracking-tight text-neutral-900 dark:text-white">
            Agent prompt
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer p-1.5 text-neutral-400 transition-colors hover:text-neutral-900 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body, thin scrollbar */}
        <div className="thin-scrollbar max-h-[60vh] overflow-y-auto px-5 py-4">
          <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-neutral-700 dark:text-white/70">
            {AGENT_PROMPT}
          </pre>
        </div>

        {/* Footer, copy below the line */}
        <div className="flex items-center justify-end border-t border-neutral-200 px-5 py-3 dark:border-white/[0.08]">
          <button
            onClick={() => {
              navigator.clipboard.writeText(AGENT_PROMPT);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium tracking-tight text-neutral-700 transition-colors hover:bg-neutral-100 active:scale-[0.98] dark:border-white/[0.14] dark:text-white/80 dark:hover:bg-white/[0.06]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#5a8a4a] dark:text-[#97c983]" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy prompt
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const AGENT_TABS = [
  { label: 'CLI', command: 'uv add pyrpc-core' },
  { label: 'Prompt', command: undefined, content: AGENT_PROMPT },
  { label: 'MCP', command: MCP_COMMAND },
  { label: 'Skills', command: 'npx skills add pyrpc' },
];

export default function HeroSection() {
  const [agentTab, setAgentTab] = useState(0);
  const [codeTab, setCodeTab] = useState(0);
  const [promptOpen, setPromptOpen] = useState(false);

  const activeAgent = AGENT_TABS[agentTab];
  const activeCode = CODE_TABS[codeTab];

  return (
    <section className="flex min-h-[calc(100svh-6rem)] md:min-h-[calc(100svh-8rem)] w-full items-center px-6 pb-8 pt-40">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-10 xl:gap-16">
      {/* Left, headline, subcopy, actions, agent card */}
      <div className="flex w-full flex-col items-center text-center lg:items-start lg:text-left">
        <h1 className="text-balance text-4xl font-semibold tracking-tight leading-tight text-neutral-900 dark:text-white">
          The type-safe bridge between Python and TypeScript.
        </h1>
        <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-neutral-600 dark:text-white/60">
          Define your API once in Python. Consume it in TypeScript with end-to-end type safety. No schema
          drift. No hand-written clients.
        </p>

        {/* CLI / Prompt / MCP / Skills, agent tab card */}
        <div className="mt-8 w-full max-w-lg rounded-md border border-foreground/[0.1] relative overflow-hidden text-left">
          <div className="flex items-center border-b border-foreground/[0.1]">
            {AGENT_TABS.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setAgentTab(i)}
                className={cn(
                  'relative cursor-pointer px-4 py-2 text-[12px] transition-colors duration-150',
                  agentTab === i
                    ? 'text-neutral-800 dark:text-neutral-200'
                    : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-400',
                )}
              >
                {t.label}
                {agentTab === i && (
                  <div className="absolute bottom-0 left-4 right-4 h-[1.5px] bg-neutral-600 dark:bg-neutral-400" />
                )}
              </button>
            ))}
          </div>
          {activeAgent.content ? (
            <div className="bg-neutral-100/50 px-5 py-4 dark:bg-[#050505]">
              <p className="truncate text-[13px] font-medium leading-relaxed text-neutral-700 dark:text-neutral-200">
                {activeAgent.content.split('\n\n')[0]}
              </p>
              <div className="relative mt-1.5">
                <p className="line-clamp-2 text-xs leading-relaxed text-neutral-400 dark:text-neutral-500">
                  {activeAgent.content.split('\n\n').slice(1).join(' ')}
                </p>
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-neutral-100/50 to-transparent dark:from-[#050505]" />
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-foreground/[0.04] pt-2">
                <button
                  onClick={() => setPromptOpen(true)}
                  className="flex cursor-pointer items-center gap-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                >
                  <Eye className="h-3 w-3" />
                  View full prompt
                </button>
                <AgentCopyButton text={activeAgent.content} withText />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 bg-neutral-100/50 px-4 py-3 dark:bg-[#050505]">
              <code className="truncate font-mono text-[13px]">
                <span className="text-[#5a8a4a] dark:text-[#97c983]">{activeAgent.command!.split(' ')[0]}</span>{' '}
                <span className="text-neutral-700 dark:text-neutral-300">
                  {activeAgent.command!.split(' ').slice(1).join(' ')}
                </span>
              </code>
              <AgentCopyButton text={activeAgent.command!} />
            </div>
          )}
        </div>

        <PromptModal open={promptOpen} onClose={() => setPromptOpen(false)} />

        {/* Actions, below the agent tabs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
          <Link
            href="/docs/get-started/installation"
            className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md bg-neutral-900 px-6 py-2 text-sm font-medium tracking-tight text-white transition-all hover:bg-neutral-700 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            Get Started
          </Link>
          <Link href="/demo" className="shrink-0 self-center">
            <div className="relative group cursor-pointer whitespace-nowrap px-6 py-2 sm:w-auto transition-all active:scale-[0.98]">
              <div className="absolute top-0 left-[-8px] right-[-8px] h-[1px] bg-neutral-300 dark:bg-neutral-700 group-hover:bg-neutral-400 dark:group-hover:bg-neutral-500 transition-colors" />
              <div className="absolute bottom-0 left-[-8px] right-[-8px] h-[1px] bg-neutral-300 dark:bg-neutral-700 group-hover:bg-neutral-400 dark:group-hover:bg-neutral-500 transition-colors" />
              <div className="absolute left-0 top-[-8px] bottom-[-8px] w-[1px] bg-neutral-300 dark:bg-neutral-700 group-hover:bg-neutral-400 dark:group-hover:bg-neutral-500 transition-colors" />
              <div className="absolute right-0 top-[-8px] bottom-[-8px] w-[1px] bg-neutral-300 dark:bg-neutral-700 group-hover:bg-neutral-400 dark:group-hover:bg-neutral-500 transition-colors" />
              <div className="absolute bottom-[-10px] right-[-7px] font-mono text-[9px] text-neutral-400 dark:text-neutral-600 select-none transition-colors group-hover:text-neutral-500 dark:group-hover:text-neutral-400">
                +
              </div>
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.03)_6px,rgba(0,0,0,0.03)_12px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(255,255,255,0.03)_6px,rgba(255,255,255,0.03)_12px)] group-hover:bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.06)_6px,rgba(0,0,0,0.06)_12px)] dark:group-hover:bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(255,255,255,0.06)_6px,rgba(255,255,255,0.06)_12px)] transition-all" />
              <span className="relative z-10 text-[13px] font-medium tracking-tight text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                See it in action
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Right, tabbed code window: server.py / client.ts — theme aware,
          same surface treatment as better-auth's hero code block */}
      <div className="w-full min-w-0">
        <div className="w-full overflow-hidden border border-foreground/[0.08] bg-neutral-50 dark:bg-black">
          <div className="flex items-stretch border-b border-foreground/[0.08]">
            {CODE_TABS.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setCodeTab(i)}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 border-r border-foreground/[0.08] px-4 py-2 transition-colors',
                  codeTab === i
                    ? 'bg-neutral-100 dark:bg-white/[0.04] text-neutral-800 dark:text-[#dcdcdc]'
                    : 'bg-transparent text-neutral-400 hover:text-neutral-600 dark:text-[#6b6b6b] dark:hover:text-[#a3a3a3]',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.icon} alt="" className="h-3.5 w-3.5" />
                <span className="font-mono text-[11px]">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="flex h-[360px] overflow-hidden">
            <LineNumbers count={activeCode.lines} />
            <div className="min-w-0 flex-1 overflow-x-auto p-4 pl-3 pt-4">
              {activeCode.code}
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
