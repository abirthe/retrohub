import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env if not present
const envPath = fs.existsSync(path.join(__dirname, '..', '..', '.env'))
  ? path.join(__dirname, '..', '..', '.env')
  : path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^\"|\"$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const jsonPath = fs.existsSync(path.join(__dirname, 'market_scraped.json'))
  ? path.join(__dirname, 'market_scraped.json')
  : path.join(process.cwd(), 'scripts', 'pricing', 'market_scraped.json');
const marketData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Build candidate list
const candidates = [];
for (const p of marketData) {
  let minChildPrice = null;
  if (p.children && p.children.length > 0) {
    const validPrices = p.children.map(c => Number(c.price)).filter(pr => !isNaN(pr) && pr > 0);
    if (validPrices.length > 0) {
      minChildPrice = Math.min(...validPrices);
    }
  }

  let parentPrice = null;
  if (p.price) {
    const firstPart = p.price.toString().split('-')[0].trim();
    const num = Number(firstPart);
    if (!isNaN(num) && num > 0) {
      parentPrice = num;
    }
  }
  if (!parentPrice) {
    parentPrice = minChildPrice;
  }

  candidates.push({
    type: 'parent',
    name: p.name,
    slug: p.slug,
    price: parentPrice
  });

  for (const ch of (p.children || [])) {
    const pr = Number(ch.price);
    if (!isNaN(pr) && pr > 0) {
      candidates.push({
        type: 'child',
        name: ch.name,
        parentName: p.name,
        slug: ch.slug,
        price: pr
      });
    }
  }
}

