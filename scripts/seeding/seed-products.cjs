/**
 * seed-products.cjs
 * Reads all product Excel files from /Products and upserts them into Supabase.
 *
 * Usage:
 *   1. Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env
 *   2. node scripts/seed-products.cjs
 */

const path = require('path');
const fs = require('fs');
const XLSX = require('../../node_modules/xlsx');
const { createClient } = require('../../node_modules/@supabase/supabase-js');

// Load .env file manually
const envPath = fs.existsSync(path.join(__dirname, '..', '..', '.env')) ? path.join(__dirname, '..', '..', '.env') : path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^\"|\"$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === 'your_service_role_key_here') {
  process.stdout.write('ERROR: Missing SUPABASE_SERVICE_ROLE_KEY in .env\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const PRODUCTS_DIR = path.join(__dirname, '..', 'Products');
const BATCH_SIZE = 100;

// ─── REGION DETECTION ─────────────────────────────────────────────────────────
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

// ─── CATEGORY DETECTION ───────────────────────────────────────────────────────

// Arekta 2 uses human-readable group labels in the Category column.
// Mapping those group labels to our DB enum values.
const AREKTA_SUBSCRIPTION_KEYWORDS = [
  'subscription', 'discord nitro', 'youtube premium', 'xbox gamepass', 'xbox game pass',
  'adobe creative cloud', 'spotify', 'netflix', 'duolingo', 'telegram premium',
  'linkedin premium', 'google one', 'icloud', 'faceit', 'grammarly', 'quillbot',
  'perplexity', 'datacamp', 'tryhackme', 'ubisoft+ premium', 'chegg', 'exitlag',
  'discord server boosting', 'discord decoration', 'windows activation',
];

const AREKTA_TOPUP_KEYWORDS = [
  'game top-up', 'top-up', 'topup', 'v-bucks', 'vbucks', 'apex coins', 'robux',
  'brawl stars', 'genshin', 'honkai', 'pubg', 'mobile legends', 'mlbb',
  'fortnite', 'roblox login', 'delta force', 'efootball', 'pes',
  'marvel rivals', 'lattices', 'honor of kings', 'wuthering waves',
  'zenless zone zero', 'once human', 'neverness', 'where winds meet',
];

const AREKTA_SOFTWARE_KEYWORDS = [
  'software', 'vpn', 'canva', 'capcut', 'dolby atmos', 'expressvpn', 'hma pro',
  'internet download manager', 'idm', 'malwarebytes', 'mcafee', 'microsoft 365',
  'nord vpn', 'nordvpn', 'proton vpn', 'surfshark', 'zoom',
];

const AREKTA_GIFTCARD_KEYWORDS = [
  'gift card', 'itunes', 'nintendo', 'blizzard', 'battlenet', 'steam online',
  'xbox gift card', 'xbox top-up', 'roblox gift card',
];

function detectArekta2Category(nameOrGroupLabel) {
  const lower = (nameOrGroupLabel || '').toLowerCase();
  if (AREKTA_SOFTWARE_KEYWORDS.some(k => lower.includes(k))) return 'software';
  if (AREKTA_SUBSCRIPTION_KEYWORDS.some(k => lower.includes(k))) return 'subscription';
  if (AREKTA_TOPUP_KEYWORDS.some(k => lower.includes(k))) return 'topup';
  if (AREKTA_GIFTCARD_KEYWORDS.some(k => lower.includes(k))) return 'giftcard';
  // Default: it's a PC game listing from Arekta
  return 'pc_game';
}

// Detect platform from product name
function detectPlatform(title, defaultPlatform = null) {
  if (defaultPlatform) return defaultPlatform;
  if (!title) return null;
  const t = title.toLowerCase();
  if (t.includes('steam')) return 'Steam';
  if (t.includes('xbox') || t.includes('xbox live')) return 'Xbox';
  if (t.includes('windows store') || t.includes('microsoft store')) return 'Microsoft Store';
  if (t.includes('psn') || t.includes('ps5') || t.includes('ps4') || t.includes('playstation')) return 'PlayStation';
  if (t.includes('roblox')) return 'Roblox';
  if (t.includes('nintendo') || t.includes('eshop')) return 'Nintendo';
  if (t.includes('ea app') || t.includes('origin')) return 'EA';
  if (t.includes('ubisoft') || t.includes('uplay') || t.includes('ubisoft connect')) return 'Ubisoft Connect';
  if (t.includes('epic')) return 'Epic Games';
  if (t.includes('gog')) return 'GOG';
  if (t.includes('blizzard') || t.includes('battlenet') || t.includes('battle.net')) return 'Battle.net';
  if (t.includes('discord')) return 'Discord';
  if (t.includes('youtube')) return 'YouTube';
  if (t.includes('google')) return 'Google';
  if (t.includes('itunes') || t.includes('apple')) return 'Apple';
  return null;
}

// Categorise based on the platform column from SALE! file
function categoryFromSalePlatform(platform) {
  if (!platform) return 'pc_game';
  const p = platform.toLowerCase();
  if (p.includes('xbox') || p.includes('windows store')) return 'xbox_game';
  if (p.includes('steam') || p.includes('gog') || p.includes('ubisoft') || p.includes('origin') || p.includes('epic')) return 'pc_game';
  return 'pc_game';
}

// ─── PRICE HELPERS ────────────────────────────────────────────────────────────
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
  // Headers: ["LBwiWP src"(img), "O4be9G src"(platform logo), "Platform", "NAME", "PRICE"]
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const products = [];
  for (let i = 1; i < rows.length; i++) {
    const [imgUrl, , platform, name, price] = rows[i];
    if (!name || !price) continue;
    const salePrice = parseSalePrice(price);
    if (!salePrice) continue;
    const platStr = platform?.toString().trim() || '';
    products.push({
      title: name.toString().trim(),
      category: categoryFromSalePlatform(platStr),
      delivery_type: 'instant_code',
      platform: platStr || detectPlatform(name),
      image_url: imgUrl?.toString().trim() || null,
      sale_price: salePrice,
      cost_price: deriveCostPrice(salePrice),
      region: regionFromTitle(name),
      is_active: true,
      in_stock: 100,
    });
  }
  return products;
}

