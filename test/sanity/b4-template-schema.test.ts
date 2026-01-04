/**
 * B.4 Operator Evidence Template Schema Test
 * 
 * Ensures the operator evidence template contains required fields.
 * Protects against accidental template drift.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const TEMPLATE_PATH = path.join(
  process.cwd(),
  'docs/verification/track_b/templates/B4_OPERATOR_EVIDENCE_TEMPLATE.md'
);

describe('B.4 Operator Evidence Template Schema', () => {
  let templateContent: string;

  beforeAll(() => {
    if (!fs.existsSync(TEMPLATE_PATH)) {
      throw new Error(`Template not found: ${TEMPLATE_PATH}`);
    }
    templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  });

  it('contains PROJECT_ID field', () => {
    expect(templateContent).toMatch(/PROJECT_ID/);
  });

  it('contains GIT_SHA field', () => {
    expect(templateContent).toMatch(/GIT_SHA/);
  });

  it('contains GRAPH_API_V2_URL field', () => {
    expect(templateContent).toMatch(/GRAPH_API_V2_URL/);
  });

  it('contains WORKING_TREE_CLEAN field', () => {
    expect(templateContent).toMatch(/WORKING_TREE_CLEAN/);
  });

  it('contains Pre-B4 preflight checkbox', () => {
    expect(templateContent).toMatch(/Pre-B4 preflight passed/);
  });

  it('contains V2 server healthy checkbox', () => {
    expect(templateContent).toMatch(/V2 server healthy/);
  });

  it('contains operator attestation section', () => {
    expect(templateContent).toMatch(/Operator Attestation/);
  });

  it('contains compliance statement', () => {
    expect(templateContent).toMatch(/Compliance Statement/);
  });
});

