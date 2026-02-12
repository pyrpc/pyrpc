'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ComponentProps, useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

export function ThemeToggle({
  className,
  mode: _mode,
  ...props
}: ComponentProps<'button'> & {
  mode?: 'light-dark' | 'light-dark-system';
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className={cn('size-9 p-2', className)} />;

  return (
    <button
      className={cn(
        'group relative inline-flex size-9 items-center justify-center rounded-lg border bg-background hover:bg-fd-accent hover:text-fd-accent-foreground transition-colors',
        className,
      )}
      aria-label="Toggle Theme"
      onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
      {...props}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
