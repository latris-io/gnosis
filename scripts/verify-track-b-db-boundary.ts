#!/usr/bin/env npx tsx
/**
 * G-API Track B Database Boundary Verification
 * 
 * Enforces EXIT.md requirement: "No direct database access in Track B code"
 * with the CID-approved exception for B.6.1 enumeration endpoints.
 * 
 * RULES:
 *   - src/api/v2/**:           DB imports ALLOWED, but must be READ-ONLY
 *   - src/track_b/http/**:     DB imports FORBIDDEN (handlers call v2 APIs)
 *   - src/services/track_b/**: DB imports FORBIDDEN
 * 
 * READ-ONLY ENFORCEMENT:
 *   Files in src/api/v2/** are scanned for write patterns:
 *   INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE,
 *   SET TRANSACTION READ WRITE, pool.query with write intent
 * 
 * Exit 0 if compliant, exit 1 if violations found.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Violation {
  file: string;
  line: number;
  content: string;
  pattern: string;
  severity: 'ERROR' | 'WARNING';
}

// ============================================================
// PATH CONFIGURATION
// ============================================================

// Paths where DB imports are ALLOWED (but must be read-only)
const DB_ALLOWED_PATHS = [
  'src/api/v2/',
];

// Paths where DB imports are FORBIDDEN (must use v2 APIs)
const DB_FORBIDDEN_PATHS = [
  'src/track_b/http/',
  'src/services/track_b/',
];

// All Track B paths to scan
const SCAN_GLOBS = [
  'src/services/track_b/**/*.ts',
  'src/api/v2/**/*.ts',
  'src/track_b/**/*.ts',
];

// ============================================================
// DB IMPORT PATTERNS (comprehensive)
// ============================================================

