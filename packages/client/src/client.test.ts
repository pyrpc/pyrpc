import { describe, it, expect, vi } from 'vitest';
import { createClient, httpBatchLink, httpLink } from './index';

describe('PyRPCClient', () => {
  it('should format request correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: 'test-id',
        result: 42,
        error: null
      })
    });
    globalThis.fetch = mockFetch as any;

    const client = createClient({
      links: [httpLink({ url: 'http://localhost:8000/rpc' })],
    });
    const result = await client.add(1, 2);

    expect(result).toBe(42);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/rpc',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"method":"add"'),
      })
    );
  });

  it('should handle named parameters', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'x', result: 'hello', error: null })
    });
    global.fetch = mockFetch;

    const client = createClient({
      links: [httpLink({ url: 'http://localhost:8000/rpc' })],
    });
    await client.greet({ name: 'World' });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.params).toEqual({ name: 'World' });
  });

  it('should throw PyRPCError on server error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: 'x',
        error: { code: -32601, message: 'Method not found' }
      })
    });

    const client = createClient({
      links: [httpLink({ url: 'http://localhost:8000/rpc' })],
    });
    await expect(client.unknown()).rejects.toThrow('Method not found');
  });
});

describe('createClient links configuration', () => {
  it('rejects clients with no links', () => {
    expect(() => createClient({ links: [] })).toThrow('No terminating link');
    expect(() => createClient()).toThrow('No terminating link');
  });

  it('rejects clients with multiple terminating links', () => {
    expect(() =>
      createClient({
        links: [
          httpLink({ url: 'http://localhost:8000/rpc' }),
          httpBatchLink({ url: 'http://localhost:8000/rpc' }),
        ],
      })
    ).toThrow('Multiple terminating links');
  });
});

describe('httpBatchLink', () => {
  it('can send a single operation', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: '1', result: 'hello', error: null }]),
    });
    globalThis.fetch = mockFetch as any;

    const client = createClient({
      links: [httpBatchLink({ url: 'http://localhost:8000/rpc' })],
    });
    const result = await client.greet({ name: 'World' });

    expect(result).toBe('hello');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].method).toBe('greet');
  });

  it('combines concurrent operations into one HTTP request', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: '1', result: 1, error: null },
        { id: '2', result: 2, error: null },
        { id: '3', result: 50, error: null },
      ]),
    });
    globalThis.fetch = mockFetch as any;

    const client = createClient({
      links: [httpBatchLink({ url: 'http://localhost:8000/rpc' })],
    });

    const results = await Promise.all([
      client.get_user({ id: 1 }),
      client.get_user({ id: 2 }),
      client.get_post({ id: 50 }),
    ]);

    expect(results).toEqual([1, 2, 50]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toHaveLength(3);
  });

  it('correlates results back to the correct operations', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: 'a', result: 'alice', error: null },
        { id: 'b', result: 'bob', error: null },
      ]),
    });
    globalThis.fetch = mockFetch as any;

    const client = createClient({
      links: [httpBatchLink({ url: 'http://localhost:8000/rpc' })],
    });

    const [alice, bob] = await Promise.all([
      client.get_user({ id: 1 }),
      client.get_user({ id: 2 }),
    ]);

    expect(alice).toBe('alice');
    expect(bob).toBe('bob');
  });

  it('does not fail successful operations when one operation errors', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: 'a', result: 'alice', error: null },
        { id: 'b', result: null, error: { code: -32601, message: 'Not found' } },
        { id: 'c', result: 'carol', error: null },
      ]),
    });
    globalThis.fetch = mockFetch as any;

    const client = createClient({
      links: [httpBatchLink({ url: 'http://localhost:8000/rpc' })],
    });

    const [alice, bob, carol] = await Promise.allSettled([
      client.get_user({ id: 1 }),
      client.get_user({ id: 2 }),
      client.get_user({ id: 3 }),
    ]);

    expect(alice.status).toBe('fulfilled');
    expect((alice as PromiseFulfilledResult<unknown>).value).toBe('alice');
    expect(bob.status).toBe('rejected');
    expect((bob as PromiseRejectedResult).reason.message).toBe('Not found');
    expect(carol.status).toBe('fulfilled');
    expect((carol as PromiseFulfilledResult<unknown>).value).toBe('carol');
  });

  it('rejects all operations when the HTTP request fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const client = createClient({
      links: [httpBatchLink({ url: 'http://localhost:8000/rpc' })],
    });

    const results = await Promise.allSettled([
      client.get_user({ id: 1 }),
      client.get_user({ id: 2 }),
    ]);

    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    expect((results[0] as PromiseRejectedResult).reason.message).toBe('HTTP error! status: 500');
  });

  it('flushes early when maxItems is reached', async () => {
    const allResults = [
      { id: '1', result: 1, error: null },
      { id: '2', result: 2, error: null },
      { id: '3', result: 3, error: null },
    ];
    const mockFetch = vi.fn().mockImplementation((_url, init) => {
      const body = JSON.parse(init.body);
      const isFirstBatch = body[0].method === 'get_user' && body.length === 2;
      const offset = isFirstBatch ? 0 : 2;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(allResults.slice(offset, offset + body.length)),
      });
    });
    globalThis.fetch = mockFetch as any;

    const client = createClient({
      links: [httpBatchLink({ url: 'http://localhost:8000/rpc', maxItems: 2 })],
    });

    const results = await Promise.all([
      client.get_user({ id: 1 }),
      client.get_user({ id: 2 }),
      client.get_user({ id: 3 }),
    ]);

    expect(results).toEqual([1, 2, 3]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});