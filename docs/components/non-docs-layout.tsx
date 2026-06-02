"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import Link from "next/link"

export function NonDocsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  if (pathname?.startsWith("/docs")) {
    return <>{children}</>
  }

  return (
    <div className="relative max-w-[1400px] mx-auto min-h-screen">
      {/* Vertical architectural grid lines - pinned to container edges */}
      <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-neutral-200 dark:bg-white/[0.08]" />
      <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-neutral-200 dark:bg-white/[0.08]" />

      {children}
      
      {/* Global Footer for non-docs pages */}
      <footer className="relative mt-40 pb-24 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-px bg-fd-border" />
        <div 
          className="max-w-[1240px] mx-auto pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-fd-foreground/40 text-[10px] font-mono uppercase tracking-[0.3em]"
        >
          <div className="flex items-center gap-6">
            <span className="text-fd-foreground/60 font-bold">(c) 2026 pyRPC</span>
            <span className="text-fd-foreground/20">|</span>
            <span>MIT License</span>
            <span className="text-fd-foreground/20">|</span>
            <span className="text-fd-foreground/30">v0.3.0</span>
          </div>
          <div className="flex items-center gap-12">
            <Link href="/docs" className="hover:text-fd-foreground transition-all">Docs</Link>
            <a href="https://github.com/pyrpc/pyrpc" target="_blank" rel="noreferrer" className="hover:text-fd-foreground transition-all">GitHub</a>
            <a href="https://www.npmjs.com/org/pyrpc" target="_blank" rel="noreferrer" className="hover:text-fd-foreground transition-all">npm</a>
            <Link href="/legal/privacy" className="hover:text-fd-foreground transition-all">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-fd-foreground transition-all">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
