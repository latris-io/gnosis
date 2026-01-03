// @implements INFRASTRUCTURE
// Environment variable validation and configuration
import 'dotenv/config';

/**
 * Required environment variables for Gnosis system.
 * Throws if any required variable is missing.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

export const config = {
  // PostgreSQL (Render)
  databaseUrl: requireEnv('DATABASE_URL'),
  
  // Neo4j (Aura)
  neo4jUrl: requireEnv('NEO4J_URL'),
  neo4jUser: requireEnv('NEO4J_USER'),
  neo4jPassword: requireEnv('NEO4J_PASSWORD'),
  
  // Environment
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  
  // Derived
  isDevelopment: optionalEnv('NODE_ENV', 'development') === 'development',
  isProduction: optionalEnv('NODE_ENV', 'development') === 'production',
} as const;

export type Config = typeof config;


