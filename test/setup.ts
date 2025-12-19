// @implements INFRASTRUCTURE
// Test setup file - loads environment and initializes connections
import 'dotenv/config';

// Default SANITY_PHASE to 'post_a1' if not set (cross-platform)
// A1 extraction is complete, so 'post_a1' is the normal operating state
// Override with: SANITY_PHASE=pre npm run test:sanity
process.env.SANITY_PHASE = process.env.SANITY_PHASE || 'post_a1';

// ────────────────────────────────────────────────────────────────
// LIFECYCLE ONLY - NOT FOR DATA ACCESS
// Tests MUST use @gnosis/api/v1 for all functional data operations.
// These exports are for connection lifecycle (setup/teardown) only.
// ────────────────────────────────────────────────────────────────
import { closeConnections } from '../src/ops/track-a.js';
export { closeConnections };

// Config export (no db access)
export { config } from '../src/config/env.js';

// Global test utilities
export const TEST_PROJECT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Log message with timestamp for test debugging.
 */
export function testLog(message: string): void {
  console.log(`[TEST ${new Date().toISOString()}] ${message}`);
}

