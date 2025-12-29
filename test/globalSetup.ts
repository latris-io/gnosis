// @implements INFRASTRUCTURE
// Global setup/teardown for vitest
// This runs ONCE before all tests and returns a teardown function
// that runs ONCE after all tests complete

import 'dotenv/config';

export async function setup() {
  // Global setup - runs before any test files
  console.log('[GLOBAL SETUP] Starting test suite');
}

export async function teardown() {
  // Global teardown - runs after ALL test files complete
  console.log('[GLOBAL TEARDOWN] Test suite complete');
  
  // Note: connections are closed in each test file's afterAll hook
  // because globalSetup runs in a separate process from the test runner
  
  // Force exit after a short delay to handle any lingering handles
  setTimeout(() => {
    console.log('[GLOBAL TEARDOWN] Force exit after timeout');
    process.exit(0);
  }, 2000).unref();
}

export default async function() {
  await setup();
  return teardown;
}

