"use client"

import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { Github, Moon, Sun } from "lucide-react"

export function NonDocsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (pathname?.startsWith("/docs")) {
    return (
      // Same canvas as the landing page: body token (white / black), not the
      // fumadocs shell tint — only sidebar/toc chrome keeps fd-background.
      <div className="min-h-svh bg-background">
        {children}
      </div>
    )
  }

  const AI_PROMPT =
    "What is pyRPC? Define procedures in Python, consume them in TypeScript with full type safety. No schema drift. It is built from three distinct pieces: an RPC model of @rpc.query and @rpc.mutation procedures served over JSON-RPC 2.0 at a single endpoint; codegen, where pyrpc dev generates typed TypeScript clients straight from your Python source and regenerates them on every save; and MCP, where pyrpc mcp serves your project's registry to AI coding agents locally and https://mcp.pyrpc.com/mcp hosts the documentation server, so agents can introspect procedures, validate arguments, and run codegen against a live backend. Compare pyRPC to OpenAPI, gRPC, and tRPC and explain when each is the right choice.";
  const aiQuery = encodeURIComponent(AI_PROMPT);

  return (
    <div className="relative min-h-screen">
      {children}
      
      {/* Global Footer for non-docs pages */}
      <footer className="relative mt-0 pb-8">
        <div className="mx-auto max-w-[1400px] px-6">
          {/* Ask AI about pyRPC - centered above footer nav */}
          <div className="border-t border-neutral-200 dark:border-white/[0.08] pt-10 pb-6 flex flex-col items-center">
            <span
              className="text-fd-foreground/40 font-mono text-[12px] tracking-wide mb-3"
            >
              Ask AI about pyRPC
            </span>
            <div className="flex items-center gap-2.5">
              {[
                { name: "Claude", href: `https://claude.ai/new?q=${aiQuery}`, icon: <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />, viewBox: "0 0 24 24" },
                { name: "ChatGPT", href: `https://chatgpt.com/?q=${aiQuery}`, icon: <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />, viewBox: "0 0 24 24" },
                { name: "Perplexity", href: `https://www.perplexity.ai/?q=${aiQuery}`, icon: <path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z" />, viewBox: "0 0 24 24" },
                { name: "Grok", href: `https://grok.com/?q=${aiQuery}`, icon: <><path d="M13.2371 21.0407L24.3186 12.8506C24.8619 12.4491 25.6384 12.6057 25.8973 13.2294C27.2597 16.5185 26.651 20.4712 23.9403 23.1851C21.2297 25.8989 17.4581 26.4941 14.0108 25.1386L10.2449 26.8843C15.6463 30.5806 22.2053 29.6665 26.304 25.5601C29.5551 22.3051 30.562 17.8683 29.6205 13.8673L29.629 13.8758C28.2637 7.99809 29.9647 5.64871 33.449 0.844576C33.5314 0.730667 33.6139 0.616757 33.6964 0.5L29.1113 5.09055V5.07631L13.2343 21.0436"/><path d="M10.9503 23.0313C7.07343 19.3235 7.74185 13.5853 11.0498 10.2763C13.4959 7.82722 17.5036 6.82767 21.0021 8.2971L24.7595 6.55998C24.0826 6.07017 23.215 5.54334 22.2195 5.17313C17.7198 3.31926 12.3326 4.24192 8.67479 7.90126C5.15635 11.4239 4.0499 16.8403 5.94992 21.4622C7.36924 24.9165 5.04257 27.3598 2.69884 29.826C1.86829 30.7002 1.0349 31.5745 0.36364 32.5L10.9474 23.0341"/></>, viewBox: "0 0 34 33" },
              ].map((ai) => (
                <a
                  key={ai.name}
                  href={ai.href}
                  target="_blank"
                  rel="noreferrer"
                  title={`Ask ${ai.name} about pyRPC`}
                  className="text-fd-foreground/30 hover:text-fd-foreground/60 transition-colors"
                >
                  <svg role="img" viewBox={ai.viewBox} fill="currentColor" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                    <title>{ai.name}</title>
                    {ai.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Bottom footer - 2 column layout */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 pb-2 text-[11px] text-fd-foreground/40 font-mono">
          {/* Left: navigation links */}
          <nav className="flex items-center gap-2">
            <Link href="/docs" className="hover:text-fd-foreground transition-colors">Docs</Link>
            <span className="text-fd-foreground/15">/</span>
            <Link href="/legal/privacy" className="hover:text-fd-foreground transition-colors">Privacy</Link>
            <span className="text-fd-foreground/15">/</span>
            <Link href="/legal/terms" className="hover:text-fd-foreground transition-colors">Terms</Link>
          </nav>

          {/* Right: social icons + copyright */}
          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="hover:text-fd-foreground transition-colors text-fd-foreground/30"
                title={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {resolvedTheme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            )}
            <a href="https://github.com/pyrpc/pyrpc" target="_blank" rel="noreferrer" className="hover:text-fd-foreground transition-colors text-fd-foreground/30">
              <Github className="w-3.5 h-3.5" />
            </a>
            <a href="https://x.com/pyrpc_dev" target="_blank" rel="noreferrer" className="hover:text-fd-foreground transition-colors text-fd-foreground/30">
              <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/>
              </svg>
            </a>
            <a href="https://t.me/pyrpc" target="_blank" rel="noreferrer" className="hover:text-fd-foreground transition-colors text-fd-foreground/30">
              <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.127.087.497.04.82-.076.534-.599 2.86-.634 3.054a.737.737 0 0 0 .002.312c.044.17.16.305.288.386.002 0 .587.426.587.426s.162.096.264.18c.112.093.227.27.151.444-.074.168-.344.266-.344.266s-.56.182-1.975.693c-.748.27-1.663.6-2.232.496a3.3 3.3 0 0 1-.326-.059c-.595-.148-.998-.388-1.387-.626-.605-.374-1.116-.835-1.62-1.291-.24-.218-.472-.44-.685-.677-.618-.687-.005-1.695.004-1.706.003-.004.563-.896 1.775-2.053.64-.613 1.476-1.29 1.86-1.536.143-.09.278-.118.318-.116zm-4.019 2.645a.558.558 0 0 0-.433.3 217 217 0 0 0-1.46 2.833c-.063.121-.074.273-.013.394.087.153.268.213.433.172.124-.022.157-.028.157-.028s.004.002.004.004c.004 0 .02.002.04.034.021.032.028.077.028.106v.002c.053.1.138.163.196.215.014.012.015.013.002.015z"/>
              </svg>
            </a>
            <a href="https://linkedin.com/company/pyrpc" target="_blank" rel="noreferrer" className="hover:text-fd-foreground transition-colors text-fd-foreground/30">
              <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="https://www.npmjs.com/org/pyrpc" target="_blank" rel="noreferrer" className="hover:text-fd-foreground transition-colors text-fd-foreground/30">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0h-2.666V8.667h2.666v5.331zm12 0H13.332V8.667h2.666v4h1.336v-4h1.332v4h1.332v-4h1.334v5.331z"/></svg>
            </a>
            <a href="https://pypi.org/project/pyrpc-core/" target="_blank" rel="noreferrer" className="hover:text-fd-foreground transition-colors text-fd-foreground/30">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 0L4 4v8l8 4 8-4V4l-8-4zm6 11.09l-6 3-6-3V5.91l6-3 6 3v5.18z"/></svg>
            </a>
            <span className="text-fd-foreground/15">·</span>
            <span>© 2026 pyRPC</span>
          </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