async function run() {
  const { data: dbProducts, error } = await supabase.from('products')
    .select('id, title, category, sale_price, cost_price')
    .or('sale_price.is.null,sale_price.eq.0');

  if (error) {
    process.stderr.write('Supabase error: ' + error.message + '\n');
    return;
  }

  process.stdout.write('Total empty DB products: ' + dbProducts.length + '\n');
  process.stdout.write('Total market candidates: ' + candidates.length + '\n');

  const matched = [];
  const unmatched = [];

  for (const dbP of dbProducts) {
    const rawTitle = dbP.title.trim();
    const cleanTitle = rawTitle.replace(/^"+/, '').trim();
    const parts = cleanTitle.split('|').map(s => s.trim());
    const lastPart = parts[parts.length - 1];
    const secondPart = parts.length > 2 ? parts.slice(1).join(' | ') : lastPart;
    const normDb = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

    let match = null;

    // 1. Direct child exact match
    match = candidates.find(c => c.type === 'child' && (
      c.name.toLowerCase() === cleanTitle.toLowerCase() ||
      `${c.parentName} | ${c.name}`.toLowerCase() === cleanTitle.toLowerCase() ||
      `${c.parentName} ${c.name}`.toLowerCase() === cleanTitle.toLowerCase()
    ));

    // 2. Match by last part or second part if child
    if (!match) {
      match = candidates.find(c => c.type === 'child' && (
        c.name.toLowerCase() === lastPart.toLowerCase() ||
        c.name.toLowerCase() === secondPart.toLowerCase()
      ));
    }

    // 3. Normalized string match
    if (!match) {
      match = candidates.find(c => {
        if (c.type === 'child') {
          const normChild = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const normCombo = (c.parentName + c.name).toLowerCase().replace(/[^a-z0-9]/g, '');
          return normDb === normChild || normDb === normCombo;
        }
        return false;
      });
    }

    // 4. If title starts with 'Sale | '
    if (!match && cleanTitle.startsWith('Sale | ')) {
      const saleItem = cleanTitle.replace(/^Sale\s*\|\s*/, '').trim();
      const normSale = saleItem.toLowerCase().replace(/[^a-z0-9]/g, '');
      match = candidates.find(c => c.type === 'child' && (
        c.name.toLowerCase() === saleItem.toLowerCase() ||
        c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normSale
      ));
    }

    // 5. Parent name exact match
    if (!match) {
      match = candidates.find(c => c.type === 'parent' && (
        c.name.toLowerCase() === cleanTitle.toLowerCase() ||
        c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normDb
      ));
    }

    // 6. Fortnite partial (e.g. '"Fortnite V-Bucks ( PC | 800 V-bucks' or '"Fortnite V-Bucks ( PC')
    if (!match && cleanTitle.toLowerCase().includes('fortnite') && cleanTitle.toLowerCase().includes('v-bucks')) {
      const vbMatch = cleanTitle.match(/(\d+)\s*v-bucks/i);
      if (vbMatch) {
        const count = vbMatch[1];
        match = candidates.find(c => c.parentName?.toLowerCase().includes('fortnite') && c.name.toLowerCase().includes(count));
      } else {
        // Parent Fortnite product
        match = candidates.find(c => c.type === 'parent' && c.name.toLowerCase().includes('fortnite'));
        if (match && !match.price) {
          match.price = 825; // min price of Fortnite 800 V-bucks
        }
      }
    }

    // 7. BDT in title (e.g. 'Windows Activation Key | 399 BDT', 'Adobe Creative Cloud | 5700 BDT', 'Wuthering Waves | 625 BDT', 'MARVEL RIVALS | Lattices | 130 BDT')
    if (!match) {
      const bdtMatch = cleanTitle.match(/(\d+)\s*BDT/i);
      if (bdtMatch) {
        match = { name: cleanTitle, price: parseInt(bdtMatch[1], 10), note: 'BDT regex' };
      }
    }

    // 8. Truncated titles like 'Where Winds Meet | 000 Echo Beads', 'Where Winds Meet | 12', 'Where Winds Meet | 3', 'Where Winds Meet | 6'
    if (!match && cleanTitle.startsWith('Where Winds Meet | ')) {
      if (lastPart === '12' || lastPart === '12,000 Echo Beads') {
        match = candidates.find(c => c.slug === '12000-echo-beads');
      } else if (lastPart === '6' || lastPart === '6,000 Echo Beads') {
        match = candidates.find(c => c.slug === '6000-echo-beads');
      } else if (lastPart === '3' || lastPart === '3,000 Echo Beads' || lastPart === '000 Echo Beads') {
        match = candidates.find(c => c.slug === '3000-echo-beads');
      }
    }

    // 9. 'Wuthering Waves | 1' -> 1090 Lunites (1800)
    if (!match && cleanTitle === 'Wuthering Waves | 1') {
      match = candidates.find(c => c.slug?.includes('1090-lunites'));
    }

    // 10. 'MARVEL RIVALS | Lattices | 1' -> 1000 Lattices (1225)
    if (!match && cleanTitle === 'MARVEL RIVALS | Lattices | 1') {
      match = candidates.find(c => c.slug === '1000-lattices');
    }

    // 11. 'Adobe Creative Cloud | 1' -> Adobe 1 Month (99)
    if (!match && cleanTitle === 'Adobe Creative Cloud | 1') {
      match = candidates.find(c => c.slug === 'adobe-1-month');
    }

    // 12. 'Windows Activation Key | 1' -> Windows 11 - PRO (399)
    if (!match && cleanTitle === 'Windows Activation Key | 1') {
      match = candidates.find(c => c.slug === 'windows-11-home' || c.slug === 'windows-11-pro');
    }

    if (match && match.price && !isNaN(match.price) && match.price > 0) {
      matched.push({ dbP, match, price: match.price });
    } else {
      unmatched.push(dbP);
    }
  }

  process.stdout.write('Matched: ' + matched.length + ' / ' + dbProducts.length + '\n');
  if (unmatched.length > 0) {
    process.stdout.write('Unmatched (' + unmatched.length + '):\n' + JSON.stringify(unmatched.map(u => u.title), null, 2) + '\n');
  }

  process.stdout.write(`\nUpdating ${matched.length} products in database...\n`);
  let updatedCount = 0;
  let errorCount = 0;

  for (const item of matched) {
    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          sale_price: item.price,
          cost_price: item.price
        })
        .eq('id', item.dbP.id);

      if (updateError) {
        errorCount++;
        process.stderr.write(`Failed to update ${item.dbP.title}: ${updateError.message}\n`);
      } else {
        updatedCount++;
      }
    } catch (e) {
      errorCount++;
      process.stderr.write(`Exception on ${item.dbP.title}: ${e.message}\n`);
    }
  }

  process.stdout.write(`Done! Successfully updated: ${updatedCount}, Errors: ${errorCount}\n`);
}

run();
