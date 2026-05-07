import { PyRPCError } from './error';
import type { ClientOptions, RpcRequest, RpcResponse } from './types';

export class PyRPCClient {
  private baseUrl: string;
  private options: ClientOptions;

  constructor(options: ClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.options = options;
  }

  /**
   * Internal method to perform the fetch request.
   */
  private async request<T>(method: string, params: any): Promise<T> {
    const id = Math.random().toString(36).substring(7);
    const body: RpcRequest = { id, method, params };

    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.options.headers) {
      const extraHeaders = typeof this.options.headers === 'function' 
        ? await this.options.headers() 
        : this.options.headers;
      headers = { ...headers, ...extraHeaders };
    }

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
 * Convenience factory function.
 */
export function createClient<TRouter = any>(options: ClientOptions): PyRPCClient & TRouter {
  const client = new PyRPCClient(options);
  
  // Return a proxy that merges the client instance with the rpc proxy
  return new Proxy(client, {
    get(target, prop: string, receiver) {
      if (prop in target) {
        return Reflect.get(target, prop, receiver);
      }
      return target.rpc[prop];
    }
  }) as any;
}
