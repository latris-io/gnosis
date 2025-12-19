// src/services/projects/project-service.ts
// @implements STORY-64.1
// @tdd TDD-A1-ENTITY-REGISTRY
// Project identity resolution - allowed to import db

import { getClient } from '../../db/postgres.js';

export interface ProjectIdentity {
  id: string;
  slug: string;
}

// UUID v4 pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate that a string is a valid UUID.
 */
function isValidUUID(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/**
 * Resolve project identity from projectId (UUID) or projectSlug (string).
 * - If projectId is provided, validates it's a UUID and returns it.
 * - If projectSlug is provided, looks up the project by name or creates it.
 * 
 * @returns { id: string (UUID), slug: string }
 * @throws Error if neither provided, or if projectId is invalid UUID
 */
export async function resolveProjectId(opts: {
  projectId?: string;
  projectSlug?: string;
}): Promise<ProjectIdentity> {
  const { projectId, projectSlug } = opts;

  // projectId takes precedence
  if (projectId) {
    if (!isValidUUID(projectId)) {
      throw new Error(
        `PROJECT_ID must be a valid UUID, got: "${projectId}"\n` +
        `Hint: Use PROJECT_SLUG for human-friendly names (e.g., PROJECT_SLUG=gnosis-default)`
      );
    }
    // Return UUID directly; slug is unknown unless we query
    return { id: projectId, slug: projectId };
  }

  // projectSlug provided - lookup or create
  if (projectSlug) {
    const client = await getClient();
    try {
      // Try to find existing project by name
      const existing = await client.query<{ id: string; name: string }>(
        'SELECT id, name FROM projects WHERE name = $1',
        [projectSlug]
      );

      if (existing.rows.length > 0) {
        return { id: existing.rows[0].id, slug: existing.rows[0].name };
      }

      // Create new project
      const created = await client.query<{ id: string; name: string }>(
        'INSERT INTO projects (name) VALUES ($1) RETURNING id, name',
        [projectSlug]
      );

      return { id: created.rows[0].id, slug: created.rows[0].name };
    } finally {
      client.release();
    }
  }

  // Neither provided
  throw new Error(
    'Either PROJECT_ID (UUID) or PROJECT_SLUG (string) is required.\n' +
    'Usage:\n' +
    '  PROJECT_ID=<uuid> npm run extract:a1\n' +
    '  PROJECT_SLUG=gnosis-default npm run extract:a1'
  );
}
