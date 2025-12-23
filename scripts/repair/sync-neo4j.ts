// @ts-nocheck
// Sync entities and relationships to Neo4j via replace-by-project
import 'dotenv/config';
import { syncToNeo4j, replaceAllRelationshipsInNeo4j } from '../../src/ops/track-a.js';

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              NEO4J SYNC                                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const projectId = '6df2f456-440d-4958-b475-d9808775ff69';

  console.log('Syncing entities to Neo4j...');
  const entityResult = await syncToNeo4j(projectId);
  console.log(`  Synced: ${entityResult.synced}`);

  console.log('\nRebuilding relationships in Neo4j (replace-by-project)...');
  const relResult = await replaceAllRelationshipsInNeo4j(projectId);
  console.log(`  Deleted: ${(relResult as any).deleted ?? 'N/A'}`);
  console.log(`  Synced: ${relResult.synced}`);

  console.log('\n✓ Neo4j sync complete');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
