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
  baseUrl: string;
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
}
