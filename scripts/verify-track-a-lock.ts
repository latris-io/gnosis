#!/usr/bin/env npx tsx
/**
 * Track A Lock Enforcement
 * 
 * Authority: GOVERNANCE_PHASED_PLAN.md, HGR-1.1 Extension Packet
 * 
 * Enforces that Track A locked surfaces cannot be modified unless:
 * 1. PR title/body or commit message contains CID-YYYY-MM-DD-* reference
 * 2. The referenced CID file exists in docs/verification/
 * 3. That CID file contains REOPEN_TRACK_A: true
 * 
 * Exit codes:
 * - 0: No locked files changed, or valid CID reopening approved
 * - 1: Locked files changed without valid CID reopening
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// --- Configuration ---

// Track A locked surface patterns (comprehensive - Option B)
const LOCKED_PATTERNS = [
  // Core Track A (A1-A3)
  /^src\/schema\/track-a\//,
  /^src\/extraction\//,
  /^src\/services\/entities\//,
  /^src\/services\/relationships\//,
  /^src\/services\/sync\//,
  /^src\/db\//,
  /^migrations\//,
  
  // Markers (A3)
  /^src\/markers\//,
  
  // Ledger (Track A infrastructure)
  /^src\/ledger\//,
  
  // Pipeline (A4)
  /^src\/pipeline\//,
  /^src\/ops\//,
  
  // Graph API (A5)
  /^src\/api\/v1\//,
  /^src\/services\/graph\//,
  /^src\/http\//,
  
  // Verification + Specs
  /^scripts\/verification\//,
  /^spec\/track_a\//,
  /^test\/fixtures\//,
  
  // Governance docs — lock ENTIRE docs/verification/ folder
  // This prevents tampering with Track A evidence (CIDs, audits, closeouts, etc.)
  // Track B should use a different folder (e.g., docs/verification/track_b/**)
  /^docs\/verification\//,
];

// CID pattern to look for (word-bounded, alphanumeric + dash/underscore only)
const CID_PATTERN = /\bCID-\d{4}-\d{2}-\d{2}[A-Za-z0-9_-]*\b/g;

// --- Utility Functions ---

function getChangedFiles(): string[] {
  try {
    let diffCommand: string;
    
    // Check if we're in a PR context (GitHub Actions sets GITHUB_BASE_REF)
    const baseBranch = process.env.GITHUB_BASE_REF;
    if (baseBranch) {
      // PR context: compare against base branch
      diffCommand = `git diff --name-only origin/${baseBranch}...HEAD`;
    } else {
      // Push context: compare against previous commit
      diffCommand = `git diff --name-only HEAD~1..HEAD`;
    }
    
    const output = execSync(diffCommand, { encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    // FAIL CLOSED: If we can't compute the diff, we cannot verify lock compliance
    console.error('❌ Could not compute changed files for Track A lock enforcement.');
    console.error(String(error));
    process.exit(1);
  }
}

function isLockedFile(filePath: string): boolean {
  return LOCKED_PATTERNS.some(pattern => pattern.test(filePath));
}

function getCommitMessage(): string {
  try {
    return execSync('git log -1 --pretty=%B', { encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

function extractCidRefs(text: string): string[] {
  const matches = text.match(CID_PATTERN);
  return matches ? [...new Set(matches)] : [];
}

function cidFileExists(cidRef: string): boolean {
  // Try exact match first
  const exactPath = join('docs/verification', `${cidRef}.md`);
  if (existsSync(exactPath)) return true;
  
  // Try with suffix variations
  const basePath = 'docs/verification';
  try {
    const files = execSync(`ls ${basePath}/${cidRef}*.md 2>/dev/null || true`, { encoding: 'utf-8' });
    return files.trim().length > 0;
  } catch {
    return false;
  }
}

function cidHasReopenFlag(cidRef: string): boolean {
  const basePath = 'docs/verification';
  
  // Find the CID file
  let cidFilePath: string | null = null;
  
  // Try exact match
  const exactPath = join(basePath, `${cidRef}.md`);
  if (existsSync(exactPath)) {
    cidFilePath = exactPath;
  } else {
    // Try to find with glob
    try {
      const files = execSync(`ls ${basePath}/${cidRef}*.md 2>/dev/null || true`, { encoding: 'utf-8' });
      const foundFiles = files.trim().split('\n').filter(Boolean);
      if (foundFiles.length > 0) {
        cidFilePath = foundFiles[0];
      }
    } catch {
      return false;
    }
  }
  
  if (!cidFilePath) return false;
  
  try {
    const content = readFileSync(cidFilePath, 'utf-8');
    // Look for REOPEN_TRACK_A: true (case-insensitive, flexible formatting)
    return /REOPEN_TRACK_A\s*:\s*true/i.test(content);
  } catch {
    return false;
  }
}

// --- Main ---

function main(): void {
  console.log('Track A Lock Enforcement');
  console.log('='.repeat(50));
  console.log('Authority: HGR-1.1 Extension Packet, GOVERNANCE_PHASED_PLAN.md');
  console.log('Baseline: track-a5-green (93ba7872885e1449004959eb8c79870da144f983)');
  console.log('');
  
  // Get changed files
  const changedFiles = getChangedFiles();
  console.log(`Changed files: ${changedFiles.length}`);
  
  // Filter to locked files
  const changedLockedFiles = changedFiles.filter(isLockedFile);
  
  if (changedLockedFiles.length === 0) {
    console.log('\n✅ No Track A locked surfaces changed.');
    console.log('Lock enforcement: PASS');
    process.exit(0);
  }
  
  console.log(`\n⚠️  Track A locked surfaces changed (${changedLockedFiles.length}):`);
  for (const file of changedLockedFiles) {
    console.log(`   - ${file}`);
  }
  
  // Check for CID references
  const commitMessage = getCommitMessage();
  const prTitle = process.env.GITHUB_PR_TITLE || '';
  const prBody = process.env.GITHUB_PR_BODY || '';
  
  const allText = `${commitMessage}\n${prTitle}\n${prBody}`;
  const cidRefs = extractCidRefs(allText);
  
  console.log('\nChecking for CID reopening authorization...');
  
  if (cidRefs.length === 0) {
    console.log('\n❌ FAILURE: Track A locked surfaces changed without CID reference.');
    printInstructions(changedLockedFiles);
    process.exit(1);
  }
  
  console.log(`Found CID reference(s): ${cidRefs.join(', ')}`);
  
  // Verify at least one CID has REOPEN_TRACK_A: true
  let hasValidReopen = false;
  let validCid: string | null = null;
  
  for (const cidRef of cidRefs) {
    console.log(`\nChecking ${cidRef}...`);
    
    if (!cidFileExists(cidRef)) {
      console.log(`   ❌ CID file not found in docs/verification/`);
      continue;
    }
    console.log(`   ✓ CID file exists`);
    
    if (!cidHasReopenFlag(cidRef)) {
      console.log(`   ❌ CID does not contain REOPEN_TRACK_A: true`);
      continue;
    }
    console.log(`   ✓ CID contains REOPEN_TRACK_A: true`);
    
    hasValidReopen = true;
    validCid = cidRef;
    break;
  }
  
  if (!hasValidReopen) {
    console.log('\n❌ FAILURE: No CID with REOPEN_TRACK_A: true found.');
    printInstructions(changedLockedFiles);
    process.exit(1);
  }
  
  console.log(`\n✅ Track A lock reopened by ${validCid}`);
  console.log('Lock enforcement: PASS (CID-authorized reopening)');
  console.log('\n⚠️  WARNING: This change modifies Track A locked surfaces.');
  console.log('   Ensure all verification gates pass before merging.');
  process.exit(0);
}

function printInstructions(changedFiles: string[]): void {
  console.log('\n' + '='.repeat(50));
  console.log('TO MODIFY TRACK A LOCKED SURFACES:');
  console.log('='.repeat(50));
  console.log('\n1. Create a CID document:');
  console.log('   docs/verification/CID-YYYY-MM-DD-description.md');
  console.log('\n2. Include in the CID:');
  console.log('   REOPEN_TRACK_A: true');
  console.log('   (plus justification, impact analysis, etc.)');
  console.log('\n3. Reference the CID in your commit message or PR:');
  console.log('   fix: update extraction per CID-2026-01-03-extraction-fix');
  console.log('\n4. Ensure all verification gates pass:');
  console.log('   npm run verify:organ-parity');
  console.log('   npm run verify:scripts-boundary');
  console.log('   npm test');
  console.log('\nChanged locked files:');
  for (const file of changedFiles) {
    console.log(`   - ${file}`);
  }
  console.log('\nSee docs/GOVERNANCE_PHASED_PLAN.md for governance rules.');
  console.log('See docs/verification/HGR-1_1_EXTENSION_PACKET_2026-01-02.md for Track A baseline.');
}

main();

