// src/pipeline/statistics.ts
// @implements STORY-64.4
// @tdd TDD-A4-STRUCTURAL-ANALYSIS
// NOTE: Infrastructure modules do not carry @satisfies markers.
// Only ast-relationship-provider.ts carries @satisfies AC-64.4.1/2/3.

import type { ExtractionStatistics, PipelineSnapshot } from './types.js';
import { queryEntities, getAllEntities } from '../api/v1/entities.js';
import type { EntityTypeCode } from '../schema/track-a/entities.js';
import { getClient, setProjectContext } from '../db/postgres.js';

/**
 * Compute extraction statistics for a project.
 * 
 * Statistics include:
 * - Total entities and by-type breakdown
 * - Total relationships and by-type breakdown
 * - Orphan entities (entities with no relationships)
 * - Orphan markers (markers pointing to non-existent targets)
 * 
 * Note: This is service-layer code, DB access is allowed.
 */
export async function computeStatistics(
  snapshot: PipelineSnapshot
): Promise<ExtractionStatistics> {
  const projectId = snapshot.project_id;
  const client = await getClient();
  
  try {
    await setProjectContext(client, projectId);
    
    // Get entity counts by type
    const entityResult = await client.query(`
      SELECT entity_type, COUNT(*) as count
      FROM entities
      WHERE project_id = $1
      GROUP BY entity_type
    `, [projectId]);
    
    const entities_by_type: Record<string, number> = {};
    let total_entities = 0;
    
    for (const row of entityResult.rows) {
      entities_by_type[row.entity_type] = parseInt(row.count, 10);
      total_entities += parseInt(row.count, 10);
    }
    
    // Get relationship counts by type
    const relResult = await client.query(`
      SELECT relationship_type, COUNT(*) as count
      FROM relationships
      WHERE project_id = $1
      GROUP BY relationship_type
    `, [projectId]);
    
    const relationships_by_type: Record<string, number> = {};
    let total_relationships = 0;
    
    for (const row of relResult.rows) {
      relationships_by_type[row.relationship_type] = parseInt(row.count, 10);
      total_relationships += parseInt(row.count, 10);
    }
    
    // Count orphan entities (entities not in any relationship)
    const orphanEntityResult = await client.query(`
      SELECT COUNT(*) as count
      FROM entities e
      WHERE e.project_id = $1
        AND NOT EXISTS (
          SELECT 1 FROM relationships r 
          WHERE r.project_id = $1 
            AND (r.from_entity_id = e.id OR r.to_entity_id = e.id)
        )
    `, [projectId]);
    
    const orphan_entities = parseInt(orphanEntityResult.rows[0]?.count || '0', 10);
    
    // Count orphan markers (R18/R19 relationships where target doesn't exist)
    // Note: This should be 0 if marker extraction is working correctly
    const orphanMarkerResult = await client.query(`
      SELECT COUNT(*) as count
      FROM relationships r
      WHERE r.project_id = $1
        AND r.relationship_type IN ('R18', 'R19')
        AND NOT EXISTS (
          SELECT 1 FROM entities e 
          WHERE e.project_id = $1 
            AND e.id = r.to_entity_id
        )
    `, [projectId]);
    
    const orphan_markers = parseInt(orphanMarkerResult.rows[0]?.count || '0', 10);
    
    return {
      total_entities,
      entities_by_type,
      total_relationships,
      relationships_by_type,
      orphan_entities,
      orphan_markers,
    };
  } finally {
    client.release();
  }
}

/**
 * Get a summary string for statistics.
 */
export function formatStatisticsSummary(stats: ExtractionStatistics): string {
  const entityTypes = Object.keys(stats.entities_by_type).length;
  const relTypes = Object.keys(stats.relationships_by_type).length;
  
  return `${stats.total_entities} entities (${entityTypes} types), ` +
    `${stats.total_relationships} relationships (${relTypes} types), ` +
    `${stats.orphan_entities} orphan entities, ${stats.orphan_markers} orphan markers`;
}

