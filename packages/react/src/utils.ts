import type { QueryClient } from '@tanstack/react-query';
import { callProcedure } from './call';
import { getProcedureQueryKey } from './queryKey';
import { QUERY_KEY_PREFIX, type AnyProc, type ProceduresRecord, type ReactClientUtils } from './types';

export function createUtils<TProcedures extends ProceduresRecord>(
  client: TProcedures,
  queryClient: QueryClient,
): ReactClientUtils<TProcedures> {
  const utils = {
    queryClient,
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PREFIX] }),
  } as ReactClientUtils<TProcedures>;

  return new Proxy(utils, {
    get(target, prop: string | symbol) {
      if (typeof prop !== 'string') return undefined;
      if (prop in target) {
        return (target as Record<string, unknown>)[prop];
      }

      const fn = (client as Record<string, AnyProc>)[prop];
      if (typeof fn !== 'function') return undefined;

      return {
        getQueryKey: (input?: unknown) => getProcedureQueryKey(prop, input),
        invalidate: (input?: unknown) =>
          queryClient.invalidateQueries({
            queryKey: getProcedureQueryKey(prop, input),
          }),
        prefetch: (input: unknown) =>
          queryClient.prefetchQuery({
            queryKey: getProcedureQueryKey(prop, input),
            queryFn: () => callProcedure(fn, input as never),
          }),
        fetch: (input: unknown) =>
          queryClient.fetchQuery({
            queryKey: getProcedureQueryKey(prop, input),
            queryFn: () => callProcedure(fn, input as never),
          }),
      };
    },
  });
}
