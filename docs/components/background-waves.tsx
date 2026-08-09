"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"

const LineWaves = dynamic(() => import("./line-waves"), { ssr: false })

export function BackgroundWaves() {
  const { resolvedTheme } = useTheme()
  const pathname = usePathname()
  const isDark = resolvedTheme !== "light"

  if (pathname?.startsWith("/docs")) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="absolute inset-0">
        <LineWaves
          rotation={-42}
          speed={0.4}
          warpIntensity={0.35}
          innerLineCount={45}
          outerLineCount={12}
          edgeFadeWidth={0}
          colorCycleSpeed={0}
          brightness={isDark ? 0.18 : 0.22}
          color1="#ffffff"
          color2="#ffffff"
          color3="#ffffff"
          enableMouseInteraction
          mouseInfluence={1.6}
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white dark:from-fd-background to-transparent" />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(255,255,255,0.96)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_55%,#000_100%)] opacity-90"
      />
    </div>
  )
}
