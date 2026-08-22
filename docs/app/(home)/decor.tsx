"use client";

import { cn } from '@/lib/cn';

/**
 * Deterministic PRNG so server and client render identical patterns
 * (no hydration mismatch).
 */
function seededPattern(seed: number, count: number, density: number): boolean[] {
  let s = seed >>> 0;
  const out: boolean[] = [];
  for (let i = 0; i < count; i++) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    out.push(s / 4294967296 < density);
  }
  return out;
}

/**
 * Retro dither tile, a small grid of pixels, some filled.
 * Pure decoration; scatter in section gutters like Radius's dither cells.
 */
export function DitherTile({
  seed = 7,
  cells = 6,
  cellSize = 6,
  density = 0.45,
  className,
}: {
  seed?: number;
  cells?: number;
  cellSize?: number;
  density?: number;
  className?: string;
}) {
  const pattern = seededPattern(seed, cells * cells, density);
  const px = cells * cellSize;
  return (
    <svg
      aria-hidden
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      className={cn('text-neutral-900 dark:text-white', className)}
    >
      {pattern.map((filled, i) => {
        if (!filled) return null;
        const x = (i % cells) * cellSize;
        const y = Math.floor(i / cells) * cellSize;
        return (
          <rect key={i} x={x} y={y} width={cellSize} height={cellSize} fill="currentColor" />
        );
      })}
    </svg>
  );
}

/**
 * Subtle dot field, CSS-only background texture for large surfaces.
 */
export function DotField({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 text-neutral-900 dark:text-white',
        '[background-image:radial-gradient(circle,currentColor_1px,transparent_1px)]',
        '[background-size:22px_22px]',
        'opacity-[0.05]',
        className,
      )}
    />
  );
}

/**
 * A short run of ASCII blocks, terminal-flavored divider ornament.
 */
export function AsciiRule({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'select-none overflow-hidden whitespace-nowrap font-mono text-[10px] leading-none tracking-[0.35em] text-neutral-300 dark:text-white/[0.08]',
        className,
      )}
    >
      {'▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚'}
    </div>
  );
}
