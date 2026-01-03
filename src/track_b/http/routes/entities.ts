// src/track_b/http/routes/entities.ts
// Track B HTTP Layer - Entity Enumeration Route
// Per CID-2026-01-03: HTTP handlers are thin wrappers, no DB imports
//
// This file MUST NOT import from 'pg' or 'src/db/**'.
// It imports only from src/api/v2/*.js and calls the programmatic API.

import type { FastifyPluginAsync } from 'fastify';
import { enumerateEntities, ValidationError } from '../../../api/v2/entities.js';
import type { EntityQueryParams, ErrorResponse } from '../types.js';

/**
 * Entity enumeration routes plugin.
 * Mounted at /api/v2 by server.ts.
 */
export const entityRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/v2/entities?project_id=...&entity_type=...&limit=...&offset=...
  app.get<{
    Querystring: EntityQueryParams;
  }>('/entities', async (request, reply) => {
    try {
      const { project_id, entity_type, limit, offset } = request.query;

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
      const result = await enumerateEntities(
        project_id ?? '',
        entity_type ?? '',
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

