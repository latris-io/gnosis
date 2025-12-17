#!/usr/bin/env npx tsx
// scripts/audit-pillars.ts
// @implements INFRASTRUCTURE
// Pre-A2 audit of shadow ledger and semantic corpus
// Validates schema correctness, content quality, and traceability

import * as fs from 'fs';
import * as path from 'path';

// Expected schemas (from src/ledger/*.ts interfaces)
interface LedgerEntry {
  timestamp: string;
  operation: 'CREATE' | 'UPDATE';
  entity_type: string;
  entity_id: string;
  instance_id: string;
  content_hash: string;
  evidence: {
    source_file: string;
    line_start: number;
    line_end: number;
    commit_sha?: string;
    extraction_timestamp?: string;
    extractor_version?: string;
  };
  project_id: string;
}

interface SemanticSignal {
  timestamp: string;
  type: 'CORRECT' | 'INCORRECT' | 'PARTIAL' | 'ORPHAN_MARKER' | 'AMBIGUOUS';
  entity_type?: string;
  instance_id?: string;
  context: Record<string, unknown>;
  evidence: Record<string, unknown>;
}

const VALID_OPERATIONS = ['CREATE', 'UPDATE'];
const VALID_SIGNAL_TYPES = ['CORRECT', 'INCORRECT', 'PARTIAL', 'ORPHAN_MARKER', 'AMBIGUOUS'];

const LEDGER_PATH = 'shadow-ledger/ledger.jsonl';
const CORPUS_PATH = 'semantic-corpus/signals.jsonl';

function green(s: string): string { return `\x1b[32m${s}\x1b[0m`; }
function red(s: string): string { return `\x1b[31m${s}\x1b[0m`; }
function yellow(s: string): string { return `\x1b[33m${s}\x1b[0m`; }

interface AuditResult {
  total: number;
  valid: number;
  invalid: number;
  errors: string[];
}

function auditLedger(): { result: AuditResult; byOperation: Record<string, number>; sample: unknown | null } {
  const result: AuditResult = { total: 0, valid: 0, invalid: 0, errors: [] };
  const byOperation: Record<string, number> = { CREATE: 0, UPDATE: 0 };
  let sample: unknown = null;

  if (!fs.existsSync(LEDGER_PATH)) {
    result.errors.push(`File not found: ${LEDGER_PATH}`);
    return { result, byOperation, sample };
  }

  const content = fs.readFileSync(LEDGER_PATH, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  result.total = lines.length;

  for (let i = 0; i < lines.length; i++) {
    try {
      const entry = JSON.parse(lines[i]) as Record<string, unknown>;
      
      // Required fields check
      const requiredFields = ['timestamp', 'operation', 'entity_type', 'entity_id', 'instance_id', 'content_hash', 'evidence', 'project_id'];
      const missingFields = requiredFields.filter(f => !(f in entry));
      
      if (missingFields.length > 0) {
        result.invalid++;
        result.errors.push(`Line ${i + 1}: Missing fields: ${missingFields.join(', ')}`);
        continue;
      }

      // Operation validation
      if (!VALID_OPERATIONS.includes(entry.operation as string)) {
        result.invalid++;
        result.errors.push(`Line ${i + 1}: Invalid operation: ${entry.operation}`);
        continue;
      }

      // Evidence structure check
      const evidence = entry.evidence as Record<string, unknown>;
      if (!evidence || typeof evidence !== 'object') {
        result.invalid++;
        result.errors.push(`Line ${i + 1}: Evidence is not an object`);
        continue;
      }

      const evidenceFields = ['source_file', 'line_start', 'line_end'];
      const missingEvidence = evidenceFields.filter(f => !(f in evidence));
      if (missingEvidence.length > 0) {
        result.invalid++;
        result.errors.push(`Line ${i + 1}: Missing evidence fields: ${missingEvidence.join(', ')}`);
        continue;
      }

      result.valid++;
      byOperation[entry.operation as string] = (byOperation[entry.operation as string] || 0) + 1;

      // Capture first valid entry as sample
      if (!sample) {
        sample = entry;
      }
    } catch (e) {
      result.invalid++;
      result.errors.push(`Line ${i + 1}: Parse error: ${(e as Error).message}`);
    }
  }

  return { result, byOperation, sample };
}

function auditCorpus(): { result: AuditResult; byType: Record<string, number>; sample: unknown | null } {
  const result: AuditResult = { total: 0, valid: 0, invalid: 0, errors: [] };
  const byType: Record<string, number> = {};
  let sample: unknown = null;

  if (!fs.existsSync(CORPUS_PATH)) {
    result.errors.push(`File not found: ${CORPUS_PATH}`);
    return { result, byType, sample };
  }

  const content = fs.readFileSync(CORPUS_PATH, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  result.total = lines.length;

  for (let i = 0; i < lines.length; i++) {
    try {
      const signal = JSON.parse(lines[i]) as Record<string, unknown>;
      
      // Required fields check
      const requiredFields = ['timestamp', 'type', 'context', 'evidence'];
      const missingFields = requiredFields.filter(f => !(f in signal));
      
      if (missingFields.length > 0) {
        result.invalid++;
        if (result.errors.length < 10) {
          result.errors.push(`Line ${i + 1}: Missing fields: ${missingFields.join(', ')}`);
        }
        continue;
      }

      // Type validation
      if (!VALID_SIGNAL_TYPES.includes(signal.type as string)) {
        result.invalid++;
        if (result.errors.length < 10) {
          result.errors.push(`Line ${i + 1}: Invalid type: ${signal.type}`);
        }
        continue;
      }

      result.valid++;
      const signalType = signal.type as string;
      byType[signalType] = (byType[signalType] || 0) + 1;

      // Capture first valid entry as sample
      if (!sample) {
        sample = signal;
      }
    } catch (e) {
      result.invalid++;
      if (result.errors.length < 10) {
        result.errors.push(`Line ${i + 1}: Parse error: ${(e as Error).message}`);
      }
    }
  }

  return { result, byType, sample };
}

function checkTraceability(): { ledgerSourcesExist: number; ledgerTotal: number; signalEvidenced: number; signalTotal: number } {
  let ledgerSourcesExist = 0;
  let ledgerTotal = 0;
  let signalEvidenced = 0;
  let signalTotal = 0;

  // Check ledger source files
  if (fs.existsSync(LEDGER_PATH)) {
    const content = fs.readFileSync(LEDGER_PATH, 'utf8');
    const lines = content.split('\n').filter(line => line.trim()).slice(0, 5);
    ledgerTotal = lines.length;

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const sourceFile = entry.evidence?.source_file;
        if (sourceFile && fs.existsSync(sourceFile)) {
          ledgerSourcesExist++;
        }
      } catch {
        // Skip parse errors
      }
    }
  }

  // Check signal evidence
  if (fs.existsSync(CORPUS_PATH)) {
    const content = fs.readFileSync(CORPUS_PATH, 'utf8');
    const lines = content.split('\n').filter(line => line.trim()).slice(0, 5);
    signalTotal = lines.length;

    for (const line of lines) {
      try {
        const signal = JSON.parse(line);
        // Evidence is considered "anchored" if it has any content
        if (signal.evidence && Object.keys(signal.evidence).length > 0) {
          signalEvidenced++;
        }
      } catch {
        // Skip parse errors
      }
    }
  }

  return { ledgerSourcesExist, ledgerTotal, signalEvidenced, signalTotal };
}

