export { createSvelteClient } from './createSvelteClient';
export type { SvelteClientOptions } from './createSvelteClient';
export { httpLink, httpBatchLink } from '@pyrpc/client';
export type {
  SvelteClient,
  ProcedureKindMap,
  ProceduresRecord,
  QueryInput,
  ProcedureKind,
  InferProcedureKinds,
} from './types';
export { QUERY_KEY_PREFIX } from './types';
