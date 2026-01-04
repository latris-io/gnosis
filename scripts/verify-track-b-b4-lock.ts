#!/usr/bin/env npx tsx
/**
 * Track B B.4 Closure Lock Enforcement
 * 
 * Authority: B.4 PASS (G-CLOSURE), Track B governance
 * 
 * Enforces that B.4 closure surfaces cannot be modified unless:
 * 1. Commit message or PR references a CID (docs/cid/*)
 * 2. The CID file is also modified in the same changeset
 * 
 * Exit codes:
 * - 0: No locked files changed, or valid CID authorization found
 * - 1: Locked files changed without valid CID authorization
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

// --- Configuration ---

// B.4 locked surface patterns (post-B.4 PASS lockdown)
const LOCKED_PATTERNS = [
  // Closure services
  /^src\/services\/track_b\/closure-check\//,
  // Closure CLI
  /^scripts\/closure\.ts$/,
  // Operator evidence template (defines required fields/structure)
  /^docs\/verification\/track_b\/templates\/B4_OPERATOR_EVIDENCE_TEMPLATE\.md$/,
];

// CID pattern in commit messages / PR
const CID_PATTERN = /\bCID-\d{4}-\d{2}-\d{2}[A-Za-z0-9_-]*\b/g;

// CID directory pattern (file being modified must be in docs/cid/)
const CID_FILE_PATTERN = /^docs\/cid\//;

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
    console.error('❌ Could not compute changed files for B.4 lock enforcement.');
    console.error(String(error));
    process.exit(1);
  }
}

function isLockedFile(filePath: string): boolean {
  return LOCKED_PATTERNS.some(pattern => pattern.test(filePath));
}

function isCidFile(filePath: string): boolean {
  return CID_FILE_PATTERN.test(filePath);
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

// --- Main ---

function main(): void {
  console.log('Track B B.4 Closure Lock Enforcement');
  console.log('='.repeat(50));
  console.log('Authority: B.4 PASS (G-CLOSURE PASS proven)');
  console.log('');
  
  // Get changed files
  const changedFiles = getChangedFiles();
  console.log(`Changed files: ${changedFiles.length}`);
  
  // Filter to locked files
  const changedLockedFiles = changedFiles.filter(isLockedFile);
  
  if (changedLockedFiles.length === 0) {
    console.log('\n✅ No B.4 closure surfaces changed.');
    console.log('Lock enforcement: PASS');
    console.log('');
    console.log('NOTE: B.4 services must not execute subprocesses.');
    console.log('      Subprocess execution is allowed ONLY in scripts/closure.ts.');
    process.exit(0);
  }
  
  console.log(`\n⚠️  B.4 closure surfaces changed (${changedLockedFiles.length}):`);
  for (const file of changedLockedFiles) {
    console.log(`   - ${file}`);
  }
  
  // Check if any CID file is also modified
  const cidFilesModified = changedFiles.filter(isCidFile);
  
  // Check for CID references in commit/PR
  const commitMessage = getCommitMessage();
  const prTitle = process.env.GITHUB_PR_TITLE || '';
  const prBody = process.env.GITHUB_PR_BODY || '';
  
  const allText = `${commitMessage}\n${prTitle}\n${prBody}`;
  const cidRefs = extractCidRefs(allText);
  
  console.log('\nChecking for CID authorization...');
  
  // Require BOTH: CID reference AND CID file modified
  const hasCidRef = cidRefs.length > 0;
  const hasCidFileChange = cidFilesModified.length > 0;
  
  if (!hasCidRef && !hasCidFileChange) {
    console.log('\n❌ FAILURE: B.4 closure surfaces changed without CID authorization.');
    printInstructions(changedLockedFiles);
    process.exit(1);
  }
  
  if (hasCidRef && !hasCidFileChange) {
    console.log(`\nFound CID reference(s): ${cidRefs.join(', ')}`);
    console.log('⚠️  BUT: No CID file (docs/cid/*) was modified in this changeset.');
    console.log('');
    console.log('   To modify B.4 surfaces, you must:');
    console.log('   1. Create or update a CID in docs/cid/');
    console.log('   2. Reference that CID in your commit message');
    printInstructions(changedLockedFiles);
    process.exit(1);
  }
  
  if (!hasCidRef && hasCidFileChange) {
    console.log(`\nCID files modified: ${cidFilesModified.join(', ')}`);
    console.log('⚠️  BUT: No CID reference found in commit message or PR.');
    console.log('');
    console.log('   Include a CID reference in your commit message:');
    console.log('   git commit -m "fix: update closure per CID-2026-01-03-closure-fix"');
    printInstructions(changedLockedFiles);
    process.exit(1);
  }
  
  // Both conditions met
  console.log(`\nCID reference(s): ${cidRefs.join(', ')}`);
  console.log(`CID files modified: ${cidFilesModified.join(', ')}`);
  
  // Verify at least one referenced CID exists
  let validCid: string | null = null;
  for (const cidRef of cidRefs) {
    const cidPath = `docs/cid/${cidRef}.md`;
    if (existsSync(cidPath) || cidFilesModified.some(f => f.includes(cidRef))) {
      validCid = cidRef;
      break;
    }
  }
  
  if (!validCid) {
    console.log('\n⚠️  WARNING: CID reference does not match any existing or modified CID file.');
    console.log('   Proceeding with assumption that CID is being created.');
  }
  
  console.log(`\n✅ B.4 closure surfaces modification authorized by CID.`);
  console.log('Lock enforcement: PASS (CID-authorized)');
  console.log('');
  console.log('⚠️  WARNING: This change modifies B.4 closure surfaces.');
  console.log('   Ensure all verification gates pass before merging.');
  console.log('');
  console.log('NOTE: B.4 services must not execute subprocesses.');
  console.log('      Subprocess execution is allowed ONLY in scripts/closure.ts.');
  process.exit(0);
}

function printInstructions(changedFiles: string[]): void {
  console.log('\n' + '='.repeat(50));
  console.log('TO MODIFY B.4 CLOSURE SURFACES:');
  console.log('='.repeat(50));
  console.log('\n1. Create a CID document:');
  console.log('   docs/cid/CID-YYYY-MM-DD-description.md');
  console.log('\n2. Include in the CID:');
  console.log('   - Justification for the change');
  console.log('   - Impact analysis');
  console.log('   - Verification plan');
  console.log('\n3. Reference the CID in your commit message or PR:');
  console.log('   fix: update closure per CID-2026-01-03-closure-fix');
  console.log('\n4. Ensure all verification gates pass:');
  console.log('   npm run verify:scripts-boundary');
  console.log('   npm run verify:track-b-db-boundary');
  console.log('   npm run verify:track-b-b4-lock');
  console.log('   npm test');
  console.log('\nChanged locked files:');
  for (const file of changedFiles) {
    console.log(`   - ${file}`);
  }
  console.log('\nAfter B.4 PASS, closure surfaces are locked; changes require CID.');
}

main();

