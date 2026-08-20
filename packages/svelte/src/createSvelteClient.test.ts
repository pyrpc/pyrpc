import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/svelte-query', () => ({
  createQuery: vi.fn(() => ({})),
  createMutation: vi.fn(() => ({})),
}));

import { createSvelteClient } from './createSvelteClient';
import { httpLink } from '@pyrpc/client';

type TestTypes = {
  greet: (input: { name: string }) => Promise<string>;
  add: (a: number, b: number) => Promise<number>;
};

describe('createSvelteClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes both createQuery and createMutation by default', () => {
    const api = createSvelteClient<TestTypes>({
      links: [httpLink({ url: 'http://localhost:8000/rpc' })],
      kinds: {},
    });
    expect(typeof api.greet.createQuery).toBe('function');
    expect(typeof api.greet.createMutation).toBe('function');
  });

  it('respects kinds override', () => {
    const api = createSvelteClient<TestTypes>({
      links: [httpLink({ url: 'http://localhost:8000/rpc' })],
      kinds: { greet: 'query', add: 'mutation' },
    });
    expect(typeof api.greet.createQuery).toBe('function');
    expect((api.greet as { createMutation?: unknown }).createMutation).toBeUndefined();
    expect(typeof api.add.createMutation).toBe('function');
    expect((api.add as { createQuery?: unknown }).createQuery).toBeUndefined();
  });
});
