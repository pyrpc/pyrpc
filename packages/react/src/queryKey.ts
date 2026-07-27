import { QUERY_KEY_PREFIX } from './types';

export function getProcedureQueryKey(
  procedure: string,
  input?: unknown,
): readonly unknown[] {
  if (input === undefined) {
    return [QUERY_KEY_PREFIX, procedure] as const;
  }
  return [QUERY_KEY_PREFIX, procedure, input] as const;
}
