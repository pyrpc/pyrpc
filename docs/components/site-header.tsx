'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon, Github, BookOpen, Clock, Users, ChevronDown, Menu, X } from 'lucide-react';
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
    href: '/community',
    description: 'X/Twitter, Telegram, and more',
    icon: Users,
    external: false,
  },
];

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [stars, setStars] = useState<number | null>(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetch('https://api.github.com/repos/pyrpc/pyrpc')
      .then(r => r.json())
      .then(d => setStars(d.stargazers_count ?? 0))
      .catch(() => {});
  }, []);

  // Close menus on route change
  useEffect(() => {
    setResourcesOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close on escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setResourcesOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close mobile menu on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close resources dropdown on click outside
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
    <>
      <header className={cn(
        "fixed top-0 inset-x-0 z-[100] w-full bg-white dark:bg-[#000000] border-b border-neutral-200 dark:border-white/[0.08] h-14 flex items-center justify-between",
      )}>
        {/* Left: Logo */}
        <div className="flex items-center h-full px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-fd-foreground tracking-tighter text-lg">
            <img src="/branding/png/pyrpc-mark-bg-light.png" alt="" className="w-5 h-5 block dark:hidden" />
            <img src="/branding/png/pyrpc-mark-bg-dark.png" alt="" className="w-5 h-5 hidden dark:block" />
            pyRPC
          </Link>
        </div>

        {/* Center: Nav Links (Desktop) */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center h-full">
          <Link 
            href="/demo" 
            className={cn(
              "h-full px-6 flex items-center text-[10px] font-medium uppercase tracking-[0.2em] transition-colors hover:bg-fd-accent/50",
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
        </nav>

        {/* Right: GitHub Stars + Theme + Hamburger */}
        <div className="flex items-center h-full">
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
            {stars !== null && <span className="hidden md:inline text-[10px] font-mono font-normal normal-case tracking-tight text-fd-muted-foreground">{formatStars(stars)}</span>}
          </Link>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-full px-6 flex items-center border-l border-fd-border text-fd-muted-foreground hover:text-fd-foreground transition-colors hover:bg-fd-accent/50"
            aria-label="Toggle theme"
          >
            {mounted && (theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
          </button>
          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="md:hidden h-full px-4 flex items-center border-l border-fd-border text-fd-muted-foreground hover:text-fd-foreground transition-colors hover:bg-fd-accent/50"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay — rendered outside header to avoid stacking context nesting */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Menu Panel */}
          <div
            ref={mobileMenuRef}
            className="absolute right-0 top-14 w-[280px] h-[calc(100vh-3.5rem)] bg-white dark:bg-[#0a0a0a] border-l border-neutral-200 dark:border-white/[0.08] shadow-xl animate-fd-sidebar-in overflow-y-auto z-10"
          >
            <nav className="flex flex-col py-4">
              <Link
                href="/demo"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-6 py-3 text-[13px] font-medium transition-colors hover:bg-fd-accent/50",
                  pathname === '/demo' ? "text-fd-foreground" : "text-fd-muted-foreground hover:text-fd-foreground"
                )}
              >
                Demo
              </Link>
              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-6 py-3 text-[13px] font-medium transition-colors hover:bg-fd-accent/50",
                  pathname?.startsWith('/docs') ? "text-fd-foreground" : "text-fd-muted-foreground hover:text-fd-foreground"
                )}
              >
                Docs
              </Link>
              <div className="border-t border-fd-border mx-4 my-2" />
              <div className="px-6 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-fd-muted-foreground">
                Resources
              </div>
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
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 text-[13px] font-medium transition-colors hover:bg-fd-accent/50",
                      isActive ? "text-fd-foreground" : "text-fd-muted-foreground hover:text-fd-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.name}
                  </LinkOrA>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
