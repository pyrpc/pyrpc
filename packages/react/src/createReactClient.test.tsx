import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createReactClient } from './createReactClient';
import { getProcedureQueryKey } from './queryKey';
import { httpLink } from '@pyrpc/client';

type TestTypes = {
  add: (a: number, b: number) => Promise<number>;
  greet: (input: { name: string }) => Promise<string>;
  get_status: () => Promise<{ status: string }>;
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('createReactClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('useQuery calls the procedure with object input', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'Hello, Ada', error: null }),
    }) as any;

    const api = createReactClient<TestTypes>({
      links: [httpLink({ url: 'http://localhost:8000/rpc' })],
      kinds: {},
    });

    const { result } = renderHook(
      () => api.greet.useQuery({ name: 'Ada' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('Hello, Ada');
  });

  it('useQuery supports positional args via tuple input', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 3, error: null }),
    }) as any;

    const api = createReactClient<TestTypes>({
      links: [httpLink({ url: 'http://localhost:8000/rpc' })],
      kinds: {},
    });

    const { result } = renderHook(() => api.add.useQuery([1, 2]), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(3);
  });

  it('useMutation calls the procedure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'Hello, Bob', error: null }),
    }) as any;

    const api = createReactClient<TestTypes>({
      links: [httpLink({ url: 'http://localhost:8000/rpc' })],
      kinds: {},
    });

    const { result } = renderHook(() => api.greet.useMutation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ name: 'Bob' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('Hello, Bob');
  });

  it('respects kinds override (query-only)', () => {
    const api = createReactClient<TestTypes>({
      links: [httpLink({ url: 'http://localhost:8000/rpc' })],
      kinds: { greet: 'query', add: 'mutation' },
    });

    expect(typeof api.greet.useQuery).toBe('function');
    expect((api.greet as { useMutation?: unknown }).useMutation).toBeUndefined();
    expect(typeof api.add.useMutation).toBe('function');
    expect((api.add as { useQuery?: unknown }).useQuery).toBeUndefined();
  });

  it('useUtils can invalidate and build query keys', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: { status: 'ok' }, error: null }),
    }) as any;

    const api = createReactClient<TestTypes>({
      links: [httpLink({ url: 'http://localhost:8000/rpc' })],
      kinds: {},
    });

    const { result } = renderHook(
      () => {
        const query = api.get_status.useQuery(undefined);
        const utils = api.useUtils();
        return { query, utils };
      },
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    expect(result.current.utils.get_status.getQueryKey()).toEqual(
      getProcedureQueryKey('get_status'),
    );
    await result.current.utils.get_status.invalidate();
  });
});
