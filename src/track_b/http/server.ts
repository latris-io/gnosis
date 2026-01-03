// src/track_b/http/server.ts
// Track B Graph API v2 HTTP Server
// Per CID-2026-01-03: Separate server from Track A v1 (src/http/** is locked)
//
// This server runs on GRAPH_API_V2_PORT (default 3001) and provides:
// - GET /api/v2/entities - Entity enumeration
// - GET /api/v2/relationships - Relationship enumeration
//
// Server infrastructure only — NO @implements markers here
// (Track B is gate-based, not marker-based)

import Fastify, { type FastifyInstance } from 'fastify';
import { entityRoutes } from './routes/entities.js';
import { relationshipRoutes } from './routes/relationships.js';

/**
 * Create and configure the v2 Fastify server.
 * Registers enumeration routes under /api/v2 prefix.
 */
export async function createV2Server(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

  // Register v2 routes
  await app.register(entityRoutes, { prefix: '/api/v2' });
  await app.register(relationshipRoutes, { prefix: '/api/v2' });

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'ok', server: 'v2' };
  });

  return app;
}

/**
 * Start the v2 HTTP server on the specified port.
 * Default port: 3001 (or GRAPH_API_V2_PORT env var)
 */
export async function startV2Server(port?: number): Promise<FastifyInstance> {
  const serverPort = port ?? parseInt(process.env.GRAPH_API_V2_PORT ?? '3001', 10);
  const app = await createV2Server();

  try {
    await app.listen({ port: serverPort, host: '0.0.0.0' });
    console.log(`Graph API v2 server listening on port ${serverPort}`);
    return app;
  } catch (err) {
    app.log.error(err);
    throw err;
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  startV2Server().catch((err) => {
    console.error('Failed to start v2 server:', err);
    process.exit(1);
  });
}

