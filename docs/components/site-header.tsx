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
    <header className="fixed top-0 z-[100] w-full bg-black border-b border-white/10 h-14 flex items-center justify-between">
      {/* Left: Logo */}
      <div className="flex items-center h-full px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-white tracking-tighter text-lg">
          pRPC
        </Link>
      </div>

      {/* Right: Nav Segmented */}
      <div className="flex items-center h-full">
        <Link 
          href="/demo" 
          className={cn(
            "h-full px-6 flex items-center border-l border-white/10 text-[10px] font-black uppercase tracking-[0.2em] transition-colors hover:bg-white/[0.03]",
            pathname === '/demo' ? "text-white" : "text-neutral-500 hover:text-neutral-300"
          )}
        >
          Demo
        </Link>
        <Link 
          href="/docs" 
          className={cn(
            "h-full px-6 flex items-center border-l border-white/10 text-[10px] font-black uppercase tracking-[0.2em] transition-colors hover:bg-white/[0.03] relative",
            pathname?.startsWith('/docs') ? "text-white" : "text-neutral-500 hover:text-neutral-300"
          )}
        >
          Docs
          {pathname?.startsWith('/docs') && (
            <div className="absolute top-0 left-0 w-full h-[1px] bg-white" />
          )}
        </Link>
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-full px-6 flex items-center border-l border-white/10 text-neutral-500 hover:text-white transition-colors hover:bg-white/[0.03]"
          aria-label="Toggle theme"
        >
          {mounted && (theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
        </button>
      </div>
    </header>
  );
}

