import { describe, it, expect, mock } from 'bun:test';
import { createClient } from './index';

describe('PyRPCClient', () => {
  it('should format request correctly', async () => {
    const mockFetch = mock().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: 'test-id',
        result: 42,
        error: null
      })
    });
    globalThis.fetch = mockFetch as any;

    const client = createClient({ baseUrl: 'http://localhost:8000' });
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
    const mockFetch = mock().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 'hello' })
    });
    globalThis.fetch = mockFetch as any;

    const client = createClient({ baseUrl: 'http://localhost:8000' });
    await client.greet({ name: 'World' });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.params).toEqual({ name: 'World' });
  });

  it('should throw PyRPCError on server error', async () => {
    globalThis.fetch = mock().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        error: { code: -32601, message: 'Method not found' }
      })
    }) as any;

    const client = createClient({ baseUrl: 'http://localhost:8000' });
    await expect(client.unknown()).rejects.toThrow('Method not found');
  });
});
