'use client';

import {
  HydrationBoundary as TanStackHydrationBoundary,
  type DehydratedState,
} from '@tanstack/react-query';
import type { ReactNode } from 'react';

export type HydrationBoundaryProps = {
  state: DehydratedState;
  children: ReactNode;
};

/**
 * Standard TanStack Query hydration boundary for RSC → client cache handoff.
 * Pair with `dehydrate()` after `prefetch` on the server.
 */
export function HydrationBoundary({ state, children }: HydrationBoundaryProps) {
  return (
    <TanStackHydrationBoundary state={state}>{children}</TanStackHydrationBoundary>
  );
}

/** @deprecated Use `HydrationBoundary` (TanStack’s name). */
export const HydrateClient = HydrationBoundary;
/** @deprecated Use `HydrationBoundaryProps`. */
export type HydrateClientProps = HydrationBoundaryProps;
