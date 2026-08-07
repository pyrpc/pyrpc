import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'postinstall.test.js' // This is a custom test runner, not a Vitest test
    ]
  }
})