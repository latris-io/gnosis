// @implements INFRASTRUCTURE
// Neo4j constraint/index migration runner
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { getSession } from './neo4j.js';

const MIGRATIONS_DIR = join(process.cwd(), 'migrations', 'neo4j');

interface CypherMigration {
  name: string;
  statements: string[];
}

/**
 * Parse a Cypher file into individual statements.
 * Splits on semicolons, filters comments and empty lines.
 */
function parseCypherFile(content: string): string[] {
  return content
    .split(';')
    .map(segment => {
      // Remove comment lines from each segment
      const lines = segment.split('\n')
        .filter(line => !line.trim().startsWith('//'))
        .join('\n')
        .trim();
      return lines;
    })
    .filter(s => s.length > 0);
}

/**
 * Get list of pending Cypher migrations from filesystem.
 */
async function getPendingMigrations(): Promise<CypherMigration[]> {
  const files = await readdir(MIGRATIONS_DIR);
  const cypherFiles = files
    .filter(f => f.endsWith('.cypher'))
    .sort();
  
  const migrations: CypherMigration[] = [];
  for (const file of cypherFiles) {
    const content = await readFile(join(MIGRATIONS_DIR, file), 'utf-8');
    const statements = parseCypherFile(content);
    if (statements.length > 0) {
      migrations.push({ name: file, statements });
    }
  }
  
  return migrations;
}

/**
 * Apply a single Cypher migration.
 */
async function applyMigration(migration: CypherMigration): Promise<void> {
  const session = getSession();
  try {
    for (const statement of migration.statements) {
      await session.run(statement);
    }
    console.log(`✓ Applied: ${migration.name}`);
  } catch (error) {
    console.error(`✗ Failed: ${migration.name}`);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Run all Neo4j migrations.
 * Note: Neo4j constraints are idempotent (IF NOT EXISTS), so we run all files.
 */
export async function migrateNeo4j(): Promise<void> {
  console.log('Running Neo4j migrations...');
  
  const migrations = await getPendingMigrations();
  
  if (migrations.length === 0) {
    console.log('No Cypher migrations found.');
    return;
  }
  
  console.log(`Found ${migrations.length} migration file(s).`);
  
  for (const migration of migrations) {
    await applyMigration(migration);
  }
  
  console.log('Neo4j migrations complete.');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateNeo4j()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Neo4j migration failed:', error);
      process.exit(1);
    });
}
