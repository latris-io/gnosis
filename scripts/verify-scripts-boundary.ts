#!/usr/bin/env npx tsx
/**
 * G-API Scripts Boundary Verification
 * 
 * Verifies that no script imports from src/services/** or src/db/**.
 * This enforces Option A: scripts must use src/ops/** entrypoints only.
 * 
 * Detects ALL import forms:
 * - ESM: import { x } from '../../src/services/...'
 * - ESM: import { x } from '@gnosis/services/...' (if aliases exist)
 * - CJS: require('../../src/services/...')
 * - Dynamic: await import('../../src/services/...')
 * 
 * Exit 0 if clean, exit 1 if violations found.
 * Output: file:line for each violation.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Violation {
  file: string;
  line: number;
  content: string;
  pattern: string;
}

// Forbidden import patterns
const FORBIDDEN_PATTERNS: Array<{ regex: RegExp; description: string }> = [
  // Relative imports to services
  { regex: /from\s+['"][^'"]*\/src\/services\//, description: 'ESM import from services' },
  { regex: /from\s+['"][^'"]*\/services\//, description: 'ESM import from services (short path)' },
  // Relative imports to db
  { regex: /from\s+['"][^'"]*\/src\/db\//, description: 'ESM import from db' },
  { regex: /from\s+['"][^'"]*\/db\//, description: 'ESM import from db (short path)' },
  // Alias imports (if tsconfig paths exist)
  { regex: /from\s+['"]@gnosis\/services\//, description: 'ESM alias import from services' },
  { regex: /from\s+['"]@gnosis\/db\//, description: 'ESM alias import from db' },
  { regex: /from\s+['"]@\/services\//, description: 'ESM alias import from services' },
  { regex: /from\s+['"]@\/db\//, description: 'ESM alias import from db' },
  // require() calls
  { regex: /require\s*\(\s*['"][^'"]*\/src\/services\//, description: 'require() from services' },
  { regex: /require\s*\(\s*['"][^'"]*\/src\/db\//, description: 'require() from db' },
  { regex: /require\s*\(\s*['"][^'"]*\/services\//, description: 'require() from services (short path)' },
  { regex: /require\s*\(\s*['"][^'"]*\/db\//, description: 'require() from db (short path)' },
  // Dynamic imports
  { regex: /import\s*\(\s*['"][^'"]*\/src\/services\//, description: 'dynamic import() from services' },
  { regex: /import\s*\(\s*['"][^'"]*\/src\/db\//, description: 'dynamic import() from db' },
  { regex: /import\s*\(\s*['"][^'"]*\/services\//, description: 'dynamic import() from services (short path)' },
  { regex: /import\s*\(\s*['"][^'"]*\/db\//, description: 'dynamic import() from db (short path)' },
];

/**
 * Check if file has a G-API exception marker (must be at start of line in JSDoc).
 * Format: " * @g-api-exception REASON_CODE"
 * Files with this marker are skipped (documented exceptions).
 */
function getGApiExceptionReason(content: string): string | null {
  // Must be in a JSDoc comment line format: " * @g-api-exception REASON"
  const match = content.match(/^\s*\*\s*@g-api-exception\s+(\w+)/m);
  return match ? match[1] : null;
}

async function scanFile(filePath: string): Promise<{ violations: Violation[]; skipped: boolean; reason?: string }> {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check for exception marker (must be in JSDoc format)
  const exceptionReason = getGApiExceptionReason(content);
  if (exceptionReason) {
    return { violations: [], skipped: true, reason: exceptionReason };
  }
  
  const violations: Violation[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Skip comments (lines starting with //, *, or inside JSDoc)
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      continue;
    }

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.regex.test(line)) {
        violations.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          pattern: pattern.description,
        });
        break; // Only report first matching pattern per line
      }
    }
  }

  return { violations, skipped: false };
}

async function main() {
  const scriptsDir = path.resolve(process.cwd(), 'scripts');
  
  // Find all .ts files under scripts/
  const files = await glob('**/*.ts', { cwd: scriptsDir, nodir: true });
  
  console.log(`Scanning ${files.length} script files for G-API boundary violations...\n`);

  const allViolations: Violation[] = [];
  const violatingFiles = new Set<string>();
  const skippedFiles: Array<{ file: string; reason: string }> = [];

  for (const file of files) {
    const fullPath = path.join(scriptsDir, file);
    const relativePath = `scripts/${file}`;
    const result = await scanFile(fullPath);
    
    if (result.skipped) {
      skippedFiles.push({ file: relativePath, reason: result.reason! });
      continue;
    }
    
    if (result.violations.length > 0) {
      violatingFiles.add(relativePath);
      for (const v of result.violations) {
        allViolations.push({ ...v, file: relativePath });
      }
    }
  }

  // Report skipped files first
  if (skippedFiles.length > 0) {
    console.log('SKIPPED FILES (@g-api-exception):\n');
    for (const { file, reason } of skippedFiles) {
      console.log(`  ${file} [${reason}]`);
    }
    console.log('');
  }

  // Output results
  if (allViolations.length === 0) {
    console.log('✓ No G-API boundary violations found.');
    console.log('All scripts correctly use src/ops/** entrypoints.');
    if (skippedFiles.length > 0) {
      console.log(`(${skippedFiles.length} file(s) skipped with @g-api-exception)`);
    }
    process.exit(0);
  }

  console.log('G-API BOUNDARY VIOLATIONS DETECTED\n');
  console.log('Scripts must NOT import from src/services/** or src/db/**.');
  console.log('Use src/ops/** entrypoints instead.\n');
  console.log('─'.repeat(80));

  // Group by file
  const byFile = new Map<string, Violation[]>();
  for (const v of allViolations) {
    if (!byFile.has(v.file)) {
      byFile.set(v.file, []);
    }
    byFile.get(v.file)!.push(v);
  }

  for (const [file, violations] of byFile) {
    console.log(`\n${file}:`);
    for (const v of violations) {
      console.log(`  Line ${v.line}: ${v.content}`);
      console.log(`    [${v.pattern}]`);
    }
  }

  console.log('\n' + '─'.repeat(80));
  console.log(`\nTotal: ${allViolations.length} violations in ${violatingFiles.size} files`);
  if (skippedFiles.length > 0) {
    console.log(`(${skippedFiles.length} file(s) skipped with @g-api-exception)`);
  }
  console.log('\nTo fix: Replace service/db imports with src/ops/** entrypoints.');
  
  process.exit(1);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
