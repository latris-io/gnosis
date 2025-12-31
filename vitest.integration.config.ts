// @implements INFRASTRUCTURE
// Vitest configuration for integration tests (long-running, ~8-10 minutes)
// Run with: npm run test:pipeline:integration
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.integration.test.ts'],
    environment: 'node',
    globals: true,
    setupFiles: ['test/setup.ts'],
    globalSetup: ['test/globalSetup.ts'],
    // Integration tests need much longer timeouts
    testTimeout: 600000,  // 10 minutes
    hookTimeout: 120000,  // 2 minutes for setup/teardown
    teardownTimeout: 60000,  // 1 minute for cleanup
    // Run test files sequentially to prevent database race conditions
    fileParallelism: false,
  },
});

