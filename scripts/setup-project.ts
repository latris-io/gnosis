#!/usr/bin/env npx tsx
// scripts/setup-project.ts
// Creates a default project for A1 extraction if it doesn't exist

import 'dotenv/config';
import { initProject, closeConnections } from '../src/ops/track-a.js';

async function main(): Promise<void> {
  const projectName = process.env.PROJECT_NAME || 'gnosis-default';
  
  try {
    // Use ops layer to resolve/create project
    const project = await initProject({ projectSlug: projectName });
    
    console.log(`Project '${project.slug}' ready: ${project.id}`);
    console.log(`\nUse this for extraction:`);
    console.log(`export PROJECT_SLUG=${project.slug}`);
    console.log(`# or`);
    console.log(`export PROJECT_ID=${project.id}`);
    
    await closeConnections();
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

main();


