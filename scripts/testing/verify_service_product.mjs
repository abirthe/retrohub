import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = {};
const lines = fs.readFileSync('.env', 'utf8').split('\n');
for (const line of lines) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^"|"$/g, '');
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);

async function testFetch() {
  // Query exactly like shopApi.ts does for activeCategory = 'service'
  const { data, count, error } = await supabase
    .from('v_grouped_products')
    .select('*', { count: 'exact' })
    .or('category.eq.service,category.eq.software');

  if (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    return;
  }

  process.stdout.write(`Found ${count} products in service/software.\n`);
  const googleProduct = data.find(p => p.title.includes('Google AI Pro'));
  if (googleProduct) {
    process.stdout.write(`Google AI Pro found in view:\n${JSON.stringify(googleProduct, null, 2)}\n`);
  } else {
    process.stdout.write('Warning: Google AI Pro not in v_grouped_products. Checking products table directly...\n');
    const { data: directData } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'service');
    process.stdout.write(`Direct products count: ${directData?.length}\n`);
  }
}

testFetch();
