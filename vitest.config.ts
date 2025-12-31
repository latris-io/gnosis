// @implements INFRASTRUCTURE
// Vitest configuration for Gnosis test suites
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Exclude integration tests from default run (they take 8-10 minutes)
    // Run integration tests with: npm run test:pipeline:integration
    exclude: ['**/node_modules/**', '**/*.integration.test.ts'],
    environment: 'node',
    globals: true,
    setupFiles: ['test/setup.ts'],
    // Global setup runs once before all tests, returns teardown function
    globalSetup: ['test/globalSetup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Longer teardown timeout to ensure connections close
    teardownTimeout: 10000,
    // Run test files sequentially to prevent database race conditions
    fileParallelism: false,
  },
});


