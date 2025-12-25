#!/usr/bin/env npx tsx
// Cross-store verification: PostgreSQL vs Neo4j parity check
// Run: npx tsx scripts/verify-cross-store.ts

import 'dotenv/config';
import { rlsQuery } from '../test/utils/rls.js';
import neo4j from 'neo4j-driver';

const PROJECT_ID = process.env.PROJECT_ID || '6df2f456-440d-4958-b475-d9808775ff69';

async function main() {
  console.log('=== CROSS-STORE VERIFICATION ===\n');
  console.log('Project:', PROJECT_ID);
  console.log('');

  // PostgreSQL Entity Counts
  console.log('--- PostgreSQL Entities ---');
  const pgEntities = await rlsQuery<{ entity_type: string; count: string }>(PROJECT_ID, `
    SELECT entity_type, COUNT(*) as count 
    FROM entities 
    GROUP BY entity_type 
    ORDER BY entity_type
  `);
  
  let pgEntityTotal = 0;
  const pgEntityMap = new Map<string, number>();
  for (const row of pgEntities) {
    const count = parseInt(row.count);
    console.log(`  ${row.entity_type}: ${count}`);
    pgEntityTotal += count;
    pgEntityMap.set(row.entity_type, count);
  }
  console.log(`  TOTAL: ${pgEntityTotal}`);

  // PostgreSQL Relationship Counts
  console.log('\n--- PostgreSQL Relationships ---');
  const pgRels = await rlsQuery<{ relationship_type: string; count: string }>(PROJECT_ID, `
    SELECT relationship_type, COUNT(*) as count 
    FROM relationships 
    GROUP BY relationship_type 
    ORDER BY relationship_type
  `);
  
  let pgRelTotal = 0;
  const pgRelMap = new Map<string, number>();
  for (const row of pgRels) {
    const count = parseInt(row.count);
    console.log(`  ${row.relationship_type}: ${count}`);
    pgRelTotal += count;
    pgRelMap.set(row.relationship_type, count);
  }
  console.log(`  TOTAL: ${pgRelTotal}`);

  // Neo4j Entity Counts
  console.log('\n--- Neo4j Entities ---');
  const driver = neo4j.driver(
    process.env.NEO4J_URL!,
    neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
  );
  const session = driver.session();

  try {
    const neo4jEntities = await session.run(`
      MATCH (e:Entity {project_id: $projectId})
      RETURN e.entity_type as entity_type, count(e) as count
      ORDER BY e.entity_type
    `, { projectId: PROJECT_ID });
    
    let neo4jEntityTotal = 0;
    const neo4jEntityMap = new Map<string, number>();
    for (const record of neo4jEntities.records) {
      const type = record.get('entity_type');
      const count = record.get('count').toNumber();
      console.log(`  ${type}: ${count}`);
      neo4jEntityTotal += count;
      neo4jEntityMap.set(type, count);
    }
    console.log(`  TOTAL: ${neo4jEntityTotal}`);

    // Neo4j Relationship Counts
    console.log('\n--- Neo4j Relationships ---');
    const neo4jRels = await session.run(`
      MATCH ()-[r:RELATIONSHIP {project_id: $projectId}]->()
      RETURN r.relationship_type as relationship_type, count(r) as count
      ORDER BY r.relationship_type
    `, { projectId: PROJECT_ID });
    
    let neo4jRelTotal = 0;
    const neo4jRelMap = new Map<string, number>();
    for (const record of neo4jRels.records) {
      const type = record.get('relationship_type');
      const count = record.get('count').toNumber();
      console.log(`  ${type}: ${count}`);
      neo4jRelTotal += count;
      neo4jRelMap.set(type, count);
    }
    console.log(`  TOTAL: ${neo4jRelTotal}`);

    // Parity Check
    console.log('\n=== PARITY CHECK ===');
    const entityMatch = pgEntityTotal === neo4jEntityTotal;
    const relMatch = pgRelTotal === neo4jRelTotal;
    
    console.log(`Entities:      PostgreSQL=${pgEntityTotal}, Neo4j=${neo4jEntityTotal} ${entityMatch ? '✓ MATCH' : '✗ MISMATCH'}`);
    console.log(`Relationships: PostgreSQL=${pgRelTotal}, Neo4j=${neo4jRelTotal} ${relMatch ? '✓ MATCH' : '✗ MISMATCH'}`);

    // Per-type comparison
    if (!entityMatch) {
      console.log('\n--- Entity Mismatches ---');
      for (const [type, pgCount] of pgEntityMap) {
        const neo4jCount = neo4jEntityMap.get(type) || 0;
        if (pgCount !== neo4jCount) {
          console.log(`  ${type}: PG=${pgCount}, Neo4j=${neo4jCount}`);
        }
      }
    }

    if (!relMatch) {
      console.log('\n--- Relationship Mismatches ---');
      for (const [type, pgCount] of pgRelMap) {
        const neo4jCount = neo4jRelMap.get(type) || 0;
        if (pgCount !== neo4jCount) {
          console.log(`  ${type}: PG=${pgCount}, Neo4j=${neo4jCount}`);
        }
      }
    }

    // Final verdict
    console.log('\n=== VERDICT ===');
    if (entityMatch && relMatch) {
      console.log('✅ CROSS-STORE PARITY VERIFIED');
    } else {
      console.log('❌ CROSS-STORE PARITY FAILED');
      process.exit(1);
    }

  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

