// @ts-nocheck
import 'dotenv/config';
import neo4j from 'neo4j-driver';

async function main() {
  const driver = neo4j.driver(
    process.env.NEO4J_URL!,
    neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
  );

  const session = driver.session();
  try {
    // Count all nodes
    const allNodes = await session.run('MATCH (n) RETURN count(n) AS count');
    console.log('Total nodes in Neo4j:', allNodes.records[0].get('count').toNumber());
    
    // Count Entity nodes specifically
    const entityNodes = await session.run('MATCH (n:Entity) RETURN count(n) AS count');
    console.log('Entity nodes:', entityNodes.records[0].get('count').toNumber());
    
    // Count by entity_type property
    const byType = await session.run(`
      MATCH (n:Entity) 
      RETURN n.entity_type AS type, count(n) AS count 
      ORDER BY type
    `);
    console.log('\nBy entity_type:');
    for (const record of byType.records) {
      console.log(' ', record.get('type'), ':', record.get('count').toNumber());
    }
    
    // Count relationships
    const rels = await session.run('MATCH ()-[r]->() RETURN count(r) AS count');
    console.log('\nTotal relationships:', rels.records[0].get('count').toNumber());
    
    // Count by relationship type property
    const relsByType = await session.run(`
      MATCH ()-[r]->() 
      RETURN r.relationship_type AS type, count(r) AS count 
      ORDER BY type
    `);
    console.log('\nRelationships by type:');
    for (const record of relsByType.records) {
      console.log(' ', record.get('type'), ':', record.get('count').toNumber());
    }
    
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch(console.error);

