import type { ReactNode } from 'react';
import { Providers } from './providers';

export const metadata = {
  title: 'pyRPC Next.js Example',
  description: 'App Router + TanStack Query adapter demo',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // layout.tsx is a Server Component by default in the Next.js App Router.
  // Providers must live in a separate 'use client' file because they use
  // useState and React context — neither of which can run in a Server Component.
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 40 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
