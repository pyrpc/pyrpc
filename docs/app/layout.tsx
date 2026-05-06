import { RootProvider } from 'fumadocs-ui/provider/next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { SiteHeader } from '@/components/site-header';
import './global.css';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning style={{ colorScheme: 'dark' }}>
      <body className="font-sans antialiased bg-black" suppressHydrationWarning>
        <RootProvider>
          <SiteHeader />
          <main className="pt-14">
            {children}
          </main>
        </RootProvider>
      </body>
    </html>
  );
}
