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

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const isExecute = process.argv.includes('--execute');

/**
 * Normalizes title:
 * - strips brackets with noise like [Auto Delivery], (Instant), emojis
 * - strips common filler phrases ('auto delivery', 'fast delivery', 'instant', 'warranty')
 * - preserves edition, version, denomination, and core game/product name
 */
function normalizeTitle(title) {
  let t = (title || '').toLowerCase();
  
  // Remove markdown, emojis, noise
  t = t.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ');
  t = t.replace(/[⭐️✅🔥⚡️💥🎁❤️🚀⭐|#]/g, ' ');

  // Remove bracketed noise tags like [Instant Delivery], [Auto Delivery], (PC), (GLOBAL)
  t = t.replace(/\[\s*(?:auto[- ]?delivery|instant|fast|warranty|delivery|global|pc)\s*\]/gi, ' ');
  t = t.replace(/\(\s*(?:auto[- ]?delivery|instant|fast|warranty|delivery|global|pc)\s*\)/gi, ' ');

  // Remove common marketing filler words
  t = t.replace(/\b(auto[- ]?delivery|instant delivery|fast delivery|lifetime warranty|24\/7 support|region free)\b/gi, ' ');

  // Redundant tokens already captured by category, platform, and region
  t = t.replace(/\b(pc|key|keys|cdkey|code|codes|global|live|steam|xbox|playstation|psn|ps4|ps5)\b/gi, ' ');

  // Common seller suffixes
  t = t.replace(/\b(activation|online|offline|new|personal)\b/gi, ' ');

  // Normalize punctuation and whitespace
  t = t.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  return t;
}

function normalizePlatform(plat) {
  const p = (plat || '').toLowerCase().trim();
  if (p.includes('xbox')) return 'xbox';
  if (p.includes('playstation') || p.includes('psn') || p.includes('ps4') || p.includes('ps5')) return 'playstation';
  if (p.includes('steam')) return 'steam';
  if (p.includes('gog')) return 'gog';
  if (p.includes('epic')) return 'epic';
  if (p.includes('ubisoft') || p.includes('uplay')) return 'ubisoft';
  if (p.includes('origin') || p.includes('ea')) return 'ea';
  if (p.includes('nintendo')) return 'nintendo';
  return p;
}

function normalizeRegion(reg) {
  const r = (reg || '').toLowerCase().trim();
  if (r.includes('global')) return 'global';
  if (r.includes('us') || r.includes('united states') || r.includes('usa')) return 'us';
  if (r.includes('eu') || r.includes('europe')) return 'eu';
  if (r.includes('tr') || r.includes('turkey')) return 'tr';
  if (r.includes('ar') || r.includes('argentina')) return 'ar';
  return r;
}

function resolvePlatform(product) {
  const p = normalizePlatform(product.platform);
  if (p && p !== 'n/a') return p;
  const t = (product.title || '').toLowerCase();
  if (t.includes('xbox')) return 'xbox';
  if (t.includes('playstation') || t.includes('psn') || t.includes('ps4') || t.includes('ps5')) return 'playstation';
  if (t.includes('steam')) return 'steam';
  if (t.includes('gog')) return 'gog';
  if (t.includes('epic')) return 'epic';
  if (t.includes('ubisoft')) return 'ubisoft';
  if (product.category === 'pc_game') return 'steam';
  return 'standard';
}

function resolveRegion(product) {
  const r = normalizeRegion(product.region);
  if (r && r !== 'n/a') return r;
  const t = (product.title || '').toLowerCase();
  if (t.includes('turkey') || t.includes('(tl)')) return 'tr';
  if (t.includes('argentina')) return 'ar';
  if (t.includes('united states') || t.includes('usa')) return 'us';
  if (t.includes('europe') || t.includes('eu')) return 'eu';
  return 'global';
}

/**
 * Extracts a multi-factor fingerprint based on:
 * 1. Category
 * 2. Title (normalized core)
 * 3. Platform (normalized with fallback)
 * 4. Region (normalized with fallback)
 * 5. Denomination / Duration / Edition details
 */
function extractStrictFingerprint(product) {
  const cat = (product.category || '').toLowerCase().trim();
  const rawTitle = (product.title || '').toLowerCase();
  const plat = resolvePlatform(product);
  const reg = resolveRegion(product);

  // 1. Account vs Game/Product distinction (critical so accounts are never grouped with keys/games)
  const isAccount = rawTitle.includes('account') || rawTitle.includes('login') || rawTitle.includes('full access');
  const typeTag = isAccount ? 'account' : 'product';

  // 2. Denomination / amount / duration
  let denom = '';
  const denomMatch = rawTitle.match(/(\$\s*\d+|\d+\s*\$|\d+\s*(?:tl|myr|hkd|usd|inr|eur|gbp|bdt)|\d+\s*(?:vp|robux|v-bucks|cp|coins|uc|credits|points|diamonds)|\b(?:1|3|6|12)\s*(?:month|months|year|days)\b)/i);
  if (denomMatch) {
    denom = denomMatch[0].replace(/\s+/g, '');
  }

  // 3. Normalized Title
  const cleanTitle = normalizeTitle(product.title);

  // 4. Combined strict fingerprint: Title + Category + Platform + Region + Type + Denom
  const key = `${cat}::${plat}::${reg}::${typeTag}::${denom}::${cleanTitle}`;

  return {
    key,
    cat,
    plat,
    reg,
    cleanTitle,
    denom,
    typeTag,
  };
}

async function fetchAllProducts() {
  const seenIds = new Set();
  const all = [];
  let from = 0;
  const batch = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, description, category, platform, region, delivery_type, sale_price, cost_price, image_url, in_stock, created_at')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + batch - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const p of data) {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        all.push(p);
      }
    }
    if (data.length < batch) break;
    from += batch;
  }
  return all;
}

