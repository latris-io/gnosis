// @implements INFRASTRUCTURE
// Infrastructure verification script (NOT SANITY tests)
// Checks: Node version, TypeScript, DB connections, env vars, canonical docs
import 'dotenv/config';
import { existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, fn: () => boolean | Promise<boolean>, successMsg: string, failMsg: string): Promise<void> {
  return Promise.resolve(fn())
    .then(passed => {
      results.push({ name, passed, message: passed ? successMsg : failMsg });
    })
    .catch(error => {
      results.push({ name, passed: false, message: `${failMsg}: ${error.message}` });
    });
}

async function main() {
  console.log('Verifying infrastructure...\n');

  // 1. Node version >= 20
  await check(
    'Node.js version',
    () => {
      const version = process.version;
      const major = parseInt(version.slice(1).split('.')[0], 10);
      return major >= 20;
    },
    `Node.js ${process.version} (>= 20 required)`,
    `Node.js ${process.version} is below minimum (>= 20 required)`
  );

  // 2. TypeScript compilation
  await check(
    'TypeScript compilation',
    () => {
      try {
        execSync('npx tsc --noEmit', { cwd: ROOT, stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
    'TypeScript compiles without errors',
    'TypeScript compilation failed'
  );

  // 3. Environment variables
  await check(
    'Environment variables',
    () => {
      const required = ['DATABASE_URL', 'NEO4J_URL', 'NEO4J_USER', 'NEO4J_PASSWORD'];
      const missing = required.filter(v => !process.env[v]);
      return missing.length === 0;
    },
    'All required env vars present',
    'Missing required env vars (check .env file)'
  );

  // 4. PostgreSQL connection
  await check(
    'PostgreSQL connection',
    async () => {
      // Dynamic import for ts-node compatibility
      const pg = await import('pg');
      const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        await pool.end();
        return true;
      } catch {
        await pool.end();
        return false;
      }
    },
    'PostgreSQL connection successful',
    'PostgreSQL connection failed'
  );

  // 5. Neo4j connection
  await check(
    'Neo4j connection',
    async () => {
      // Dynamic import for ts-node compatibility
      const neo4j = await import('neo4j-driver');
      const driver = neo4j.default.driver(
        process.env.NEO4J_URL!,
        neo4j.default.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
      );
      try {
        const session = driver.session();
        await session.run('RETURN 1');
        await session.close();
        await driver.close();
        return true;
      } catch {
        await driver.close();
        return false;
      }
    },
    'Neo4j connection successful',
    'Neo4j connection failed'
  );

  // 6. Canonical documents present
  const canonicalDocs = [
    'docs/BRD_V20_6_3_COMPLETE.md',
    'docs/UNIFIED_TRACEABILITY_GRAPH_SCHEMA_V20_6_1.md',
    'docs/UNIFIED_VERIFICATION_SPECIFICATION_V20_6_5.md',
    'docs/GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md',
    'docs/CURSOR_IMPLEMENTATION_PLAN_V20_8_5.md',
  ];
  
  await check(
    'Canonical documents',
    () => canonicalDocs.every(doc => existsSync(join(ROOT, doc))),
    'All canonical documents present',
    'Missing canonical documents'
  );

  // 7. Phase 0A artifacts
  const phase0Artifacts = [
    'shadow-ledger/ledger.jsonl',
    'semantic-corpus/signals.jsonl',
    '.current-track',
  ];
  
  await check(
    'Phase 0A artifacts',
    () => phase0Artifacts.every(f => existsSync(join(ROOT, f))),
    'All Phase 0A artifacts present',
    'Missing Phase 0A artifacts'
  );

  // Print results
  console.log('\nResults:');
  console.log('─'.repeat(60));
  
  let allPassed = true;
  for (const result of results) {
    const icon = result.passed ? '✓' : '✗';
    console.log(`${icon} ${result.name}: ${result.message}`);
    if (!result.passed) allPassed = false;
  }
  
  console.log('─'.repeat(60));
  
  if (allPassed) {
    console.log('\n✓ All infrastructure checks passed.\n');
    process.exit(0);
  } else {
    console.log('\n✗ Some infrastructure checks failed.\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Infrastructure verification failed:', error);
  process.exit(1);
});
