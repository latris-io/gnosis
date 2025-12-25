#!/usr/bin/env npx tsx
// scripts/check-test-entities.ts
// Check what E28/E29 entities exist and their names

import { rlsQuery } from '../test/utils/rls.js';
import 'dotenv/config';

async function main() {
  const projectId = process.env.PROJECT_ID;
  if (!projectId) throw new Error('PROJECT_ID required');

  // Check E28 TestSuites
  const e28 = await rlsQuery<{instance_id: string, name: string}>(
    projectId, 
    `SELECT instance_id, name FROM entities WHERE entity_type = 'E28' ORDER BY name LIMIT 30`
  );
  console.log('E28 TestSuites:');
  e28.forEach(e => console.log('  ', e.instance_id, '|', e.name));

  // Check E29 TestCases
  const e29 = await rlsQuery<{instance_id: string, name: string}>(
    projectId, 
    `SELECT instance_id, name FROM entities WHERE entity_type = 'E29' ORDER BY name LIMIT 30`
  );
  console.log('\nE29 TestCases:');
  e29.forEach(e => console.log('  ', e.instance_id, '|', e.name));

  // Check for STORY patterns
  const storyPatterns = e28.filter(e => /STORY-\d+\.\d+/i.test(e.name));
  console.log(`\nE28 with STORY-XX.YY pattern: ${storyPatterns.length}`);
  storyPatterns.forEach(e => console.log('  ', e.name));

  // Check for AC patterns
  const acPatterns = e29.filter(e => /AC-\d+\.\d+\.\d+/i.test(e.name));
  console.log(`\nE29 with AC-XX.YY.ZZ pattern: ${acPatterns.length}`);
  acPatterns.forEach(e => console.log('  ', e.name));

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

