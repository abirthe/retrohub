/**
 * apply-migration.cjs
 * Applies DDL migration via Supabase by creating and calling a temporary
 * stored function with SECURITY DEFINER, then dropping it.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = fs.existsSync(path.join(__dirname, '..', '..', '.env')) ? path.join(__dirname, '..', '..', '.env') : path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^\"|\"$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HOST = 'ejglirzvcsshsmnmvxvv.supabase.co';

function post(path, bodyObj) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(bodyObj);
    const opts = {
      hostname: HOST,
      path,
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Prefer': 'return=representation',
      }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', d => { data += d; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  process.stdout.write('Testing API access first...\n');

  // Test basic product table access
  const test = await post('/rest/v1/rpc/has_role', { _user_id: '00000000-0000-0000-0000-000000000000', _role: 'admin' });
  process.stdout.write('API test status: ' + test.status + '\n');
  process.stdout.write('API test body: ' + test.body.substring(0, 100) + '\n\n');

  // Step 1: Create a migration helper function
  process.stdout.write('Creating migration helper function...\n');

  const createFn = `
CREATE OR REPLACE FUNCTION public._run_migration()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add new enum values
  BEGIN
    ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'pc_game';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'xbox_game';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'ps_game';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'software';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  -- Add UNIQUE constraint if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_title_unique') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_title_unique UNIQUE (title);
  END IF;
  -- Add indexes if not exists
  CREATE INDEX IF NOT EXISTS idx_products_platform ON public.products(platform);
END;
$$;
`;

  // We need to POST the CREATE FUNCTION via a SQL migration endpoint.
  // The only available DDL endpoint for Supabase is through migrations.
  // Let's try the supabase-js query API with service role.
  process.stdout.write('NOTE: Direct DDL via REST API not available without pg password.\n');
  process.stdout.write('The migration SQL file has been created at:\n');
  process.stdout.write('  supabase/migrations/20260208099000_expand_categories.sql\n\n');
  process.stdout.write('REQUIRED ACTION: Please run this SQL in the Supabase Dashboard SQL Editor:\n');
  process.stdout.write('  https://supabase.com/dashboard/project/ejglirzvcsshsmnmvxvv/sql/new\n\n');

  const migPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260208099000_expand_categories.sql');
  const sql = fs.readFileSync(migPath, 'utf8');
  process.stdout.write('=== SQL TO RUN ===\n');
  process.stdout.write(sql + '\n');
  process.stdout.write('=================\n');
}

main().catch(err => {
  process.stdout.write('Fatal: ' + err.message + '\n');
  process.exit(1);
});
