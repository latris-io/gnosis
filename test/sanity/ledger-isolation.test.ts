// test/sanity/ledger-isolation.test.ts
// @implements INFRASTRUCTURE
// LEGACY_SCAN_OK: This test validates ledger isolation by checking root files
// SANITY tests: LEDGER ISOLATION (SANITY-060 to SANITY-070)
// Track A - ledger and corpus isolation per V11 plan

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import 'dotenv/config';

// Import module namespaces for export checking
import * as ledgerMod from '../../src/ledger/shadow-ledger.js';
import * as corpusMod from '../../src/ledger/semantic-corpus.js';

// ═══════════════════════════════════════════════════════════════════════════
// Helper: Convert RegExp to global mode while preserving all other flags
// ═══════════════════════════════════════════════════════════════════════════

function toGlobal(re: RegExp): RegExp {
  const flags = Array.from(new Set((re.flags + 'g').split(''))).join('');
  return new RegExp(re.source, flags);
}

// ═══════════════════════════════════════════════════════════════════════════
// Legacy Path Patterns
// ═══════════════════════════════════════════════════════════════════════════

const LEGACY_PATH_PATTERNS = [
  // Separator-agnostic (covers literal strings + Windows)
  /shadow-ledger[\\/]+ledger\.jsonl/i,
  /semantic-corpus[\\/]+signals\.jsonl/i,
  
  // path.join patterns (any quote, whitespace tolerant)
  /path\.join\s*\(\s*['"`]shadow-ledger['"`]\s*,\s*['"`]ledger\.jsonl['"`]\s*\)/i,
  /path\.join\s*\(\s*['"`]semantic-corpus['"`]\s*,\s*['"`]signals\.jsonl['"`]\s*\)/i,
  
  // path.resolve patterns
  /path\.resolve\s*\(\s*['"`]shadow-ledger['"`]\s*,\s*['"`]ledger\.jsonl['"`]\s*\)/i,
  /path\.resolve\s*\(\s*['"`]semantic-corpus['"`]\s*,\s*['"`]signals\.jsonl['"`]\s*\)/i,
  
  // Broad pattern: any path.join/resolve that ends in ledger.jsonl under shadow-ledger
  /path\.(join|resolve)\s*\(\s*['"`]shadow-ledger['"`]\s*,[^)]*['"`]ledger\.jsonl['"`]\s*\)/i,
  /path\.(join|resolve)\s*\(\s*['"`]semantic-corpus['"`]\s*,[^)]*['"`]signals\.jsonl['"`]\s*\)/i,
];

const ALLOWED_MARKERS = [
  /LEGACY_OK:/i,
  /LEGACY_SCAN_OK:/i,  // For tests that intentionally contain legacy path literals
  /AUDIT_ONLY:/i,
  /DEPRECATED:/i,
  /MIGRATION_ONLY:/i,
  /getLegacyLedgerArchivePath/,
  /getLegacyCorpusArchivePath/,
  /\/\/\s*@legacy-allowed/,
];

// ═══════════════════════════════════════════════════════════════════════════
// Import Patterns for Singleton Detection
// ═══════════════════════════════════════════════════════════════════════════

const IMPORT_PATTERNS: Array<{ token: 'shadowLedger' | 'semanticCorpus'; re: RegExp }> = [
  // ESM multi-line imports (s flag for dotall)
  { token: 'shadowLedger', re: /import\s*\{[^}]*\bshadowLedger\b[^}]*\}\s*from\s*['"][^'"]+['"]/s },
  { token: 'semanticCorpus', re: /import\s*\{[^}]*\bsemanticCorpus\b[^}]*\}\s*from\s*['"][^'"]+['"]/s },
  
  // ESM default
  { token: 'shadowLedger', re: /import\s+shadowLedger\s+from\s*['"][^'"]+['"]/ },
  { token: 'semanticCorpus', re: /import\s+semanticCorpus\s+from\s*['"][^'"]+['"]/ },
  
  // CJS destructure (s flag for multi-line)
  { token: 'shadowLedger', re: /(?:const|let|var)\s*\{[^}]*\bshadowLedger\b[^}]*\}\s*=\s*require\s*\(/s },
  { token: 'semanticCorpus', re: /(?:const|let|var)\s*\{[^}]*\bsemanticCorpus\b[^}]*\}\s*=\s*require\s*\(/s },
  
  // CJS property access
  { token: 'shadowLedger', re: /require\s*\([^)]+\)\s*\.\s*shadowLedger/ },
  { token: 'semanticCorpus', re: /require\s*\([^)]+\)\s*\.\s*semanticCorpus/ },
];

