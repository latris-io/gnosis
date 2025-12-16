#!/usr/bin/env npx tsx
// scripts/setup-project.ts
// Creates a default project for A1 extraction if it doesn't exist

import 'dotenv/config';
import { pool } from '../src/db/postgres.js';

async function main(): Promise<void> {
  const projectName = process.env.PROJECT_NAME || 'gnosis-default';
  
  try {
    // Check if project exists
    const existing = await pool.query(
      "SELECT id FROM projects WHERE name = $1",
      [projectName]
    );
    
    if (existing.rows.length > 0) {
      console.log(`Project '${projectName}' already exists: ${existing.rows[0].id}`);
      console.log(`\nUse this PROJECT_ID for extraction:`);
      console.log(`export PROJECT_ID=${existing.rows[0].id}`);
    } else {
      // Create project
      const result = await pool.query<{ id: string; name: string }>(
        "INSERT INTO projects (id, name) VALUES (gen_random_uuid(), $1) RETURNING id, name",
        [projectName]
      );
      console.log(`Created project '${projectName}': ${result.rows[0].id}`);
      console.log(`\nUse this PROJECT_ID for extraction:`);
      console.log(`export PROJECT_ID=${result.rows[0].id}`);
    }
    
    await pool.end();
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

main();
