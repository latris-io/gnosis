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
  
  // Check for db imports
  DB_IMPORT_REGEX.lastIndex = 0;
  let match;
  
  while ((match = DB_IMPORT_REGEX.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const lineContent = lines[lineNumber - 1] || '';
    
    // ALLOWED: services and db itself
    if (isService || isDb) continue;
    
    // FORBIDDEN: everyone else
    let authority = '.cursorrules Rule 3';
    if (isApiV1) {
      authority = 'Story A.5 line 64: API MUST NOT import src/db/*';
    } else if (isOps) {
      authority = '.cursorrules Rule 3: ops MUST NOT import src/db/*';
    } else if (isProvider) {
      authority = 'Story A.3 line 62: Providers MUST NOT import src/db/*';
    } else if (isTest || isScript) {
      authority = '.cursorrules Rule 3: Tests/scripts must use @gnosis/api/v1 or src/ops/*';
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
  
  while ((match = SERVICES_IMPORT_REGEX.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const lineContent = lines[lineNumber - 1] || '';
    
    // Allow test/utils/admin-test-only.ts to import from services/admin/admin-test-only
    if (isTestUtilsAdminTestOnly && lineContent.includes('admin-test-only')) {
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
        const violations = scanFile(file);
        allViolations.push(...violations);
      }
    }

    if (allViolations.length > 0) {
      console.error(formatReport(allViolations));
    }

    expect(allViolations.length, 'Forbidden actions detected').toBe(0);
  });
});
