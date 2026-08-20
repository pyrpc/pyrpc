import { describe, expect, it } from 'vitest';
import { createVueClient } from './createVueClient';
import { httpLink } from '@pyrpc/client';

type TestTypes = {
  greet: (input: { name: string }) => Promise<string>;
  add: (a: number, b: number) => Promise<number>;
};

describe('createVueClient', () => {
  it('exposes both hooks by default when kinds are empty', () => {
    const api = createVueClient<TestTypes>({ links: [httpLink({ url: 'http://localhost:8000/rpc' })], kinds: {} });
    expect(typeof api.greet.useQuery).toBe('function');
    expect(typeof api.greet.useMutation).toBe('function');
  });

  it('respects kinds override', () => {
    const api = createVueClient<TestTypes>({
      links: [httpLink({ url: 'http://localhost:8000/rpc' })],
      kinds: { greet: 'query', add: 'mutation' },
    });
    expect(typeof api.greet.useQuery).toBe('function');
    expect((api.greet as { useMutation?: unknown }).useMutation).toBeUndefined();
    expect(typeof api.add.useMutation).toBe('function');
    expect((api.add as { useQuery?: unknown }).useQuery).toBeUndefined();
  });
});
