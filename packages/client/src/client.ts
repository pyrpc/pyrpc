import { PyRPCError } from './error';
import type { ClientOptions, RpcRequest, RpcResponse } from './types';

const NO_BASE_URL_ERROR = `
No baseUrl detected.

pyRPC could not automatically determine your server location.

If your frontend and backend are deployed separately, provide:

createClient({
  baseUrl: "https://api.example.com"
})
`;

class PyRPCClient {
  private url: string;
  private options: ClientOptions;

  constructor(options: ClientOptions = {}) {
    let baseUrl = options.baseUrl;

    if (!baseUrl) {
      if (typeof window !== 'undefined' && window.location) {
        baseUrl = window.location.origin;
      } else {
        throw new Error(NO_BASE_URL_ERROR);
      }
    }

    const clean = baseUrl.replace(/\/+$/, '');
    this.url = clean.replace(/\/rpc$/i, '') + '/rpc';
    this.options = options;
  }

  private async request<T>(method: string, params: any): Promise<T> {
    const id = Math.random().toString(36).substring(7);
    const body: RpcRequest = { id, method, params };

    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let userHeaders: HeadersInit = {};
    if (this.options.headers) {
      userHeaders = typeof this.options.headers === 'function' 
        ? await this.options.headers() 
        : this.options.headers;
    }

    const headers = { ...baseHeaders, ...Object.fromEntries(new Headers(userHeaders).entries()) };

    const response = await fetch(this.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RpcResponse<T> = await response.json();

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
 * @example
 * ```typescript
 * import { createClient } from "@pyrpc/client"
 * import type { Types } from "@pyrpc/types"
 *
 * const api = createClient<Types>({ baseUrl: "http://localhost:8000" })
 * const user = await api.get_user("John")
 * ```
 */
export function createClient<T = any>(
  options: ClientOptions = {}
): T {
  const client = new PyRPCClient(options);

  return new Proxy({} as Record<string, (...args: any[]) => Promise<any>>, {
    get(_target, prop: string | symbol) {
      if (typeof prop !== 'string') return undefined;
      return (...args: any[]) => (client as any).request(prop, normalizeArgs(args));
    }
  }) as unknown as T;
}
