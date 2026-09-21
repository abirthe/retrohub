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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  process.stdout.write('ERROR: Missing Supabase URL or Service Role Key in .env\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const isExecute = process.argv.includes('--execute');

function cleanCoreName(title) {
  let t = (title || '').toLowerCase();
  
  // Remove markdown, emojis, noise
  t = t.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ');
  t = t.replace(/[⭐️✅🔥⚡️💥🎁❤️🚀⭐|#]/g, ' ');
  t = t.replace(/\[.*?\]|\(.*?\)/g, ' ');

  // Remove common filler words
  t = t.replace(/\b(steam|key|global|xbox|live|playstation|psn|ps4|ps5|account|activation|online|offline|pc|auto[- ]?delivery|instant|warranty|fast|delivery|to your account|to your email|new|personal|full access|region free)\b/gi, ' ');

  // Normalize spaces and special characters
  t = t.replace(/[^a-z0-9]+/g, ' ').trim();
  return t;
}

function extractFingerprint(product) {
  const t = (product.title || '').toLowerCase();
  const pLower = (product.platform || '').toLowerCase();
  const rLower = (product.region || '').toLowerCase();

  // Denomination or duration (e.g. $10, 50 TL, 1 Month, 12 Month, 475 VP, 100 Robux)
  let denom = '';
  const denomMatch = t.match(/(\$\s*\d+|\d+\s*\$|\d+\s*(?:tl|myr|hkd|usd|inr|eur|gbp|bdt)|\d+\s*(?:vp|robux|v-bucks|cp|coins|uc|credits|points|diamonds)|\b(?:1|3|6|12)\s*(?:month|months|year|days)\b)/i);
  if (denomMatch) {
    denom = denomMatch[0].replace(/\s+/g, '');
  }

  // Platform
  let plat = pLower;
  if (t.includes('xbox') || pLower.includes('xbox')) plat = 'xbox';
  else if (t.includes('playstation') || t.includes('psn') || t.includes('ps4') || t.includes('ps5') || pLower.includes('playstation')) plat = 'playstation';
  else if (t.includes('steam') || pLower.includes('steam')) plat = 'steam';
  else if (t.includes('epic') || pLower.includes('epic')) plat = 'epic';
  else if (t.includes('ubisoft') || pLower.includes('ubisoft')) plat = 'ubisoft';

  // Region
  let reg = rLower;
  if (t.includes('turkey') || t.includes('(tl)')) reg = 'tr';
  else if (t.includes('argentina')) reg = 'ar';
  else if (t.includes('global')) reg = 'global';
  else if (t.includes('ukraine')) reg = 'ua';
  else if (t.includes('united states') || t.includes('(usd)') || t.includes('usa')) reg = 'us';
  else if (t.includes('europe') || t.includes('eu')) reg = 'eu';

  const core = cleanCoreName(product.title);

  return {
    core,
    denom,
    plat,
    reg,
    category: product.category,
    key: `${product.category}::${plat}::${reg}::${denom}::${core}`
  };
}

async function fetchAllProducts() {
  const all = [];
  let from = 0;
  const batch = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, description, category, platform, sale_price, cost_price, image_url, source_url, in_stock')
      .range(from, from + batch - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < batch) break;
    from += batch;
  }
  return all;
}

async function main() {
  process.stdout.write(`\n=== RetroHub Product Deduplication & Profit Optimization ===\n`);
  process.stdout.write(`Mode: ${isExecute ? 'LIVE EXECUTE (Deletions will be applied)' : 'DRY-RUN (Preview only)'}\n\n`);

  process.stdout.write('Fetching all products...\n');
  const products = await fetchAllProducts();
  process.stdout.write(`Found ${products.length} total products in database.\n\n`);

  const clusters = new Map();
  for (const p of products) {
    const fp = extractFingerprint(p);
    if (!fp.core || fp.core.length < 3) continue;
    if (!clusters.has(fp.key)) clusters.set(fp.key, []);
    clusters.get(fp.key).push(p);
  }

  const duplicates = Array.from(clusters.entries()).filter(([k, list]) => list.length > 1);
  process.stdout.write(`Found ${duplicates.length} duplicate groups across the store.\n\n`);

  const toKeep = [];
  const toDelete = [];

  for (const [key, list] of duplicates) {
    // Sort products in this duplicate cluster by profit descending
    // Profit = sale_price - cost_price
    list.sort((a, b) => {
      const profitA = (a.sale_price || 0) - (a.cost_price || 0);
      const profitB = (b.sale_price || 0) - (b.cost_price || 0);
      if (profitB !== profitA) return profitB - profitA;

      // Tie-breaker 1: Valid image URL
      const aHasImg = a.image_url && a.image_url.startsWith('http');
      const bHasImg = b.image_url && b.image_url.startsWith('http');
      if (aHasImg && !bHasImg) return -1;
      if (!aHasImg && bHasImg) return 1;

      // Tie-breaker 2: Longer, more detailed description
      return (b.description?.length || 0) - (a.description?.length || 0);
    });

    const best = list[0];
    const redundant = list.slice(1);

    toKeep.push(best);
    toDelete.push(...redundant);

    const bestProfit = (best.sale_price || 0) - (best.cost_price || 0);
    process.stdout.write(`Group: [${key}]\n`);
    process.stdout.write(`  ✔ KEEP: "${best.title}" (Sale: ${best.sale_price} Tk, Cost: ${best.cost_price} Tk, Profit: ${bestProfit} Tk)\n`);
    for (const item of redundant) {
      const p = (item.sale_price || 0) - (item.cost_price || 0);
      process.stdout.write(`  ✖ DELETE: "${item.title}" (Sale: ${item.sale_price} Tk, Cost: ${item.cost_price} Tk, Profit: ${p} Tk) [ID: ${item.id}]\n`);
    }
    process.stdout.write('\n');
  }

  process.stdout.write(`Summary:\n`);
  process.stdout.write(`- Total Duplicate Groups: ${duplicates.length}\n`);
  process.stdout.write(`- Products to KEEP: ${toKeep.length}\n`);
  process.stdout.write(`- Products to DELETE: ${toDelete.length}\n`);
  process.stdout.write(`- Catalog size after cleanup: ${products.length - toDelete.length}\n\n`);

  if (!isExecute) {
    process.stdout.write(`[DRY-RUN COMPLETE] No changes were written to the database.\n`);
    process.stdout.write(`To execute these deletions, run with --execute.\n`);
    return;
  }

  if (toDelete.length === 0) {
    process.stdout.write('No duplicates to delete.\n');
    return;
  }

  process.stdout.write(`Proceeding to delete ${toDelete.length} duplicate products in batches...\n`);
  const idsToDelete = toDelete.map(p => p.id);
  const BATCH_SIZE = 100;
  let deletedCount = 0;

  for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
    const batch = idsToDelete.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', batch);

    if (error) {
      process.stdout.write(`\nError deleting batch: ${error.message}\n`);
      throw error;
    }
    deletedCount += batch.length;
    process.stdout.write(`Deleted ${deletedCount} / ${idsToDelete.length} products...\r`);
  }

  process.stdout.write(`\n\n✔ SUCCESS! Successfully removed ${deletedCount} duplicate products.\n`);
  process.stdout.write(`Highest profit-making products have been preserved.\n`);
}

main().catch(err => {
  process.stdout.write(`\nFatal error: ${err.message}\n`);
  process.exit(1);
});
