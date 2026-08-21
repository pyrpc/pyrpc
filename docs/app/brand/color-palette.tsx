'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

const COLORS = [
  { name: 'Background', var: '--fd-background', bgClass: 'bg-fd-background' },
  { name: 'Foreground', var: '--fd-foreground', bgClass: 'bg-fd-foreground' },
  { name: 'Primary', var: '--fd-primary', bgClass: 'bg-fd-primary' },
  { name: 'Primary FG', var: '--fd-primary-foreground', bgClass: 'bg-fd-primary-foreground' },
  { name: 'Secondary', var: '--fd-secondary', bgClass: 'bg-fd-secondary' },
  { name: 'Secondary FG', var: '--fd-secondary-foreground', bgClass: 'bg-fd-secondary-foreground' },
  { name: 'Muted', var: '--fd-muted', bgClass: 'bg-fd-muted' },
  { name: 'Muted FG', var: '--fd-muted-foreground', bgClass: 'bg-fd-muted-foreground' },
  { name: 'Accent', var: '--fd-accent', bgClass: 'bg-fd-accent' },
  { name: 'Accent FG', var: '--fd-accent-foreground', bgClass: 'bg-fd-accent-foreground' },
  { name: 'Border', var: '--fd-border', bgClass: 'bg-fd-border' },
];

/** Resolve any CSS color (oklch, rgb, …) to a 6-digit hex string. */
function toHex(raw: string): string {
  if (!raw) return '';
  const el = document.createElement('span');
  el.style.color = raw;
  el.style.display = 'none';
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color;
  document.body.removeChild(el);
  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '';
  return (
    '#' +
    match
      .slice(1)
      .map((n) => parseInt(n, 10).toString(16).padStart(2, '0').toUpperCase())
      .join('')
  );
}

export function ColorPalette() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const next: Record<string, string> = {};
    for (const color of COLORS) {
      next[color.name] = toHex(rootStyle.getPropertyValue(color.var));
    }
    setValues(next);
  }, []);

  function handleCopy(name: string) {
    const value = values[name];
    if (!value) return;
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(name);
    window.setTimeout(() => setCopied((c) => (c === name ? null : c)), 1500);
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-fd-border/50 border border-fd-border rounded-lg overflow-hidden">
      {COLORS.map((color) => (
        <button
          key={color.name}
          type="button"
          onClick={() => handleCopy(color.name)}
          className="group cursor-pointer bg-fd-background p-4 space-y-3 text-left outline-none transition-colors hover:bg-fd-muted/60 focus-visible:bg-fd-muted/60 dark:hover:bg-white/[0.04] dark:focus-visible:bg-white/[0.04]"
        >
          <div
            className={cn(
              'h-12 w-full rounded-md border border-fd-border/50 transition-colors group-hover:border-fd-foreground/30',
              color.bgClass,
            )}
          />
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-medium text-fd-foreground">{color.name}</p>
              <span className="font-mono text-[10px] text-fd-muted-foreground">
                {values[color.name]}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[10px] text-fd-muted-foreground truncate">
                {color.var}
              </p>
              <span
                className={cn(
                  'font-mono text-[10px] transition-opacity',
                  copied === color.name
                    ? 'text-fd-foreground opacity-100'
                    : 'opacity-0 group-hover:opacity-40',
                )}
              >
                {copied === color.name ? 'copied ✓' : 'copy'}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
