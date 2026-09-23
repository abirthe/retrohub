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

async function checkRegionalAccounts() {
  const { data: accounts } = await supabase.from('products').select('id, title, region').ilike('title', '%account%');

  const updates = [];
  for (const p of accounts) {
    const t = p.title.toLowerCase();
    let target = null;
    if (t.includes('ukraine') || t.includes('ukrainian')) target = 'UA';
    else if (t.includes('poland')) target = 'PL';
    else if (t.includes('turkey') || t.includes('turkish') || t.includes('t rkiye')) target = 'TR';
    else if (t.includes('kazakhstan with balance')) target = 'KZ';
    else if (t.includes('japan')) target = 'JP';
    else if (t.includes('india') || t.includes('indian')) target = 'IN';

    if (target && p.region !== target) {
      updates.push({ id: p.id, title: p.title, current: p.region, target });
    }
  }

  process.stdout.write(`Found ${updates.length} accounts to update:\n`);
  for (const u of updates) {
    process.stdout.write(`- "${u.title}" (${u.current} -> ${u.target})\n`);
    await supabase.from('products').update({ region: u.target }).eq('id', u.id);
  }
  process.stdout.write('All regional account tags updated!\n');
}

checkRegionalAccounts();
