/**
 * An RPC operation: "run procedure `method` with `params`".
 * The generated client produces these; links transport them.
 */
export interface Operation {
  id: string;
  method: string;
  params: any[] | Record<string, any>;
}

export interface OperationError {
  code: number;
  message: string;
  data?: any;
}

/**
 * The wire result of a single RPC operation. `error` is set when the
 * HTTP request succeeded but the RPC procedure itself failed; the two are
 * mutually exclusive.
 */
export interface OperationResult<T = any> {
  id: string;
  result: T | null;
  error: OperationError | null;
}

/**
 * A terminating link transports an RPC operation to the server.
 *
 * - `httpLink`      — one operation → one HTTP request
 * - `httpBatchLink` — several operations → one HTTP request
 *
 * Non-terminating links (logging, retry, auth, splitting) are not
 * implemented yet; the interface is kept minimal so they can be added
 * later without changing the client core.
 */
export interface TerminatingLink {
  request(operation: Operation): Promise<OperationResult>;
}

/** Configuration for `httpLink`. */
export interface HttpLinkOptions {
  /**
   * Server URL. Give the server root (`http://localhost:8000`) or the full
   * endpoint (`http://localhost:8000/rpc`); the link normalizes to `/rpc`.
   */
  url: string;
}

/** Configuration for `httpBatchLink`. */
export interface HttpBatchLinkOptions {
  /**
   * Server URL. Give the server root (`http://localhost:8000`) or the full
   * endpoint (`http://localhost:8000/rpc`); the link normalizes to `/rpc`.
   */
  url: string;
  /**
   * Maximum number of operations per HTTP request. When more operations
   * are queued than this, they are flushed immediately rather than waiting
   * for the batching window. Defaults to `Infinity`.
   */
  maxItems?: number;
}

export interface ClientOptions {
  /**
   * The link pipeline. For now exactly one terminating link is supported
   * (`httpLink` or `httpBatchLink`); supplying zero or multiple terminating
   * links is a configuration error.
   */
  links: TerminatingLink[];
}