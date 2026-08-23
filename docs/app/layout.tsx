import { RootProvider } from 'fumadocs-ui/provider/next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { SiteHeader } from '@/components/site-header';
import { NonDocsLayout } from '@/components/non-docs-layout';
import './global.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'pyRPC - Type-Safe APIs for Python',
    template: '%s | pyRPC',
  },
  description: 'Define procedures in Python. Consume them in TypeScript with full type safety. No schema drift, no codegen pipelines.',
  openGraph: {
    title: 'pyRPC - Type-Safe APIs for Python',
    description: 'Define procedures in Python. Consume them in TypeScript with full type safety. No schema drift, no codegen pipelines.',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <RootProvider>
          <SiteHeader />
          <main className="relative z-10">
            <NonDocsLayout>
              {children}
            </NonDocsLayout>
          </main>
        </RootProvider>
      </body>
    </html>
  );
}
