/**
 * generate-sql.cjs
 * Reads all product Excel files and generates a products-seed.sql file
 * with INSERT statements you can run directly in the Supabase SQL Editor.
 *
 * Usage: node scripts/generate-sql.cjs
 * Output: scripts/products-seed.sql
 */

const XLSX = require('../node_modules/xlsx');
const path = require('path');
const fs = require('fs');

const PRODUCTS_DIR = path.join(__dirname, '..', 'Products');

// ─── REGION DETECTION ────────────────────────────────────────────────────────
const REGION_MAP = {
  'global': 'GLOBAL', 'us': 'US', 'united states': 'US', 'usa': 'US',
  'europe': 'EU', 'eu': 'EU', 'uk': 'UK', 'united kingdom': 'UK',
  'ca': 'CA', 'canada': 'CA', 'mx': 'MX', 'mexico': 'MX',
  'br': 'BR', 'brazil': 'BR', 'in': 'IN', 'india': 'IN',
  'cn': 'CN', 'china': 'CN', 'jp': 'JP', 'japan': 'JP',
  'kr': 'KR', 'south korea': 'KR', 'korea': 'KR',
  'au': 'AU', 'australia': 'AU', 'nz': 'NZ', 'new zealand': 'NZ',
  'ae': 'AE', 'uae': 'AE', 'united arab emirates': 'AE',
  'sa': 'SA', 'saudi arabia': 'SA', 'za': 'ZA', 'south africa': 'ZA',
  'ru': 'RU', 'russia': 'RU', 'tr': 'TR', 'turkey': 'TR',
  'sg': 'SG', 'singapore': 'SG', 'my': 'MY', 'malaysia': 'MY',
  'th': 'TH', 'thailand': 'TH', 'id': 'ID', 'indonesia': 'ID',
  'ph': 'PH', 'philippines': 'PH', 'vn': 'VN', 'vietnam': 'VN',
  'me': 'ME', 'middle east': 'ME', 'africa': 'AFRICA',
  'oceania': 'OCEANIA', 'latam': 'LATAM', 'latin america': 'LATAM',
  'asia': 'ASIA', 'argentina': 'LATAM',
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
  const last = parts[parts.length - 1].toLowerCase();
  const secondLast = parts.length > 1 ? parts[parts.length - 2].toLowerCase() : '';
  const twoWord = secondLast + ' ' + last;
  if (REGION_MAP[last]) return REGION_MAP[last];
  if (REGION_MAP[twoWord]) return REGION_MAP[twoWord];
  return 'GLOBAL';
}

