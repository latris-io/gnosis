/**
 * B.4 Closure Check Orchestrator
 *
 * Proves deterministic ingestion by:
 * 1. Running full Track A pipeline twice
 * 2. Comparing whole-graph snapshots via B.3 infrastructure
 * 3. Failing loudly on any nondeterminism
 */

import { spawn } from 'child_process';
import * as path from 'path';
import type {
  ClosureResult,
  EvidenceData,
  RunBinding,
  ProvenanceValidationResult,
  ExplicitComparison,
} from './types.js';
import {
  captureRunBinding,
  validateProvenance,
  validateShaUnchanged,
} from './provenance.js';
import { logClosureOperation } from './ledger.js';
import { evaluateGClosure, computeExplicitComparison } from './gate.js';
import { writeEvidence, LATEST_EVIDENCE_PATH, getRunEvidencePath } from './evidence.js';

// Import B.3 drift detection infrastructure
import { createGraphSnapshot, saveSnapshot } from '../drift-detection/snapshot.js';
import { computeDiff } from '../drift-detection/diff.js';
import type { GraphSnapshot } from '../drift-detection/types.js';

// ============================================================
// Constants
// ============================================================

const SETTLE_WINDOW_MS = 3000; // 3 seconds, per story card

// ============================================================
// Settle Window
// ============================================================

async function settle(): Promise<void> {
  console.log(`  Settling for ${SETTLE_WINDOW_MS}ms...`);
  await new Promise((r) => setTimeout(r, SETTLE_WINDOW_MS));
}

// ============================================================
// Run Command
// ============================================================

async function runCommand(
  cmd: string,
  args: string[],
  projectId: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`  Running: ${cmd} ${args.join(' ')}`);
    const proc = spawn(cmd, args, {
      env: { ...process.env, PROJECT_ID: projectId },
      stdio: 'inherit',
      shell: true,
    });
    proc.on('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${cmd} ${args.join(' ')} failed with code ${code}`))
    );
    proc.on('error', (err) => reject(err));
  });
}

// ============================================================
// Full Track A Pipeline
// ============================================================

async function runFullTrackAPipeline(projectId: string): Promise<void> {
  // Step 1: Entity extraction + derivations
  await runCommand('npx', ['tsx', 'scripts/run-a1-extraction.ts'], projectId);

  // Step 2: Track B TDD registry (required for complete graph)
  await runCommand('npx', ['tsx', 'scripts/register-track-b-tdds.ts'], projectId);
}

// ============================================================
// Precheck (Validate Provenance Only)
// ============================================================

export async function runPrecheck(providedRunId?: string): Promise<{
  binding: RunBinding;
  provenance: ProvenanceValidationResult;
  valid: boolean;
}> {
  console.log('\n🔍 B.4 Precheck: Validating provenance...\n');

  const binding = await captureRunBinding(providedRunId);

  console.log(`  Run ID: ${binding.run_id}`);
  console.log(`  Git SHA: ${binding.git_sha.slice(0, 12)}...`);
  console.log(`  Working Tree Clean: ${binding.working_tree_clean ? 'Yes' : 'No (dirty)'}`);
  console.log(`  V2 Health: ${binding.v2_health.status}`);
  console.log('');

  const provenance = validateProvenance(binding);

  if (provenance.valid) {
    console.log('  ✅ Provenance validation PASSED\n');
  } else {
    console.log('  ❌ Provenance validation FAILED\n');
    for (const err of provenance.errors) {
      console.log(`     - ${err}`);
    }
    console.log('');
  }

  return { binding, provenance, valid: provenance.valid };
}

// ============================================================
// Full Closure Run
// ============================================================

