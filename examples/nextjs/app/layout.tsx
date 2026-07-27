import type { ReactNode } from 'react';
import { Providers } from './providers';

export const metadata = {
  title: 'pyRPC Next.js Example',
  description: 'App Router + TanStack Query adapter demo',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 40 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