function detectPlatform(title, def = null) {
  if (def) return def;
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

function parseSalePrice(raw) {
  if (!raw) return null;
  const n = parseFloat(raw.toString().replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

function deriveCostPrice(salePrice) {
  return salePrice ? parseFloat((salePrice * 0.85).toFixed(2)) : null;
}

// ─── SQL ESCAPING ─────────────────────────────────────────────────────────────
function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  return "'" + val.toString().replace(/'/g, "''") + "'";
}

function escNum(val) {
  if (val === null || val === undefined) return 'NULL';
  return parseFloat(val).toFixed(2);
}

// ─── FILE PARSERS (same as seed-products.cjs) ─────────────────────────────────
function parseSaleFile(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const products = [];
  for (let i = 1; i < rows.length; i++) {
    const [imgUrl, , platform, name, price] = rows[i];
    if (!name || !price) continue;
    const salePrice = parseSalePrice(price);
    if (!salePrice) continue;
    products.push({ title: name.toString().trim(), category: 'giftcard', delivery_type: 'instant_code', platform: platform?.toString().trim() || detectPlatform(name), image_url: imgUrl?.toString().trim() || null, sale_price: salePrice, cost_price: deriveCostPrice(salePrice), region: regionFromTitle(name) });
  }
  return products;
}

function parseSteamGamesFile(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const products = [];
  for (let i = 0; i < rows.length; i++) {
    const [imgUrl, name, price] = rows[i];
    if (!name || !price) continue;
    const salePrice = parseSalePrice(price);
    if (!salePrice) continue;
    products.push({ title: name.toString().trim(), category: 'giftcard', delivery_type: 'instant_code', platform: detectPlatform(name, 'Steam'), image_url: imgUrl?.toString().trim() || null, sale_price: salePrice, cost_price: deriveCostPrice(salePrice), region: regionFromTitle(name) });
  }
  return products;
}

function parsePSGamesFile(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const products = [];
  for (let i = 1; i < rows.length; i++) {
    const [imgUrl, name, region, price] = rows[i];
    if (!name || !price) continue;
    const salePrice = parseSalePrice(price);
    if (!salePrice) continue;
    products.push({ title: name.toString().trim(), category: 'giftcard', delivery_type: 'instant_code', platform: 'PlayStation', image_url: imgUrl?.toString().trim() || null, sale_price: salePrice, cost_price: deriveCostPrice(salePrice), region: detectRegion(region) || regionFromTitle(name) });
  }
  return products;
}

function parseXboxGamesFile(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const products = [];
  for (let i = 1; i < rows.length; i++) {
    const [imgUrl, , name, region, price] = rows[i];
    if (!name || !price) continue;
    const salePrice = parseSalePrice(price);
    if (!salePrice) continue;
    products.push({ title: name.toString().trim(), category: 'giftcard', delivery_type: 'instant_code', platform: 'Xbox', image_url: imgUrl?.toString().trim() || null, sale_price: salePrice, cost_price: deriveCostPrice(salePrice), region: detectRegion(region) || regionFromTitle(name) });
  }
  return products;
}

function parseCatalog2File(filePath) {
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
    products.push({ title: name.toString().trim(), category: 'giftcard', delivery_type: 'instant_code', platform: detectPlatform(name), image_url: imgUrl?.toString().trim() || null, description: description?.toString().trim() || null, sale_price: salePrice, cost_price: deriveCostPrice(salePrice), region: regionFromTitle(name) });
  }
  return products;
}

function parseOvrokFile(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const products = [];
  for (let i = 1; i < rows.length; i++) {
    const [imgUrl, name, price] = rows[i];
    if (!name || !price) continue;
    const salePrice = parseSalePrice(price);
    if (!salePrice) continue;
    products.push({ title: name.toString().trim(), category: 'giftcard', delivery_type: 'instant_code', platform: detectPlatform(name), image_url: imgUrl?.toString().trim() || null, sale_price: salePrice, cost_price: deriveCostPrice(salePrice), region: regionFromTitle(name) });
  }
  return products;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const fileParsers = [
  { file: 'SALE!.xlsx', label: 'SALE!', parser: parseSaleFile },
  { file: 'STEAM GAMES.xlsx', label: 'STEAM GAMES', parser: parseSteamGamesFile },
  { file: 'Xbox Games.xlsx', label: 'Xbox Games', parser: parseXboxGamesFile },
  { file: 'PS Games.xlsx', label: 'PS Games', parser: parsePSGamesFile },
  { file: 'Catalog 2.xlsx', label: 'Catalog 2', parser: parseCatalog2File },
  { file: 'ovrok.xlsx', label: 'ovrok', parser: parseOvrokFile },
];

let allProducts = [];
for (const { file, label, parser } of fileParsers) {
  const filePath = path.join(PRODUCTS_DIR, file);
  process.stdout.write('Parsing: ' + label + '... ');
  const parsed = parser(filePath);
  process.stdout.write(parsed.length + ' products\n');
  allProducts = allProducts.concat(parsed);
}

// Deduplicate by title
const titleMap = new Map();
for (const p of allProducts) titleMap.set(p.title, p);
const deduplicated = Array.from(titleMap.values());

process.stdout.write('Total unique: ' + deduplicated.length + '\n');
process.stdout.write('Generating SQL...\n');

// Build SQL
const lines = [
  '-- RetroHub Products Seed',
  '-- ' + deduplicated.length + ' unique products',
  '-- Generated: ' + new Date().toISOString(),
  '',
  '-- Ensure unique constraint exists on title before upsert',
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_products_title_unique ON public.products(title);',
  '',
  'INSERT INTO public.products (title, category, delivery_type, platform, image_url, description, sale_price, cost_price, region, in_stock, is_active)',
  'VALUES',
];

const valueLines = deduplicated.map((p, i) => {
  const isLast = i === deduplicated.length - 1;
  return '(' +
    [
      esc(p.title),
      "'giftcard'",
      "'instant_code'",
      esc(p.platform),
      esc(p.image_url),
      esc(p.description || null),
      escNum(p.sale_price),
      escNum(p.cost_price),
      "'" + p.region + "'",
      '0',
      'true',
    ].join(', ') +
    ')' + (isLast ? '' : ',');
});

lines.push(...valueLines);
lines.push('ON CONFLICT (title) DO UPDATE SET');
lines.push('  sale_price = EXCLUDED.sale_price,');
lines.push('  cost_price = EXCLUDED.cost_price,');
lines.push('  image_url = EXCLUDED.image_url,');
lines.push('  platform = EXCLUDED.platform,');
lines.push('  region = EXCLUDED.region,');
lines.push('  updated_at = NOW();');

const sqlContent = lines.join('\n');
const outPath = path.join(__dirname, '..', 'database', 'products-seed.sql');
fs.writeFileSync(outPath, sqlContent, 'utf8');
process.stdout.write('Written to: scripts/database/products-seed.sql (' + (sqlContent.length / 1024).toFixed(1) + ' KB)\n');