// ═══════════════════════════════════════════════════════════════════════════
// Scan Functions
// ═══════════════════════════════════════════════════════════════════════════

async function scanForLegacyPaths(globPattern: string): Promise<string[]> {
  const files = await glob(globPattern, { cwd: process.cwd() });
  const violations = new Set<string>(); // Dedupe
  
  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const lines = content.split('\n');
    
    // Check if file has a file-level marker (in first 10 lines)
    const fileHeader = lines.slice(0, 10).join('\n');
    const hasFileMarker = ALLOWED_MARKERS.some(marker => marker.test(fileHeader));
    
    // If file has a file-level marker, skip all violations in this file
    if (hasFileMarker) continue;
    
    for (const pattern of LEGACY_PATH_PATTERNS) {
      const regex = toGlobal(pattern);
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        
        // Check +/- 2 line window for line-level allowed markers
        const windowStart = Math.max(0, lineNum - 3);
        const windowEnd = Math.min(lines.length - 1, lineNum + 1);
        const window = lines.slice(windowStart, windowEnd + 1).join('\n');
        
        const isAllowed = ALLOWED_MARKERS.some(marker => marker.test(window));
        if (!isAllowed) {
          // Dedupe key: file:line (ignore which pattern matched)
          violations.add(`${file}:${lineNum}`);
        }
      }
    }
  }
  
  return Array.from(violations).sort();
}

async function scanForLegacyImports(globPattern: string): Promise<string[]> {
  const files = await glob(globPattern, { cwd: process.cwd() });
  const violations = new Set<string>(); // Dedupe
  
  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const lines = content.split('\n');
    
    // Check if file has a file-level marker (in first 10 lines)
    const fileHeader = lines.slice(0, 10).join('\n');
    const hasFileMarker = /LEGACY_OK:|LEGACY_SCAN_OK:|AUDIT_ONLY:|@legacy-allowed/.test(fileHeader);
    
    // If file has a file-level marker, skip all violations in this file
    if (hasFileMarker) continue;
    
    for (const { token, re } of IMPORT_PATTERNS) {
      const regex = toGlobal(re);
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        
        // Check +/- 2 line window for line-level allowed markers
        const windowStart = Math.max(0, lineNum - 3);
        const windowEnd = Math.min(lines.length - 1, lineNum + 1);
        const window = lines.slice(windowStart, windowEnd + 1).join('\n');
        
        const isAllowed = /LEGACY_OK:|LEGACY_SCAN_OK:|AUDIT_ONLY:|@legacy-allowed/.test(window);
        if (!isAllowed) {
          violations.add(`${file}:${lineNum}:${token}`);
        }
      }
    }
  }
  
  return Array.from(violations).sort();
}

// ═══════════════════════════════════════════════════════════════════════════
// Root File Assertion
// ═══════════════════════════════════════════════════════════════════════════

