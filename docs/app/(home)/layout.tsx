import { baseOptions } from '@/lib/layout.shared';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  // Navigation is handled at the root
  return (
    <main className="flex-1 flex flex-col">
      {children}
    </main>
  );
}
