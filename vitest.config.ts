// @implements INFRASTRUCTURE
// Vitest configuration for Gnosis test suites
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    globals: true,
    setupFiles: ['test/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run test files sequentially to prevent database race conditions
    // Tests within a file still run in parallel unless fileParallelism is false
    fileParallelism: false,
    // Increase pool timeout for Neo4j connections
    pool: {
      vmThreads: {
        useAtomics: true,
      },
    },
  },
});


