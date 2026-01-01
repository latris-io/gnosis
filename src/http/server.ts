// src/http/server.ts
// Infrastructure only — NO @implements markers here
// Markers belong on routes/graph.ts where endpoints are defined
//
// Per CID-2026-01-01: Minimal HTTP adapter layer for BRD endpoints.
// This is a new, unlocked surface for A5.

import Fastify, { type FastifyInstance } from 'fastify';
import { graphRoutes } from './routes/graph.js';

/**
 * Create and configure the Fastify server.
 * Registers graph API routes under /api/graph prefix.
 */
export async function createServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

  // Register graph API routes
  await app.register(graphRoutes, { prefix: '/api/graph' });

  return app;
}

/**
 * Start the HTTP server on the specified port.
 * Default port: 3000
 */
export async function startServer(port: number = 3000): Promise<FastifyInstance> {
  const app = await createServer();

  try {
    await app.listen({ port, host: '0.0.0.0' });
    return app;
  } catch (err) {
    app.log.error(err);
    throw err;
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

