// src/track_b/http/routes/relationships.ts
// Track B HTTP Layer - Relationship Enumeration Route
// Per CID-2026-01-03: HTTP handlers are thin wrappers, no DB imports
//
// This file MUST NOT import from 'pg' or 'src/db/**'.
// It imports only from src/api/v2/*.js and calls the programmatic API.

import type { FastifyPluginAsync } from 'fastify';
import { enumerateRelationships, ValidationError } from '../../../api/v2/relationships.js';
import type { RelationshipQueryParams, ErrorResponse } from '../types.js';

/**
 * Relationship enumeration routes plugin.
 * Mounted at /api/v2 by server.ts.
 */
export const relationshipRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/v2/relationships?project_id=...&relationship_type=...&limit=...&offset=...
  app.get<{
    Querystring: RelationshipQueryParams;
  }>('/relationships', async (request, reply) => {
    try {
      const { project_id, relationship_type, limit, offset } = request.query;

      // Parse numeric params (strings from query)
      const parsedLimit = limit ? parseInt(limit, 10) : undefined;
      const parsedOffset = offset ? parseInt(offset, 10) : undefined;

      // Validate numeric parsing
      if (limit !== undefined && isNaN(parsedLimit!)) {
        return reply.status(400).send({ error: 'limit must be a number' } as ErrorResponse);
      }
      if (offset !== undefined && isNaN(parsedOffset!)) {
        return reply.status(400).send({ error: 'offset must be a number' } as ErrorResponse);
      }

      // Call programmatic API (it does full validation)
      const result = await enumerateRelationships(
        project_id ?? '',
        relationship_type || undefined, // Convert empty string to undefined
        parsedLimit,
        parsedOffset
      );

      return result;
    } catch (err) {
      if (err instanceof ValidationError) {
        return reply.status(400).send({ error: err.message } as ErrorResponse);
      }
      // Let Fastify handle as 500
      throw err;
    }
  });
};

