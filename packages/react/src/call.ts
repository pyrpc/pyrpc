import type { AnyProc, QueryInput } from './types';

/** Invoke a procedure with the same input shape used by hooks. */
export function callProcedure<TProc extends AnyProc>(
  fn: TProc,
  input: QueryInput<TProc>,
): Promise<Awaited<ReturnType<TProc>>> {
  if (input === undefined) {
    return fn();
  }
  if (Array.isArray(input)) {
    return fn(...input);
  }
  return fn(input);
}
