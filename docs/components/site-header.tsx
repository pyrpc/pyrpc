'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon, BookOpen, Clock, Users, Scale, Palette, ChevronDown, Menu, X, Code2, Type, Download } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { cn } from '@/lib/cn';
import { usePathname } from 'next/navigation';

const MAIN_RESOURCES = [
  {
    name: 'Blog',
    href: '/blog',
    description: 'Engineering, product, and updates',
    icon: BookOpen,
    external: false,
  },
  {
    name: 'Changelog',
    href: '/changelog',
    description: 'Latest releases and improvements',
    icon: Clock,
    external: false,
  },
];

const SECONDARY_RESOURCES = [
  {
    name: 'Community',
    href: '/community',
    icon: Users,
    external: false,
  },
  {
    name: 'Brand',
    href: '/brand',
    icon: Palette,
    external: false,
  },
  {
    name: 'Legal',
    href: '/legal',
    icon: Scale,
    external: false,
  },
];

const RESOURCES_ITEMS = [...MAIN_RESOURCES, ...SECONDARY_RESOURCES];

export function SiteHeader() {
  const { theme, resolvedTheme, setTheme } = useTheme();
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

  // Docs pages use the full viewport width; marketing pages stay centered
  const isDocs = pathname?.startsWith('/docs') ?? false;

  const formatStars = (count: number): string => {
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  const copyToClipboard = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <>
      <header className={cn(
        "fixed top-0 inset-x-0 z-[100] w-full bg-white dark:bg-[#000000] border-b border-neutral-200 dark:border-white/[0.08] h-14",
      )}>
        <div className={cn(
          'relative flex h-full w-full items-center justify-between px-6 transition-[max-width] duration-300 ease-out',
          isDocs ? 'max-w-full' : 'mx-auto max-w-[1400px]',
        )}>
          {/* Left: Logo */}
          <div className="flex items-center h-full">
            <ContextMenu.Root>
              <ContextMenu.Trigger asChild>
                <Link href="/" className="flex items-center gap-2 font-bold text-fd-foreground tracking-tighter text-lg">
                  <img src="/branding/png/pyrpc-mark-bg-light.png" alt="" className="w-5 h-5 block dark:hidden" />
                  <img src="/branding/png/pyrpc-mark-bg-dark.png" alt="" className="w-5 h-5 hidden dark:block" />
                  pyRPC
                </Link>
              </ContextMenu.Trigger>
              <ContextMenu.Portal>
                <ContextMenu.Content className="min-w-[220px] bg-white dark:bg-[#0a0a0a] rounded-lg border border-neutral-200 dark:border-white/[0.08] shadow-xl p-1.5 z-[100] animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2">
                  <ContextMenu.Item 
                    className="flex items-center gap-2.5 px-2 py-1.5 text-[13px] font-medium text-fd-muted-foreground outline-none cursor-default rounded-md hover:bg-fd-accent hover:text-fd-foreground focus:bg-fd-accent focus:text-fd-foreground transition-colors"
                    onSelect={() => copyToClipboard(resolvedTheme === 'dark' ? '/branding/png/pyrpc-mark-bg-dark.png' : '/branding/png/pyrpc-mark-bg-light.png')}
                  >
                    <Code2 className="w-4 h-4 opacity-80" />
                    Copy Logo as PNG
                  </ContextMenu.Item>
                  <ContextMenu.Item 
                    className="flex items-center gap-2.5 px-2 py-1.5 text-[13px] font-medium text-fd-muted-foreground outline-none cursor-default rounded-md hover:bg-fd-accent hover:text-fd-foreground focus:bg-fd-accent focus:text-fd-foreground transition-colors"
                    onSelect={() => copyToClipboard(resolvedTheme === 'dark' ? '/branding/png/pyrpc-wordmark-bg-dark.png' : '/branding/png/pyrpc-wordmark-bg-light.png')}
                  >
                    <Type className="w-4 h-4 opacity-80" />
                    Copy Wordmark as PNG
                  </ContextMenu.Item>
                  <a href={resolvedTheme === 'dark' ? '/branding/png/pyrpc-wordmark-bg-dark.png' : '/branding/png/pyrpc-wordmark-bg-light.png'} download="pyrpc-brand-assets.png" className="outline-none">
                    <ContextMenu.Item className="flex items-center gap-2.5 px-2 py-1.5 text-[13px] font-medium text-fd-muted-foreground outline-none cursor-default rounded-md hover:bg-fd-accent hover:text-fd-foreground focus:bg-fd-accent focus:text-fd-foreground transition-colors">
                      <Download className="w-4 h-4 opacity-80" />
                      Download Brand Assets
                    </ContextMenu.Item>
                  </a>
                  
                  <ContextMenu.Separator className="h-px bg-neutral-200 dark:bg-white/[0.08] my-1.5 mx-1" />
                  
                  <Link href="/brand" className="outline-none" passHref legacyBehavior>
                    <ContextMenu.Item className="flex items-center gap-2.5 px-2 py-1.5 text-[13px] font-medium text-fd-muted-foreground outline-none cursor-default rounded-md hover:bg-fd-accent hover:text-fd-foreground focus:bg-fd-accent focus:text-fd-foreground transition-colors">
                      <Palette className="w-4 h-4 opacity-80" />
                      Visit Brand Guidelines
                    </ContextMenu.Item>
                  </Link>
                </ContextMenu.Content>
              </ContextMenu.Portal>
            </ContextMenu.Root>
          </div>

          {/* Right: GitHub Stars + Theme + Hamburger */}
          <div className="flex items-center h-full">
            <Link
              href="https://github.com/pyrpc/pyrpc"
              target="_blank"
              rel="noreferrer"
              className={cn(
                "h-full px-4 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] transition-colors hover:bg-fd-accent/50",
                "text-fd-muted-foreground hover:text-fd-foreground"
              )}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-[15px] h-[15px]">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              {stars !== null && <span className="hidden md:inline text-[10px] font-mono font-normal normal-case tracking-tight text-fd-muted-foreground">{formatStars(stars)}</span>}
            </Link>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-full px-4 flex items-center text-fd-muted-foreground hover:text-fd-foreground transition-colors hover:bg-fd-accent/50"
              aria-label="Toggle theme"
            >
              {mounted && (theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
            </button>
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="md:hidden h-full pl-4 flex items-center text-fd-muted-foreground hover:text-fd-foreground transition-colors hover:bg-fd-accent/50"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Center: Nav Links (Desktop) */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-0 items-center h-full">
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
                "absolute top-full left-0 mt-0 w-[240px] border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0a0a0a] rounded-lg shadow-lg dark:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.5)] p-1.5 transition-all duration-200 origin-top-left",
                resourcesOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              )}
              role="menu"
            >
              <div className="flex flex-col">
                {RESOURCES_ITEMS.map((item, index) => {
                  const isActive = !item.external && pathname?.startsWith(item.href);
                  const Icon = item.icon;
                  const LinkOrA = item.external ? 'a' : Link;
                  const extraProps = item.external ? { target: '_blank', rel: 'noreferrer' } : {};

                  return (
                    <div key={item.name}>
                      <LinkOrA
                        href={item.href}
                        {...extraProps}
                        className={cn(
                          "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] font-medium transition-colors outline-none cursor-pointer group",
                          isActive
                            ? "bg-fd-accent text-fd-foreground"
                            : "text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
                        )}
                        onClick={() => setResourcesOpen(false)}
                      >
                        <Icon className="w-4 h-4 shrink-0 opacity-80" />
                        {item.name}
                      </LinkOrA>
                      {/* Add separator between main and secondary resources */}
                      {index === MAIN_RESOURCES.length - 1 && (
                        <div className="h-px bg-neutral-200 dark:bg-white/[0.08] my-1.5 mx-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay, rendered outside header to avoid stacking context nesting */}
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
