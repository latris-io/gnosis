// test/http/graph-routes.test.ts
// HTTP integration tests for Graph API routes using Fastify inject

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../../src/http/server.js';

describe('Graph API HTTP Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/graph/:id/relationships', () => {
    it('returns 400 when project_id is missing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/graph/entity-123/relationships',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toContain('project_id is required');
    });

    it('returns 400 for invalid min_confidence', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/graph/entity-123/relationships?project_id=proj-123&min_confidence=abc',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toContain('min_confidence must be a valid number');
    });

    it('returns 400 for min_confidence out of range', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/graph/entity-123/relationships?project_id=proj-123&min_confidence=1.5',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toContain('min_confidence must be between 0 and 1');
    });

    it('returns 400 for invalid provenance category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/graph/entity-123/relationships?project_id=proj-123&provenance=invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toContain('Invalid provenance category');
    });
  });

  describe('POST /api/graph/traverse', () => {
    it('returns 400 when project_id is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/graph/traverse',
        payload: {
          start_id: 'entity-123',
          max_depth: 2,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toContain('project_id is required');
    });

    it('returns 400 when start_id is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/graph/traverse',
        payload: {
          project_id: 'proj-123',
          max_depth: 2,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toContain('start_id is required');
    });

    it('returns 400 when max_depth exceeds safety limit (10)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/graph/traverse',
        payload: {
          project_id: 'proj-123',
          start_id: 'entity-123',
          max_depth: 15,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toContain('max_depth must be between 1 and 10');
    });

    it('returns 400 when max_depth is less than 1', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/graph/traverse',
        payload: {
          project_id: 'proj-123',
          start_id: 'entity-123',
          max_depth: 0,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toContain('max_depth must be between 1 and 10');
    });

    it('returns 400 for min_confidence out of range', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/graph/traverse',
        payload: {
          project_id: 'proj-123',
          start_id: 'entity-123',
          max_depth: 2,
          min_confidence: 2.0,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toContain('min_confidence must be between 0 and 1');
    });

    it('returns 400 for invalid provenance array', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/graph/traverse',
        payload: {
          project_id: 'proj-123',
          start_id: 'entity-123',
          max_depth: 2,
          provenance: ['explicit', 'bad_category'],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toContain('Invalid provenance category');
    });
  });
});

