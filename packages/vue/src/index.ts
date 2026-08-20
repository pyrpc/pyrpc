export { createVueClient, createPyrpcVue } from './createVueClient';
export type { VueClientOptions, VueAppClient } from './createVueClient';
export { httpLink, httpBatchLink } from '@pyrpc/client';

export type {
  VueClient,
  ProcedureKindMap,
  ProceduresRecord,
  QueryInput,
  ProcedureKind,
  InferProcedureKinds,
} from './types';
export { QUERY_KEY_PREFIX } from './types';