const DB_IMPORT_PATTERNS: Array<{ regex: RegExp; description: string }> = [
  // Direct pg imports
  { regex: /from\s+['"]pg['"]/, description: 'Direct pg import' },
  { regex: /from\s+['"]pg-pool['"]/, description: 'pg-pool import' },
  { regex: /import\s+type\s+\{[^}]*\}\s+from\s+['"]pg['"]/, description: 'pg type import' },
  
  // Relative imports to db/ (with or without .js extension)
  { regex: /from\s+['"][^'"]*\/db\/postgres(\.js)?['"]/, description: 'Import from db/postgres' },
  { regex: /from\s+['"][^'"]*\/db\/neo4j(\.js)?['"]/, description: 'Import from db/neo4j' },
  { regex: /from\s+['"][^'"]*\/db\/migrate(\.js)?['"]/, description: 'Import from db/migrate' },
  
  // Fallback: any path segment containing /db/
  { regex: /from\s+['"][^'"]*\/db\/[^'"]*['"]/, description: 'Import from */db/*' },
  
  // Short relative forms (../db/, ../../db/, etc.)
  { regex: /from\s+['"]\.\.?\/[^'"]*\/db\//, description: 'Short relative db import' },
  
  // Aliased imports
  { regex: /from\s+['"]@\/db\//, description: 'Aliased @/db import' },
  { regex: /from\s+['"]@gnosis\/db\//, description: 'Aliased @gnosis/db import' },
  { regex: /from\s+['"]src\/db\//, description: 'Absolute src/db import' },
  
  // Neo4j driver
  { regex: /from\s+['"]neo4j-driver['"]/, description: 'Direct neo4j-driver import' },
  
  // Other Postgres clients (defensive)
  { regex: /from\s+['"]postgres['"]/, description: 'postgres.js import' },
  { regex: /from\s+['"]@vercel\/postgres['"]/, description: '@vercel/postgres import' },
  { regex: /from\s+['"]slonik['"]/, description: 'slonik import' },
  
  // require() forms
  { regex: /require\s*\(\s*['"]pg['"]\s*\)/, description: 'require(pg)' },
  { regex: /require\s*\(\s*['"][^'"]*\/db\//, description: 'require(*/db/*)' },
];

// ============================================================
// WRITE PATTERNS (for read-only enforcement in src/api/v2/**)
// ============================================================

const WRITE_PATTERNS: Array<{ regex: RegExp; description: string }> = [
  // SQL write statements (case-insensitive)
  { regex: /\bINSERT\s+INTO\b/i, description: 'SQL INSERT' },
  { regex: /\bUPDATE\s+\w+\s+SET\b/i, description: 'SQL UPDATE' },
  { regex: /\bDELETE\s+FROM\b/i, description: 'SQL DELETE' },
  { regex: /\bDROP\s+(TABLE|INDEX|CONSTRAINT)\b/i, description: 'SQL DROP' },
  { regex: /\bALTER\s+TABLE\b/i, description: 'SQL ALTER' },
  { regex: /\bCREATE\s+(TABLE|INDEX)\b/i, description: 'SQL CREATE' },
  { regex: /\bTRUNCATE\b/i, description: 'SQL TRUNCATE' },
  
  // Explicit read-write transaction mode
  { regex: /SET\s+TRANSACTION\s+READ\s+WRITE/i, description: 'READ WRITE transaction' },
  
  // Dangerous patterns
  { regex: /\.query\s*\(\s*['"`]DELETE\b/i, description: 'query(DELETE...)' },
  { regex: /\.query\s*\(\s*['"`]UPDATE\b/i, description: 'query(UPDATE...)' },
  { regex: /\.query\s*\(\s*['"`]INSERT\b/i, description: 'query(INSERT...)' },
];

// ============================================================
// HELPERS
// ============================================================

function getPathCategory(relativePath: string): 'DB_ALLOWED' | 'DB_FORBIDDEN' | 'NOT_TRACK_B' {
  const normalized = relativePath.replace(/\\/g, '/');
  
  if (DB_ALLOWED_PATHS.some(p => normalized.startsWith(p))) {
    return 'DB_ALLOWED';
  }
  if (DB_FORBIDDEN_PATHS.some(p => normalized.startsWith(p))) {
    return 'DB_FORBIDDEN';
  }
  return 'NOT_TRACK_B';
}

function scanFileForDbImports(content: string, relativePath: string): Violation[] {
  const lines = content.split('\n');
  const violations: Violation[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      continue;
    }
    
    for (const { regex, description } of DB_IMPORT_PATTERNS) {
      if (regex.test(line)) {
        violations.push({
          file: relativePath,
          line: i + 1,
          content: trimmed,
          pattern: description,
          severity: 'ERROR',
        });
        break;
      }
    }
  }
  
  return violations;
}

function scanFileForWritePatterns(content: string, relativePath: string): Violation[] {
  const lines = content.split('\n');
  const violations: Violation[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      continue;
    }
    
    for (const { regex, description } of WRITE_PATTERNS) {
      if (regex.test(line)) {
        violations.push({
          file: relativePath,
          line: i + 1,
          content: trimmed,
          pattern: `WRITE VIOLATION: ${description}`,
          severity: 'ERROR',
        });
        break;
      }
    }
  }
  
  return violations;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('Track B Database Boundary Verification (v8)');
  console.log('============================================\n');
  console.log('Policy: No direct database access in Track B code');
  console.log('Exception: src/api/v2/** (read-only only, per CID-2026-01-03)\n');
  console.log('Rules:');
  console.log('  src/api/v2/**:           DB imports ALLOWED (read-only enforced)');
  console.log('  src/track_b/http/**:     DB imports FORBIDDEN (must call v2 APIs)');
  console.log('  src/services/track_b/**: DB imports FORBIDDEN\n');
  
  const cwd = process.cwd();
  
  // Collect all files to scan
  let allFiles: string[] = [];
  for (const pattern of SCAN_GLOBS) {
    const files = await glob(pattern, { cwd, nodir: true });
    allFiles = allFiles.concat(files);
  }
  
  // Deduplicate and normalize
  allFiles = [...new Set(allFiles)].map(f => f.replace(/\\/g, '/'));
  
  if (allFiles.length === 0) {
    console.log('⚠️  WARNING: No Track B source files found to scan.');
    console.log('   This check is VACUOUSLY PASSING because no code exists yet.');
    console.log('   Once Track B code is added, this verifier will enforce boundaries.\n');
    console.log('✓ No G-API boundary violations (no files to check).');
    process.exit(0);
  }
  
  console.log(`Scanning ${allFiles.length} Track B source files...\n`);
  
  const results: {
    dbAllowed: { file: string; hasDbImport: boolean; writeViolations: Violation[] }[];
    dbForbidden: { file: string; violations: Violation[] }[];
  } = {
    dbAllowed: [],
    dbForbidden: [],
  };
  
  const allViolations: Violation[] = [];
  
  for (const relativePath of allFiles) {
    const absolutePath = path.join(cwd, relativePath);
    const content = fs.readFileSync(absolutePath, 'utf-8');
    const category = getPathCategory(relativePath);
    
    if (category === 'DB_ALLOWED') {
      // Scan for DB imports (informational) and write violations (error)
      const dbImports = scanFileForDbImports(content, relativePath);
      const writeViolations = scanFileForWritePatterns(content, relativePath);
      
      results.dbAllowed.push({
        file: relativePath,
        hasDbImport: dbImports.length > 0,
        writeViolations,
      });
      
      // Write violations are errors
      allViolations.push(...writeViolations);
      
    } else if (category === 'DB_FORBIDDEN') {
      // Any DB import is a violation
      const violations = scanFileForDbImports(content, relativePath);
      
      results.dbForbidden.push({
        file: relativePath,
        violations,
      });
      
      allViolations.push(...violations);
    }
    // NOT_TRACK_B files are ignored (shouldn't match our globs anyway)
  }
  
  // ============================================================
  // REPORT
  // ============================================================
  
  // Report DB-ALLOWED paths (with read-only enforcement)
  if (results.dbAllowed.length > 0) {
    console.log('DB-ALLOWED PATHS (src/api/v2/**):\n');
    for (const { file, hasDbImport, writeViolations } of results.dbAllowed) {
      const dbStatus = hasDbImport ? '🔗 DB import' : '   no DB';
      const writeStatus = writeViolations.length > 0 ? `❌ ${writeViolations.length} write violation(s)` : '✓ read-only';
      console.log(`  ${file}`);
      console.log(`    ${dbStatus} | ${writeStatus}`);
    }
    console.log('');
  }
  
  // Report DB-FORBIDDEN paths
  if (results.dbForbidden.length > 0) {
    console.log('DB-FORBIDDEN PATHS (src/track_b/http/**, src/services/track_b/**):\n');
    for (const { file, violations } of results.dbForbidden) {
      const status = violations.length > 0 ? `❌ ${violations.length} violation(s)` : '✓ clean';
      console.log(`  ${file}: ${status}`);
    }
    console.log('');
  }
  
  // ============================================================
  // FINAL RESULT
  // ============================================================
  
  if (allViolations.length === 0) {
    console.log('─'.repeat(70));
    console.log('\n✓ No G-API boundary violations found.');
    console.log('Track B database access policy is compliant.\n');
    process.exit(0);
  }
  
  console.log('─'.repeat(70));
  console.log('\n❌ G-API BOUNDARY VIOLATIONS DETECTED\n');
  
  // Group violations by type
  const writeViolations = allViolations.filter(v => v.pattern.startsWith('WRITE'));
  const importViolations = allViolations.filter(v => !v.pattern.startsWith('WRITE'));
  
  if (importViolations.length > 0) {
    console.log('FORBIDDEN DB IMPORTS (in src/track_b/http/** or src/services/track_b/**):\n');
    for (const v of importViolations) {
      console.log(`  ${v.file}:${v.line}`);
      console.log(`    ${v.content}`);
      console.log(`    [${v.pattern}]\n`);
    }
  }
  
  if (writeViolations.length > 0) {
    console.log('READ-ONLY VIOLATIONS (in src/api/v2/**):\n');
    for (const v of writeViolations) {
      console.log(`  ${v.file}:${v.line}`);
      console.log(`    ${v.content}`);
      console.log(`    [${v.pattern}]\n`);
    }
  }
  
  console.log('─'.repeat(70));
  console.log(`\nTotal: ${allViolations.length} violation(s)`);
  console.log(`  - ${importViolations.length} forbidden DB import(s)`);
  console.log(`  - ${writeViolations.length} read-only violation(s)`);
  console.log('\nTo fix:');
  console.log('  - Move DB access to src/api/v2/** (enumeration only)');
  console.log('  - Ensure src/api/v2/** uses only SELECT, not INSERT/UPDATE/DELETE');
  console.log('  - src/track_b/http/** handlers must call v2 APIs, not import DB');
  
  process.exit(1);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

