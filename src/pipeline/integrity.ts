// src/pipeline/integrity.ts
// @implements STORY-64.4
// @tdd TDD-A4-STRUCTURAL-ANALYSIS
// NOTE: Infrastructure modules do not carry @satisfies markers.
// Only ast-relationship-provider.ts carries @satisfies AC-64.4.1/2/3.
//
// Architecture Note: IntegrityEvaluator is service-layer code.
// Direct DB access is allowed per PROMPTS.md architecture rules.

import type { IntegrityResult, IntegrityFinding, PipelineSnapshot } from './types.js';
import { getClient, setProjectContext } from '../db/postgres.js';
import { getSession } from '../db/neo4j.js';

/**
 * Evaluate structural integrity of the extracted graph.
 * 
 * Produces findings with severity levels (not pass/fail assertions).
 * Findings are signals for human gate review at HGR-1.
 * 
 * Per epistemic hygiene: this system does not claim to "know" correctness.
 * It reports what it observes for human judgment.
 */
export class IntegrityEvaluator {
  /**
   * Run all integrity evaluations and return findings.
   */
  async evaluate(snapshot: PipelineSnapshot): Promise<IntegrityResult> {
    const projectId = snapshot.project_id;
    const findings: IntegrityFinding[] = [];
    
    // Run all evaluations in parallel where possible
    const [
      relIntegrity,
      entityUniqueness,
      requiredTypes,
      brdCounts,
      orphanFiles,
      connectivity,
    ] = await Promise.all([
      this.evaluateRelationshipIntegrity(projectId),
      this.evaluateEntityUniqueness(projectId),
      this.evaluateRequiredEntityTypes(projectId),
      this.evaluateBRDCounts(projectId),
      this.evaluateOrphanFiles(projectId),
      this.evaluateGraphConnectivity(projectId),
    ]);
    
    findings.push(relIntegrity, entityUniqueness, requiredTypes, brdCounts, orphanFiles, connectivity);
    
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const warningCount = findings.filter(f => f.severity === 'warning').length;
    
    return {
      findings,
      summary: `${findings.length} findings (${criticalCount} critical, ${warningCount} warnings)`,
    };
  }

  /**
   * Evaluate 1: All relationships reference existing entities.
   */
  private async evaluateRelationshipIntegrity(projectId: string): Promise<IntegrityFinding> {
    const client = await getClient();
    
    try {
      await setProjectContext(client, projectId);
      
      const result = await client.query(`
        SELECT r.id, r.from_entity_id, r.to_entity_id
        FROM relationships r
        LEFT JOIN entities s ON r.from_entity_id = s.id AND s.project_id = $1
        LEFT JOIN entities t ON r.to_entity_id = t.id AND t.project_id = $1
        WHERE r.project_id = $1
          AND (s.id IS NULL OR t.id IS NULL)
      `, [projectId]);
      
      return {
        name: 'relationship_integrity',
        severity: result.rows.length === 0 ? 'info' : 'critical',
        message: result.rows.length === 0
          ? 'All relationships reference valid entities'
          : `${result.rows.length} relationships have invalid references`,
        evidence: { orphan_count: result.rows.length },
      };
    } finally {
      client.release();
    }
  }

  /**
   * Evaluate 2: No duplicate entity instance_ids within project.
   */
  private async evaluateEntityUniqueness(projectId: string): Promise<IntegrityFinding> {
    const client = await getClient();
    
    try {
      await setProjectContext(client, projectId);
      
      const result = await client.query(`
        SELECT instance_id, COUNT(*) as count
        FROM entities
        WHERE project_id = $1
        GROUP BY instance_id
        HAVING COUNT(*) > 1
      `, [projectId]);
      
      return {
        name: 'entity_uniqueness',
        severity: result.rows.length === 0 ? 'info' : 'critical',
        message: result.rows.length === 0
          ? 'All entity instance_ids are unique'
          : `${result.rows.length} duplicate instance_ids found`,
        evidence: { duplicate_count: result.rows.length },
      };
    } finally {
      client.release();
    }
  }

  /**
   * Evaluate 3: All required Track A entity types are present.
   */
  private async evaluateRequiredEntityTypes(projectId: string): Promise<IntegrityFinding> {
    const client = await getClient();
    
    // Required entity types for Track A
    const requiredTypes = ['E01', 'E02', 'E03', 'E11', 'E12', 'E27', 'E29'];
    
    try {
      await setProjectContext(client, projectId);
      
      const result = await client.query(`
        SELECT DISTINCT entity_type FROM entities
        WHERE project_id = $1
      `, [projectId]);
      
      const foundTypes = new Set(result.rows.map(r => r.entity_type));
      const missingTypes = requiredTypes.filter(t => !foundTypes.has(t));
      
      return {
        name: 'required_entity_types',
        severity: missingTypes.length === 0 ? 'info' : 'warning',
        message: missingTypes.length === 0
          ? 'All required entity types present'
          : `Missing entity types: ${missingTypes.join(', ')}`,
        evidence: { missing_types: missingTypes },
      };
    } finally {
      client.release();
    }
  }

