/**
 * B.3 Semantic Signal Emission
 * 
 * Track B: Story B.3 - Drift Detection
 * TDD ID: TDD-TRACKB-B3
 * 
 * Emits semantic signals when drift is detected.
 * Contributes to Track B exit requirement (100+ signals total across Track A + Track B).
 * 
 * Signal types:
 *   - DRIFT_UNEXPECTED: G-DRIFT gate failed due to unexpected changes
 *   - DRIFT_MUTATION: Entity/relationship content_hash changed
 *   - DRIFT_DELETION: Entity/relationship was deleted
 *   - DRIFT_ADDITION: Entity/relationship was added
 */

import * as fs from 'fs';
import * as path from 'path';
import { DriftItem, DriftSignal, GDriftResult } from './types.js';

// Semantic corpus location
const CORPUS_DIR = 'semantic-corpus';
const SIGNALS_FILE = 'drift-signals.jsonl';

// Project ID from environment
const PROJECT_ID = process.env.PROJECT_ID || '6df2f456-440d-4958-b475-d9808775ff69';

/**
 * Get the full path to the drift signals file.
 */
function getSignalsPath(repoRoot: string): string {
  return path.join(repoRoot, CORPUS_DIR, PROJECT_ID, SIGNALS_FILE);
}

/**
 * Map a drift item to a semantic signal.
 */
function driftItemToSignal(
  item: DriftItem,
  baselineSnapshot: string,
  currentSnapshot: string,
  isUnexpected: boolean
): DriftSignal {
  let type: DriftSignal['type'];
  let severity: DriftSignal['severity'];
  
  switch (item.change_type) {
    case 'added':
      type = 'DRIFT_ADDITION';
      severity = isUnexpected ? 'WARNING' : 'WARNING';
      break;
    case 'deleted':
      type = 'DRIFT_DELETION';
      severity = isUnexpected ? 'ERROR' : 'WARNING';
      break;
    case 'mutated':
      type = 'DRIFT_MUTATION';
      severity = isUnexpected ? 'ERROR' : 'WARNING';
      break;
  }
  
  return {
    type,
    severity,
    instance_id: item.instance_id,
    entity_type: item.entity_type,
    relationship_type: item.relationship_type,
    baseline_snapshot: baselineSnapshot,
    current_snapshot: currentSnapshot,
    context: {
      category: item.category,
      change_type: item.change_type,
      old_hash: item.old_hash,
      new_hash: item.new_hash,
      unexpected: isUnexpected,
    },
  };
}

/**
 * Emit semantic signals for drift items.
 * 
 * Only emits signals for unexpected drift items (those not covered by allowlist).
 * This focuses signal collection on genuine issues.
 * 
 * @param repoRoot - Absolute path to repository root
 * @param result - G-DRIFT gate result
 * @returns Number of signals emitted
 */
export async function emitDriftSignals(
  repoRoot: string,
  result: GDriftResult
): Promise<number> {
  // Only emit signals for unexpected items
  if (result.unexpected_items.length === 0) {
    return 0;
  }
  
  const signalsPath = getSignalsPath(repoRoot);
  const signalsDir = path.dirname(signalsPath);
  
  // Ensure directory exists
  await fs.promises.mkdir(signalsDir, { recursive: true });
  
  // Convert drift items to signals
  const signals: DriftSignal[] = result.unexpected_items.map(item =>
    driftItemToSignal(item, result.baseline_snapshot, result.current_snapshot, true)
  );
  
  // Append signals as JSONL
  const lines = signals.map(s => JSON.stringify(s)).join('\n') + '\n';
  await fs.promises.appendFile(signalsPath, lines, 'utf-8');
  
  console.log(`[B.3] Emitted ${signals.length} semantic signals to ${signalsPath}`);
  
  return signals.length;
}

/**
 * Count existing drift signals.
 */
export async function countDriftSignals(repoRoot: string): Promise<number> {
  const signalsPath = getSignalsPath(repoRoot);
  
  try {
    const content = await fs.promises.readFile(signalsPath, 'utf-8');
    return content.trim().split('\n').filter(line => line.length > 0).length;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return 0;
    }
    throw error;
  }
}

/**
 * Get the path to the signals file (for documentation/evidence).
 */
export function getSignalsFilePath(): string {
  return `${CORPUS_DIR}/${PROJECT_ID}/${SIGNALS_FILE}`;
}

