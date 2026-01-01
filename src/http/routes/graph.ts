// src/http/routes/graph.ts
// @implements STORY-64.5
// @satisfies AC-64.5.1
// @satisfies AC-64.5.2
//
// HTTP routes for Graph API v1 — thin transport wrappers only.
// Per CID-2026-01-01: HTTP layer is transport only, no business logic.
// All validation and parsing lives in programmatic API (src/api/v1/*).
//
// Error mapping contract (consistent across GET and POST):
// - ValidationError → 400 { error: message }
// - Other errors → 500 (Fastify default handler)
//
// Project scoping: Explicit project_id in query param (GET) or body field (POST).

import type { FastifyPluginAsync } from 'fastify';
import * as relationshipsApi from '../../api/v1/relationships.js';
import * as traversalApi from '../../api/v1/traversal.js';

/**
 * Graph API routes plugin.
 * Mounted at /api/graph by server.ts.
 */
export const graphRoutes: FastifyPluginAsync = async (app) => {
  // AC-64.5.1: Single-hop relationships
  // GET /api/graph/:id/relationships?project_id=...&min_confidence=...&provenance=...
  app.get<{
    Params: { id: string };
    Querystring: {
      project_id?: string;
      min_confidence?: string;
      provenance?: string;
    };
  }>('/:id/relationships', async (request, reply) => {
    try {
      // Pass raw strings to programmatic API — it does all validation
      const result = await relationshipsApi.getRelationshipsForEntity(
        request.query.project_id ?? '',
        request.params.id,
        {
          minConfidence: request.query.min_confidence,
          provenance: request.query.provenance,
        }
      );
      return result;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'ValidationError') {
        return reply.status(400).send({ error: err.message });
      }
      throw err; // Let Fastify handle as 500
    }
  });

  // AC-64.5.2: Multi-hop traversal
  // POST /api/graph/traverse
  // Body: { project_id, start_id, max_depth, min_confidence?, provenance? }
  app.post<{
    Body: {
      project_id?: string;
      start_id?: string;
      max_depth?: number;
      min_confidence?: number;
      provenance?: string[];
    };
  }>('/traverse', async (request, reply) => {
    try {
      // Pass raw body to programmatic API — it does all validation
      const result = await traversalApi.traverse({
        project_id: request.body.project_id ?? '',
        start_id: request.body.start_id ?? '',
        max_depth: request.body.max_depth ?? 0,
        min_confidence: request.body.min_confidence,
        provenance: request.body.provenance,
      });
      return result;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'ValidationError') {
        return reply.status(400).send({ error: err.message });
      }
      throw err; // Let Fastify handle as 500
    }
  });
};

