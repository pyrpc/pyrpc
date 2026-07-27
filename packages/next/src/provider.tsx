'use client';

import { PyRPCProvider as ReactPyRPCProvider } from '@pyrpc/react';
import type { ReactNode } from 'react';
import { getQueryClient } from './queryClient';

export type PyRPCProviderProps = {
  children: ReactNode;
};

/**
 * App-wide provider for Next.js — TanStack Query cache with App Router–safe client.
 * Same name as `@pyrpc/react`’s `PyRPCProvider`.
 */
export function PyRPCProvider({ children }: PyRPCProviderProps) {
  const queryClient = getQueryClient();
  return (
    <ReactPyRPCProvider queryClient={queryClient}>{children}</ReactPyRPCProvider>
  );
}

/** @deprecated Use `PyRPCProvider`. */
export const NextPyRPCProvider = PyRPCProvider;
/** @deprecated Use `PyRPCProviderProps`. */
export type NextPyRPCProviderProps = PyRPCProviderProps;