  /**
   * Evaluate 4: BRD counts match expected values.
   * NOTE: This is a finding (signal), not an assertion.
   * Human gate reviews discrepancies.
   */
  private async evaluateBRDCounts(projectId: string): Promise<IntegrityFinding> {
    const client = await getClient();
    
    // Expected counts from BRD V20.6.4
    const expected = { epics: 65, stories: 397, acs: 3147 };
    
    try {
      await setProjectContext(client, projectId);
      
      const epicResult = await client.query(
        `SELECT COUNT(*) FROM entities WHERE project_id = $1 AND entity_type = 'E01'`,
        [projectId]
      );
      const storyResult = await client.query(
        `SELECT COUNT(*) FROM entities WHERE project_id = $1 AND entity_type = 'E02'`,
        [projectId]
      );
      const acResult = await client.query(
        `SELECT COUNT(*) FROM entities WHERE project_id = $1 AND entity_type = 'E03'`,
        [projectId]
      );
      
      const actual = {
        epics: parseInt(epicResult.rows[0].count, 10),
        stories: parseInt(storyResult.rows[0].count, 10),
        acs: parseInt(acResult.rows[0].count, 10),
      };
      
      const match = actual.epics === expected.epics &&
        actual.stories === expected.stories &&
        actual.acs === expected.acs;
      
      return {
        name: 'brd_counts',
        severity: 'info', // Always info - human gate reviews discrepancies
        message: match
          ? `BRD counts match: ${actual.epics}/${actual.stories}/${actual.acs}`
          : `BRD counts: expected ${expected.epics}/${expected.stories}/${expected.acs}, found ${actual.epics}/${actual.stories}/${actual.acs}`,
        evidence: { expected, actual },
      };
    } finally {
      client.release();
    }
  }

  /**
   * Evaluate 5: Source files have contained entities.
   */
  private async evaluateOrphanFiles(projectId: string): Promise<IntegrityFinding> {
    const client = await getClient();
    
    try {
      await setProjectContext(client, projectId);
      
      // Source files without any R05 CONTAINS relationships
      const result = await client.query(`
        SELECT sf.id FROM entities sf
        WHERE sf.project_id = $1
          AND sf.entity_type = 'E11'
          AND NOT EXISTS (
            SELECT 1 FROM relationships r
            WHERE r.project_id = $1
              AND r.from_entity_id = sf.id
              AND r.relationship_type = 'R05'
          )
      `, [projectId]);
      
      return {
        name: 'orphan_files',
        severity: result.rows.length === 0 ? 'info' : 'warning',
        message: result.rows.length === 0
          ? 'All source files have contained entities'
          : `${result.rows.length} source files have no contained entities`,
        evidence: { orphan_count: result.rows.length },
      };
    } finally {
      client.release();
    }
  }

  /**
   * Evaluate 6: Graph connectivity (Epic → Function paths exist).
   */
  private async evaluateGraphConnectivity(projectId: string): Promise<IntegrityFinding> {
    const session = getSession();
    
    try {
      // Check if we can traverse from any Epic to any Function
      const result = await session.run(`
        MATCH path = (e:Entity {entity_type: 'E01', project_id: $projectId})-[:RELATIONSHIP*1..5]->(f:Entity {entity_type: 'E12', project_id: $projectId})
        RETURN COUNT(DISTINCT path) as paths
        LIMIT 1
      `, { projectId });
      
      const pathCount = result.records[0]?.get('paths')?.toNumber() || 0;
      
      return {
        name: 'graph_connectivity',
        severity: pathCount > 0 ? 'info' : 'warning',
        message: pathCount > 0
          ? 'Graph is connected (Epic → Function paths exist)'
          : 'Graph may be disconnected (no Epic → Function paths found)',
        evidence: { path_count: pathCount },
      };
    } finally {
      await session.close();
    }
  }
}

/**
 * Convenience function to evaluate integrity for a snapshot.
 */
export async function evaluateIntegrity(snapshot: PipelineSnapshot): Promise<IntegrityResult> {
  const evaluator = new IntegrityEvaluator();
  return evaluator.evaluate(snapshot);
}