function parseSteamGamesFile(filePath) {
  // No header row — all rows are data: [image_url, name, price]
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
      category: 'pc_game',
      delivery_type: 'instant_code',
      platform: 'Steam',
      image_url: imgUrl?.toString().trim() || null,
      sale_price: salePrice,
      cost_price: deriveCostPrice(salePrice),
      region: regionFromTitle(name),
      is_active: true,
      in_stock: 100,
    });
  }
  return products;
}

function parsePSGamesFile(filePath) {
  // Headers: ["LBwiWP src"(img), "YLosEL"(name), "Pm6lW1"(region), "PRICE"]
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
      category: 'ps_game',
      delivery_type: 'instant_code',
      platform: 'PlayStation',
      image_url: imgUrl?.toString().trim() || null,
      sale_price: salePrice,
      cost_price: deriveCostPrice(salePrice),
      region: detectRegion(region) || regionFromTitle(name),
      is_active: true,
      in_stock: 100,
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
      category: 'xbox_game',
      delivery_type: 'instant_code',
      platform: 'Xbox',
      image_url: imgUrl?.toString().trim() || null,
      sale_price: salePrice,
      cost_price: deriveCostPrice(salePrice),
      region: detectRegion(region) || regionFromTitle(name),
      is_active: true,
      in_stock: 100,
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
    const [name, description, groupLabel, imgUrl, , price, availability] = rows[i];
    if (!name) continue;
    if (availability && availability.toString().toLowerCase() === 'outofstock') continue;
    if (!price) continue;
    const salePrice = parseSalePrice(price);
    if (!salePrice) continue;
    
    // Determine category from the group label or product name
    const categorySource = groupLabel || name.toString();
    const cat = detectArekta2Category(categorySource);
    products.push({
      title: name.toString().trim(),
      category: cat,
      delivery_type: cat === 'topup' ? 'api_h2h' : 'instant_code',
      platform: detectPlatform(name),
      image_url: imgUrl?.toString().trim() || null,
      description: description?.toString().trim() || null,
      sale_price: salePrice,
      cost_price: deriveCostPrice(salePrice),
      region: regionFromTitle(name),
      is_active: true,
      in_stock: 100,
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
      in_stock: 100,
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
      .upsert(batch, { onConflict: 'title', ignoreDuplicates: false });
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
  process.stdout.write('RetroHub Product Seeder v2\n');
  process.stdout.write('==================================\n');

  const fileParsers = [
    { file: 'STEAM GAMES.xlsx', label: 'STEAM GAMES (pc_game)', parser: parseSteamGamesFile },
    { file: 'Xbox Games.xlsx',  label: 'Xbox Games (xbox_game)', parser: parseXboxGamesFile },
    { file: 'PS Games.xlsx',    label: 'PS Games (ps_game)',     parser: parsePSGamesFile },
    { file: 'SALE!.xlsx',       label: 'SALE! (pc_game + xbox)', parser: parseSaleFile },
    { file: 'Arekta 2.xlsx',    label: 'Arekta 2 (multi-cat)',  parser: parseArekta2File },
    { file: 'ovrok.xlsx',       label: 'Ovrok (giftcard)',       parser: parseOvrokFile },
  ];

  let allProducts = [];
  const categoryCounts = {};

  for (const { file, label, parser } of fileParsers) {
    const filePath = path.join(PRODUCTS_DIR, file);
    process.stdout.write('Parsing: ' + label + '... ');
    try {
      const parsed = parser(filePath);
      process.stdout.write(parsed.length + ' products\n');
      for (const p of parsed) {
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      }
      allProducts = allProducts.concat(parsed);
    } catch (err) {
      process.stdout.write('FAILED: ' + err.message + '\n');
    }
  }

  // Deduplicate by title — last occurrence wins (most specific data)
  const titleMap = new Map();
  for (const p of allProducts) {
    titleMap.set(p.title, p);
  }
  const deduplicated = Array.from(titleMap.values());

  process.stdout.write('\nCategory breakdown:\n');
  for (const [cat, count] of Object.entries(categoryCounts)) {
    process.stdout.write('  ' + cat.padEnd(14) + count + '\n');
  }
  process.stdout.write('\nTotal unique products: ' + deduplicated.length + '\n');
  process.stdout.write('Pushing to Supabase...\n\n');

  const { inserted, errors } = await batchUpsert(deduplicated);

  process.stdout.write('\n==================================\n');
  process.stdout.write('Done! Upserted: ' + inserted + ' | Errors: ' + errors + '\n');
}

main().catch((err) => {
  process.stdout.write('Fatal error: ' + err.message + '\n');
  process.exit(1);
});
