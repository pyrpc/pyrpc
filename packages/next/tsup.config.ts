import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/client.ts',
    server: 'src/server.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  external: [
    'react',
    'next',
    '@tanstack/react-query',
    '@pyrpc/client',
    '@pyrpc/react',
    '@pyrpc/types',
  ],
});
