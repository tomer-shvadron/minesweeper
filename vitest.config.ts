import { resolve } from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    passWithNoTests: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
})
