// test/markers/tdd-decision-ledger.test.ts
// @implements STORY-64.3
// Unit tests for TDD DECISION ledger behavior
// Verifies TDD_COHERENCE_OK decision is logged and no relationship/corpus signal

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractAndValidateMarkers } from '../../src/api/v1/markers.js';
import { MarkerProvider } from '../../src/extraction/providers/marker-provider.js';
import * as entityService from '../../src/services/entities/entity-service.js';
import * as relationshipService from '../../src/services/relationships/relationship-service.js';
import { shadowLedger } from '../../src/ledger/shadow-ledger.js';
import * as semanticCorpus from '../../src/ledger/semantic-corpus.js';
import type { RepoSnapshot } from '../../src/extraction/types.js';
import type { RawMarker } from '../../src/markers/types.js';

// Mock all dependencies
vi.mock('../../src/extraction/providers/marker-provider.js');
vi.mock('../../src/services/entities/entity-service.js');
vi.mock('../../src/services/relationships/relationship-service.js');
vi.mock('../../src/ledger/shadow-ledger.js', () => ({
  shadowLedger: {
    logDecision: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('../../src/ledger/semantic-corpus.js');

describe('TDD DECISION Ledger Behavior', () => {
  const projectId = 'test-project-id';
  const snapshot: RepoSnapshot = {
    id: 'test-snapshot',
    root_path: '/test/path',
    timestamp: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('VERIFY-TDD-DECISION: TDD_COHERENCE_OK ledger entry', () => {
    it('emits TDD_COHERENCE_OK decision, does NOT call upsert or corpus signal', async () => {
      // Mock: MarkerProvider returns a single @tdd marker
      const tddMarker: RawMarker = {
        type: 'tdd',
        target_id: 'TDD-A3-MARKER-EXTRACTION',
        source_entity_id: 'FILE-src/test.ts',
        source_file: 'src/test.ts',
        line_start: 1,
        line_end: 1,
        raw_text: '@tdd TDD-A3-MARKER-EXTRACTION',
      };
      
      vi.mocked(MarkerProvider.prototype.extract).mockResolvedValue([tddMarker]);

      // Mock: Entity service returns valid E06 entity
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

      // Spies
      const logDecisionSpy = vi.mocked(shadowLedger.logDecision);
      const upsertSpy = vi.mocked(relationshipService.upsert);
      const captureSignalSpy = vi.mocked(semanticCorpus.captureSemanticSignal);

      // Execute
      const result = await extractAndValidateMarkers(projectId, snapshot);

      // Assert: TDD_COHERENCE_OK decision was logged
      expect(logDecisionSpy).toHaveBeenCalledTimes(1);
      expect(logDecisionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          decision: 'TDD_COHERENCE_OK',
          marker_type: 'tdd',
          target_id: 'TDD-A3-MARKER-EXTRACTION',
          source_entity_id: 'FILE-src/test.ts',
          source_file: 'src/test.ts',
          line_start: 1,
          line_end: 1,
          project_id: projectId,
        })
      );

      // Assert: NO relationship upsert (TDD is coherence-only)
      expect(upsertSpy).not.toHaveBeenCalled();

      // Assert: NO semantic corpus signal (TDD_COHERENCE_OK is not an error)
      expect(captureSignalSpy).not.toHaveBeenCalled();

      // Assert: Result reflects validated TDD marker
      expect(result.validated).toHaveLength(1);
      expect(result.validated[0].type).toBe('tdd');
      expect(result.stats.tdd_ok_count).toBe(1);
      expect(result.stats.r18_created).toBe(0);
      expect(result.stats.r19_created).toBe(0);
    });
  });

  describe('Contrast: @implements creates relationship, not decision', () => {
    it('@implements with valid target calls upsert, not logDecision', async () => {
      // Mock: MarkerProvider returns a single @implements marker
      const implementsMarker: RawMarker = {
        type: 'implements',
        target_id: 'STORY-64.3',
        source_entity_id: 'FILE-src/test.ts',
        source_file: 'src/test.ts',
        line_start: 1,
        line_end: 1,
        raw_text: '@implements STORY-64.3',
      };
      
      vi.mocked(MarkerProvider.prototype.extract).mockResolvedValue([implementsMarker]);

      // Mock: Entity service returns valid Story entity
      vi.mocked(entityService.getByInstanceId).mockResolvedValue({
        id: 'story-uuid',
        entity_type: 'E02',
        instance_id: 'STORY-64.3',
        name: 'Marker Extraction',
        attributes: {},
        source_file: 'docs/BRD.md',
        line_start: 100,
        line_end: 150,
        content_hash: 'sha256:story',
        extracted_at: new Date(),
        project_id: projectId,
      } as any);

      // Mock: Upsert succeeds
      vi.mocked(relationshipService.upsert).mockResolvedValue({
        relationship: { id: 'rel-uuid' } as any,
        operation: 'CREATE',
      });

      const logDecisionSpy = vi.mocked(shadowLedger.logDecision);
      const upsertSpy = vi.mocked(relationshipService.upsert);

      // Execute
      const result = await extractAndValidateMarkers(projectId, snapshot);

      // Assert: Relationship was created
      expect(upsertSpy).toHaveBeenCalledTimes(1);
      expect(upsertSpy).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({
          relationship_type: 'R18',
          from_instance_id: 'FILE-src/test.ts',
          to_instance_id: 'STORY-64.3',
        })
      );

      // Assert: NO decision logged for @implements (only for @tdd)
      expect(logDecisionSpy).not.toHaveBeenCalled();

      // Assert: Stats reflect R18 creation
      expect(result.stats.r18_created).toBe(1);
      expect(result.stats.tdd_ok_count).toBe(0);
    });
  });
});

