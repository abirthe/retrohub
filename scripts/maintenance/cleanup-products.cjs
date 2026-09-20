/**
 * cleanup-products.cjs
 *
 * Three-pass cleanup for RetroHub products:
 *   1. DEDUPLICATE  — find near-duplicate titles (case/punct-insensitive) and
 *                     delete the weaker copy, keeping the one with the better image.
 *   2. IN-STOCK     — set in_stock = 100 on every product.
 *   3. RE-CATEGORISE— re-assign category based on the best-possible signal
 *                     (platform field → title keywords → current category fallback).
 *
 * Usage: node scripts/cleanup-products.cjs
 */

'use strict';

const path = require('path');
const fs   = require('fs');
const { createClient } = require('../../node_modules/@supabase/supabase-js');

// ── env loader ────────────────────────────────────────────────────────────────
const envPath = fs.existsSync(path.join(__dirname, '..', '..', '.env')) ? path.join(__dirname, '..', '..', '.env') : path.join(__dirname, '..', '.env');
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

const SUPABASE_URL      = process.env.VITE_SUPABASE_URL || '';
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === 'your_service_role_key_here') {
  process.stdout.write('ERROR: Missing SUPABASE_SERVICE_ROLE_KEY in .env\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const BATCH = 500;

// ── normalise a title for duplicate comparison ────────────────────────────────
function normalise(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// ── category rules ───────────────────────────────────────────────────────────
const PLATFORM_TO_CATEGORY = {
  'steam':            'pc_game',
  'gog':              'pc_game',
  'epic games':       'pc_game',
  'ubisoft connect':  'pc_game',
  'ubisoft':          'pc_game',
  'ea':               'pc_game',
  'origin':           'pc_game',
  'battle.net':       'pc_game',
  'blizzard':         'pc_game',
  'microsoft store':  'pc_game',
  'xbox':             'xbox_game',
  'playstation':      'ps_game',
  'roblox':           'topup',
  'discord':          'subscription',
  'youtube':          'subscription',
  'google':           'subscription',
  'apple':            'giftcard',
  'nintendo':         'giftcard',
};

const TITLE_RULES = [
  { cat: 'software', kw: ['vpn', 'nordvpn', 'expressvpn', 'surfshark', 'proton vpn', 'hma pro',
      'malwarebytes', 'mcafee', 'microsoft 365', 'office 365', 'idm', 'internet download manager',
      'zoom', 'canva pro', 'capcut pro', 'dolby atmos', 'windows activation', 'windows 10',
      'windows 11', 'antivirus', 'kaspersky', 'bitdefender'] },

  { cat: 'subscription', kw: ['discord nitro', 'discord server', 'discord decoration',
      'youtube premium', 'youtube music', 'spotify premium', 'spotify',
      'netflix', 'amazon prime', 'hbo max', 'hulu', 'apple tv', 'apple music',
      'adobe creative cloud', 'adobe cc', 'adobe photoshop', 'adobe acrobat',
      'icloud', 'google one', 'linkedin premium', 'grammarly premium', 'quillbot',
      'perplexity', 'duolingo', 'telegram premium', 'faceit', 'datacamp',
      'tryhackme', 'chegg', 'exitlag', 'ubisoft+ premium', 'xbox game pass',
      'xbox gamepass', 'ea play', 'ps plus', 'playstation plus'] },

  { cat: 'topup', kw: ['v-bucks', 'vbucks', 'apex coins', 'apex legend', 'robux', 'roblox',
      'brawl stars', 'genshin impact', 'honkai star rail', 'pubg mobile', 'mobile legends',
      'mlbb', 'fortnite', 'delta force', 'efootball', 'pes mobile',
      'marvel rivals', 'honor of kings', 'wuthering waves', 'zenless zone zero',
      'once human', 'neverness', 'where winds meet', 'free fire', 'clash of clans',
      'clash royale', 'uc pubg', 'moons', 'primogem', 'oneiric shard',
      'top-up', 'topup', 'top up', 'recharge', 'in-game currency', 'game currency'] },

  { cat: 'giftcard', kw: ['gift card', 'giftcard', 'itunes', 'app store', 'google play',
      'amazon gift', 'steam wallet', 'steam gift', 'nintendo eshop',
      'blizzard balance', 'battlenet balance', 'xbox gift card', 'psn wallet',
      'playstation wallet', 'playstation store credit', 'roblox gift card',
      'prepaid card', 'prepaid code', 'voucher', 'wallet card'] },

  { cat: 'ps_game', kw: ['ps5', 'ps4', 'psn', 'playstation', 'ps plus'] },

  { cat: 'xbox_game', kw: ['xbox', 'microsoft store game'] },

  { cat: 'pc_game', kw: ['steam', 'gog', 'epic games', 'ubisoft connect', 'uplay',
      'origin', 'ea app', 'battle.net', 'blizzard game', 'rockstar'] },
];

function bestCategory(title, platform, current) {
  const t = (title || '').toLowerCase();

  if (platform) {
    const pLower = platform.toLowerCase();
    for (const [key, cat] of Object.entries(PLATFORM_TO_CATEGORY)) {
      if (pLower.includes(key)) return cat;
    }
  }

  for (const { cat, kw } of TITLE_RULES) {
    if (kw.some(k => t.includes(k))) return cat;
  }

  return current;
}

// ── fetch ALL products ────────────────────────────────────────────────────────
async function fetchAll() {
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, category, platform, image_url, sale_price, in_stock')
      .range(from, from + BATCH - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < BATCH) break;
    from += BATCH;
  }
  return all;
}

// ── batch update — group by (category, in_stock) and update each group at once ──
async function batchUpdate(rows) {
  // Group by category (in_stock is always 100 for all)
  const groups = {};
  for (const row of rows) {
    if (!groups[row.category]) groups[row.category] = [];
    groups[row.category].push(row.id);
  }

  let totalDone = 0;
  for (const [category, ids] of Object.entries(groups)) {
    // Split into chunks of 500 for the .in() filter
    for (let i = 0; i < ids.length; i += BATCH) {
      const chunk = ids.slice(i, i + BATCH);
      const { error } = await supabase
        .from('products')
        .update({ category, in_stock: 100 })
        .in('id', chunk);
      if (error) {
        process.stdout.write('  Error updating category ' + category + ': ' + error.message + '\n');
      } else {
        totalDone += chunk.length;
        process.stdout.write('  Updated ' + totalDone + '/' + rows.length + '\r');
      }
    }
  }
  process.stdout.write('  Updated ' + totalDone + '/' + rows.length + '          \n');
}

// ── batch delete ──────────────────────────────────────────────────────────────
async function batchDelete(ids) {
  let done = 0;
  for (let i = 0; i < ids.length; i += BATCH) {
    const slice = ids.slice(i, i + BATCH);
    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', slice);
    if (error) {
      process.stdout.write('\nDelete batch error: ' + error.message + '\n');
    } else {
      done += slice.length;
      process.stdout.write('  Deleted ' + done + '/' + ids.length + '\r');
    }
  }
  process.stdout.write('\n');
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  process.stdout.write('\nRetroHub Product Cleanup\n');
  process.stdout.write('=======================================\n\n');

  process.stdout.write('Fetching all products from Supabase...\n');
  const products = await fetchAll();
  process.stdout.write('  Found ' + products.length + ' total records\n\n');

  // ── Deduplicate ──────────────────────────────────────────────────────────────
  process.stdout.write('Deduplicating by normalised title...\n');

  const kept     = new Map();
  const toDelete = [];

  for (const p of products) {
    const key = normalise(p.title);
    if (!kept.has(key)) {
      kept.set(key, p);
    } else {
      const existing = kept.get(key);
      const hasImg    = !!(p.image_url && p.image_url.startsWith('http'));
      const existImg  = !!(existing.image_url && existing.image_url.startsWith('http'));

      if (hasImg && !existImg) {
        toDelete.push(existing.id);
        kept.set(key, p);
      } else if (!hasImg && existImg) {
        toDelete.push(p.id);
      } else {
        if ((p.sale_price || 0) > (existing.sale_price || 0)) {
          toDelete.push(existing.id);
          kept.set(key, p);
        } else {
          toDelete.push(p.id);
        }
      }
    }
  }

  const uniqueProducts = Array.from(kept.values());
  process.stdout.write('  Unique products : ' + uniqueProducts.length + '\n');
  process.stdout.write('  Duplicates found: ' + toDelete.length + '\n');

  if (toDelete.length > 0) {
    process.stdout.write('  Deleting duplicates...\n');
    await batchDelete(toDelete);
    process.stdout.write('  Done - duplicates removed\n\n');
  } else {
    process.stdout.write('  No duplicates to remove\n\n');
  }

  // ── Re-categorise + stock ────────────────────────────────────────────────────
  process.stdout.write('Building re-categorisation + stock update...\n');

  const catCounts = {};
  const updates = uniqueProducts.map(p => {
    const newCat = bestCategory(p.title, p.platform, p.category);
    catCounts[newCat] = (catCounts[newCat] || 0) + 1;
    return { id: p.id, category: newCat, in_stock: 100 };
  });

  process.stdout.write('  Category breakdown after re-assignment:\n');
  for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
    process.stdout.write('    ' + cat.padEnd(16) + count + '\n');
  }
  process.stdout.write('\n');

  process.stdout.write('Pushing ' + updates.length + ' updates to Supabase...\n');
  await batchUpdate(updates);

  process.stdout.write('\n=======================================\n');
  process.stdout.write('Done!\n');
  process.stdout.write('  Products after cleanup : ' + uniqueProducts.length + '\n');
  process.stdout.write('  Duplicates removed     : ' + toDelete.length + '\n');
  process.stdout.write('  All in_stock set to    : 100\n');
  process.stdout.write('  Categories re-assigned : ' + updates.length + '\n\n');
}

main().catch(err => {
  process.stdout.write('Fatal: ' + err.message + '\n');
  process.exit(1);
});
