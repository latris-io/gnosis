// test/sanity/forbidden-actions-harness.test.ts
// Enforcement harness for existing Forbidden Actions
// Authority: ENTRY.md lines 311-312, .cursorrules line 77
// NOT a new requirement - enforces existing "MUST NOT" rules

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// ============================================================
// Scan Configuration
// ============================================================

const SCAN_DIRECTORIES = ['src', 'scripts', 'test'];

// File extensions to scan (includes JS variants for completeness)
const SCAN_EXTENSIONS = '{ts,tsx,js,mjs,cjs}';

const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/.git/**',
  '**/*.md',
  '**/*.txt',
  '**/forbidden-actions-harness.test.ts', // Self-exclusion
];

// Marker for explicit exemption from G-API boundary checks
// Usage: Add "@g-api-exception REASON" or "@g-api-exception: <reason>" to file header
// Both formats are accepted (JSDoc and single-line comment styles)
const G_API_EXCEPTION_MARKER = /@g-api-exception[:\s]/;

// ============================================================
// Forbidden Patterns (Authority-Aligned)
// ============================================================

interface ForbiddenPattern {
  name: string;
  category: string;
  regex: RegExp;
  authority: string;
}

const FORBIDDEN_PATTERNS: ForbiddenPattern[] = [
  // ──────────────────────────────────────────────────────────
  // Category A: Skips / disabled execution
  // Authority: ENTRY.md line 312: "MUST NOT assume tests pass without running them"
  // ──────────────────────────────────────────────────────────
  { 
    name: 'it.skip', 
    category: 'SKIP', 
    regex: /\bit\.skip\s*\(/g, 
    authority: 'ENTRY.md:312 "MUST NOT assume tests pass without running them"' 
  },
  { 
    name: 'describe.skip', 
    category: 'SKIP', 
    regex: /\bdescribe\.skip\s*\(/g, 
    authority: 'ENTRY.md:312 "MUST NOT assume tests pass without running them"' 
  },
  { 
    name: 'test.skip', 
    category: 'SKIP', 
    regex: /\btest\.skip\s*\(/g, 
    authority: 'ENTRY.md:312 "MUST NOT assume tests pass without running them"' 
  },
  { 
    name: 'xit', 
    category: 'SKIP', 
    regex: /\bxit\s*\(/g, 
    authority: 'ENTRY.md:312 "MUST NOT assume tests pass without running them"' 
  },
  { 
    name: 'xtest', 
    category: 'SKIP', 
    regex: /\bxtest\s*\(/g, 
    authority: 'ENTRY.md:312 "MUST NOT assume tests pass without running them"' 
  },
  { 
    name: 'xdescribe', 
    category: 'SKIP', 
    regex: /\bxdescribe\s*\(/g, 
    authority: 'ENTRY.md:312 "MUST NOT assume tests pass without running them"' 
  },
  
  // ──────────────────────────────────────────────────────────
  // Category A+: .only patterns (GOVERNANCE - not in ENTRY.md)
  // Rationale: .only() runs only one test, effectively skipping others
  // ──────────────────────────────────────────────────────────
  { 
    name: 'it.only', 
    category: 'ONLY', 
    regex: /\bit\.only\s*\(/g, 
    authority: 'Governance: .only() skips all other tests' 
  },
  { 
    name: 'describe.only', 
    category: 'ONLY', 
    regex: /\bdescribe\.only\s*\(/g, 
    authority: 'Governance: .only() skips all other tests' 
  },
  { 
    name: 'test.only', 
    category: 'ONLY', 
    regex: /\btest\.only\s*\(/g, 
    authority: 'Governance: .only() skips all other tests' 
  },
];

// ============================================================
// Canon Mutation Detection
// Authority: .cursorrules:77 "Canonical Documents (Read-Only Authority)"
// ============================================================

// Step 1: Detect any file write operation
const WRITE_OPERATION_REGEX = /\b(writeFile|writeFileSync|appendFile|appendFileSync|rm|rmSync|unlink|unlinkSync|truncate|truncateSync)\s*\(/g;

// Step 2: Forbidden path patterns (literal strings only)
const FORBIDDEN_PATH_PATTERNS = [
  /['"`](?:\.\/)?docs\//,
  /['"`](?:\.\/)?spec\//,
];

// Step 3: Allowed targets (exception)
const ALLOWED_PATH_PATTERNS = [
  /shadow-ledger/,
  /semantic-corpus/,
];

// ============================================================
// G-API Boundary Detection
// Authority: .cursorrules Rule 3, Story A.3 line 62, Story A.5 line 64
// ============================================================

const DB_IMPORT_REGEX = /from\s+['"][^'"]*\/db\//g;
const SERVICES_IMPORT_REGEX = /from\s+['"][^'"]*\/services\//g;

// ============================================================
// Test-Only Module Isolation
// Authority: Governance - test-only modules cannot leak to production
// ============================================================

// Matches: import ... from '...admin-test-only...' OR require('...admin-test-only...')
const ADMIN_TEST_ONLY_IMPORT_REGEX = /(?:from\s+['"]|require\s*\(\s*['"])[^'"]*admin-test-only[^'"]*['"]/g;

// Matches: import ... from '...test/utils...' OR require('...test/utils...')
const TEST_UTILS_IMPORT_REGEX = /(?:from\s+['"]|require\s*\(\s*['"])[^'"]*test\/utils[^'"]*['"]/g;

// Matches: import ... from '../test/...' OR require('../test/...')
const RELATIVE_TEST_IMPORT_REGEX = /(?:from\s+['"]|require\s*\(\s*['"])\.\.?\/[^'"]*\/test\/[^'"]*['"]/g;

// ============================================================
// RLS Structural Enforcement (Two-Level Allowlist)
// Authority: RLS hardening - prevent false-green RLS bypass in tests
// ============================================================

// Level 1: Only these files may import from src/db/* or use DB primitives
// Note: integrity.test.ts is included because it contains test fixtures that
// reference pool.query patterns (for testing the detection logic itself)
const LEVEL1_DB_ALLOWLIST = [
  'test/utils/rls.ts',
  'test/utils/db-meta.ts',
  'test/sanity/integrity.test.ts',
];

// Level 2: Only these files may import from test/utils/db-meta
const LEVEL2_DB_META_ALLOWLIST = [
  'test/sanity/integrity.test.ts',
];

// Forbidden patterns for test files NOT in Level 1 allowlist
const RLS_FORBIDDEN_PATTERNS = {
  srcDbImport: /from\s+['"][^'"]*src\/db\/[^'"]*['"]/g,
  pgImport: /from\s+['"]pg['"]/g,
  getClientCall: /\bgetClient\s*\(/g,
  setProjectContextCall: /\bsetProjectContext\s*\(/g,
  newPool: /new\s+Pool\s*\(/g,
  poolQuery: /\bpool\.query\s*\(/g,
};

// Level 2: db-meta import pattern
const DB_META_IMPORT_REGEX = /from\s+['"][^'"]*\/utils\/db-meta(\.(js|ts))?['"]/g;

// ============================================================
// Detection Logic
// ============================================================

interface Violation {
  file: string;
  line: number;
  pattern: string;
  category: string;
  snippet: string;
  authority: string;
}

function checkTestOnlyIsolation(filePath: string, content: string, lines: string[]): Violation[] {
  const violations: Violation[] = [];
  
  // Only check src/ files (excluding services/admin/admin-test-only.ts)
  if (!filePath.includes('/src/')) return violations;
  if (filePath.includes('/src/services/admin/admin-test-only.ts')) return violations;
  
  const isServicesAdmin = filePath.includes('/src/services/admin/');
  
  // Check for admin-test-only imports in src/ (except services/admin/)
  ADMIN_TEST_ONLY_IMPORT_REGEX.lastIndex = 0;
  let match;
  
  while ((match = ADMIN_TEST_ONLY_IMPORT_REGEX.exec(content)) !== null) {
    // Allow services/admin/ to import from admin-test-only (for re-exports if needed)
    if (isServicesAdmin) continue;
    
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const lineContent = lines[lineNumber - 1] || '';
    
    violations.push({
      file: filePath,
      line: lineNumber,
      pattern: 'admin-test-only-import-in-src',
      category: 'G-API',
      snippet: lineContent.trim(),
      authority: 'Governance: admin-test-only module cannot be imported from src/ (except services/admin/)',
    });
  }
  
  // Check for test/utils imports in src/
  TEST_UTILS_IMPORT_REGEX.lastIndex = 0;
  
  while ((match = TEST_UTILS_IMPORT_REGEX.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const lineContent = lines[lineNumber - 1] || '';
    
    violations.push({
      file: filePath,
      line: lineNumber,
      pattern: 'test-utils-import-in-src',
      category: 'G-API',
      snippet: lineContent.trim(),
      authority: 'Governance: src/ cannot import from test/utils/',
    });
  }
  
  // Check for relative test/ imports in src/
  RELATIVE_TEST_IMPORT_REGEX.lastIndex = 0;
  
  while ((match = RELATIVE_TEST_IMPORT_REGEX.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const lineContent = lines[lineNumber - 1] || '';
    
    violations.push({
      file: filePath,
      line: lineNumber,
      pattern: 'relative-test-import-in-src',
      category: 'G-API',
      snippet: lineContent.trim(),
      authority: 'Governance: src/ cannot import from test/ via relative paths',
    });
  }
  
  return violations;
}

function checkGAPIViolation(filePath: string, content: string, lines: string[]): Violation[] {
  const violations: Violation[] = [];
  
  // Determine file category
  const isService = filePath.includes('/src/services/');
  const isDb = filePath.includes('/src/db/');
  const isApiV1 = filePath.includes('/src/api/v1/');
  const isOps = filePath.includes('/src/ops/');
  const isProvider = filePath.includes('/src/extraction/providers/');
  const isTest = filePath.includes('/test/');
  const isScript = filePath.includes('/scripts/');
  // A4: Pipeline is service-layer code, DB access allowed in orchestrator/integrity/statistics
  const isPipeline = filePath.includes('/src/pipeline/');
  
  // Check for db imports (G-API boundary for src/ files)
  // Note: Test files have separate RLS enforcement via checkRLSViolation()
  DB_IMPORT_REGEX.lastIndex = 0;
  let match;
  
  while ((match = DB_IMPORT_REGEX.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const lineContent = lines[lineNumber - 1] || '';
    
    // ALLOWED: services, db, and pipeline (service-layer per A4 spec)
    if (isService || isDb || isPipeline) continue;
    
    // Test files are handled by checkRLSViolation() with two-level allowlist
    if (isTest) continue;
    
    // FORBIDDEN: everyone else in src/
    let authority = '.cursorrules Rule 3';
    if (isApiV1) {
      authority = 'Story A.5 line 64: API MUST NOT import src/db/*';
    } else if (isOps) {
      authority = '.cursorrules Rule 3: ops MUST NOT import src/db/*';
    } else if (isProvider) {
      authority = 'Story A.3 line 62: Providers MUST NOT import src/db/*';
    } else if (isScript) {
      authority = '.cursorrules Rule 3: Scripts must use @gnosis/api/v1 or src/ops/*';
    }
    
    violations.push({
      file: filePath,
      line: lineNumber,
      pattern: 'db-import-forbidden',
      category: 'G-API',
      snippet: lineContent.trim(),
      authority,
    });
  }
  
  // Check for services imports from tests/scripts/providers
  SERVICES_IMPORT_REGEX.lastIndex = 0;
  
  // Exception: test/utils/admin-test-only.ts is allowed to import from services/admin/admin-test-only.ts
  const isTestUtilsAdminTestOnly = filePath.includes('/test/utils/admin-test-only.');
  
  // Exception: Unit tests that mock services are allowed to import them for mocking
  // These tests use vi.mock() to replace the actual implementations
  const isUnitTestWithMocks = filePath.includes('/test/markers/') && content.includes('vi.mock(');
  
  // Exception: Verification tests that need admin helpers for test data setup
  // These use admin-test-only for creating/deleting test entities/relationships
  const isVerificationTestWithAdminHelpers = 
    filePath.includes('/test/verification/') && 
    content.includes('admin-test-only');
  
  while ((match = SERVICES_IMPORT_REGEX.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const lineContent = lines[lineNumber - 1] || '';
    
    // Allow test/utils/admin-test-only.ts to import from services/admin/admin-test-only
    if (isTestUtilsAdminTestOnly && lineContent.includes('admin-test-only')) {
      continue;
    }
    
    // Allow unit tests with mocks to import services for mocking purposes
    if (isUnitTestWithMocks) {
      continue;
    }
    
    // Allow verification tests that use admin helpers for test data setup
    if (isVerificationTestWithAdminHelpers && lineContent.includes('admin-test-only')) {
      continue;
    }
    
    // FORBIDDEN: tests, scripts, and providers importing services
    if (isTest || isScript || isProvider) {
      violations.push({
        file: filePath,
        line: lineNumber,
        pattern: 'services-import-forbidden',
        category: 'G-API',
        snippet: lineContent.trim(),
        authority: '.cursorrules Rule 3: Tests/scripts/providers must use @gnosis/api/v1',
      });
    }
  }
  
  return violations;
}

// ============================================================
// RLS Structural Enforcement
// ============================================================

function isInLevel1Allowlist(filePath: string): boolean {
  return LEVEL1_DB_ALLOWLIST.some(allowed => filePath.endsWith(allowed) || filePath.includes(`/${allowed}`));
}

function isInLevel2Allowlist(filePath: string): boolean {
  return LEVEL2_DB_META_ALLOWLIST.some(allowed => filePath.endsWith(allowed) || filePath.includes(`/${allowed}`));
}

function checkRLSViolation(filePath: string, content: string, lines: string[]): Violation[] {
  const violations: Violation[] = [];
  
  // Only check test files
  if (!filePath.includes('/test/')) return violations;
  
  // Level 1 allowlist files can use DB primitives
  if (isInLevel1Allowlist(filePath)) return violations;
  
  // Check Level 1 forbidden patterns (DB primitives)
  const forbiddenChecks = [
    { name: 'src/db import', regex: RLS_FORBIDDEN_PATTERNS.srcDbImport },
    { name: 'pg import', regex: RLS_FORBIDDEN_PATTERNS.pgImport },
    { name: 'getClient() call', regex: RLS_FORBIDDEN_PATTERNS.getClientCall },
    { name: 'setProjectContext() call', regex: RLS_FORBIDDEN_PATTERNS.setProjectContextCall },
    { name: 'new Pool()', regex: RLS_FORBIDDEN_PATTERNS.newPool },
    { name: 'pool.query()', regex: RLS_FORBIDDEN_PATTERNS.poolQuery },
  ];
  
  for (const check of forbiddenChecks) {
    check.regex.lastIndex = 0;
    let match;
    while ((match = check.regex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const lineContent = lines[lineNumber - 1] || '';
      
      violations.push({
        file: filePath,
        line: lineNumber,
        pattern: check.name,
        category: 'RLS-ENFORCEMENT',
        snippet: lineContent.trim(),
        authority: `RLS Hardening: Use test/utils/rls.ts (rlsQuery) or test/utils/db-meta.ts (metaQuery). Only Level 1 allowlist files may use DB primitives.`,
      });
    }
  }
  
  // Level 2 check: db-meta imports restricted to integrity.test.ts
  DB_META_IMPORT_REGEX.lastIndex = 0;
  let match;
  while ((match = DB_META_IMPORT_REGEX.exec(content)) !== null) {
    if (!isInLevel2Allowlist(filePath)) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const lineContent = lines[lineNumber - 1] || '';
      
      violations.push({
        file: filePath,
        line: lineNumber,
        pattern: 'db-meta import (Level 2 violation)',
        category: 'RLS-ENFORCEMENT',
        snippet: lineContent.trim(),
        authority: `RLS Hardening: Only integrity.test.ts may import db-meta.ts. Use test/utils/rls.ts (rlsQuery) for project-scoped queries.`,
      });
    }
  }
  
  return violations;
}

function checkCanonMutation(filePath: string, content: string, lines: string[]): Violation[] {
  const violations: Violation[] = [];
  
  // Only check scripts/ and test/ directories
  if (!filePath.includes('/scripts/') && !filePath.includes('/test/')) {
    return violations;
  }
  
  WRITE_OPERATION_REGEX.lastIndex = 0;
  let match;
  
  while ((match = WRITE_OPERATION_REGEX.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const lineContent = lines[lineNumber - 1] || '';
    
    // Check if this line contains a forbidden path
    const hasForbiddenPath = FORBIDDEN_PATH_PATTERNS.some(p => p.test(lineContent));
    const hasAllowedPath = ALLOWED_PATH_PATTERNS.some(p => p.test(lineContent));
    
    if (hasForbiddenPath && !hasAllowedPath) {
      violations.push({
        file: filePath,
        line: lineNumber,
        pattern: `${match[1]}() to docs/ or spec/`,
        category: 'CANON_MUTATION',
        snippet: lineContent.trim(),
        authority: '.cursorrules:77 "Canonical Documents (Read-Only Authority)"',
      });
    }
  }
  
  return violations;
}

/**
 * Check if a file has the @g-api-exception marker
 * This marker exempts audit scripts from G-API boundary checks
 */
function hasGApiException(filePath: string, content: string): boolean {
  // Only check the first 10 lines (header area)
  const headerLines = content.split('\n').slice(0, 10).join('\n');
  return G_API_EXCEPTION_MARKER.test(headerLines);
}

function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Check forbidden patterns (skip, only)
  for (const pattern of FORBIDDEN_PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      violations.push({
        file: filePath,
        line: lineNumber,
        pattern: pattern.name,
        category: pattern.category,
        snippet: lines[lineNumber - 1]?.trim() || '',
        authority: pattern.authority,
      });
    }
  }

  // Check canon mutation
  violations.push(...checkCanonMutation(filePath, content, lines));

  // Check G-API boundary violations
  violations.push(...checkGAPIViolation(filePath, content, lines));

  // Check test-only module isolation
  violations.push(...checkTestOnlyIsolation(filePath, content, lines));

  // Check RLS structural enforcement (two-level allowlist)
  violations.push(...checkRLSViolation(filePath, content, lines));

  return violations;
}

function formatReport(violations: Violation[]): string {
  if (violations.length === 0) return '';

  let report = '\n=== FORBIDDEN ACTIONS DETECTED ===\n\n';
  
  violations.forEach((v, i) => {
    report += `[${i + 1}] ${v.category}\n`;
    report += `    File: ${v.file}\n`;
    report += `    Line: ${v.line}\n`;
    report += `    Pattern: ${v.pattern}\n`;
    report += `    Snippet: ${v.snippet}\n`;
    report += `    Authority: ${v.authority}\n\n`;
  });

  report += `Total violations: ${violations.length}\n`;
  report += 'HARD-FAIL: Remove all forbidden actions before proceeding.\n';
  
  return report;
}

// ============================================================
// Test (Phase-neutral naming)
// ============================================================

describe('Forbidden Actions Enforcement Harness', () => {
  it('fails on forbidden actions in enforcement scope', async () => {
    const repoRoot = process.cwd();
    const allViolations: Violation[] = [];
    const skippedFiles: string[] = [];

    for (const dir of SCAN_DIRECTORIES) {
      const dirPath = path.join(repoRoot, dir);
      if (!fs.existsSync(dirPath)) continue;

      // Scan TS and JS variants
      const files = await glob(`${dir}/**/*.${SCAN_EXTENSIONS}`, {
        cwd: repoRoot,
        ignore: EXCLUDE_PATTERNS,
        absolute: true,
      });

      for (const file of files) {
        // Check for @g-api-exception marker
        const content = fs.readFileSync(file, 'utf-8');
        if (hasGApiException(file, content)) {
          skippedFiles.push(file);
          continue;
        }
        
        const violations = scanFile(file);
        allViolations.push(...violations);
      }
    }

    // Report skipped files for audit clarity
    if (skippedFiles.length > 0) {
      console.log('\n=== FILES SKIPPED (@g-api-exception) ===');
      for (const f of skippedFiles) {
        console.log(`  - ${f}`);
      }
      console.log(`Total skipped: ${skippedFiles.length}\n`);
    }

    if (allViolations.length > 0) {
      console.error(formatReport(allViolations));
    }

    expect(allViolations.length, 'Forbidden actions detected').toBe(0);
  });
});


