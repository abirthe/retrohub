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
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanOrphans() {
  const orphans = [
    'Windows Activation Key',
    'Grammarly',
    'Telegram Premium',
    'QuillBot',
    'Fortnite V-Bucks (PC)',
    'Adobe Creative Cloud',
    'Hoichoi Subscription | 12 Month | 2 Screen | 4 Devices',
    'Netflix Gift Card (USD) | $25',
    'Netflix Gift Card (USD) | $50',
    'Netflix Gift Card (USD) | $30',
    'Discord Nitro Gift / digital key / code 1-12 Month / GLOBAL',
    'Bongo EPL Monthly Pass',
    'ExitLag – 1 Month Subscription',
    'Subscription PURE Pure - Without Shame FAST'
  ];

  const { data: prods } = await supabase.from('products').select('id, title').in('title', orphans);
  const pids = prods.map(p => p.id);

  const { data: orders } = await supabase.from('orders').select('product_id').in('product_id', pids);
  const orderedIds = new Set((orders || []).map(o => o.product_id));

  process.stdout.write(`Found ${prods.length} orphan products.\n`);
  for (const p of prods) {
    if (orderedIds.has(p.id)) {
      process.stdout.write(`- Has orders: "${p.title}" -> Deactivating\n`);
      await supabase.from('products').update({ is_active: false, in_stock: 0 }).eq('id', p.id);
    } else {
      process.stdout.write(`- Deleting: "${p.title}"\n`);
      await supabase.from('products').delete().eq('id', p.id);
    }
  }
}

cleanOrphans();
