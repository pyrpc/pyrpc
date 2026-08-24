import { createClient, type ClientOptions } from '@pyrpc/client';
import {
  callProcedure,
  createReactClient,
  createUtils,
  type InferProcedureKinds,
  type ProceduresRecord,
  type QueryInput,
  type ReactClient,
  type ReactClientOptions,
} from '@pyrpc/react';
import { dehydrate, type DehydratedState, type QueryClient } from '@tanstack/react-query';
import type { ComponentType, ReactNode } from 'react';
import {
  HydrationBoundary,
  type HydrationBoundaryProps,
} from './HydrateClient';
import { PyRPCProvider } from './provider';
import { getQueryClient } from './queryClient';

export type CreateNextClientOptions = ReactClientOptions;

export type PrefetchHelpers<TProcedures extends ProceduresRecord> = {
  [K in keyof TProcedures]: (
    input: QueryInput<TProcedures[K]>,
  ) => Promise<void>;
};

type NextHelpers<TProcedures extends ProceduresRecord> = {
  /** App-wide provider — `<api.Provider>`. */
  Provider: ComponentType<{ children: ReactNode }>;
  /**
   * Warm query cache on the server. Pair with `dehydrate` + `HydrationBoundary`.
   */
  prefetch: PrefetchHelpers<TProcedures>;
  /** Serialize server QueryClient cache (TanStack standard). */
  dehydrate: (client?: QueryClient) => DehydratedState;
  /** Rehydrate server cache on the client (TanStack standard). */
  HydrationBoundary: ComponentType<HydrationBoundaryProps>;
  /** @deprecated Use `HydrationBoundary`. */
  HydrateClient: ComponentType<HydrationBoundaryProps>;
  /** Promise client for RSC / route handlers / server actions. */
  createCaller: (overrides?: ClientOptions) => TProcedures;
  getQueryClient: () => QueryClient;
  createUtils: (client?: QueryClient) => ReturnType<typeof createUtils<TProcedures>>;
  /**
   * Nested hooks client (same procedures as the top-level proxy).
   * Prefer top-level: `api.greet.useQuery(...)`.
   */
  api: ReactClient<TProcedures, InferProcedureKinds<TProcedures>>;
};

/**
 * One `api` object for App Router — procedures + Provider + prefetch + hydration.
 *
 * @example
 * ```ts
 * export const api = createNextClient<Types>({
 *   links: [httpLink({ url: process.env.PYRPC_URL! })],
 * })
 *
 * // layout:  <api.Provider>{children}</api.Provider>
 * // server:  await api.prefetch.greet("Ada")
 * //          <api.HydrationBoundary state={api.dehydrate()}><Child /></api.HydrationBoundary>
 * // client:  api.greet.useQuery("Ada")
 * ```
 */
export type NextClient<TProcedures extends ProceduresRecord> = ReactClient<
  TProcedures,
  InferProcedureKinds<TProcedures>
> &
  NextHelpers<TProcedures>;

export function createNextClient<TProcedures extends ProceduresRecord>(
  options: CreateNextClientOptions = { links: [] },
): NextClient<TProcedures> {
  const api = createReactClient<TProcedures>(options);

  const createCaller = (overrides: Partial<ClientOptions> = {}) =>
    createClient<TProcedures>({ ...options, ...overrides });

  const prefetch = new Proxy({} as PrefetchHelpers<TProcedures>, {
    get(_target, prop: string | symbol) {
      if (typeof prop !== 'string') return undefined;
      return async (input: unknown) => {
        const queryClient = getQueryClient();
        const caller = createCaller();
        // Same variance-capture idiom as the client Proxy; see eslint.config.mjs.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fn = (caller as Record<string, (...args: any[]) => Promise<any>>)[prop];
        const utils = createUtils(caller, queryClient);
        const procedureUtils = (
          utils as Record<string, { prefetch: (i: unknown) => Promise<void> }>
        )[prop];
        if (procedureUtils) {
          await procedureUtils.prefetch(input);
          return;
        }
        await queryClient.prefetchQuery({
          queryKey: ['pyrpc', prop, input],
          queryFn: () => callProcedure(fn, input as never),
        });
      };
    },
  });

  const helpers: NextHelpers<TProcedures> = {
    Provider: PyRPCProvider,
    prefetch,
    dehydrate: (client?: QueryClient) => dehydrate(client ?? getQueryClient()),
    HydrationBoundary,
    HydrateClient: HydrationBoundary,
    createCaller,
    getQueryClient,
    createUtils: (client?: QueryClient) =>
      createUtils(createCaller(), client ?? getQueryClient()),
    api,
  };

  return new Proxy(helpers as object, {
    get(target, prop: string | symbol) {
      if (typeof prop !== 'string') return undefined;
      if (prop in target) {
        return (target as Record<string, unknown>)[prop];
      }
      return (api as Record<string, unknown>)[prop];
    },
  }) as NextClient<TProcedures>;
}

/** @deprecated Use `createNextClient`. */
export const createPyRPCNext = createNextClient;
/** @deprecated Use `CreateNextClientOptions`. */
export type CreatePyRPCNextOptions = CreateNextClientOptions;
/** @deprecated Use `NextClient`. */
export type PyRPCNext<TProcedures extends ProceduresRecord> =
  NextClient<TProcedures>;
