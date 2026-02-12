import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen" suppressHydrationWarning>
        <RootProvider>
          <HomeLayout {...baseOptions()}>
            {children}
          </HomeLayout>
        </RootProvider>
      </body>
    </html>
  );
}
