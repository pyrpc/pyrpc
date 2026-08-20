import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createNextClient } from './createNextClient';
import { httpLink } from '@pyrpc/client';

type TestTypes = {
  greet: (input: { name: string }) => Promise<string>;
  add: (a: number, b: number) => Promise<number>;
};

describe('createNextClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('createCaller invokes procedures', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'Hello, Ada', error: null }),
    }) as any;

    const api = createNextClient<TestTypes>({
      links: [httpLink({ url: 'http://localhost:8000/rpc' })],
    });

    await expect(api.createCaller().greet({ name: 'Ada' })).resolves.toBe(
      'Hello, Ada',
    );
  });

  it('exposes hooks on the top-level api object', () => {
    const api = createNextClient<TestTypes>({
      links: [httpLink({ url: 'http://localhost:8000/rpc' })],
      kinds: {},
    });
    expect(typeof api.greet.useQuery).toBe('function');
    expect(typeof api.greet.useMutation).toBe('function');
    expect(typeof api.Provider).toBe('function');
    expect(typeof api.prefetch.greet).toBe('function');
    expect(typeof api.HydrationBoundary).toBe('function');
  });

  it('prefetch + dehydrate populate query cache', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'Hello, Ada', error: null }),
    }) as any;

    const api = createNextClient<TestTypes>({
      links: [httpLink({ url: 'http://localhost:8000/rpc' })],
    });

    const queryClient = new QueryClient();
    const utils = api.createUtils(queryClient);
    await utils.greet.prefetch({ name: 'Ada' });

    const state = api.dehydrate(queryClient);
    expect(state.queries.length).toBeGreaterThan(0);
  });
});
