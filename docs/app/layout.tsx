import { RootProvider } from 'fumadocs-ui/provider/next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { SiteHeader } from '@/components/site-header';
import { BackgroundWaves } from '@/components/background-waves';
import { NonDocsLayout } from '@/components/non-docs-layout';
import './global.css';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-fd-background text-fd-foreground" suppressHydrationWarning>
        <RootProvider>
          <BackgroundWaves />
          <SiteHeader />
          <main className="relative z-10 pt-14">
            <NonDocsLayout>
              {children}
            </NonDocsLayout>
          </main>
        </RootProvider>
      </body>
    </html>
  );
}
