export interface RpcRequest {
  id: string;
  method: string;
  params: any[] | Record<string, any>;
}

export interface RpcResponse<T = any> {
  id: string;
  result: T | null;
  error: {
    code: number;
    message: string;
    data?: any;
  } | null;
}

export interface ClientOptions {
  /**
   * The base URL of the pyRPC server.
   * If omitted in a browser environment, it defaults to the current origin + '/rpc'.
   */
  baseUrl?: string;
  /**
   * Optional custom headers to send with each request.
   */
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
}
