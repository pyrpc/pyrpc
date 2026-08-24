// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

// Lints the published TypeScript packages. The docs site keeps its own
// config (docs/eslint.config.mjs); examples are template code, not library
// surface, and are intentionally out of scope here.
export default tseslint.config(
  {
    ignores: [
      'docs/',
      'examples/',
      '**/dist/',
      '**/node_modules/',
      'architecture/',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['packages/*/src/**/*.ts', 'packages/*/src/**/*.tsx'],
    rules: {
      // Library surface: explicitness beats brevity.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': 'off',
    },
  },
  {
    // Dynamic-boundary seams where any[] parameter variance is load-bearing:
    // procedures are captured generically and re-exposed through a Proxy, so
    // unknown[] would break assignability for every concrete procedure.
    files: ['packages/*/src/**/types.ts', 'packages/client/src/client.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['packages/**/*.test.ts', 'packages/**/*.test.tsx'],
    rules: {
      // Tests exercise failure paths; any is acceptable at the seams.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
