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
const isDryRun = !process.argv.includes('--execute');

async function sanitizeImageUrls() {
  process.stdout.write(`=== Image URL Sanitizer ===\n`);
  process.stdout.write(`Mode: ${isDryRun ? 'DRY-RUN (no changes written)' : 'LIVE EXECUTE'}\n\n`);

  const { data: matches, error } = await supabase
    .from('products')
    .select('id, title, image_url')
    .or('image_url.ilike.%ovrok%,image_url.ilike.%arektacoin%');

  if (error) {
    process.stderr.write(`Error fetching products: ${error.message}\n`);
    process.exit(1);
  }

  process.stdout.write(`Found ${matches?.length ?? 0} products with vendor-specific image URLs.\n\n`);

  if (!matches || matches.length === 0) {
    process.stdout.write('Nothing to sanitize.\n');
    return;
  }

  for (const product of matches) {
    process.stdout.write(`  [${product.id}] ${product.title}\n    -> ${product.image_url}\n`);
  }

  if (isDryRun) {
    process.stdout.write(`\n[DRY-RUN] No changes written. Re-run with --execute to apply.\n`);
    return;
  }

  const ids = matches.map(p => p.id);
  const BATCH = 100;
  let updated = 0;

  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: null })
      .in('id', batch);

    if (updateError) {
      process.stderr.write(`Error updating batch: ${updateError.message}\n`);
      process.exit(1);
    }
    updated += batch.length;
    process.stdout.write(`Updated ${updated}/${ids.length}...\r`);
  }

  process.stdout.write(`\nSuccessfully cleared ${updated} vendor-specific image URLs.\n`);
}

sanitizeImageUrls().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
