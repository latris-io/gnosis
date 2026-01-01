// test/graph/api-validation.test.ts
// Unit tests for programmatic API validation (src/api/v1/*)

import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  getRelationshipsForEntity,
} from '../../src/api/v1/relationships.js';
import { traverse } from '../../src/api/v1/traversal.js';

describe('Programmatic API Validation', () => {
  describe('getRelationshipsForEntity validation', () => {
    it('throws ValidationError for missing project_id', async () => {
      await expect(
        getRelationshipsForEntity('', 'entity-123', {})
      ).rejects.toThrow(ValidationError);

      await expect(
        getRelationshipsForEntity('', 'entity-123', {})
      ).rejects.toThrow('project_id is required');
    });

    it('throws ValidationError for missing entity_id', async () => {
      await expect(
        getRelationshipsForEntity('project-123', '', {})
      ).rejects.toThrow(ValidationError);

      await expect(
        getRelationshipsForEntity('project-123', '', {})
      ).rejects.toThrow('entity_id is required');
    });

    it('throws ValidationError for invalid min_confidence (not a number)', async () => {
      await expect(
        getRelationshipsForEntity('project-123', 'entity-123', { minConfidence: 'abc' })
      ).rejects.toThrow(ValidationError);

      await expect(
        getRelationshipsForEntity('project-123', 'entity-123', { minConfidence: 'abc' })
      ).rejects.toThrow('min_confidence must be a valid number');
    });

    it('throws ValidationError for min_confidence < 0', async () => {
      await expect(
        getRelationshipsForEntity('project-123', 'entity-123', { minConfidence: '-0.5' })
      ).rejects.toThrow('min_confidence must be between 0 and 1');
    });

    it('throws ValidationError for min_confidence > 1', async () => {
      await expect(
        getRelationshipsForEntity('project-123', 'entity-123', { minConfidence: '1.5' })
      ).rejects.toThrow('min_confidence must be between 0 and 1');
    });

    it('throws ValidationError for invalid provenance category', async () => {
      await expect(
        getRelationshipsForEntity('project-123', 'entity-123', { provenance: 'invalid' })
      ).rejects.toThrow(ValidationError);

      await expect(
        getRelationshipsForEntity('project-123', 'entity-123', { provenance: 'invalid' })
      ).rejects.toThrow('Invalid provenance category: "invalid"');
    });

    it('throws ValidationError for partially invalid provenance CSV', async () => {
      await expect(
        getRelationshipsForEntity('project-123', 'entity-123', { provenance: 'explicit,bad' })
      ).rejects.toThrow('Invalid provenance category: "bad"');
    });
  });

  describe('traverse validation', () => {
    it('throws ValidationError for missing project_id', async () => {
      await expect(
        traverse({ project_id: '', start_id: 'entity-123', max_depth: 2 })
      ).rejects.toThrow('project_id is required');
    });

    it('throws ValidationError for missing start_id', async () => {
      await expect(
        traverse({ project_id: 'project-123', start_id: '', max_depth: 2 })
      ).rejects.toThrow('start_id is required');
    });

    it('throws ValidationError for max_depth < 1', async () => {
      await expect(
        traverse({ project_id: 'project-123', start_id: 'entity-123', max_depth: 0 })
      ).rejects.toThrow('max_depth must be between 1 and 10');
    });

    it('throws ValidationError for max_depth > 10 (SAFETY CONSTRAINT)', async () => {
      await expect(
        traverse({ project_id: 'project-123', start_id: 'entity-123', max_depth: 11 })
      ).rejects.toThrow('max_depth must be between 1 and 10');
    });

    it('throws ValidationError for non-integer max_depth', async () => {
      await expect(
        traverse({ project_id: 'project-123', start_id: 'entity-123', max_depth: 2.5 })
      ).rejects.toThrow('max_depth must be an integer');
    });

    it('throws ValidationError for min_confidence outside [0,1]', async () => {
      await expect(
        traverse({
          project_id: 'project-123',
          start_id: 'entity-123',
          max_depth: 2,
          min_confidence: -0.1,
        })
      ).rejects.toThrow('min_confidence must be between 0 and 1');

      await expect(
        traverse({
          project_id: 'project-123',
          start_id: 'entity-123',
          max_depth: 2,
          min_confidence: 1.1,
        })
      ).rejects.toThrow('min_confidence must be between 0 and 1');
    });

    it('throws ValidationError for invalid provenance array values', async () => {
      await expect(
        traverse({
          project_id: 'project-123',
          start_id: 'entity-123',
          max_depth: 2,
          provenance: ['explicit', 'invalid'],
        })
      ).rejects.toThrow('Invalid provenance category: "invalid"');
    });
  });
});

