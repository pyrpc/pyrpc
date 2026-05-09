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

export class PyRPCClient {
  private baseUrl: string;
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

    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.options = options;
  }

  /**
   * Internal method to perform the fetch request.
   */
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

    const response = await fetch(`${this.baseUrl}/rpc`, {
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

  /**
   * Creates a proxy that allows calling remote procedures as if they were local methods.
   */
  public get rpc(): any {
    return new Proxy({}, {
      get: (_, method: string) => {
        return (...args: any[]) => {
          // If the first argument is an object and it's the only one, 
          // we treat it as named parameters. Otherwise, positional.
          const params = (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0]))
            ? args[0]
            : args;
          return this.request(method, params);
        };
      }
    });
  }
}

/**
 * Modern factory API for pyRPC.
 */
export function createClient<TTypes = any>(options: ClientOptions = {}): PyRPCClient & TTypes {
  const client = new PyRPCClient(options);
  
  return new Proxy(client, {
    get(target, prop: string, receiver) {
      if (prop in target) {
        return Reflect.get(target, prop, receiver);
      }
      return target.rpc[prop];
    }
  }) as any;
}
