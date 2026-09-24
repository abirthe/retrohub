import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^"|"$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  process.stdout.write('Setting delivery_type = instant_code for all products in database...\n');
  
  const { error } = await supabase
    .from('products')
    .update({ delivery_type: 'instant_code' })
    .neq('delivery_type', 'instant_code');

  if (error) {
    process.stdout.write(`Error: ${error.message}\n`);
    process.exit(1);
  }
  
  process.stdout.write('✔ Successfully updated all products to delivery_type = "instant_code"!\n');
}

main().catch(err => {
  process.stdout.write(`Error: ${err.message}\n`);
  process.exit(1);
});
