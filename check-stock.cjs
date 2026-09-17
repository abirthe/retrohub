const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  const key = t.slice(0, eq).trim();
  const val = t.slice(eq + 1).trim().replace(/^\"|\"$/g, '');
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: all, count: allCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: outOfStock } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('in_stock', 0);
  
  console.log('Total products:', allCount);
  console.log('Out of stock:', outOfStock);
}
run();
