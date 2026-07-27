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

export type ProcedureQueryHooks = {
  createQuery: (input: unknown, options?: Record<string, unknown>) => unknown;
};

export type ProcedureMutationHooks = {
  createMutation: (options?: Record<string, unknown>) => unknown;
};

export type ProcedureHooksForKind<TKind extends ProcedureKind | undefined> =
  TKind extends 'mutation'
    ? ProcedureMutationHooks
    : TKind extends 'query'
      ? ProcedureQueryHooks
      : ProcedureQueryHooks & ProcedureMutationHooks;

export type SvelteClient<TProcedures extends ProceduresRecord> = {
  [K in keyof TProcedures]: ProcedureHooksForKind<
    InferProcedureKinds<TProcedures>[K]
  >;
} & {
  client: TProcedures;
};

export const QUERY_KEY_PREFIX = 'pyrpc' as const;
