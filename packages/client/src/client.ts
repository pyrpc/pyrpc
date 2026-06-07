import { PyRPCError } from './error';
import type { ClientOptions, RpcRequest, RpcResponse } from './types';

const NO_BASE_URL_ERROR = `
No server URL configured.

Provide a baseUrl when creating the client:

  const api = createClient({ baseUrl: "http://localhost:8000" })

Or set up your client configuration by running:

  npx pyrpc init
`;

function readPyrpcClientConfig(): { distribution?: string; server_url?: string } | null {
  if (typeof process === 'undefined' || typeof require === 'undefined') return null;
  try {
    const fs = require('fs') as { existsSync: (p: string) => boolean; readFileSync: (p: string, enc: string) => string };
    const p = require('path') as { join: (...args: string[]) => string; dirname: (p: string) => string };

    let dir = process.cwd();
    while (true) {
      const cfgPath = p.join(dir, 'pyrpc-client.json');
      if (fs.existsSync(cfgPath)) {
        return JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
      }
      const parent = p.dirname(dir);
      if (parent === dir) return null;
      dir = parent;
    }
  } catch {
    return null;
  }
}

class PyRPCClient {
  private url: string;
  private options: ClientOptions;

  constructor(options: ClientOptions = {}) {
    this.options = options;

    let baseUrl = options.baseUrl;

    if (!baseUrl) {
      const config = readPyrpcClientConfig();
      if (config?.server_url) {
        baseUrl = config.server_url;
      } else if (typeof window !== 'undefined' && window.location) {
        baseUrl = window.location.origin;
      }
    }

    if (baseUrl) {
      const clean = baseUrl.replace(/\/+$/, '');
      this.url = clean.replace(/\/rpc$/i, '') + '/rpc';
    } else {
      this.url = '';
    }
  }

  private async request<T>(method: string, params: any): Promise<T> {
    if (!this.url) {
      throw new Error(NO_BASE_URL_ERROR);
    }

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
