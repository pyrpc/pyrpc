'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon, Github, BookOpen, Clock, Users, ChevronDown } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/cn';
import { usePathname } from 'next/navigation';

const RESOURCES_ITEMS = [
  {
    name: 'Blog',
    href: '/blog',
    description: 'Design notes and deep dives',
    icon: BookOpen,
  },
  {
    name: 'Changelog',
    href: '/changelog',
    description: 'Release history',
    icon: Clock,
  },
  {
    name: 'Community',
    href: 'https://github.com/pyrpc/pyrpc/discussions',
    description: 'GitHub Discussions',
    icon: Users,
    external: true,
  },
];

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [stars, setStars] = useState<number | null>(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const pathname = usePathname();
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetch('https://api.github.com/repos/pyrpc/pyrpc')
      .then(r => r.json())
      .then(d => d.stargazers_count && setStars(d.stargazers_count))
      .catch(() => {});
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setResourcesOpen(false);
  }, [pathname]);

  // Close on escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setResourcesOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setResourcesOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setResourcesOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setResourcesOpen(false);
    }, 150);
  }, []);

  // Check if current route is under resources
  const isResourceActive = pathname?.startsWith('/blog') || pathname?.startsWith('/changelog');

  const formatStars = (count: number): string => {
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  return (
    <header className="fixed top-0 z-[100] w-full bg-white dark:bg-[#000000] border-b border-neutral-200 dark:border-white/[0.08] h-14 flex items-center justify-between">
      {/* Left: Logo */}
      <div className="flex items-center h-full px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-fd-foreground tracking-tighter text-lg">
          <img src="/branding/png/pyrpc-mark-bg-light.png" alt="" className="w-5 h-5 block dark:hidden" />
          <img src="/branding/png/pyrpc-mark-bg-dark.png" alt="" className="w-5 h-5 hidden dark:block" />
          pyRPC
        </Link>
      </div>

      {/* Right: Nav Segmented */}
      <div className="flex items-center h-full">
        <Link 
          href="/demo" 
          className={cn(
            "h-full px-6 flex items-center border-l border-fd-border text-[10px] font-medium uppercase tracking-[0.2em] transition-colors hover:bg-fd-accent/50",
            pathname === '/demo' ? "text-fd-foreground" : "text-fd-muted-foreground hover:text-fd-foreground"
          )}
        >
          Demo
        </Link>
        <Link 
          href="/docs" 
          className={cn(
            "h-full px-6 flex items-center border-l border-fd-border text-[10px] font-medium uppercase tracking-[0.2em] transition-colors hover:bg-fd-accent/50 relative",
            pathname?.startsWith('/docs') ? "text-fd-foreground" : "text-fd-muted-foreground hover:text-fd-foreground"
          )}
        >
          Docs
          {pathname?.startsWith('/docs') && (
            <div className="absolute top-0 left-0 w-full h-[1px] bg-fd-foreground" />
          )}
        </Link>

        {/* Resources Dropdown */}
        <div
          ref={dropdownRef}
          className="relative h-full"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onClick={() => setResourcesOpen(prev => !prev)}
            className={cn(
              "h-full px-6 flex items-center gap-1.5 border-l border-fd-border text-[10px] font-medium uppercase tracking-[0.2em] transition-colors hover:bg-fd-accent/50 relative",
              isResourceActive ? "text-fd-foreground" : "text-fd-muted-foreground hover:text-fd-foreground"
            )}
            aria-expanded={resourcesOpen}
            aria-haspopup="true"
          >
            Resources
            <ChevronDown className={cn(
              "w-3 h-3 transition-transform duration-200",
              resourcesOpen && "rotate-180"
            )} />
            {isResourceActive && (
              <div className="absolute top-0 left-0 w-full h-[1px] bg-fd-foreground" />
            )}
          </button>

          {/* Dropdown Panel */}
          <div
            className={cn(
              "absolute top-full left-0 mt-0 w-[260px] border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0a0a0a] rounded-lg shadow-lg dark:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.5)] py-2 transition-all duration-200 origin-top-left",
              resourcesOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
            )}
            role="menu"
          >
            {RESOURCES_ITEMS.map((item) => {
              const isActive = !item.external && pathname?.startsWith(item.href);
              const Icon = item.icon;
              const LinkOrA = item.external ? 'a' : Link;
              const extraProps = item.external ? { target: '_blank', rel: 'noreferrer' } : {};

              return (
                <LinkOrA
                  key={item.name}
                  href={item.href}
                  {...extraProps}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 mx-1 rounded-md transition-colors group",
                    isActive
                      ? "bg-fd-accent/60 text-fd-foreground"
                      : "text-fd-muted-foreground hover:bg-fd-accent/40 hover:text-fd-foreground"
                  )}
                  role="menuitem"
                  onClick={() => setResourcesOpen(false)}
                >
                  <Icon className="w-4 h-4 mt-0.5 shrink-0 text-fd-muted-foreground group-hover:text-fd-foreground transition-colors" />
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold tracking-tight text-fd-foreground">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-fd-muted-foreground leading-snug mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </LinkOrA>
              );
            })}
          </div>
        </div>

        <Link
          href="https://github.com/pyrpc/pyrpc"
          target="_blank"
          rel="noreferrer"
          className={cn(
            "h-full px-5 flex items-center gap-1.5 border-l border-fd-border text-[10px] font-medium uppercase tracking-[0.2em] transition-colors hover:bg-fd-accent/50",
            "text-fd-muted-foreground hover:text-fd-foreground"
          )}
        >
          <Github className="w-3.5 h-3.5" />
          {stars !== null && <span className="text-[10px] font-mono font-normal normal-case tracking-tight text-fd-muted-foreground">{formatStars(stars)}</span>}
        </Link>
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-full px-6 flex items-center border-l border-fd-border text-fd-muted-foreground hover:text-fd-foreground transition-colors hover:bg-fd-accent/50"
          aria-label="Toggle theme"
        >
          {mounted && (theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
        </button>
      </div>
    </header>
  );
}
