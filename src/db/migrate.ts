// @implements INFRASTRUCTURE
// PostgreSQL migration runner
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { pool } from './postgres.js';

const MIGRATIONS_DIR = join(process.cwd(), 'migrations');

interface Migration {
  name: string;
  sql: string;
}

/**
 * Get list of applied migrations from database.
 */
async function getAppliedMigrations(): Promise<Set<string>> {
  const client = await pool.connect();
  try {
    // Check if migrations table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'migrations'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return new Set();
    }
    
    const result = await client.query('SELECT name FROM migrations ORDER BY id');
    return new Set(result.rows.map(row => row.name));
  } finally {
    client.release();
  }
}

/**
 * Get list of pending migrations from filesystem.
 */
async function getPendingMigrations(applied: Set<string>): Promise<Migration[]> {
  const files = await readdir(MIGRATIONS_DIR);
  const sqlFiles = files
    .filter(f => f.endsWith('.sql'))
    .filter(f => !applied.has(f))
    .sort();
  
  const migrations: Migration[] = [];
  for (const file of sqlFiles) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf-8');
    migrations.push({ name: file, sql });
  }
  
  return migrations;
}

/**
 * Apply a single migration within a transaction.
 */
async function applyMigration(migration: Migration): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(migration.sql);
    await client.query(
      'INSERT INTO migrations (name) VALUES ($1)',
      [migration.name]
    );
    await client.query('COMMIT');
    console.log(`✓ Applied: ${migration.name}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`✗ Failed: ${migration.name}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run all pending migrations.
 */
export async function migrate(): Promise<void> {
  console.log('Running PostgreSQL migrations...');
  
  const applied = await getAppliedMigrations();
  const pending = await getPendingMigrations(applied);
  
  if (pending.length === 0) {
    console.log('No pending migrations.');
    return;
  }
  
  console.log(`Found ${pending.length} pending migration(s).`);
  
  for (const migration of pending) {
    await applyMigration(migration);
  }
  
  console.log('Migrations complete.');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

