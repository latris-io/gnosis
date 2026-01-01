// src/services/graph/traversal-service.ts
// @implements STORY-64.5
// @satisfies AC-64.5.3
// @satisfies AC-64.5.4
//
// Multi-hop graph traversal service for Graph API V1.
// Implements bounded BFS using Neo4j mirror for 1-hop fetches.
// Read-only — no write operations.
//
// SAFETY CONSTRAINT: maxDepth capped at 10 — this is a v1 safety bound, not a BRD requirement.
// Data source: Prefers Neo4j mirror for graph queries; PostgreSQL remains authoritative.

import { getSession } from '../../db/neo4j.js';
import { matchesProvenance, type ProvenanceCategory } from './provenance.js';

/**
 * Traversal options for bounded BFS.
 */
export interface TraversalOptions {
  /** Maximum traversal depth. SAFETY CONSTRAINT: capped at 10. */
  maxDepth: number;
  /** Minimum confidence threshold (inclusive). AC-64.5.3 */
  minConfidence?: number;
  /** Allowed provenance categories. AC-64.5.4 */
  provenance?: ProvenanceCategory[];
}

/**
 * Node representation in traversal result.
 */
export interface TraversalNode {
  id: string;
  entity_type: string;
  instance_id: string;
}

/**
 * Edge representation in traversal result.
 */
export interface TraversalEdge {
  from_entity_id: string;
  to_entity_id: string;
  relationship_type: string;
  confidence: number;
}

/**
 * Traversal result containing discovered nodes and edges.
 */
export interface TraversalResult {
  nodes: TraversalNode[];
  edges: TraversalEdge[];
}

/**
 * Internal edge representation with both endpoint IDs.
 */
interface RawEdge {
  from_id: string;
  from_type: string;
  from_instance: string;
  to_id: string;
  to_type: string;
  to_instance: string;
  rel_type: string;
  confidence: number;
}

/**
 * Bounded BFS traversal starting from an entity.
 *
 * Implementation approach:
 * 1. Use BFS in TypeScript (NOT Cypher variable-length paths)
 * 2. At each depth, fetch 1-hop relationships from Neo4j for frontier nodes
 * 3. Apply confidence filter in Cypher query
 * 4. Apply provenance filter in-memory via matchesProvenance()
 * 5. Maintain visitedNodes for cycle safety
 * 6. Deduplicate edges using composite key
 *
 * SAFETY CONSTRAINT: maxDepth capped at 10 (enforced by validation layer).
 *
 * @param projectId - Project UUID (required for project scoping)
 * @param startId - Entity UUID to start traversal from
 * @param options - Traversal options (maxDepth, minConfidence, provenance)
 * @returns TraversalResult containing discovered nodes and edges
 * @throws Error if Neo4j query fails
 */
export async function traverse(
  projectId: string,
  startId: string,
  options: TraversalOptions
): Promise<TraversalResult> {
  const { maxDepth, minConfidence, provenance } = options;

  // Track visited nodes and edges for deduplication
  const visitedNodes = new Set<string>();
  const visitedEdges = new Set<string>(); // Key: `${from}|${type}|${to}`

  // Result accumulators
  const resultNodes: Map<string, TraversalNode> = new Map();
  const resultEdges: TraversalEdge[] = [];

  // BFS frontier: start with the initial entity
  let frontier = new Set<string>([startId]);
  visitedNodes.add(startId);

  // Get Neo4j session
  const session = getSession();

  try {
    // Fetch start node info
    const startNodeResult = await session.run(
      `
      MATCH (n:Entity {project_id: $projectId})
      WHERE n.id = $startId
      RETURN n.id AS id, n.entity_type AS entity_type, n.instance_id AS instance_id
      `,
      { projectId, startId }
    );

    if (startNodeResult.records.length > 0) {
      const record = startNodeResult.records[0];
      resultNodes.set(startId, {
        id: record.get('id'),
        entity_type: record.get('entity_type'),
        instance_id: record.get('instance_id'),
      });
    }

    // BFS: iterate up to maxDepth levels
    for (let depth = 0; depth < maxDepth && frontier.size > 0; depth++) {
      const frontierIds = Array.from(frontier);
      const newFrontier = new Set<string>();

      // Fetch 1-hop relationships for all frontier nodes
      // Neo4j model: :Entity nodes with :RELATIONSHIP edges
      // Apply confidence filter in Cypher if provided
      const confidenceClause = minConfidence !== undefined
        ? 'AND r.confidence >= $minConfidence'
        : '';

      const query = `
        MATCH (n:Entity {project_id: $projectId})-[r:RELATIONSHIP]-(m:Entity {project_id: $projectId})
        WHERE n.id IN $frontierIds ${confidenceClause}
        RETURN 
          n.id AS from_id, n.entity_type AS from_type, n.instance_id AS from_instance,
          m.id AS to_id, m.entity_type AS to_type, m.instance_id AS to_instance,
          r.relationship_type AS rel_type, r.confidence AS confidence
      `;

      const params: Record<string, unknown> = {
        projectId,
        frontierIds,
      };
      if (minConfidence !== undefined) {
        params.minConfidence = minConfidence;
      }

      const result = await session.run(query, params);

      for (const record of result.records) {
        const edge: RawEdge = {
          from_id: record.get('from_id'),
          from_type: record.get('from_type'),
          from_instance: record.get('from_instance'),
          to_id: record.get('to_id'),
          to_type: record.get('to_type'),
          to_instance: record.get('to_instance'),
          rel_type: record.get('rel_type'),
          confidence: typeof record.get('confidence') === 'number'
            ? record.get('confidence')
            : 1.0,
        };

        // Apply provenance filter in-memory (AC-64.5.4)
        if (provenance?.length && !matchesProvenance(edge.rel_type, provenance)) {
          continue;
        }

        // Deduplicate edges using composite key
        const edgeKey = `${edge.from_id}|${edge.rel_type}|${edge.to_id}`;
        if (visitedEdges.has(edgeKey)) {
          continue;
        }
        visitedEdges.add(edgeKey);

        // Add edge to results
        resultEdges.push({
          from_entity_id: edge.from_id,
          to_entity_id: edge.to_id,
          relationship_type: edge.rel_type,
          confidence: edge.confidence,
        });

        // Add nodes to results and frontier
        if (!resultNodes.has(edge.from_id)) {
          resultNodes.set(edge.from_id, {
            id: edge.from_id,
            entity_type: edge.from_type,
            instance_id: edge.from_instance,
          });
        }

        if (!resultNodes.has(edge.to_id)) {
          resultNodes.set(edge.to_id, {
            id: edge.to_id,
            entity_type: edge.to_type,
            instance_id: edge.to_instance,
          });
        }

        // Determine which node is the "other" end (for frontier expansion)
        // Since the query returns both directions, we need to identify the neighbor
        const neighborId = frontierIds.includes(edge.from_id) ? edge.to_id : edge.from_id;

        // Add to next frontier if not visited
        if (!visitedNodes.has(neighborId)) {
          visitedNodes.add(neighborId);
          newFrontier.add(neighborId);
        }
      }

      // Move to next depth level
      frontier = newFrontier;
    }
  } finally {
    await session.close();
  }

  return {
    nodes: Array.from(resultNodes.values()),
    edges: resultEdges,
  };
}

