import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 25000,
    hookTimeout: 25000,
    include: ['tests/**/*.test.ts'],
    fileParallelism: false, // run test files sequentially to avoid db clashes on irop_test
  },
});
