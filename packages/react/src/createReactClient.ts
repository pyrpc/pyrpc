'use client';

import { createClient, type ClientOptions } from '@pyrpc/client';
import { procedureKinds as generatedKinds } from '@pyrpc/types';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { callProcedure } from './call';
import { getProcedureQueryKey } from './queryKey';
import { PyRPCProvider } from './provider';
import { createUtils } from './utils';
import type {
  AnyProc,
  InferProcedureKinds,
  ProcedureKindMap,
  ProceduresRecord,
  QueryInput,
  ReactClient,
} from './types';

function createProcedureHooks(
  client: ProceduresRecord,
  procedure: string,
  kind: 'query' | 'mutation' | undefined,
) {
  const fn = (client as Record<string, AnyProc>)[procedure];

  const hooks: Record<string, unknown> = {};

  if (kind !== 'mutation') {
    hooks.useQuery = (
      input: unknown,
      options?: Omit<UseQueryOptions<unknown, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        ...options,
        queryKey: getProcedureQueryKey(procedure, input),
        queryFn: () => callProcedure(fn, input as never),
      });
  }

  if (kind !== 'query') {
    hooks.useMutation = (
      options?: Omit<UseMutationOptions<unknown, Error, unknown>, 'mutationFn'>,
    ) =>
      useMutation({
        ...options,
        mutationFn: (input: unknown) => callProcedure(fn, input as never),
      });
  }

  return hooks;
}

export type ReactClientOptions = ClientOptions & {
  /**
   * @internal Override generated kinds. Prefer relying on codegen — adapters
   * load `procedureKinds` from `@pyrpc/types` automatically.
   */
  kinds?: ProcedureKindMap<ProceduresRecord>;
};

/**
 * One `api` object: procedures + `api.Provider` + `api.useUtils()`.
 *
 * @example
 * ```ts
 * export const api = createReactClient<Types>({
 *   links: [httpLink({ url: "http://localhost:8000/rpc" })],
 * })
 * // <api.Provider>{children}</api.Provider>
 * // api.greet.useQuery({ name: "Ada" })
 * ```
 */
export function createReactClient<TProcedures extends ProceduresRecord>(
  options: ReactClientOptions = { links: [] },
): ReactClient<TProcedures, InferProcedureKinds<TProcedures>> {
  const { kinds: kindsOverride, ...clientOptions } = options;
  const kinds = (kindsOverride ??
    generatedKinds) as ProcedureKindMap<TProcedures>;
  const client = createClient<TProcedures>(clientOptions);

  const root = {
    client,
    Provider: PyRPCProvider,
    useUtils: () => {
      const queryClient = useQueryClient();
      return createUtils(client, queryClient);
    },
  };

  return new Proxy(root as object, {
    get(target, prop: string | symbol) {
      if (typeof prop !== 'string') return undefined;
      if (prop in target) {
        return (target as Record<string, unknown>)[prop];
      }

      const kind = kinds?.[prop as keyof typeof kinds] as
        | 'query'
        | 'mutation'
        | undefined;

      return createProcedureHooks(client as ProceduresRecord, prop, kind);
    },
  }) as ReactClient<TProcedures, InferProcedureKinds<TProcedures>>;
}

export type { QueryInput };
