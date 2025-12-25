// test/markers/tdd-coherence.test.ts
// @implements STORY-64.3
// Unit tests for TDD coherence validation (MarkerValidator)
// Tests VERIFY-TDD-02 and VERIFY-TDD-03 per A3 plan

import { describe, it, expect, beforeEach } from 'vitest';
import { MarkerValidator, type EntityLookupService } from '../../src/markers/validator.js';
import type { RawMarker } from '../../src/markers/types.js';

/**
 * Mock entity service for testing.
 * Uses dependency injection instead of vi.mock() to avoid ES module mocking issues.
 */
class MockEntityService implements EntityLookupService {
  private entities: Map<string, { entity_type: string; instance_id: string }> = new Map();

  addEntity(instanceId: string, entityType: string): void {
    this.entities.set(instanceId, { entity_type: entityType, instance_id: instanceId });
  }

  clear(): void {
    this.entities.clear();
  }

  async getByInstanceId(_projectId: string, instanceId: string): Promise<{ entity_type: string; instance_id: string } | null> {
    return this.entities.get(instanceId) || null;
  }
}

describe('MarkerValidator TDD Coherence', () => {
  const projectId = '00000000-0000-0000-0000-000000000001';
  let validator: MarkerValidator;
  let mockService: MockEntityService;

  const createTddMarker = (targetId: string): RawMarker => ({
    type: 'tdd',
    target_id: targetId,
    source_entity_id: 'FILE-test/file.ts',
    source_file: 'test/file.ts',
    line_start: 1,
    line_end: 1,
    raw_text: `@tdd ${targetId}`,
  });

  beforeEach(() => {
    mockService = new MockEntityService();
    validator = new MarkerValidator(projectId, mockService);
    // Always add the source entity (E11 SourceFile)
    mockService.addEntity('FILE-test/file.ts', 'E11');
  });

  // VERIFY-TDD-02: Entity exists but wrong type → TDD_COHERENCE_MISMATCH
  describe('VERIFY-TDD-02: TDD_COHERENCE_MISMATCH when entity is wrong type', () => {
    it('produces TDD_COHERENCE_MISMATCH when entity exists but is E02 (Story)', async () => {
      mockService.addEntity('TDD-WRONG-TYPE', 'E02');

      const marker = createTddMarker('TDD-WRONG-TYPE');
      const result = await validator.validateMarkers([marker]);

      expect(result.validated).toHaveLength(0);
      expect(result.orphans).toHaveLength(0);
      expect(result.tddMismatches).toHaveLength(1);
      expect(result.tddMismatches[0].validation_error).toContain('Expected E06');
      expect(result.tddMismatches[0].validation_error).toContain('found E02');
    });

    it('produces TDD_COHERENCE_MISMATCH when entity exists but is E01 (Epic)', async () => {
      mockService.addEntity('TDD-EPIC-TYPE', 'E01');

      const marker = createTddMarker('TDD-EPIC-TYPE');
      const result = await validator.validateMarkers([marker]);

      expect(result.tddMismatches).toHaveLength(1);
      expect(result.tddMismatches[0].validation_error).toContain('Expected E06');
      expect(result.tddMismatches[0].validation_error).toContain('found E01');
    });
  });

  // VERIFY-TDD-03: Entity exists and is E06 → validated (TDD_COHERENCE_OK)
  describe('VERIFY-TDD-03: TDD_COHERENCE_OK when entity is E06', () => {
    it('validates @tdd marker when target entity is E06 TechnicalDesign', async () => {
      mockService.addEntity('TDD-A3-MARKER-EXTRACTION', 'E06');

      const marker = createTddMarker('TDD-A3-MARKER-EXTRACTION');
      const result = await validator.validateMarkers([marker]);

      expect(result.validated).toHaveLength(1);
      expect(result.validated[0].validated).toBe(true);
      expect(result.validated[0].target_id).toBe('TDD-A3-MARKER-EXTRACTION');
      expect(result.orphans).toHaveLength(0);
      expect(result.tddMismatches).toHaveLength(0);
    });
  });

  // VERIFY-TDD-ORPHAN: TDD entity not found → TDD_COHERENCE_MISMATCH (not orphan)
  describe('TDD entity not found', () => {
    it('produces TDD_COHERENCE_MISMATCH when TDD entity does not exist', async () => {
      // Target TDD-NONEXISTENT not in mock registry

      const marker = createTddMarker('TDD-NONEXISTENT');
      const result = await validator.validateMarkers([marker]);

      expect(result.validated).toHaveLength(0);
      expect(result.orphans).toHaveLength(0); // NOT orphan - TDD has its own category
      expect(result.tddMismatches).toHaveLength(1);
      expect(result.tddMismatches[0].validation_error).toContain('not found');
    });
  });

  // Contrast: @implements orphan goes to orphans array, not tddMismatches
  describe('Non-TDD markers use orphans array', () => {
    it('@implements marker with missing target goes to orphans, not tddMismatches', async () => {
      // Target STORY-999.999 not in mock registry

      const marker: RawMarker = {
        type: 'implements',
        target_id: 'STORY-999.999',
        source_entity_id: 'FILE-test/file.ts',
        source_file: 'test/file.ts',
        line_start: 1,
        line_end: 1,
        raw_text: '@implements STORY-999.999',
      };

      const result = await validator.validateMarkers([marker]);

      expect(result.orphans).toHaveLength(1);
      expect(result.tddMismatches).toHaveLength(0);
      expect(result.orphans[0].validation_error).toContain('not found');
    });
  });

  // Source entity validation
  describe('Source entity validation', () => {
    it('orphans marker when source entity does not exist', async () => {
      mockService.clear(); // Remove source entity
      mockService.addEntity('STORY-1.1', 'E02'); // Add target but not source

      const marker: RawMarker = {
        type: 'implements',
        target_id: 'STORY-1.1',
        source_entity_id: 'FILE-nonexistent.ts',
        source_file: 'nonexistent.ts',
        line_start: 1,
        line_end: 1,
        raw_text: '@implements STORY-1.1',
      };

      const result = await validator.validateMarkers([marker]);

      expect(result.orphans).toHaveLength(1);
      expect(result.orphans[0].validation_error).toContain('Source entity');
      expect(result.orphans[0].validation_error).toContain('not found');
    });
  });
});
