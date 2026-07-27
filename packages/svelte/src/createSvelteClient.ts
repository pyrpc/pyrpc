import { createClient, type ClientOptions } from '@pyrpc/client';
import { procedureKinds as generatedKinds } from '@pyrpc/types';
import { createMutation, createQuery } from '@tanstack/svelte-query';
import { callProcedure } from './call';
import type {
  AnyProc,
  ProcedureKindMap,
  ProceduresRecord,
  SvelteClient,
} from './types';
import { QUERY_KEY_PREFIX } from './types';

export type SvelteClientOptions = ClientOptions & {
  /** @internal Override generated kinds. Prefer codegen defaults. */
  kinds?: ProcedureKindMap<ProceduresRecord>;
};

function getProcedureQueryKey(
  procedure: string,
  input?: unknown,
): readonly unknown[] {
  return input === undefined
    ? [QUERY_KEY_PREFIX, procedure]
    : [QUERY_KEY_PREFIX, procedure, input];
}

/**
 * Create a Svelte + TanStack Query client for pyRPC.
 * Kinds load automatically from `@pyrpc/types`.
 */
export function createSvelteClient<TProcedures extends ProceduresRecord>(
  options: SvelteClientOptions = {},
): SvelteClient<TProcedures> {
  const { kinds: kindsOverride, ...clientOptions } = options;
  const kinds = (kindsOverride ??
    generatedKinds) as ProcedureKindMap<TProcedures>;
  const client = createClient<TProcedures>(clientOptions);
  const root = { client };

  return new Proxy(root as object, {
    get(target, prop: string | symbol) {
      if (typeof prop !== 'string') return undefined;
      if (prop in target) return (target as Record<string, unknown>)[prop];

      const fn = (client as Record<string, AnyProc>)[prop];
      const kind = kinds?.[prop as keyof typeof kinds] as
        | 'query'
        | 'mutation'
        | undefined;

      const hooks: Record<string, unknown> = {};

      if (kind !== 'mutation') {
        hooks.createQuery = (input: unknown, queryOptions?: object) =>
          createQuery({
            ...(queryOptions as object),
            queryKey: getProcedureQueryKey(prop, input),
            queryFn: () => callProcedure(fn, input as never),
          });
      }

      if (kind !== 'query') {
        hooks.createMutation = (mutationOptions?: object) =>
          createMutation({
            ...(mutationOptions as object),
            mutationFn: (input: unknown) => callProcedure(fn, input as never),
          });
      }

      return hooks;
    },
  }) as SvelteClient<TProcedures>;
}