export async function runClosure(repoRoot: string, providedRunId?: string): Promise<ClosureResult> {
  console.log('\n🔒 B.4 Closure Check: Starting...\n');

  // 1. Capture bindings (includes v2 health check)
  const binding = await captureRunBinding(providedRunId);
  console.log(`  Run ID: ${binding.run_id}`);
  console.log(`  Git SHA: ${binding.git_sha.slice(0, 12)}...`);
  console.log(`  Working Tree Clean: ${binding.working_tree_clean ? 'Yes' : 'No (dirty)'}`);
  console.log(`  V2 Health: ${binding.v2_health.status}`);

  if (!binding.working_tree_clean) {
    console.log('  ⚠️  Warning: Working tree is dirty. Results will be recorded in evidence.');
  }
  console.log('');

  await logClosureOperation(repoRoot, binding.run_id, binding.project_id, {
    action: 'RUN_STARTED',
    binding,
  });

  // 2. Validate provenance (exact SHA match required)
  console.log('📋 Phase 0: Validating provenance...\n');
  const provenance = validateProvenance(binding);
  await logClosureOperation(repoRoot, binding.run_id, binding.project_id, {
    action: 'PRECONDITION_CHECK',
    provenance,
  });

  if (!provenance.valid) {
    console.log('  ❌ Provenance validation FAILED\n');
    for (const err of provenance.errors) {
      console.log(`     - ${err}`);
    }

    await logClosureOperation(repoRoot, binding.run_id, binding.project_id, {
      action: 'PRECONDITION_FAILED',
      errors: provenance.errors,
    });

    const evidenceData: EvidenceData = {
      status: 'PRECONDITION_FAILED',
      binding,
      provenance,
    };
    await writeEvidence(evidenceData);

    return {
      status: 'PRECONDITION_FAILED',
      pass: false,
      run_id: binding.run_id,
      evidence_path: LATEST_EVIDENCE_PATH,
      run_evidence_path: getRunEvidencePath(binding.run_id),
    };
  }
  console.log('  ✅ Provenance validation PASSED\n');

  // 3. Ingestion #1 (FULL pipeline)
  console.log('🔄 Phase 1: Running ingestion #1...\n');
  try {
    await runFullTrackAPipeline(binding.project_id);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.log(`\n  ❌ Ingestion #1 failed: ${errorMsg}\n`);

    const evidenceData: EvidenceData = {
      status: 'ERROR',
      binding,
      provenance,
      error: `Ingestion #1 failed: ${errorMsg}`,
    };
    await writeEvidence(evidenceData);

    return {
      status: 'ERROR',
      pass: false,
      run_id: binding.run_id,
      evidence_path: LATEST_EVIDENCE_PATH,
      run_evidence_path: getRunEvidencePath(binding.run_id),
    };
  }

  await settle();

  console.log('\n📸 Creating snapshot AFTER_1...\n');
  const snapshot1 = await createGraphSnapshot(
    binding.graph_api_v2_url,
    binding.project_id,
    'closure-after-1'
  );
  await saveSnapshot(repoRoot, snapshot1);
  console.log(`  Snapshot 1: ${snapshot1.id}`);
  console.log(`    Entities: ${snapshot1.entity_count}`);
  console.log(`    Relationships: ${snapshot1.relationship_count}`);
  console.log(`    Entity Root: ${snapshot1.entity_merkle_root.slice(0, 16)}...`);
  console.log(`    Rel Root: ${snapshot1.relationship_merkle_root.slice(0, 16)}...`);

  await logClosureOperation(repoRoot, binding.run_id, binding.project_id, {
    action: 'PHASE1_SNAPSHOT',
    snapshot_id: snapshot1.id,
  });

  // 4. Validate SHA unchanged between phases
  console.log('\n🔍 Checking SHA unchanged...\n');
  const shaCheck = validateShaUnchanged(binding);
  if (!shaCheck.unchanged) {
    console.log(`  ❌ SHA drift detected!`);
    console.log(`     Expected: ${binding.git_sha.slice(0, 12)}...`);
    console.log(`     Current:  ${shaCheck.current_sha.slice(0, 12)}...`);

    await logClosureOperation(repoRoot, binding.run_id, binding.project_id, {
      action: 'SHA_DRIFT',
      detected_sha: shaCheck.current_sha,
    });

    const evidenceData: EvidenceData = {
      status: 'SHA_DRIFT',
      binding,
      provenance,
      snapshot1: {
        id: snapshot1.id,
        entity_count: snapshot1.entity_count,
        relationship_count: snapshot1.relationship_count,
        entity_merkle_root: snapshot1.entity_merkle_root,
        relationship_merkle_root: snapshot1.relationship_merkle_root,
      },
      detected_sha: shaCheck.current_sha,
    };
    await writeEvidence(evidenceData);

    return {
      status: 'SHA_DRIFT',
      pass: false,
      run_id: binding.run_id,
      evidence_path: LATEST_EVIDENCE_PATH,
      run_evidence_path: getRunEvidencePath(binding.run_id),
    };
  }
  console.log('  ✅ SHA unchanged\n');

  // 5. Ingestion #2 (FULL pipeline, same commands)
  console.log('🔄 Phase 2: Running ingestion #2...\n');
  try {
    await runFullTrackAPipeline(binding.project_id);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.log(`\n  ❌ Ingestion #2 failed: ${errorMsg}\n`);

    const evidenceData: EvidenceData = {
      status: 'ERROR',
      binding,
      provenance,
      snapshot1: {
        id: snapshot1.id,
        entity_count: snapshot1.entity_count,
        relationship_count: snapshot1.relationship_count,
        entity_merkle_root: snapshot1.entity_merkle_root,
        relationship_merkle_root: snapshot1.relationship_merkle_root,
      },
      error: `Ingestion #2 failed: ${errorMsg}`,
    };
    await writeEvidence(evidenceData);

    return {
      status: 'ERROR',
      pass: false,
      run_id: binding.run_id,
      evidence_path: LATEST_EVIDENCE_PATH,
      run_evidence_path: getRunEvidencePath(binding.run_id),
    };
  }

  await settle();

  console.log('\n📸 Creating snapshot AFTER_2...\n');
  const snapshot2 = await createGraphSnapshot(
    binding.graph_api_v2_url,
    binding.project_id,
    'closure-after-2'
  );
  await saveSnapshot(repoRoot, snapshot2);
  console.log(`  Snapshot 2: ${snapshot2.id}`);
  console.log(`    Entities: ${snapshot2.entity_count}`);
  console.log(`    Relationships: ${snapshot2.relationship_count}`);
  console.log(`    Entity Root: ${snapshot2.entity_merkle_root.slice(0, 16)}...`);
  console.log(`    Rel Root: ${snapshot2.relationship_merkle_root.slice(0, 16)}...`);

  await logClosureOperation(repoRoot, binding.run_id, binding.project_id, {
    action: 'PHASE2_SNAPSHOT',
    snapshot_id: snapshot2.id,
  });

  // 6. Compare AFTER_1 vs AFTER_2 (explicit field checks)
  console.log('\n🔬 Comparing snapshots...\n');
  const diff = computeDiff(snapshot1, snapshot2);
  const comparison = computeExplicitComparison(snapshot1, snapshot2, diff);

  console.log(`  Counts match: ${comparison.counts_match ? '✅' : '❌'}`);
  console.log(`  Entity roots match: ${comparison.entity_roots_match ? '✅' : '❌'}`);
  console.log(`  Relationship roots match: ${comparison.relationship_roots_match ? '✅' : '❌'}`);
  console.log(`  Drift items: ${comparison.drift_items}`);

  await logClosureOperation(repoRoot, binding.run_id, binding.project_id, {
    action: 'DIFF_COMPUTED',
    drift_count: diff.summary.total_drift_items,
  });

  // 7. Evaluate G-CLOSURE gate
  console.log('\n🚪 Evaluating G-CLOSURE gate...\n');
  const gateResult = evaluateGClosure(snapshot1, snapshot2, diff, provenance);

  await logClosureOperation(repoRoot, binding.run_id, binding.project_id, {
    action: 'GATE_EVALUATED',
    pass: gateResult.pass,
  });

  if (gateResult.pass) {
    console.log('  ✅ G-CLOSURE: PASS\n');
  } else {
    console.log('  ❌ G-CLOSURE: FAIL\n');
    for (const reason of gateResult.failure_reasons) {
      console.log(`     - ${reason}`);
    }
    console.log('');
  }

  // 8. Write evidence (always, to run-specific dir + latest)
  const evidenceData: EvidenceData = {
    status: gateResult.pass ? 'PASS' : 'FAIL',
    binding,
    provenance,
    snapshot1: {
      id: snapshot1.id,
      entity_count: snapshot1.entity_count,
      relationship_count: snapshot1.relationship_count,
      entity_merkle_root: snapshot1.entity_merkle_root,
      relationship_merkle_root: snapshot1.relationship_merkle_root,
    },
    snapshot2: {
      id: snapshot2.id,
      entity_count: snapshot2.entity_count,
      relationship_count: snapshot2.relationship_count,
      entity_merkle_root: snapshot2.entity_merkle_root,
      relationship_merkle_root: snapshot2.relationship_merkle_root,
    },
    comparison,
    gateResult,
  };

  const evidencePaths = await writeEvidence(evidenceData);
  console.log(`📝 Evidence written to:`);
  console.log(`   Run: ${evidencePaths.run_path}`);
  console.log(`   Latest: ${evidencePaths.latest_path}`);

  return {
    status: gateResult.pass ? 'PASS' : 'FAIL',
    pass: gateResult.pass,
    run_id: binding.run_id,
    evidence_path: evidencePaths.latest_path,
    run_evidence_path: evidencePaths.run_path,
  };
}

