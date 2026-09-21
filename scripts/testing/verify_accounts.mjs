import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '..', '.env');
const env = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^"|"$/g, '');
  }
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  const { data: allAccounts, error } = await supabase
    .from('products')
    .select('id, title, category, sale_price, cost_price, platform')
    .ilike('title', '%account%');

  if (error) {
    process.stderr.write(error.message + '\n');
    process.exit(1);
  }

  const games = allAccounts.filter(p => ['pc_game', 'xbox_game', 'ps_game'].includes(p.category));
  const apps = allAccounts.filter(p => p.category === 'software');
  const others = allAccounts.filter(p => !['pc_game', 'xbox_game', 'ps_game', 'software'].includes(p.category));

  process.stdout.write(`Total Account Products: ${allAccounts.length}\n`);
  process.stdout.write(`- Games Accounts (accounts_games): ${games.length}\n`);
  process.stdout.write(`- App Accounts (accounts_app): ${apps.length}\n`);
  process.stdout.write(`- Other Accounts (accounts_others): ${others.length}\n`);
}

verify();
