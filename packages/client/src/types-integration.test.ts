import { describe, it, expect, vi } from 'vitest';
import { createClient } from './index';

describe('@pyrpc/types integration', () => {
  it('should provide autocompletion via Types generic', async () => {
    // Simulate the generated Types interface from @pyrpc/types
    interface Types {
      add(a: number, b: number): Promise<number>;
      greet(name: string): Promise<string>;
    }

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 42 }),
    });
    globalThis.fetch = mockFetch as any;

    const client = createClient<Types>({ baseUrl: 'http://localhost:8000' });

    const result = await client.add(1, 2);
    expect(result).toBe(42);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/rpc',
      expect.objectContaining({
        body: expect.stringContaining('"method":"add"'),
      })
    );
  });

  it('should proxy unknown properties to rpc', async () => {
    interface Types {
      customMethod(payload: { id: number }): Promise<{ name: string }>;
    }

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: { name: 'test' } }),
    });
    globalThis.fetch = mockFetch as any;

    const client = createClient<Types>({ baseUrl: 'http://localhost:8000' });
    const result = await client.customMethod({ id: 1 });

    expect(result).toEqual({ name: 'test' });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.method).toBe('customMethod');
    expect(body.params).toEqual({ id: 1 });
  });

  it('should still expose client methods alongside rpc methods', () => {
    const client = createClient({ baseUrl: 'http://localhost:8000' });
    // Client methods like rpc should still be accessible
    expect(client.rpc).toBeDefined();
  });
});
