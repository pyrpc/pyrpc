import { describe, it, expect, vi } from 'vitest';
import { createClient, httpLink } from './index';

describe('@pyrpc/types integration', () => {
  it('should provide autocompletion via Types generic', async () => {
    // Simulate the generated Types interface from @pyrpc/types
    interface Types {
      add(a: number, b: number): Promise<number>;
      greet(name: string): Promise<string>;
    }

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'x', result: 42, error: null }),
    });
    globalThis.fetch = mockFetch as any;

    const client = createClient<Types>({
      links: [httpLink({ url: 'http://localhost:8000/rpc' })],
    });

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
      json: () => Promise.resolve({ id: 'x', result: { name: 'test' }, error: null }),
    });
    globalThis.fetch = mockFetch as any;

    const client = createClient<Types>({
      links: [httpLink({ url: 'http://localhost:8000/rpc' })],
    });
    const result = await client.customMethod({ id: 1 });

    expect(result).toEqual({ name: 'test' });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.method).toBe('customMethod');
    expect(body.params).toEqual({ id: 1 });
  });

  it('should normalise url and strip trailing slash', () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'x', result: null, error: null }),
    });
    globalThis.fetch = mockFetch as any;

    const client = createClient({
      links: [httpLink({ url: 'http://localhost:8000/rpc/' })],
    });
    void client.foo();

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/rpc',
      expect.objectContaining({ body: expect.stringContaining('"method":"foo"') }),
    );
  });

  it('should append /rpc when given a bare server url', () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'x', result: null, error: null }),
    });
    globalThis.fetch = mockFetch as any;

    const client = createClient({
      links: [httpLink({ url: 'http://localhost:8000' })],
    });
    void client.foo();

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/rpc',
      expect.objectContaining({ body: expect.stringContaining('"method":"foo"') }),
    );
  });

  it('should append /rpc to a bare url ending in a slash', () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'x', result: null, error: null }),
    });
    globalThis.fetch = mockFetch as any;

    const client = createClient({
      links: [httpLink({ url: 'http://localhost:8000/' })],
    });
    void client.foo();

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/rpc',
      expect.objectContaining({ body: expect.stringContaining('"method":"foo"') }),
    );
  });
});