async function main() {
  process.stdout.write(`\n============================================================\n`);
  process.stdout.write(`RetroHub Strict Deduplication (Title + Category + Details)\n`);
  process.stdout.write(`Mode: ${isExecute ? 'LIVE EXECUTE (Deletions will be applied)' : 'DRY-RUN (Preview only)'}\n`);
  process.stdout.write(`============================================================\n\n`);

  process.stdout.write('Fetching all products from Supabase...\n');
  const products = await fetchAllProducts();
  process.stdout.write(`Total products in database: ${products.length}\n\n`);

  // Check exact title duplicates
  const titleMap = new Map();
  for (const p of products) {
    const raw = (p.title || '').trim().toLowerCase();
    if (!titleMap.has(raw)) titleMap.set(raw, []);
    titleMap.get(raw).push(p);
  }
  const exactTitleDups = Array.from(titleMap.entries()).filter(([_, list]) => list.length > 1);
  process.stdout.write(`Direct exact title duplicates: ${exactTitleDups.length}\n`);
  if (exactTitleDups.length > 0) {
    for (const [t, list] of exactTitleDups.slice(0, 5)) {
      process.stdout.write(`  Sample: "${t}" (${list.length} copies)\n`);
    }
  }

  // Check exact source_url duplicates
  const urlMap = new Map();
  for (const p of products) {
    if (p.source_url) {
      const u = p.source_url.trim();
      if (!urlMap.has(u)) urlMap.set(u, []);
      urlMap.get(u).push(p);
    }
  }
  const urlDups = Array.from(urlMap.entries()).filter(([_, list]) => list.length > 1);
  process.stdout.write(`Duplicate source_url records: ${urlDups.length}\n`);

  // Check core title duplicates (ignoring category/platform)
  const coreMap = new Map();
  for (const p of products) {
    const core = normalizeTitle(p.title);
    if (!core || core.length < 3) continue;
    if (!coreMap.has(core)) coreMap.set(core, []);
    coreMap.get(core).push(p);
  }
  const coreDups = Array.from(coreMap.entries()).filter(([_, list]) => list.length > 1);
  process.stdout.write(`Duplicate title core (any category/platform): ${coreDups.length}\n`);
  if (coreDups.length > 0) {
    for (const [c, list] of coreDups.slice(0, 5)) {
      process.stdout.write(`  Sample core: "${c}"\n`);
      for (const item of list) {
        process.stdout.write(`    - [${item.category}] [${item.platform || 'N/A'}] [${item.region || 'N/A'}] "${item.title}"\n`);
      }
    }
  }

  // Cluster by comprehensive fingerprint
  const clusters = new Map();
  for (const p of products) {
    const fp = extractStrictFingerprint(p);
    if (!fp.cleanTitle || fp.cleanTitle.length < 2) continue;
    if (!clusters.has(fp.key)) clusters.set(fp.key, []);
    clusters.get(fp.key).push(p);
  }

  const duplicates = Array.from(clusters.entries()).filter(([_, list]) => list.length > 1);
  process.stdout.write(`Found ${duplicates.length} duplicate groups across all categories and details.\n\n`);

  const toKeep = [];
  const toDelete = [];

  for (const [key, list] of duplicates) {
    // Rank items in cluster:
    // 1. Highest profit (sale_price - cost_price)
    // 2. Valid image URL
    // 3. In stock (> 0)
    // 4. Description length / details
    list.sort((a, b) => {
      const profitA = (a.sale_price || 0) - (a.cost_price || 0);
      const profitB = (b.sale_price || 0) - (b.cost_price || 0);
      if (profitB !== profitA) return profitB - profitA;

      const aHasImg = a.image_url && a.image_url.startsWith('http');
      const bHasImg = b.image_url && b.image_url.startsWith('http');
      if (aHasImg && !bHasImg) return -1;
      if (!aHasImg && bHasImg) return 1;

      if ((b.in_stock || 0) !== (a.in_stock || 0)) {
        return (b.in_stock || 0) - (a.in_stock || 0);
      }

      return (b.description?.length || 0) - (a.description?.length || 0);
    });

    const best = list[0];
    const redundant = list.slice(1);

    toKeep.push(best);
    toDelete.push(...redundant);

    const bestProfit = (best.sale_price || 0) - (best.cost_price || 0);
    process.stdout.write(`Group: [${best.category}] "${best.title}" (Platform: ${best.platform || 'N/A'}, Region: ${best.region || 'N/A'})\n`);
    process.stdout.write(`  ✔ KEEP: [ID: ${best.id}] Price: ${best.sale_price} Tk | Cost: ${best.cost_price} Tk | Profit: ${bestProfit} Tk | Stock: ${best.in_stock || 0}\n`);
    for (const item of redundant) {
      const itemProfit = (item.sale_price || 0) - (item.cost_price || 0);
      process.stdout.write(`  ✖ DELETE: [ID: ${item.id}] "${item.title}" | Price: ${item.sale_price} Tk | Cost: ${item.cost_price} Tk | Profit: ${itemProfit} Tk\n`);
    }
    process.stdout.write('\n');
  }

  process.stdout.write(`============================================================\n`);
  process.stdout.write(`Deduplication Summary:\n`);
  process.stdout.write(`- Total Duplicate Groups: ${duplicates.length}\n`);
  process.stdout.write(`- Products to KEEP:       ${toKeep.length}\n`);
  process.stdout.write(`- Redundant to DELETE:    ${toDelete.length}\n`);
  process.stdout.write(`- Final Catalog Size:     ${products.length - toDelete.length}\n`);
  process.stdout.write(`============================================================\n\n`);

  if (!isExecute) {
    process.stdout.write(`[DRY-RUN COMPLETE] No products were deleted from the database.\n`);
    process.stdout.write(`To execute these deletions, run:\n`);
    process.stdout.write(`  node scripts/maintenance/deduplicate_products_strict.mjs --execute\n\n`);
    return;
  }

  if (toDelete.length === 0) {
    process.stdout.write('No duplicates found to delete.\n');
    return;
  }

  process.stdout.write(`Proceeding to delete ${toDelete.length} duplicate products in batches of 100...\n`);
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
    process.stdout.write(`Deleted ${deletedCount} / ${idsToDelete.length} duplicates...\r`);
  }

  process.stdout.write(`\n✔ Successfully deleted ${deletedCount} duplicate products!\n`);
  process.stdout.write(`Catalog has been cleaned and deduplicated based on title, category, and details.\n`);
}

main().catch(err => {
  process.stdout.write(`\nFatal error: ${err.message}\n`);
  process.exit(1);
});
