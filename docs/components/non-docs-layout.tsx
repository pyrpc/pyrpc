"use client"

import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"

export function NonDocsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

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
        <div className="max-w-[1240px] mx-auto pt-10 flex flex-col items-center gap-4 text-[11px] text-fd-foreground/40">
          <nav className="flex items-center gap-3">
            <Link href="/docs" className="hover:text-fd-foreground transition-colors">Docs</Link>
            <span className="text-fd-foreground/15">/</span>
            <Link href="/blog" className="hover:text-fd-foreground transition-colors">Blog</Link>
            <span className="text-fd-foreground/15">/</span>
            <a href="https://github.com/pyrpc/pyrpc" target="_blank" rel="noreferrer" className="hover:text-fd-foreground transition-colors">GitHub</a>
            <span className="text-fd-foreground/15">/</span>
            <a href="https://www.npmjs.com/org/pyrpc" target="_blank" rel="noreferrer" className="hover:text-fd-foreground transition-colors">npm</a>
            <span className="text-fd-foreground/15">/</span>
            <Link href="/legal/privacy" className="hover:text-fd-foreground transition-colors">Privacy</Link>
            <span className="text-fd-foreground/15">/</span>
            <Link href="/legal/terms" className="hover:text-fd-foreground transition-colors">Terms</Link>
          </nav>
          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="hover:text-fd-foreground transition-colors"
              >
                {resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              </button>
            )}
            <span className="text-fd-foreground/15">·</span>
            <span>© 2026 pyRPC</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
