import type {
  UseMutationOptions,
  UseMutationReturnType,
  UseQueryOptions,
  UseQueryReturnType,
} from '@tanstack/vue-query';

export type AnyProc = (...args: any[]) => Promise<any>;
export type ProceduresRecord = Record<string, AnyProc>;
export type ProcResult<T> = T extends (...args: any[]) => Promise<infer R> ? R : never;
export type ProcArgs<T> = T extends (...args: infer A) => any ? A : never;

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
  useQuery: (
    input: QueryInput<TProc>,
    options?: Omit<UseQueryOptions<ProcResult<TProc>, Error>, 'queryKey' | 'queryFn'>,
  ) => UseQueryReturnType<ProcResult<TProc>, Error>;
};

export type ProcedureMutationHooks<TProc extends AnyProc> = {
  useMutation: (
    options?: Omit<
      UseMutationOptions<ProcResult<TProc>, Error, QueryInput<TProc>, unknown>,
      'mutationFn'
    >,
  ) => UseMutationReturnType<ProcResult<TProc>, Error, QueryInput<TProc>, unknown>;
};

export type ProcedureHooksForKind<
  TProc extends AnyProc,
  TKind extends ProcedureKind | undefined,
> = TKind extends 'mutation'
  ? ProcedureMutationHooks<TProc>
  : TKind extends 'query'
    ? ProcedureQueryHooks<TProc>
    : ProcedureQueryHooks<TProc> & ProcedureMutationHooks<TProc>;

export type VueClient<TProcedures extends ProceduresRecord> = {
  [K in keyof TProcedures]: ProcedureHooksForKind<
    TProcedures[K],
    InferProcedureKinds<TProcedures>[K]
  >;
} & {
  client: TProcedures;
};

export const QUERY_KEY_PREFIX = 'pyrpc' as const;
