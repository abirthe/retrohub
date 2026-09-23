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

async function applyDescriptionFixes() {
  process.stdout.write('Applying description sanitization and fixes...\n');

  const updatesPath = path.resolve(__dirname, '../testing/planned_desc_updates.json');
  if (!fs.existsSync(updatesPath)) {
    process.stderr.write('Planned updates file not found!\n');
    return;
  }

  const updates = JSON.parse(fs.readFileSync(updatesPath, 'utf8'));
  process.stdout.write(`Found ${updates.length} products to update.\n`);

  let successCount = 0;
  for (const u of updates) {
    const { error } = await supabase
      .from('products')
      .update({ description: u.newDesc })
      .eq('id', u.id);

    if (error) {
      process.stderr.write(`Error updating ${u.title}: ${error.message}\n`);
    } else {
      successCount++;
    }
  }

  process.stdout.write(`Successfully updated descriptions for ${successCount} products!\n`);
}

applyDescriptionFixes();
