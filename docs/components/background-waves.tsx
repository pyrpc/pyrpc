"use client"

import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import LineWaves from "./line-waves"

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
          brightness={isDark ? 0.07 : 0.16}
          color1="#ffffff"
          color2="#ffffff"
          color3="#ffffff"
          enableMouseInteraction
          mouseInfluence={1.6}
        />
      </div>
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white dark:from-fd-background to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white dark:from-fd-background to-transparent" />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(255,255,255,1)_90%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_25%,#070707_90%)] opacity-90"
      />
    </div>
  )
}
