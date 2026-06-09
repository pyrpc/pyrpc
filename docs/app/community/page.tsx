import Link from 'next/link'
import { cn } from '@/lib/cn'

const channels = [
  {
    name: 'X / Twitter',
    href: 'https://x.com/pyrpc_dev',
    description: 'Follow for release announcements, tips, and updates.',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg>
    ),
  },
  {
    name: 'Telegram',
    href: 'https://t.me/pyrpc',
    description: 'Real-time chat with maintainers and community members.',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.127.087.497.04.82-.076.534-.599 2.86-.634 3.054a.737.737 0 0 0 .002.312c.044.17.16.305.288.386.002 0 .587.426.587.426s.162.096.264.18c.112.093.227.27.151.444-.074.168-.344.266-.344.266s-.56.182-1.975.693c-.748.27-1.663.6-2.232.496a3.3 3.3 0 0 1-.326-.059c-.595-.148-.998-.388-1.387-.626-.605-.374-1.116-.835-1.62-1.291-.24-.218-.472-.44-.685-.677-.618-.687-.005-1.695.004-1.706.003-.004.563-.896 1.775-2.053.64-.613 1.476-1.29 1.86-1.536.143-.09.278-.118.318-.116zm-4.019 2.645a.558.558 0 0 0-.433.3 217 217 0 0 0-1.46 2.833c-.063.121-.074.273-.013.394.087.153.268.213.433.172.124-.022.157-.028.157-.028s.004.002.004.004c.004 0 .02.002.04.034.021.032.028.077.028.106v.002c.053.1.138.163.196.215.014.012.015.013.002.015z"/></svg>
    ),
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com/@pyrpc',
    description: 'Tutorials, deep dives, and feature walkthroughs.',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
    ),
  },
  {
    name: 'NPM',
    href: 'https://www.npmjs.com/org/pyrpc',
    description: 'TypeScript client packages.',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0h-2.666V8.667h2.666v5.331zm12 0H13.332V8.667h2.666v4h1.336v-4h1.332v4h1.332v-4h1.334v5.331z"/></svg>
    ),
  },
  {
    name: 'PyPI',
    href: 'https://pypi.org/project/pyrpc-core/',
    description: 'Python package downloads.',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 0L4 4v8l8 4 8-4V4l-8-4zm6 11.09l-6 3-6-3V5.91l6-3 6 3v5.18z"/></svg>
    ),
  },
  {
    name: 'Discord',
    href: '#',
    description: 'Coming soon',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0741.0741 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
    ),
  },
]

export default function CommunityPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-2xl font-bold tracking-tight uppercase font-mono mb-2">
        Community
      </h1>
      <p className="text-sm text-fd-muted-foreground mb-12">
        Get involved, ask questions, and stay up to date with the latest pyRPC developments.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200 dark:bg-white/[0.08] rounded-lg overflow-hidden border border-neutral-200 dark:border-white/[0.08]">
        {channels.map((channel) => {
          const isComingSoon = channel.href === '#';
          const Comp = isComingSoon ? 'div' : 'a';
          const extra = isComingSoon ? {} : { target: '_blank', rel: 'noreferrer' };
          return (
            <Comp
              key={channel.name}
              {...(isComingSoon ? {} : { href: channel.href })}
              {...extra}
              className={cn(
                "flex items-start gap-4 p-6 bg-white dark:bg-[#0a0a0a] transition-colors group",
                isComingSoon
                  ? "blur-sm cursor-default select-none"
                  : "hover:bg-neutral-50 dark:hover:bg-white/[0.03]"
              )}
            >
              <div className={cn(
                "mt-0.5 shrink-0 transition-colors",
                isComingSoon
                  ? "text-fd-foreground/15"
                  : "text-fd-foreground/30 group-hover:text-fd-foreground/60"
              )}>
                {channel.icon}
              </div>
              <div>
                <div className={cn(
                  "text-[14px] font-semibold tracking-tight mb-1",
                  isComingSoon
                    ? "text-fd-foreground/40"
                    : "text-fd-foreground group-hover:underline"
                )}>
                  {channel.name}
                </div>
                <div className="text-[12px] text-fd-foreground/40 leading-relaxed">
                  {channel.description}
                </div>
              </div>
            </Comp>
          );
        })}
      </div>

      <div className="mt-16 text-center">
        <Link
          href="/"
          className="text-[11px] font-mono tracking-[0.2em] uppercase text-fd-foreground/30 hover:text-fd-foreground/60 transition-colors"
        >
          ← Back home
        </Link>
      </div>
    </div>
  )
}
