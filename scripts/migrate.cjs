const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const MIGRATIONS_DIR = path.join(__dirname, '../database/migrations');

async function runMigrations() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Pre-flight check: Ensure exec_sql RPC exists
  console.log('Pre-flight check: Verifying exec_sql RPC...');
  const { data: rpcCheck, error: rpcError } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });

  if (rpcError) {
    console.error('--------------------------------------------------');
    console.log('✓ Pre-flight check failed: exec_sql RPC is missing.');
    console.log('ACTION REQUIRED: Run this SQL in your Supabase SQL Editor:');
    console.log('CREATE OR REPLACE FUNCTION exec_sql(sql text)');
    console.log('RETURNS void LANGUAGE plpgsql SECURITY DEFINER');
    console.log('AS $$ BEGIN EXECUTE sql; END; $$;');
    console.log('--------------------------------------------------');
    process.exit(1);
  }

  // Ensure _migrations table exists
  console.log('Ensuring _migrations table exists...');
  await supabase.rpc('exec_sql', { sql: `
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ DEFAULT now()
    );
  `});

  // Get executed migrations
  const { data: executedMigrations, error: fetchError } = await supabase
    .from('_migrations')
    .select('name');

  if (fetchError) {
    console.error('Error fetching executed migrations:', fetchError);
    process.exit(1);
  }

  const executedNames = executedMigrations.map(m => m.name);

  // Get migration files
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql') && !f.endsWith('_rollback.sql'))
    .sort();

  for (const file of files) {
    if (executedNames.includes(file)) {
      console.log(`Skipping already executed migration: ${file}`);
      continue;
    }

    console.log(`Executing migration: ${file}...`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

    // Standard 14: No transaction commands in RPC SQL
    if (sql.includes('BEGIN') || sql.includes('COMMIT') || sql.includes('ROLLBACK')) {
      console.error(`Error: Migration ${file} contains transaction commands (BEGIN/COMMIT/ROLLBACK).`);
      console.error('PL/pgSQL RPC calls are atomic and do not support explicit transactions.');
      process.exit(1);
    }

    const { error: execError } = await supabase.rpc('exec_sql', { sql });

    if (execError) {
      console.error(`Error executing migration ${file}:`, execError);
      process.exit(1);
    }

    // Record migration
    const { error: recordError } = await supabase
      .from('_migrations')
      .insert({ name: file });

    if (recordError) {
      console.error(`Error recording migration ${file}:`, recordError);
      process.exit(1);
    }

    console.log(`✓ Migration ${file} executed successfully.`);
  }

  console.log('✓ All migrations complete.');
}

runMigrations();
