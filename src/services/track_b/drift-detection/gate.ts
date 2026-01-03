/**
 * B.3 G-DRIFT Gate Evaluation
 * 
 * Track B: Story B.3 - Drift Detection
 * TDD ID: TDD-TRACKB-B3
 * 
 * Evaluates drift against an allowlist.
 * Gate passes if no unexpected drift items are found.
 * 
 * ALLOWLIST FORMAT (JSON file):
 *   {
 *     "allowed_entity_types": ["E11", "E12"],
 *     "allowed_instance_patterns": ["^FILE-test/.*"],
 *     "allowed_relationship_types": ["R14"]
 *   }
 * 
 * Patterns are stored as strings and compiled to RegExp at runtime.
 */

import * as fs from 'fs';
import { 
  DriftDiff, 
  DriftItem, 
  DriftAllowlist, 
  DriftAllowlistFile, 
  GDriftResult 
} from './types.js';

/**
 * Default empty allowlist (all drift is unexpected).
 */
export const DEFAULT_ALLOWLIST: DriftAllowlist = {
  allowed_entity_types: new Set(),
  allowed_instance_patterns: [],
  allowed_relationship_types: new Set(),
};

/**
 * Load allowlist from JSON file.
 * Compiles regex strings to RegExp objects at runtime.
 * 
 * @param filepath - Path to allowlist JSON file
 * @returns DriftAllowlist with compiled patterns
 */
export function loadAllowlist(filepath: string): DriftAllowlist {
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const file: DriftAllowlistFile = JSON.parse(content);
    
    return {
      allowed_entity_types: new Set(file.allowed_entity_types ?? []),
      allowed_instance_patterns: (file.allowed_instance_patterns ?? []).map(s => new RegExp(s)),
      allowed_relationship_types: new Set(file.allowed_relationship_types ?? []),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File doesn't exist - return default empty allowlist
      return DEFAULT_ALLOWLIST;
    }
    throw error;
  }
}

/**
 * Check if a drift item is allowed by the allowlist.
 */
function isAllowed(item: DriftItem, allowlist: DriftAllowlist): boolean {
  // Check instance_id against patterns
  for (const pattern of allowlist.allowed_instance_patterns) {
    if (pattern.test(item.instance_id)) {
      return true;
    }
  }
  
  // Check entity type
  if (item.category === 'entity' && item.entity_type) {
    if (allowlist.allowed_entity_types.has(item.entity_type)) {
      return true;
    }
  }
  
  // Check relationship type
  if (item.category === 'relationship' && item.relationship_type) {
    if (allowlist.allowed_relationship_types.has(item.relationship_type)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Evaluate G-DRIFT gate.
 * 
 * Gate PASSES if:
 *   - All drift items are covered by the allowlist
 *   - OR there are no drift items at all
 * 
 * Gate FAILS if:
 *   - Any drift item is NOT covered by the allowlist
 * 
 * @param diff - DriftDiff result from computeDiff
 * @param allowlist - DriftAllowlist (default: empty, all drift unexpected)
 * @returns GDriftResult with pass/fail and categorized items
 */
export function evaluateGDrift(
  diff: DriftDiff,
  allowlist: DriftAllowlist = DEFAULT_ALLOWLIST
): GDriftResult {
  const unexpected: DriftItem[] = [];
  const allowed: DriftItem[] = [];
  
  for (const item of diff.items) {
    if (isAllowed(item, allowlist)) {
      allowed.push(item);
    } else {
      unexpected.push(item);
    }
  }
  
  const pass = unexpected.length === 0;
  
  return {
    gate: 'G-DRIFT',
    pass,
    computed_at: new Date().toISOString(),
    baseline_snapshot: diff.snapshot_a,
    current_snapshot: diff.snapshot_b,
    drift_summary: diff.summary,
    unexpected_items: unexpected,
    allowed_items: allowed,
  };
}

/**
 * Format G-DRIFT result for display.
 */
export function formatGDriftResult(result: GDriftResult): string {
  const lines: string[] = [];
  
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push(`  G-DRIFT GATE: ${result.pass ? 'PASS ✓' : 'FAIL ✗'}`);
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`  Baseline: ${result.baseline_snapshot}`);
  lines.push(`  Current:  ${result.current_snapshot}`);
  lines.push(`  Computed: ${result.computed_at}`);
  lines.push('');
  lines.push('  SUMMARY:');
  lines.push(`    Entities:      +${result.drift_summary.entities_added} / -${result.drift_summary.entities_deleted} / ~${result.drift_summary.entities_mutated}`);
  lines.push(`    Relationships: +${result.drift_summary.relationships_added} / -${result.drift_summary.relationships_deleted} / ~${result.drift_summary.relationships_mutated}`);
  lines.push(`    Total items:   ${result.drift_summary.total_drift_items}`);
  lines.push('');
  lines.push(`  Unexpected: ${result.unexpected_items.length}`);
  lines.push(`  Allowed:    ${result.allowed_items.length}`);
  
  if (result.unexpected_items.length > 0) {
    lines.push('');
    lines.push('  UNEXPECTED DRIFT ITEMS (first 20):');
    for (const item of result.unexpected_items.slice(0, 20)) {
      const type = item.entity_type ?? item.relationship_type ?? '';
      lines.push(`    [${item.change_type.toUpperCase()}] ${item.category} ${type}: ${item.instance_id}`);
    }
    if (result.unexpected_items.length > 20) {
      lines.push(`    ... and ${result.unexpected_items.length - 20} more`);
    }
  }
  
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}

