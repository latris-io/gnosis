#!/usr/bin/env npx tsx
/**
 * CID Enforcement for Organ Document Changes
 * 
 * Authority: GOVERNANCE_PHASED_PLAN.md §7
 * 
 * Checks that any changes to organ-governed documents include a CID reference
 * in the commit message or PR title/body.
 * 
 * Organ-governed documents:
 * - docs/BRD_*.md (except BRD_FORMAT_SPECIFICATION.md)
 * - docs/UNIFIED_TRACEABILITY_GRAPH_SCHEMA_*.md
 * - docs/UNIFIED_VERIFICATION_SPECIFICATION_*.md
 * - docs/GNOSIS_TO_SOPHIA_MASTER_ROADMAP_*.md
 * - docs/CURSOR_IMPLEMENTATION_PLAN_*.md
 * - docs/integrations/EP-*.md
 * 
 * Exit codes:
 * - 0: No organ docs changed, or CID reference found
 * - 1: Organ docs changed but no CID reference
 */

import { execSync } from 'child_process';

// --- Configuration ---

// Patterns for organ-governed documents
const ORGAN_DOC_PATTERNS = [
  /^docs\/BRD_(?!FORMAT_SPECIFICATION).*\.md$/,
  /^docs\/UNIFIED_TRACEABILITY_GRAPH_SCHEMA_.*\.md$/,
  /^docs\/UNIFIED_VERIFICATION_SPECIFICATION_.*\.md$/,
  /^docs\/GNOSIS_TO_SOPHIA_MASTER_ROADMAP_.*\.md$/,
  /^docs\/CURSOR_IMPLEMENTATION_PLAN_.*\.md$/,
  /^docs\/integrations\/EP-.*\.md$/,
];

// CID pattern to look for
const CID_PATTERN = /CID-\d{4}-\d{2}-\d{2}/;

// --- Utility Functions ---

function getChangedFiles(): string[] {
  try {
    // For PRs: compare against origin/main
    // For pushes: compare HEAD~1..HEAD
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
    // If diff fails (e.g., initial commit), return empty
    console.warn('Could not get changed files:', error);
    return [];
  }
}

function isOrganDoc(filePath: string): boolean {
  return ORGAN_DOC_PATTERNS.some(pattern => pattern.test(filePath));
}

function getCommitMessage(): string {
  try {
    return execSync('git log -1 --pretty=%B', { encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

function getPrInfo(): { title: string; body: string } {
  // GitHub Actions provides PR info via environment variables
  const title = process.env.GITHUB_PR_TITLE || '';
  const body = process.env.GITHUB_PR_BODY || '';
  return { title, body };
}

function hasCidReference(text: string): boolean {
  return CID_PATTERN.test(text);
}

// --- Main ---

function main(): void {
  console.log('CID Enforcement for Organ Document Changes');
  console.log('='.repeat(50));
  
  // Get changed files
  const changedFiles = getChangedFiles();
  console.log(`\nChanged files: ${changedFiles.length}`);
  
  // Filter to organ docs
  const changedOrganDocs = changedFiles.filter(isOrganDoc);
  
  if (changedOrganDocs.length === 0) {
    console.log('\n✅ No organ-governed documents changed.');
    console.log('CID reference not required.');
    process.exit(0);
  }
  
  console.log(`\n⚠️  Organ-governed documents changed (${changedOrganDocs.length}):`);
  for (const doc of changedOrganDocs) {
    console.log(`   - ${doc}`);
  }
  
  // Check for CID reference
  const commitMessage = getCommitMessage();
  const prInfo = getPrInfo();
  
  console.log('\nChecking for CID reference...');
  
  // Check commit message
  if (hasCidReference(commitMessage)) {
    console.log(`\n✅ CID reference found in commit message.`);
    const match = commitMessage.match(CID_PATTERN);
    console.log(`   Reference: ${match?.[0]}`);
    process.exit(0);
  }
  
  // Check PR title
  if (prInfo.title && hasCidReference(prInfo.title)) {
    console.log(`\n✅ CID reference found in PR title.`);
    const match = prInfo.title.match(CID_PATTERN);
    console.log(`   Reference: ${match?.[0]}`);
    process.exit(0);
  }
  
  // Check PR body
  if (prInfo.body && hasCidReference(prInfo.body)) {
    console.log(`\n✅ CID reference found in PR body.`);
    const match = prInfo.body.match(CID_PATTERN);
    console.log(`   Reference: ${match?.[0]}`);
    process.exit(0);
  }
  
  // No CID found - fail
  console.log('\n❌ FAILURE: Organ-governed documents changed without CID reference.');
  console.log('\nTo fix this:');
  console.log('1. Create a CID document in docs/verification/ with format: CID-YYYY-MM-DD-NNN.md');
  console.log('2. Include the CID reference in your commit message, e.g.:');
  console.log('   docs: update BRD counts per CID-2026-01-02-001');
  console.log('\nChanged organ docs:');
  for (const doc of changedOrganDocs) {
    console.log(`   - ${doc}`);
  }
  console.log('\nSee docs/GOVERNANCE_PHASED_PLAN.md §7 for CID requirements.');
  
  process.exit(1);
}

main();

