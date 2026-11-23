import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    testTimeout: 90000,
    hookTimeout: 90000,
    fileParallelism: false,
  },
});
