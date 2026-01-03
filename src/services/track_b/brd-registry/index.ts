// src/services/track_b/brd-registry/index.ts
// Track B BRD Registry - Barrel exports

// Configuration
export {
  EXPECTED_BRD_VERSION,
  BRD_PATH,
  REGISTRY_PATH,
  LEDGER_DIR,
  LEDGER_FILE,
  getLedgerPath,
  EVIDENCE_PATH,
  SCHEMA_VERSION,
} from './config.js';

// Types
export type {
  BrdIdentifier,
  BrdParseResult,
  BrdRegistry,
  Discrepancy,
  RegistryGateResult,
  BrdRegistryLedgerEntry,
  ValidationResult,
  CheckResult,
} from './types.js';

// Parser
export { parseBrd, validateParsing } from './parser.js';

// Hasher
export {
  normalizeContent,
  computeContentHash,
  computeBrdHash,
  computeFileHash,
} from './hasher.js';

// Registry operations
export {
  loadRegistry,
  saveRegistry,
  buildRegistry,
  checkRegistry,
} from './registry.js';

// Gate
export { evaluateGRegistryGate } from './gate.js';

// Ledger
export {
  appendLedgerEntry,
  readLedger,
  createBuildEntry,
  createCheckEntry,
  createGateEntry,
} from './ledger.js';

