import { PyRPCError } from './error';
import type { ClientOptions, Operation, OperationResult, TerminatingLink } from './types';

const LINKS_ERROR = `
No terminating link configured.

Provide exactly one terminating transport link when creating the client:

  const api = createClient({
    links: [httpLink({ url: "http://localhost:8000/rpc" })],
  })

or:

  const api = createClient({
    links: [httpBatchLink({ url: "http://localhost:8000/rpc" })],
  })
`;

const MULTIPLE_LINKS_ERROR = `
Multiple terminating links are not supported yet.

Supply exactly one terminating link (httpLink or httpBatchLink):

  const api = createClient({ links: [httpLink({ url: "..." })] })
`;

class PyRPCClient {
  private link: TerminatingLink;

  constructor(options: ClientOptions) {
    if (!options.links || options.links.length === 0) {
      throw new Error(LINKS_ERROR);
    }
    if (options.links.length > 1) {
      throw new Error(MULTIPLE_LINKS_ERROR);
    }
    this.link = options.links[0];
  }

  private async request<T>(method: string, params: any): Promise<T> {
    const id = Math.random().toString(36).substring(7);
    const operation: Operation = { id, method, params };

    const data: OperationResult<T> = await this.link.request(operation);

    if (data.error) {
      throw new PyRPCError(data.error.code, data.error.message, data.error.data);
    }

    return data.result as T;
  }
}

function normalizeArgs(args: any[]): any {
  return (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0]))
    ? args[0]
    : args;
}

/**
 * Creates a typed pyRPC client.
 *
 * Pass your generated `Types` interface as the generic parameter
 * to get full type safety and auto-complete for all RPC procedures.
 *
 * The transport is configured with a single terminating link:
 *
 * @example
 * ```typescript
 * import { createClient, httpLink } from "@pyrpc/client"
 * import type { Types } from "@pyrpc/types"
 *
 * const api = createClient<Types>({
 *   links: [httpLink({ url: "http://localhost:8000/rpc" })],
 * })
 * const user = await api.get_user("John")
 * ```
 */
export function createClient<T = any>(
  options: ClientOptions = { links: [] }
): T {
  const client = new PyRPCClient(options);

  return new Proxy({} as Record<string, (...args: any[]) => Promise<any>>, {
    get(_target, prop: string | symbol) {
      if (typeof prop !== 'string') return undefined;
      return (...args: any[]) => (client as any).request(prop, normalizeArgs(args));
    }
  }) as unknown as T;
}