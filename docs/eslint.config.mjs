import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    '.next/**',
    '.source/**',
    'next-env.d.ts',
    'tsconfig.tsbuildinfo',
  ]),
  {
    rules: {
      // The blog bug classes we care about: raw '>' / '{' / '}' in JSX text
      // must be escaped, so forbid only those three. Plain apostrophes and
      // quotes in prose stay legal.
      'react/no-unescaped-entities': ['error', { forbid: ['>', '{', '}'] }],

      // Blog posts legitimately render code comments inside <code> elements
      // (e.g. '// ...' in a tsconfig snippet); the rule can't tell those
      // from real comments in JSX children.
      'react/jsx-no-comment-textnodes': 'off',

      // New-strict react-hooks v7 rules that flag common, correct patterns:
      // the setMounted() hydration idiom, refs passed to children and only
      // dereferenced in event handlers, and ref mutation inside callbacks.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
    },
  },
])
