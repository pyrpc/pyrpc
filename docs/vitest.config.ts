import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname),
    },
  },
  test: {
    include: ['__tests__/**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**'],
    environment: 'node',
    server: {
      deps: {
        external: [/fumadocs-mdx/],
      },
    },
  },
});
