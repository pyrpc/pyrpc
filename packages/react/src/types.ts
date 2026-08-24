import type {
  QueryClient,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import type { ComponentType, ReactNode } from 'react';

export type AnyProc = (...args: any[]) => Promise<any>;
export type ProceduresRecord = Record<string, AnyProc>;

export type ProcArgs<T> = T extends (...args: infer A) => any ? A : never;
export type ProcResult<T> = T extends (...args: any[]) => Promise<infer R> ? R : never;

/** Query input: same args as the procedure, or a single value / tuple for the query key + call. */
export type QueryInput<TProc extends AnyProc> =
  ProcArgs<TProc> extends []
    ? void | undefined
    : ProcArgs<TProc> extends [infer Only]
      ? Only
      : ProcArgs<TProc>;

export type ProcedureKind = 'query' | 'mutation';
export type ProcedureKindMap<TProcedures extends ProceduresRecord> = {
  [K in keyof TProcedures]?: ProcedureKind;
};

/** Infer query/mutation kinds from branded generated `Types` (`_pyrpcKind`). */
export type InferProcedureKinds<TProcedures extends ProceduresRecord> = {
  [K in keyof TProcedures]: TProcedures[K] extends {
    readonly _pyrpcKind: infer Kind;
  }
    ? Kind extends ProcedureKind
      ? Kind
      : undefined
    : undefined;
};

export type ProcedureQueryHooks<TProc extends AnyProc> = {
  useQuery: <TData = ProcResult<TProc>>(
    input: QueryInput<TProc>,
    options?: Omit<
      UseQueryOptions<ProcResult<TProc>, Error, TData>,
      'queryKey' | 'queryFn'
    >,
  ) => UseQueryResult<TData, Error>;
};

export type ProcedureMutationHooks<TProc extends AnyProc> = {
  useMutation: <TContext = unknown>(
    options?: Omit<
      UseMutationOptions<ProcResult<TProc>, Error, QueryInput<TProc>, TContext>,
      'mutationFn'
    >,
  ) => UseMutationResult<ProcResult<TProc>, Error, QueryInput<TProc>, TContext>;
};

export type ProcedureHooksBoth<TProc extends AnyProc> = ProcedureQueryHooks<TProc> &
  ProcedureMutationHooks<TProc>;

export type ProcedureHooksForKind<
  TProc extends AnyProc,
  TKind extends ProcedureKind | undefined,
> = TKind extends 'mutation'
  ? ProcedureMutationHooks<TProc>
  : TKind extends 'query'
    ? ProcedureQueryHooks<TProc>
    : ProcedureHooksBoth<TProc>;

export type ReactClientProviderProps = {
  children: ReactNode;
  queryClient?: QueryClient;
};

export type ReactClient<
  TProcedures extends ProceduresRecord,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- deliberate unconstrained default when kinds are not provided
  TKinds extends ProcedureKindMap<TProcedures> = {},
> = {
  [K in keyof TProcedures]: ProcedureHooksForKind<
    TProcedures[K],
    TKinds[K]
  >;
} & {
  /** App-wide TanStack Query provider — use as `<api.Provider>`. */
  Provider: ComponentType<ReactClientProviderProps>;
  /** Access invalidate / prefetch helpers bound to the current QueryClient. */
  useUtils: () => ReactClientUtils<TProcedures>;
  /** Underlying typed pyRPC client (Promise-based). */
  client: TProcedures;
};

export type ProcedureUtils<TProc extends AnyProc> = {
  invalidate: (input?: QueryInput<TProc>) => Promise<void>;
  prefetch: (input: QueryInput<TProc>) => Promise<void>;
  getQueryKey: (input?: QueryInput<TProc>) => readonly unknown[];
  fetch: (input: QueryInput<TProc>) => Promise<ProcResult<TProc>>;
};

export type ReactClientUtils<TProcedures extends ProceduresRecord> = {
  [K in keyof TProcedures]: ProcedureUtils<TProcedures[K]>;
} & {
  invalidateAll: () => Promise<void>;
  queryClient: QueryClient;
};

export const QUERY_KEY_PREFIX = 'pyrpc' as const;
