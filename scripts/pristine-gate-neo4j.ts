/**
 * scripts/pristine-gate-neo4j.ts
 * Pristine Gate Neo4j verification
 * 
 * Direct DB access required for low-level verification queries.
 * @g-api-exception AUDIT_SCRIPT
 */
import { getSession, closeDriver } from '../src/db/neo4j.js';

const PROJECT_ID = '6df2f456-440d-4958-b475-d9808775ff69';

async function main() {
  const session = getSession();
  try {
    console.log('=== 5A) NODES BY TYPE ===');
    const nodesResult = await session.run(`
      MATCH (e:Entity {project_id: $projectId})
      RETURN e.entity_type AS entity_type, count(*) AS n
      ORDER BY entity_type
    `, { projectId: PROJECT_ID });
    nodesResult.records.forEach(r => {
      console.log(`  ${r.get('entity_type')}: ${r.get('n').toNumber()}`);
    });
    
    console.log('\n=== 5B) EDGES BY TYPE ===');
    const edgesResult = await session.run(`
      MATCH (:Entity {project_id: $projectId})-[r:RELATIONSHIP]->(:Entity {project_id: $projectId})
      RETURN r.relationship_type AS relationship_type, count(*) AS n
      ORDER BY relationship_type
    `, { projectId: PROJECT_ID });
    edgesResult.records.forEach(r => {
      console.log(`  ${r.get('relationship_type')}: ${r.get('n').toNumber()}`);
    });
    
    console.log('\n=== 5C) PARITY SUMMARY ===');
    const totalNodesResult = await session.run(`
      MATCH (e:Entity {project_id: $projectId})
      RETURN count(*) AS total
    `, { projectId: PROJECT_ID });
    const totalNodes = totalNodesResult.records[0]?.get('total')?.toNumber() ?? 0;
    
    const totalEdgesResult = await session.run(`
      MATCH (:Entity {project_id: $projectId})-[r:RELATIONSHIP]->(:Entity {project_id: $projectId})
      RETURN count(*) AS total
    `, { projectId: PROJECT_ID });
    const totalEdges = totalEdgesResult.records[0]?.get('total')?.toNumber() ?? 0;
    
    console.log(`Neo4j total nodes: ${totalNodes}`);
    console.log(`Neo4j total edges: ${totalEdges}`);
    console.log(`Expected (from Postgres): entities=4309, relationships=4303`);
    console.log(`Nodes parity: ${totalNodes === 4309 ? 'PASS' : 'FAIL'}`);
    console.log(`Edges parity: ${totalEdges === 4303 ? 'PASS' : 'FAIL'}`);
    
    // Check key relationship types
    console.log('\n=== KEY RELATIONSHIP PARITY ===');
    const keyTypes = ['R01', 'R02', 'R07', 'R18', 'R19', 'R36', 'R37'];
    for (const relType of keyTypes) {
      const result = await session.run(`
        MATCH (:Entity {project_id: $projectId})-[r:RELATIONSHIP {relationship_type: $relType}]->(:Entity {project_id: $projectId})
        RETURN count(*) AS n
      `, { projectId: PROJECT_ID, relType });
      const count = result.records[0]?.get('n')?.toNumber() ?? 0;
      console.log(`  ${relType}: ${count}`);
    }
    
  } finally {
    await session.close();
    await closeDriver();
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

