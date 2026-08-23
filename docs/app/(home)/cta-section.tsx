"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Github } from 'lucide-react';
import { CtaMosaic } from './cta-mosaic';

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toLocaleString('en-US');
}

export default function CTASection() {
  const [stars, setStars] = useState<number | null>(null);
  const [downloads, setDownloads] = useState<number | null>(null);
  const [totalDownloads, setTotalDownloads] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://api.github.com/repos/pyrpc/pyrpc')
      .then((r) => r.json())
      .then((d) => setStars(d.stargazers_count ?? null))
      .catch(() => {});

    fetch('/api/downloads')
      .then((r) => r.json())
      .then((d) => {
        setDownloads(d.downloads ?? null);
        setTotalDownloads(d.total ?? null);
      })
      .catch(() => {});
  }, []);

  const stats = [
    { value: downloads !== null ? formatCount(downloads) : '--', suffix: '/ month' },
    { value: totalDownloads !== null ? formatCount(totalDownloads) : '--', suffix: 'downloads' },
    { value: stars !== null ? formatCount(stars) : '--', suffix: 'stars' },
  ];

  return (
    <div className="relative mt-16 w-full overflow-hidden border-y border-foreground/[0.08] bg-background dark:border-white/[0.1] dark:bg-[#060606] md:mt-20">
      {/* Mosaic background, abstract tile field, quiet behind the copy */}
      <CtaMosaic />

      <div className="relative mx-auto flex max-w-[1200px] flex-col items-center px-6 py-16 text-center md:px-10 md:py-20">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4 }}
          className="text-2xl md:text-4xl font-semibold tracking-tight leading-tight text-neutral-900 dark:text-white"
        >
          Ship end-to-end types.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4, delay: 0.06 }}
          className="mt-5 max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-white/80"
        >
          Define procedures in Python. Consume them in TypeScript with full type
          safety. No schema drift, no codegen pipelines.
        </motion.p>

        {/* Usage metadata, inline mono stats above a dashed rule */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="mt-10 grid w-full max-w-lg grid-cols-3 gap-4 border-t border-dashed border-neutral-300 dark:border-white/[0.16] pt-5"
        >
          {stats.map((s) => (
            <div key={s.suffix} className="font-mono text-sm">
              <span className="text-neutral-900 dark:text-white">{s.value}</span>{' '}
              <span className="text-neutral-500 dark:text-white/60">{s.suffix}</span>
            </div>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4, delay: 0.14 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/docs/get-started/installation"
            className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-8 py-2.5 text-sm font-medium tracking-tight text-white transition-all hover:bg-neutral-700 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            Get Started
          </Link>

          {/* Framed bracket button, same treatment as the hero secondary */}
          <a
            href="https://github.com/pyrpc/pyrpc"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center rounded-md px-6 py-2.5 text-sm font-medium tracking-tight text-neutral-900 dark:text-white"
          >
            <span
              aria-hidden
              className="absolute left-0 top-0 h-2 w-2 border-l border-t border-neutral-300 transition-colors group-hover:border-neutral-400 dark:border-neutral-700 dark:group-hover:border-neutral-500"
            />
            <span
              aria-hidden
              className="absolute right-0 top-0 h-2 w-2 border-r border-t border-neutral-300 transition-colors group-hover:border-neutral-400 dark:border-neutral-700 dark:group-hover:border-neutral-500"
            />
            <span
              aria-hidden
              className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-neutral-300 transition-colors group-hover:border-neutral-400 dark:border-neutral-700 dark:group-hover:border-neutral-500"
            />
            <span
              aria-hidden
              className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-neutral-300 transition-colors group-hover:border-neutral-400 dark:border-neutral-700 dark:group-hover:border-neutral-500"
            />
            <span
              aria-hidden
              className="absolute -top-[7px] left-[14px] hidden h-[3px] w-[18px] sm:block [--hatch:#d4d4d4] dark:[--hatch:#404040]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(-45deg, var(--hatch) 0, var(--hatch) 1px, transparent 1px, transparent 4px)',
                backgroundSize: '4px 3px',
              }}
            />
            <span
              aria-hidden
              className="absolute -bottom-[7px] right-[14px] hidden h-[3px] w-[18px] sm:block [--hatch:#d4d4d4] dark:[--hatch:#404040]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(-45deg, var(--hatch) 0, var(--hatch) 1px, transparent 1px, transparent 4px)',
                backgroundSize: '4px 3px',
              }}
            />
            <span
              aria-hidden
              className="absolute -left-[9px] -top-[9px] font-mono text-[10px] leading-none text-neutral-400 transition-colors group-hover:text-neutral-500 dark:text-neutral-600 dark:group-hover:text-neutral-400"
            >
              +
            </span>
            <span
              aria-hidden
              className="absolute -right-[9px] -top-[9px] font-mono text-[10px] leading-none text-neutral-400 transition-colors group-hover:text-neutral-500 dark:text-neutral-600 dark:group-hover:text-neutral-400"
            >
              +
            </span>
            <span
              aria-hidden
              className="absolute -bottom-[9px] -left-[9px] font-mono text-[10px] leading-none text-neutral-400 transition-colors group-hover:text-neutral-500 dark:text-neutral-600 dark:group-hover:text-neutral-400"
            >
              +
            </span>
            <span
              aria-hidden
              className="absolute -bottom-[9px] -right-[9px] font-mono text-[10px] leading-none text-neutral-400 transition-colors group-hover:text-neutral-500 dark:text-neutral-600 dark:group-hover:text-neutral-400"
            >
              +
            </span>
            <Github className="mr-2 h-4 w-4" />
            Star
          </a>
        </motion.div>
      </div>
    </div>
  );
}
