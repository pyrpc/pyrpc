import type {
  HttpBatchLinkOptions,
  HttpLinkOptions,
  Operation,
  OperationResult,
  TerminatingLink,
} from './types';

const CONTENT_TYPE = { 'Content-Type': 'application/json' };

function normalizeUrl(url: string): string {
  const clean = url.replace(/\/+$/, '');
  return clean.replace(/\/rpc$/i, '') + '/rpc';
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Terminating link: one RPC operation → one HTTP request.
 */
export function httpLink(options: HttpLinkOptions): TerminatingLink {
  const url = normalizeUrl(options.url);
  return {
    async request(operation: Operation): Promise<OperationResult> {
      const response = await fetch(url, {
        method: 'POST',
        headers: CONTENT_TYPE,
        body: JSON.stringify(operation),
      });
      return readJson<OperationResult>(response);
    },
  };
}

interface PendingOperation {
  operation: Operation;
  resolve: (result: OperationResult) => void;
  reject: (reason: unknown) => void;
}

interface Batch {
  url: string;
  maxItems: number;
  pending: PendingOperation[];
  timer: ReturnType<typeof setTimeout> | null;
}

/**
 * Terminating link: multiple independent RPC operations → one HTTP request.
 *
 * The developer writes normal RPC calls; the link collects operations that
 * occur in the same scheduling window and sends them as a single JSON array.
 * Each operation keeps its own id and resolves/rejects independently, so one
 * failed procedure never fails the others (the HTTP request succeeding is a
 * transport success; a per-operation error is an operation failure).
 *
 * Batching is a transport optimization, not a new procedure and not a
 * transaction: the server dispatches every operation through the normal RPC
 * router, sequentially, and operations are not rolled back on failure.
 */
export function httpBatchLink(options: HttpBatchLinkOptions): TerminatingLink {
  const url = normalizeUrl(options.url);
  const maxItems = options.maxItems ?? Infinity;

  let batch: Batch | null = null;

  const flush = async (current: Batch) => {
    if (current.timer !== null) {
      clearTimeout(current.timer);
      current.timer = null;
    }
    if (batch === current) {
      batch = null;
    }
    const pending = current.pending.splice(0, current.pending.length);

    try {
      const response = await fetch(current.url, {
        method: 'POST',
        headers: CONTENT_TYPE,
        body: JSON.stringify(pending.map((p) => p.operation)),
      });
      const results: OperationResult[] = await readJson<OperationResult[]>(response);

      pending.forEach((p, index) => {
        const result = results[index];
        if (result) {
          p.resolve(result);
        } else {
          p.reject(new Error(`Missing batch response for operation ${p.operation.id}`));
        }
      });
    } catch (error) {
      pending.forEach((p) => p.reject(error));
    }
  };

  return {
    request(operation: Operation): Promise<OperationResult> {
      if (!batch) {
        batch = { url, maxItems, pending: [], timer: null };
      }
      const current = batch;

      return new Promise<OperationResult>((resolve, reject) => {
        current.pending.push({ operation, resolve, reject });

        if (current.pending.length >= current.maxItems) {
          void flush(current);
          return;
        }
        if (current.timer === null) {
          current.timer = setTimeout(() => void flush(current), 0);
        }
      });
    },
  };
}