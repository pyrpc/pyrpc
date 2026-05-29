'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon, Github } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { usePathname } from 'next/navigation';

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const copyAsset = async (type: 'logo' | 'wordmark') => {
    const isDark = document.documentElement.classList.contains('dark');
    const src = type === 'logo' 
      ? (isDark ? '/branding/png/pyrpc-mark-bg-dark.png' : '/branding/png/pyrpc-mark-bg-light.png')
      : (isDark ? '/branding/png/pyrpc-wordmark-bg-dark.png' : '/branding/png/pyrpc-wordmark-bg-light.png');
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    } catch {
      navigator.clipboard.writeText(window.location.origin + src);
    }
  };

  return (
    <header className="fixed top-0 z-[100] w-full bg-white dark:bg-[#000000] border-b border-neutral-200 dark:border-white/[0.08] h-14 flex items-center justify-between">
      {/* Left: Logo */}
      <div className="flex items-center h-full px-6">
        <Link 
          href="/" 
          className="flex items-center gap-2 font-bold text-fd-foreground tracking-tighter text-lg select-none"
          onContextMenu={handleContextMenu}
        >
          pyRPC
        </Link>
      </div>

      {contextMenu && (
        <div 
          className="fixed z-[999] bg-[#0c0c0c] border border-neutral-800 rounded-md shadow-2xl py-1.5 flex flex-col w-[220px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button 
            onClick={() => copyAsset('logo')}
            className="flex items-center gap-3 px-3 py-2 text-[13px] text-neutral-300 hover:bg-neutral-800/50 hover:text-white transition-colors w-full text-left font-sans"
          >
            <span className="font-mono text-neutral-500 tracking-tighter">&lt; &gt;</span>
            Copy Logo as PNG
          </button>
          <button 
            onClick={() => copyAsset('wordmark')}
            className="flex items-center gap-3 px-3 py-2 text-[13px] text-neutral-300 hover:bg-neutral-800/50 hover:text-white transition-colors w-full text-left font-sans"
          >
            <span className="font-serif text-neutral-500 font-bold ml-[1px]">T</span>
            <span className="ml-[1px]">Copy Wordmark as PNG</span>
          </button>
        </div>
      )}

      {/* Right: Nav Segmented */}
      <div className="flex items-center h-full">
        <Link 
          href="/demo" 
          className={cn(
            "h-full px-6 flex items-center border-l border-fd-border text-[10px] font-black uppercase tracking-[0.2em] transition-colors hover:bg-fd-accent/50",
            pathname === '/demo' ? "text-fd-foreground" : "text-fd-muted-foreground hover:text-fd-foreground"
          )}
        >
          Demo
        </Link>
        <Link 
          href="/blog" 
          className={cn(
            "h-full px-6 flex items-center border-l border-fd-border text-[10px] font-black uppercase tracking-[0.2em] transition-colors hover:bg-fd-accent/50",
            pathname?.startsWith('/blog') ? "text-fd-foreground" : "text-fd-muted-foreground hover:text-fd-foreground"
          )}
        >
          Blog
        </Link>
        <Link 
          href="/changelog" 
          className={cn(
            "h-full px-6 flex items-center border-l border-fd-border text-[10px] font-black uppercase tracking-[0.2em] transition-colors hover:bg-fd-accent/50",
            pathname?.startsWith('/changelog') ? "text-fd-foreground" : "text-fd-muted-foreground hover:text-fd-foreground"
          )}
        >
          Changelog
        </Link>
        <Link 
          href="/docs" 
          className={cn(
            "h-full px-6 flex items-center border-l border-fd-border text-[10px] font-black uppercase tracking-[0.2em] transition-colors hover:bg-fd-accent/50 relative",
            pathname?.startsWith('/docs') ? "text-fd-foreground" : "text-fd-muted-foreground hover:text-fd-foreground"
          )}
        >
          Docs
          {pathname?.startsWith('/docs') && (
            <div className="absolute top-0 left-0 w-full h-[1px] bg-fd-foreground" />
          )}
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
