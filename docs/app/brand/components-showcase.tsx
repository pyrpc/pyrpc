'use client';

import * as ContextMenu from '@radix-ui/react-context-menu';

function BracketButton({ children }: { children: React.ReactNode }) {
  return (
    <span className="group relative inline-flex cursor-pointer items-center justify-center px-6 py-2.5 font-mono text-[11px] tracking-wide text-fd-foreground/70 transition-all active:scale-[0.98]">
      <span aria-hidden className="absolute left-0 top-0 h-2 w-2 border-l border-t border-fd-foreground/40" />
      <span aria-hidden className="absolute right-0 top-0 h-2 w-2 border-r border-t border-fd-foreground/40" />
      <span aria-hidden className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-fd-foreground/40" />
      <span aria-hidden className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-fd-foreground/40" />
      <span aria-hidden className="absolute -left-[9px] -top-[9px] font-mono text-[10px] leading-none text-fd-foreground/30">+</span>
      <span aria-hidden className="absolute -right-[9px] -top-[9px] font-mono text-[10px] leading-none text-fd-foreground/30">+</span>
      <span aria-hidden className="absolute -bottom-[9px] -left-[9px] font-mono text-[10px] leading-none text-fd-foreground/30">+</span>
      <span aria-hidden className="absolute -bottom-[9px] -right-[9px] font-mono text-[10px] leading-none text-fd-foreground/30">+</span>
      {children}
    </span>
  );
}

export function ButtonSamples() {
  return (
    <div className="divide-y divide-fd-border border border-fd-border rounded-lg">
      <div className="flex flex-wrap items-center justify-start gap-x-8 gap-y-4 p-8">
        <span className="inline-flex cursor-pointer items-center justify-center rounded-md bg-neutral-900 px-6 py-2 text-sm font-medium tracking-tight text-white transition-all hover:bg-neutral-700 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-neutral-200">
          Default
        </span>
        <BracketButton>Secondary</BracketButton>
        <span className="cursor-pointer text-sm font-medium tracking-tight text-fd-muted-foreground transition-colors hover:text-fd-foreground active:scale-[0.98]">
          Ghost
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-start gap-x-8 gap-y-4 p-8">
        <span className="inline-flex cursor-pointer items-center justify-center rounded-md border border-fd-border px-2.5 py-1.5 text-[10px] font-medium tracking-tight text-fd-foreground transition-colors hover:bg-fd-accent">
          Small
        </span>
        <span className="inline-flex cursor-pointer items-center justify-center rounded-md bg-neutral-900 px-6 py-2 text-sm font-medium tracking-tight text-white transition-all hover:bg-neutral-700 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-neutral-200">
          Default
        </span>
        <span className="inline-flex cursor-pointer items-center justify-center rounded-md bg-neutral-900 px-8 py-2.5 text-sm font-medium tracking-tight text-white transition-all hover:bg-neutral-700 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-neutral-200">
          Large
        </span>
      </div>
    </div>
  );
}

export function ContextMenuDemo() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className="flex h-40 cursor-context-none select-none items-center justify-center rounded-lg border border-dashed border-fd-border bg-fd-background font-mono text-[11px] tracking-wide text-fd-muted-foreground transition-colors hover:border-fd-foreground/30 hover:text-fd-foreground/60">
        Right-click here
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="min-w-[220px] bg-white dark:bg-[#0a0a0a] rounded-lg border border-neutral-200 dark:border-white/[0.08] shadow-xl p-1.5 z-[100] animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2">
          <ContextMenu.Item className="flex items-center gap-2.5 px-2 py-1.5 text-[13px] font-medium text-fd-muted-foreground outline-none cursor-default rounded-md hover:bg-fd-accent hover:text-fd-foreground focus:bg-fd-accent focus:text-fd-foreground transition-colors">
            Copy Logo as PNG
          </ContextMenu.Item>
          <ContextMenu.Item className="flex items-center gap-2.5 px-2 py-1.5 text-[13px] font-medium text-fd-muted-foreground outline-none cursor-default rounded-md hover:bg-fd-accent hover:text-fd-foreground focus:bg-fd-accent focus:text-fd-foreground transition-colors">
            Copy Wordmark as PNG
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
