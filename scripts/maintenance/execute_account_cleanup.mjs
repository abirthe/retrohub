import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../../.env');
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

async function executeDatabaseUpdates() {
  process.stdout.write('Starting database cleanup and updates...\n');

  // 1. Load audit data
  const auditPath = path.resolve(__dirname, '../testing/complete_account_audit.json');
  if (!fs.existsSync(auditPath)) {
    process.stderr.write('Audit file not found!\n');
    process.exit(1);
  }

  const auditData = JSON.parse(fs.readFileSync(auditPath, 'utf8'));

  // 2. Identify non-game product IDs to delete
  const nonGameProducts = auditData.filter(p => !p.isGame);
  const deleteIds = nonGameProducts.map(p => p.id);

  process.stdout.write(`Found ${deleteIds.length} non-game products to delete.\n`);

  // Delete in batches of 50
  for (let i = 0; i < deleteIds.length; i += 50) {
    const batch = deleteIds.slice(i, i + 50);
    const { error: delError } = await supabase
      .from('products')
      .delete()
      .in('id', batch);

    if (delError) {
      process.stderr.write(`Error deleting batch ${i}: ${delError.message}\n`);
      process.exit(1);
    }
  }
  process.stdout.write(`Successfully deleted ${deleteIds.length} non-game products.\n`);

  // 3. Reclassify GTA Trilogy and Xbox Game Pass Ultimate
  const { error: gtaError } = await supabase
    .from('products')
    .update({ category: 'pc_game' })
    .eq('id', '7b2d627d-4250-45c8-83f4-4f14067d501d');

  if (gtaError) {
    process.stderr.write(`Error reclassifying GTA: ${gtaError.message}\n`);
  } else {
    process.stdout.write('Successfully reclassified GTA Trilogy to pc_game.\n');
  }

  const { error: passError } = await supabase
    .from('products')
    .update({ category: 'xbox_game' })
    .eq('id', '91d5bdb0-ea46-4256-9bb0-e8ea8b36b093');

  if (passError) {
    process.stderr.write(`Error reclassifying Xbox Game Pass: ${passError.message}\n`);
  } else {
    process.stdout.write('Successfully reclassified Xbox Game Pass Ultimate to xbox_game.\n');
  }

  // 4. Update specific region tags for regional accounts
  const regionUpdates = [
    { match: 'turkish account ps', region: 'TR' },
    { match: 'turkey region', region: 'TR' },
    { match: 'playstation turkey', region: 'TR' },
    { match: 'ukrainian psn', region: 'UA' },
    { match: 'ukraine account ps4/ps5', region: 'UA' },
    { match: 'indian psn', region: 'IN' },
    { match: 'new psn poland', region: 'PL' },
    { match: 'japanese psn', region: 'JP' },
    { match: 'new psn usa', region: 'US' },
    { match: 'xbox account with a us card', region: 'US' },
    { match: 'kazakhstan with balance', region: 'KZ' },
    { match: 'far cry 3 ru ubisoft connect', region: 'RU/CIS' }
  ];

  const { data: currentGames, error: fetchError } = await supabase
    .from('products')
    .select('id, title, region');

  if (fetchError) {
    process.stderr.write(`Error fetching current products: ${fetchError.message}\n`);
    return;
  }

  let updatedRegions = 0;
  for (const p of currentGames) {
    const t = p.title.toLowerCase();
    for (const rule of regionUpdates) {
      if (t.includes(rule.match) && p.region !== rule.region) {
        const { error: regError } = await supabase
          .from('products')
          .update({ region: rule.region })
          .eq('id', p.id);

        if (!regError) {
          updatedRegions++;
          process.stdout.write(`Updated region for "${p.title}" -> ${rule.region}\n`);
        }
        break;
      }
    }
  }

  process.stdout.write(`Successfully updated ${updatedRegions} region tags.\n`);
  process.stdout.write('Database operations completed successfully!\n');
}

executeDatabaseUpdates();
