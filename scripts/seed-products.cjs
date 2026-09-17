/**
 * seed-products.js
 * Reads all product Excel files from /Products and upserts them into Supabase.
 *
 * Usage:
 *   1. Set SUPABASE_SERVICE_ROLE_KEY in your .env file (or export it as an env variable)
 *   2. node scripts/seed-products.js
 *
 * Requires: xlsx, @supabase/supabase-js (already installed)
 */

const XLSX = require('../node_modules/xlsx');
const { createClient } = require('../node_modules/@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load .env file manually (no dotenv dependency needed)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
// IMPORTANT: Set this to your Supabase SERVICE ROLE key (not the anon key).
// Get it from: Supabase Dashboard → Settings → API → service_role key
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env variable.');
  console.error('Set it via: set SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const PRODUCTS_DIR = path.join(__dirname, '..', 'Products');
const BATCH_SIZE = 100;

// ─── REGION DETECTION ────────────────────────────────────────────────────────
const REGION_MAP = {
  'global': 'GLOBAL',
  'us': 'US', 'united states': 'US', 'usa': 'US',
  'europe': 'EU', 'eu': 'EU',
  'uk': 'UK', 'united kingdom': 'UK',
  'ca': 'CA', 'canada': 'CA',
  'mx': 'MX', 'mexico': 'MX',
  'br': 'BR', 'brazil': 'BR',
  'in': 'IN', 'india': 'IN',
  'cn': 'CN', 'china': 'CN',
  'jp': 'JP', 'japan': 'JP',
  'kr': 'KR', 'south korea': 'KR', 'korea': 'KR',
  'au': 'AU', 'australia': 'AU',
  'nz': 'NZ', 'new zealand': 'NZ',
  'ae': 'AE', 'uae': 'AE', 'united arab emirates': 'AE',
  'sa': 'SA', 'saudi arabia': 'SA',
  'za': 'ZA', 'south africa': 'ZA',
  'ru': 'RU', 'russia': 'RU',
  'tr': 'TR', 'turkey': 'TR',
  'sg': 'SG', 'singapore': 'SG',
  'my': 'MY', 'malaysia': 'MY',
  'th': 'TH', 'thailand': 'TH',
  'id': 'ID', 'indonesia': 'ID',
  'ph': 'PH', 'philippines': 'PH',
  'vn': 'VN', 'vietnam': 'VN',
  'me': 'ME', 'middle east': 'ME',
  'africa': 'AFRICA',
  'oceania': 'OCEANIA',
  'latam': 'LATAM', 'latin america': 'LATAM',
  'asia': 'ASIA',
  'argentina': 'LATAM',
};

function detectRegion(str) {
  if (!str) return 'GLOBAL';
  const lower = str.toString().toLowerCase().trim();
  for (const [key, val] of Object.entries(REGION_MAP)) {
    if (lower.includes(key)) return val;
  }
  return 'GLOBAL';
}

function regionFromTitle(title) {
  if (!title) return 'GLOBAL';
  const parts = title.toString().trim().split(' ');
  const last = parts[parts.length - 1].toUpperCase();
  const secondLast = parts.length > 1 ? parts[parts.length - 2].toUpperCase() : '';
  const twoWord = (secondLast + ' ' + last).toLowerCase();
  if (REGION_MAP[last.toLowerCase()]) return REGION_MAP[last.toLowerCase()];
  if (REGION_MAP[twoWord]) return REGION_MAP[twoWord];
  return 'GLOBAL';
}

// ─── PLATFORM DETECTION ───────────────────────────────────────────────────────
function detectPlatform(title, defaultPlatform = null) {
  if (defaultPlatform) return defaultPlatform;
  if (!title) return null;
  const t = title.toLowerCase();
  if (t.includes('steam')) return 'Steam';
  if (t.includes('xbox')) return 'Xbox';
  if (t.includes('psn') || t.includes('ps5') || t.includes('ps4') || t.includes('playstation')) return 'PlayStation';
  if (t.includes('roblox')) return 'Roblox';
  if (t.includes('nintendo') || t.includes('eshop')) return 'Nintendo';
  if (t.includes('ea app') || t.includes('origin')) return 'EA';
  if (t.includes('ubisoft') || t.includes('uplay')) return 'Ubisoft';
  if (t.includes('epic')) return 'Epic Games';
  if (t.includes('gog')) return 'GOG';
  return null;
}

// ─── PRICE HELPERS ───────────────────────────────────────────────────────────
function parseSalePrice(raw) {
  if (!raw) return null;
  const n = parseFloat(raw.toString().replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

function deriveCostPrice(salePrice) {
  return salePrice ? parseFloat((salePrice * 0.85).toFixed(2)) : null;
}

// ─── FILE PARSERS ─────────────────────────────────────────────────────────────

function parseSaleFile(filePath) {
  // Headers: ["LBwiWP src", "O4be9G src", "Platform", "NAME", "PRICE"]
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const products = [];
  for (let i = 1; i < rows.length; i++) {
    const [imgUrl, , platform, name, price] = rows[i];
    if (!name || !price) continue;
    const salePrice = parseSalePrice(price);
    if (!salePrice) continue;
    products.push({
      title: name.toString().trim(),
      category: 'giftcard',
      delivery_type: 'instant_code',
      platform: platform?.toString().trim() || detectPlatform(name),
      image_url: imgUrl?.toString().trim() || null,
      sale_price: salePrice,
      cost_price: deriveCostPrice(salePrice),
      region: regionFromTitle(name),
      is_active: true,
    });
  }
  return products;
}

function parseSteamGamesFile(filePath) {
  // No header row - all rows are data: [image_url, name, price]
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const products = [];
  for (let i = 0; i < rows.length; i++) {
    const [imgUrl, name, price] = rows[i];
    if (!name || !price) continue;
    const salePrice = parseSalePrice(price);
    if (!salePrice) continue;
    products.push({
      title: name.toString().trim(),
      category: 'giftcard',
      delivery_type: 'instant_code',
      platform: detectPlatform(name, 'Steam'),
      image_url: imgUrl?.toString().trim() || null,
      sale_price: salePrice,
      cost_price: deriveCostPrice(salePrice),
      region: regionFromTitle(name),
      is_active: true,
    });
  }
  return products;
}

function parsePSGamesFile(filePath) {
  // Headers: ["LBwiWP src", "YLosEL"(name), "Pm6lW1"(region), "PRICE"]
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const products = [];
  for (let i = 1; i < rows.length; i++) {
    const [imgUrl, name, region, price] = rows[i];
    if (!name || !price) continue;
    const salePrice = parseSalePrice(price);
    if (!salePrice) continue;
    products.push({
      title: name.toString().trim(),
      category: 'giftcard',
      delivery_type: 'instant_code',
      platform: 'PlayStation',
      image_url: imgUrl?.toString().trim() || null,
      sale_price: salePrice,
      cost_price: deriveCostPrice(salePrice),
      region: detectRegion(region) || regionFromTitle(name),
      is_active: true,
    });
  }
  return products;
}

function parseXboxGamesFile(filePath) {
  // Headers: ["lbwi-wp"(img), "u-asjs-o"(platform), "ylos-el"(name), "firf-xi"(region), "Adjusted Price"]
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const products = [];
  for (let i = 1; i < rows.length; i++) {
    const [imgUrl, , name, region, price] = rows[i];
    if (!name || !price) continue;
    const salePrice = parseSalePrice(price);
    if (!salePrice) continue;
    products.push({
      title: name.toString().trim(),
      category: 'giftcard',
      delivery_type: 'instant_code',
      platform: 'Xbox',
      image_url: imgUrl?.toString().trim() || null,
      sale_price: salePrice,
      cost_price: deriveCostPrice(salePrice),
      region: detectRegion(region) || regionFromTitle(name),
      is_active: true,
    });
  }
  return products;
}

function parseArekta2File(filePath) {
  // Headers: ["Name","Description","Category","Image","Logo","Price","Availability","Currency"]
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const products = [];
  for (let i = 1; i < rows.length; i++) {
    const [name, description, , imgUrl, , price, availability] = rows[i];
    if (!name || !price) continue;
    if (availability && availability.toString().toLowerCase() === 'outofstock') continue;
    const salePrice = parseSalePrice(price);
    if (!salePrice) continue;
    products.push({
      title: name.toString().trim(),
      category: 'giftcard',
      delivery_type: 'instant_code',
      platform: detectPlatform(name),
      image_url: imgUrl?.toString().trim() || null,
      description: description?.toString().trim() || null,
      sale_price: salePrice,
      cost_price: deriveCostPrice(salePrice),
      region: regionFromTitle(name),
      is_active: true,
    });
  }
  return products;
}

function parseOvrokFile(filePath) {
  // Headers: ["attachment-shop_catalog src"(img), "heading-title"(name), "PRICE"]
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const products = [];
  for (let i = 1; i < rows.length; i++) {
    const [imgUrl, name, price] = rows[i];
    if (!name || !price) continue;
    const salePrice = parseSalePrice(price);
    if (!salePrice) continue;
    products.push({
      title: name.toString().trim(),
      category: 'giftcard',
      delivery_type: 'instant_code',
      platform: detectPlatform(name),
      image_url: imgUrl?.toString().trim() || null,
      sale_price: salePrice,
      cost_price: deriveCostPrice(salePrice),
      region: regionFromTitle(name),
      is_active: true,
    });
  }
  return products;
}

// ─── UPSERT ───────────────────────────────────────────────────────────────────

async function batchUpsert(products) {
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('products')
      .upsert(batch, { onConflict: 'title', ignoreDuplicates: true });
    if (error) {
      process.stdout.write('\nBatch ' + (i / BATCH_SIZE + 1) + ' error: ' + error.message + '\n');
      errors += batch.length;
    } else {
      inserted += batch.length;
      process.stdout.write('  Upserted ' + inserted + '/' + products.length + ' products\r');
    }
  }
  process.stdout.write('\n');
  return { inserted, errors };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  process.stdout.write('RetroHub Product Seeder\n');
  process.stdout.write('================================\n');

  const fileParsers = [
    { file: 'SALE!.xlsx', label: 'SALE! (Mixed)', parser: parseSaleFile },
    { file: 'STEAM GAMES.xlsx', label: 'STEAM GAMES', parser: parseSteamGamesFile },
    { file: 'Xbox Games.xlsx', label: 'Xbox Games', parser: parseXboxGamesFile },
    { file: 'PS Games.xlsx', label: 'PS Games', parser: parsePSGamesFile },
    { file: 'Arekta 2.xlsx', label: 'Arekta 2 (BD Store)', parser: parseArekta2File },
    { file: 'ovrok.xlsx', label: 'Ovrok Gift Cards', parser: parseOvrokFile },
    // Arekta.xlsx is page-scraped text (no structured rows) - skipped
  ];

  let allProducts = [];

  for (const { file, label, parser } of fileParsers) {
    const filePath = path.join(PRODUCTS_DIR, file);
    process.stdout.write('Parsing: ' + label + '... ');
    try {
      const parsed = parser(filePath);
      process.stdout.write(parsed.length + ' products found\n');
      allProducts = allProducts.concat(parsed);
    } catch (err) {
      process.stdout.write('FAILED: ' + err.message + '\n');
    }
  }

  // Deduplicate by title (keep last occurrence)
  const titleMap = new Map();
  for (const p of allProducts) {
    titleMap.set(p.title, p);
  }
  const deduplicated = Array.from(titleMap.values());

  process.stdout.write('\nTotal unique products to upsert: ' + deduplicated.length + '\n');
  process.stdout.write('Pushing to Supabase...\n\n');

  const { inserted, errors } = await batchUpsert(deduplicated);

  process.stdout.write('\n================================\n');
  process.stdout.write('Done! Upserted: ' + inserted + ' | Errors: ' + errors + '\n');
}

main().catch((err) => {
  process.stdout.write('Fatal error: ' + err.message + '\n');
  process.exit(1);
});
