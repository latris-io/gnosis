// test/markers/tdd-coherence.test.ts
// @implements STORY-64.3
// Unit tests for TDD coherence validation (MarkerValidator)
// Tests VERIFY-TDD-02 and VERIFY-TDD-03 per A3 plan

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MarkerValidator } from '../../src/markers/validator.js';
import * as entityService from '../../src/services/entities/entity-service.js';
import type { RawMarker } from '../../src/markers/types.js';

// Mock the entity service
vi.mock('../../src/services/entities/entity-service.js', () => ({
  getByInstanceId: vi.fn(),
}));

describe('MarkerValidator TDD Coherence', () => {
  const projectId = 'test-project-id';
  let validator: MarkerValidator;

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
    validator = new MarkerValidator(projectId);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // VERIFY-TDD-02: Entity exists but wrong type → TDD_COHERENCE_MISMATCH
  describe('VERIFY-TDD-02: TDD_COHERENCE_MISMATCH when entity is wrong type', () => {
    it('produces TDD_COHERENCE_MISMATCH when entity exists but is E02 (Story)', async () => {
      // Mock: entity exists but is E02, not E06
      vi.mocked(entityService.getByInstanceId).mockResolvedValue({
        id: 'test-uuid',
        entity_type: 'E02',
        instance_id: 'TDD-WRONG-TYPE',
        name: 'Test Story',
        attributes: {},
        source_file: 'test.md',
        line_start: 1,
        line_end: 10,
        content_hash: 'sha256:test',
        extracted_at: new Date(),
        project_id: projectId,
      } as any);

      const marker = createTddMarker('TDD-WRONG-TYPE');
      const result = await validator.validateMarkers([marker]);

      expect(result.validated).toHaveLength(0);
      expect(result.orphans).toHaveLength(0);
      expect(result.tddMismatches).toHaveLength(1);
      expect(result.tddMismatches[0].validation_error).toContain('Expected E06');
      expect(result.tddMismatches[0].validation_error).toContain('found E02');
    });

    it('produces TDD_COHERENCE_MISMATCH when entity exists but is E01 (Epic)', async () => {
      vi.mocked(entityService.getByInstanceId).mockResolvedValue({
        id: 'test-uuid',
        entity_type: 'E01',
        instance_id: 'TDD-EPIC-TYPE',
        name: 'Test Epic',
        attributes: {},
        source_file: 'test.md',
        line_start: 1,
        line_end: 10,
        content_hash: 'sha256:test',
        extracted_at: new Date(),
        project_id: projectId,
      } as any);

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
      // Mock: entity exists and is correct type E06
      vi.mocked(entityService.getByInstanceId).mockResolvedValue({
        id: 'test-uuid',
        entity_type: 'E06',
        instance_id: 'TDD-A3-MARKER-EXTRACTION',
        name: 'TDD A3 Marker Extraction',
        attributes: {},
        source_file: 'spec/track_a/stories/A3_MARKER_EXTRACTION.md',
        line_start: 1,
        line_end: 50,
        content_hash: 'sha256:test',
        extracted_at: new Date(),
        project_id: projectId,
      } as any);

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
      // Mock: entity does not exist
      vi.mocked(entityService.getByInstanceId).mockResolvedValue(null);

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
      vi.mocked(entityService.getByInstanceId).mockResolvedValue(null);

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
});

