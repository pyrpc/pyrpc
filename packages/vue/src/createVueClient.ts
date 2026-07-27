import { createClient, type ClientOptions } from '@pyrpc/client';
import { procedureKinds as generatedKinds } from '@pyrpc/types';
import { useMutation, useQuery, VueQueryPlugin } from '@tanstack/vue-query';
import type { App, Plugin } from 'vue';
import { callProcedure } from './call';
import type {
  AnyProc,
  ProcedureKindMap,
  ProceduresRecord,
  VueClient,
} from './types';
import { QUERY_KEY_PREFIX } from './types';

export type VueClientOptions = ClientOptions & {
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
 * Create a Vue + TanStack Query client for pyRPC.
 * Kinds load automatically from `@pyrpc/types`.
 */
export function createVueClient<TProcedures extends ProceduresRecord>(
  options: VueClientOptions = {},
): VueClient<TProcedures> {
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
        hooks.useQuery = (input: unknown, queryOptions?: object) =>
          useQuery({
            ...(queryOptions as object),
            queryKey: getProcedureQueryKey(prop, input) as unknown as readonly unknown[],
            queryFn: () => callProcedure(fn, input as never),
          } as never);
      }

      if (kind !== 'query') {
        hooks.useMutation = (mutationOptions?: object) =>
          useMutation({
            ...(mutationOptions as object),
            mutationFn: (input: unknown) => callProcedure(fn, input as never),
          } as never);
      }

      return hooks;
    },
  }) as VueClient<TProcedures>;
}

export type VueAppClient<TProcedures extends ProceduresRecord> =
  VueClient<TProcedures> & {
    /** `app.use(api.plugin)` — registers TanStack Vue Query. */
    plugin: Plugin;
  };

/**
 * One `api` object for Vue: procedures + `api.plugin`.
 *
 * @example
 * ```ts
 * export const api = createPyrpcVue<Types>({ baseUrl: "..." })
 * createApp(App).use(api.plugin).mount("#app")
 * api.greet.useQuery({ name: "Ada" })
 * ```
 */
export function createPyrpcVue<TProcedures extends ProceduresRecord>(
  options: VueClientOptions = {},
): VueAppClient<TProcedures> {
  const api = createVueClient<TProcedures>(options);
  const plugin: Plugin = {
    install(app: App) {
      app.use(VueQueryPlugin);
      app.provide('pyrpc', api);
    },
  };
  return Object.assign(api, { plugin });
}
