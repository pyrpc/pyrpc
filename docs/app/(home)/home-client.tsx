"use client";

import HeroSection from "./hero-section";
import McpClientsBar from "./mcp-clients-bar";
import FeatureSections, { FRAMEWORKS } from "./feature-sections";
import CTASection from "./cta-section";
import TestimonialsSection from "./testimonials";
import QuickstartSection from "./quickstart-section";
import type { ReactNode } from 'react';

export default function HomeClient({
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
  return (
    <div className="text-fd-foreground font-sans min-h-screen overflow-x-hidden">
      {/* Ambient background, a single soft glow, nothing else */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(0,0,0,0.035),transparent_70%)] dark:bg-[radial-gradient(60%_100%_at_50%_0%,rgba(255,255,255,0.05),transparent_70%)]" />
      </div>

      <div className="relative z-10">
        <HeroSection />

        <McpClientsBar />

        {/* Supported Frameworks, full-width hairline, content centered inside */}
        <div className="mt-10 w-full md:mt-12 pt-8 md:pt-10 border-b border-neutral-200 dark:border-white/[0.1]">
          <div className="grid grid-cols-[1fr_min(1200px,100vw)_1fr] items-center">
            <div className="h-px bg-neutral-200 dark:bg-white/[0.1]"></div>
            <div className="flex items-center">
              <div className="h-px bg-neutral-200 dark:bg-white/[0.1] w-2 md:w-6 shrink-0"></div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 shrink-0 px-4">
                Supported Frameworks
              </p>
              <div className="h-px bg-neutral-200 dark:bg-white/[0.1] flex-1"></div>
            </div>
            <div className="h-px bg-neutral-200 dark:bg-white/[0.1]"></div>
          </div>
          <div className="mx-auto max-w-[1200px] px-6 md:px-10 pb-8 md:pb-10">
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-6 md:justify-between">
              {FRAMEWORKS.map((fw) => (
                <div
                  key={fw.name}
                  className="flex items-center gap-2.5 opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0 dark:opacity-60"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fw.src}
                    alt={fw.name}
                    className="h-4 w-auto object-contain brightness-0 dark:invert md:h-5"
                  />
                  <span className="font-sans text-sm font-semibold text-neutral-800 dark:text-neutral-200">{fw.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <FeatureSections />

        <QuickstartSection
          snippet1={snippet1}
          snippet2={snippet2}
          snippet3={snippet3}
          text1={text1}
          text2={text2}
          text3={text3}
        />

        <TestimonialsSection />

        <CTASection />
      </div>
    </div>
  );
}