function main() {
  console.log('=== Pre-A2 Pillar Audit ===\n');

  // Shadow Ledger Audit
  console.log('=== Shadow Ledger Audit ===');
  const ledger = auditLedger();
  console.log(`Total entries: ${ledger.result.total}`);
  console.log(`By operation: CREATE=${ledger.byOperation.CREATE || 0}, UPDATE=${ledger.byOperation.UPDATE || 0}`);
  console.log(`Schema valid: ${ledger.result.valid}/${ledger.result.total} entries (${((ledger.result.valid / ledger.result.total) * 100).toFixed(1)}%)`);
  
  if (ledger.result.errors.length > 0) {
    console.log(yellow(`Errors (first 5):`));
    ledger.result.errors.slice(0, 5).forEach(e => console.log(`  - ${e}`));
  }
  
  if (ledger.sample) {
    console.log('\nSample entry:');
    console.log(JSON.stringify(ledger.sample, null, 2));
  }

  // Semantic Corpus Audit
  console.log('\n=== Semantic Corpus Audit ===');
  const corpus = auditCorpus();
  console.log(`Total signals: ${corpus.result.total}`);
  console.log(`By type: ${Object.entries(corpus.byType).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  console.log(`Schema valid: ${corpus.result.valid}/${corpus.result.total} signals (${((corpus.result.valid / corpus.result.total) * 100).toFixed(1)}%)`);
  
  if (corpus.result.errors.length > 0) {
    console.log(yellow(`Errors (first 5):`));
    corpus.result.errors.slice(0, 5).forEach(e => console.log(`  - ${e}`));
  }
  
  if (corpus.sample) {
    console.log('\nSample signal:');
    console.log(JSON.stringify(corpus.sample, null, 2));
  }

  // Traceability Check
  console.log('\n=== Traceability Check ===');
  const trace = checkTraceability();
  console.log(`Ledger source files exist: ${trace.ledgerSourcesExist}/${trace.ledgerTotal}`);
  console.log(`Signal evidence present: ${trace.signalEvidenced}/${trace.signalTotal}`);

  // Final Result
  console.log('\n=== AUDIT RESULT ===');
  
  const ledgerOk = ledger.result.valid === ledger.result.total && ledger.result.total > 0;
  const corpusOk = corpus.result.valid === corpus.result.total && corpus.result.total >= 50;
  const typeDiversity = Object.keys(corpus.byType).length >= 2;
  const traceOk = trace.ledgerSourcesExist > 0 || trace.signalEvidenced > 0;

  const checks = [
    { name: 'Shadow ledger schema valid', pass: ledgerOk },
    { name: 'Semantic corpus schema valid', pass: corpusOk },
    { name: 'Signal type diversity (>= 2 types)', pass: typeDiversity },
    { name: 'Evidence anchored', pass: traceOk },
  ];

  let allPass = true;
  for (const check of checks) {
    const status = check.pass ? green('[PASS]') : red('[FAIL]');
    console.log(`${status} ${check.name}`);
    if (!check.pass) allPass = false;
  }

  console.log('');
  if (allPass) {
    console.log(green('✓ PRE-A2 PILLAR AUDIT: PASSED'));
    process.exit(0);
  } else {
    console.log(red('✗ PRE-A2 PILLAR AUDIT: FAILED'));
    process.exit(1);
  }
}

main();
