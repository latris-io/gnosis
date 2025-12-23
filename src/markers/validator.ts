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

import * as entityService from '../services/entities/entity-service.js';
import type { RawMarker, ValidatedMarker, OrphanMarker, TDDMismatch, ValidationResult } from './types.js';

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
  constructor(private readonly projectId: string) {}

  /**
   * Validate markers against entity registry.
   * 
   * For @implements/@satisfies: check target Story/AC exists.
   * For @tdd: check target E06 TechnicalDesign entity exists AND is type E06.
   */
  async validateMarkers(markers: RawMarker[]): Promise<ValidationResult> {
    const validated: ValidatedMarker[] = [];
    const orphans: OrphanMarker[] = [];
    const tddMismatches: TDDMismatch[] = [];

    for (const marker of markers) {
      const entity = await entityService.getByInstanceId(this.projectId, marker.target_id);

      if (marker.type === 'tdd') {
        // TDD coherence requires E06 entity type, not just existence
        if (entity === null) {
          tddMismatches.push({
            ...marker,
            validated: false,
            validation_error: `TDD entity ${marker.target_id} not found`,
          });
        } else if (entity.entity_type !== 'E06') {
          tddMismatches.push({
            ...marker,
            validated: false,
            validation_error: `Expected E06 TechnicalDesign, found ${entity.entity_type}`,
          });
        } else {
          // TDD coherence OK - validated as E06
          validated.push({
            ...marker,
            validated: true,
          });
        }
      } else if (entity !== null) {
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

