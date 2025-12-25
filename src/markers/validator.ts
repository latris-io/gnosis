// src/markers/validator.ts
// @implements STORY-64.3
// @satisfies AC-64.3.6
// @satisfies AC-64.3.7
// @tdd TDD-A3-MARKER-EXTRACTION
//
// Marker validator - validates marker targets against entity registry.
// Per A3 plan: validation ONLY, returns structured results.
// NO persistence, NO signaling (that's the API layer's job).
//
// Layer rules:
// - MAY import from services (for entity lookup)
// - MUST NOT import from api
// - MUST NOT import from db
// - MUST NOT create relationships
// - MUST NOT signal to semantic corpus

import * as entityServiceModule from '../services/entities/entity-service.js';
import type { RawMarker, ValidatedMarker, OrphanMarker, TDDMismatch, ValidationResult } from './types.js';

/**
 * Minimal interface for entity lookup (for dependency injection in tests)
 */
export interface EntityLookupService {
  getByInstanceId(projectId: string, instanceId: string): Promise<{ entity_type: string; instance_id: string } | null>;
}

/**
 * MarkerValidator validates marker targets against the entity registry.
 * 
 * Per A3 architecture:
 * - Validates targets via entityService.getByInstanceId()
 * - For @tdd markers, validates entity.entity_type === 'E06'
 * - Returns structured ValidationResult
 * - NO persistence or signaling
 */
export class MarkerValidator {
  private entityService: EntityLookupService;

  constructor(
    private readonly projectId: string, 
    entityService?: EntityLookupService
  ) {
    // Use injected service for testing, or default to real service
    this.entityService = entityService || entityServiceModule;
  }

  /**
   * Validate markers against entity registry.
   * 
   * Validates BOTH source and target entities:
   * - Source entity (FILE-*, FUNC-*, CLASS-*) must exist for relationship creation
   * - For @implements/@satisfies: target Story/AC must exist
   * - For @tdd: target E06 TechnicalDesign entity must exist AND be type E06
   * 
   * Markers with missing source entities are treated as orphans (can't create relationship).
   */
  async validateMarkers(markers: RawMarker[]): Promise<ValidationResult> {
    const validated: ValidatedMarker[] = [];
    const orphans: OrphanMarker[] = [];
    const tddMismatches: TDDMismatch[] = [];

    for (const marker of markers) {
      // First check if source entity exists (required for relationship creation)
      const sourceEntity = await this.entityService.getByInstanceId(this.projectId, marker.source_entity_id);
      
      if (sourceEntity === null) {
        // Source entity doesn't exist - can't create relationship
        // This happens for markers in scripts/** (no E11 entities extracted)
        orphans.push({
          ...marker,
          validated: false,
          validation_error: `Source entity ${marker.source_entity_id} not found in entity registry`,
        });
        continue;
      }
      
      // Now check target entity
      const targetEntity = await this.entityService.getByInstanceId(this.projectId, marker.target_id);

      if (marker.type === 'tdd') {
        // TDD coherence requires E06 entity type, not just existence
        if (targetEntity === null) {
          tddMismatches.push({
            ...marker,
            validated: false,
            validation_error: `TDD entity ${marker.target_id} not found`,
          });
        } else if (targetEntity.entity_type !== 'E06') {
          tddMismatches.push({
            ...marker,
            validated: false,
            validation_error: `Expected E06 TechnicalDesign, found ${targetEntity.entity_type}`,
          });
        } else {
          // TDD coherence OK - validated as E06
          validated.push({
            ...marker,
            validated: true,
          });
        }
      } else if (targetEntity !== null) {
        // @implements/@satisfies - target exists
        validated.push({
          ...marker,
          validated: true,
        });
      } else {
        // @implements/@satisfies - target not found
        orphans.push({
          ...marker,
          validated: false,
          validation_error: `Target ${marker.target_id} not found in entity registry`,
        });
      }
    }

    return { validated, orphans, tddMismatches };
  }
}