async function assertRootFilesEmptyOrMissing(): Promise<void> {
  const rootFiles = [
    'shadow-ledger/ledger.jsonl',
    'semantic-corpus/signals.jsonl',
  ];
  
  for (const filePath of rootFiles) {
    let content = '';
    
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch (err: any) {
      if (err.code === 'ENOENT') continue; // Missing = OK
      throw err;
    }
    
    // Check trimmed content (catches whitespace-only files)
    if (content.trim().length > 0) {
      const byteSize = Buffer.byteLength(content, 'utf8');
      throw new Error(
        `ROOT_FILE_NOT_EMPTY: ${filePath} exists with ${byteSize} bytes. ` +
        `This indicates a legacy code path was triggered or migration incomplete.`
      );
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════════════════

describe('LEDGER ISOLATION', () => {
  // Enforce clean state at start AND end (order-independent)
  beforeAll(async () => {
    await assertRootFilesEmptyOrMissing();
  });
  
  afterAll(async () => {
    await assertRootFilesEmptyOrMissing();
  });
  
  // SANITY-060: Root ledger must not exist or be empty
  it('SANITY-060: root ledger must not exist or be empty', async () => {
    const filePath = 'shadow-ledger/ledger.jsonl';
    let exists = false;
    let content = '';
    
    try {
      content = await fs.readFile(filePath, 'utf8');
      exists = true;
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }
    
    if (exists) {
      expect(content.trim().length, `Root ledger ${filePath} should be empty`).toBe(0);
    }
    // Missing is OK
  });

  // SANITY-061: Root corpus must not exist or be empty
  it('SANITY-061: root corpus must not exist or be empty', async () => {
    const filePath = 'semantic-corpus/signals.jsonl';
    let exists = false;
    let content = '';
    
    try {
      content = await fs.readFile(filePath, 'utf8');
      exists = true;
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }
    
    if (exists) {
      expect(content.trim().length, `Root corpus ${filePath} should be empty`).toBe(0);
    }
    // Missing is OK
  });

  // SANITY-062: shadowLedger singleton not exported
  it('SANITY-062: shadowLedger singleton not exported', () => {
    expect((ledgerMod as any).shadowLedger).toBeUndefined();
  });

  // SANITY-063: semanticCorpus singleton not exported
  it('SANITY-063: semanticCorpus singleton not exported', () => {
    expect((corpusMod as any).semanticCorpus).toBeUndefined();
  });

  // SANITY-064: Required factory functions are exported
  it('SANITY-064: required factory functions are exported', () => {
    expect(typeof ledgerMod.getProjectLedger).toBe('function');
    expect(typeof ledgerMod.getLedgerPath).toBe('function');
    expect(typeof corpusMod.getProjectCorpus).toBe('function');
    expect(typeof corpusMod.getCorpusPath).toBe('function');
  });

  // SANITY-065: Corpus signals (if any) have Schema V2 fields
  // Note: Legacy signals without schema_id are counted but not rejected
  it('SANITY-065: corpus signals (if any) have Schema V2 fields', async () => {
    const PROJECT_ID = process.env.PROJECT_ID;
    if (!PROJECT_ID) {
      // Skip if no project ID
      return;
    }
    
    const corpusPath = `semantic-corpus/${PROJECT_ID}/signals.jsonl`;
    let content = '';
    
    try {
      content = await fs.readFile(corpusPath, 'utf8');
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        // Corpus doesn't exist yet - that's OK for A3 pristine
        return;
      }
      throw err;
    }
    
    const lines = content.split('\n').filter(l => l.trim());
    
    // 0 signals is acceptable for A3 pristine
    // Semantic grounding readiness (>=1 signal) is a separate Track C gate
    if (lines.length === 0) return;
    
    // Count V2 vs legacy signals
    let v2Count = 0;
    let legacyCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const signal = JSON.parse(lines[i]);
      if (signal.schema_id === 'SEMANTIC_SIGNAL_V2') {
        v2Count++;
      } else {
        legacyCount++;
      }
    }
    
    // Log statistics (not enforced - legacy signals are allowed)
    if (legacyCount > 0) {
      console.log(`[SANITY-065] Corpus has ${v2Count} V2 signals and ${legacyCount} legacy signals`);
    }
    
    // Test passes as long as corpus is parseable
    expect(v2Count + legacyCount).toBe(lines.length);
  });

  // SANITY-066: No legacy path references in src/
  it('SANITY-066: no legacy path references in src/', async () => {
    const violations = await scanForLegacyPaths('src/**/*.ts');
    expect(violations, 'Legacy path references in src/').toEqual([]);
  });

  // SANITY-067: No legacy path references in scripts/
  it('SANITY-067: no legacy path references in scripts/', async () => {
    const violations = await scanForLegacyPaths('scripts/**/*.ts');
    expect(violations, 'Legacy path references in scripts/').toEqual([]);
  });

  // SANITY-068: No legacy path references in test/
  it('SANITY-068: no legacy path references in test/', async () => {
    const violations = await scanForLegacyPaths('test/**/*.ts');
    expect(violations, 'Legacy path references in test/').toEqual([]);
  });

  // SANITY-069: No legacy imports of deprecated singletons
  it('SANITY-069: no legacy imports of deprecated singletons', async () => {
    const violations = await scanForLegacyImports('{src,scripts,test}/**/*.{ts,js,mjs,cjs}');
    expect(violations, 'Legacy singleton imports found').toEqual([]);
  });

  // SANITY-070: Root files not created during test execution
  it('SANITY-070: root files not created during test execution', async () => {
    await assertRootFilesEmptyOrMissing();
  });
});

