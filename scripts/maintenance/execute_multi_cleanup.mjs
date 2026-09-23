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

async function executeMultiCleanup() {
  process.stdout.write('Starting incomplete multi-variable products cleanup...\n');

  const listPath = path.resolve(__dirname, '../testing/clean_multi_delete_list.json');
  const data = JSON.parse(fs.readFileSync(listPath, 'utf8'));

  // 1. Deactivate ordered products
  const deactIds = data.toDeactivate.map(p => p.id);
  process.stdout.write(`Deactivating ${deactIds.length} ordered products...\n`);
  for (const id of deactIds) {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false, in_stock: 0 })
      .eq('id', id);

    if (error) {
      process.stderr.write(`Error deactivating ${id}: ${error.message}\n`);
    }
  }
  process.stdout.write(`Successfully deactivated ${deactIds.length} products with order history.\n`);

  // 2. Delete incomplete multi-variable products
  const deleteIds = data.toDelete.map(p => p.id);
  process.stdout.write(`Deleting ${deleteIds.length} incomplete multi-variable products...\n`);

  for (let i = 0; i < deleteIds.length; i += 50) {
    const batch = deleteIds.slice(i, i + 50);
    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', batch);

    if (error) {
      process.stderr.write(`Error deleting batch ${i}: ${error.message}\n`);
      process.exit(1);
    }
  }

  process.stdout.write(`Successfully deleted ${deleteIds.length} incomplete multi-variable products!\n`);
}

executeMultiCleanup();
