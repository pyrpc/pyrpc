'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState, type ReactNode } from 'react';

export type PyRPCProviderProps = {
  children: ReactNode;
  /** Existing QueryClient. If omitted, one is created and owned by this provider. */
  queryClient?: QueryClient;
};

/**
 * Convenience wrapper around TanStack Query's QueryClientProvider
 * with sensible defaults for pyRPC apps.
 */
export function PyRPCProvider({ children, queryClient }: PyRPCProviderProps) {
  const [ownedClient] = useState(
    () =>
      queryClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient ?? ownedClient}>
      {children}
    </QueryClientProvider>
  );
}
