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
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed top-0 z-[100] w-full bg-white dark:bg-[#000000] border-b border-neutral-200 dark:border-white/[0.08] h-14 flex items-center justify-between">
      {/* Left: Logo */}
      <div className="flex items-center h-full px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-fd-foreground tracking-tighter text-lg">
          pyRPC
        </Link>
      </div>

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
