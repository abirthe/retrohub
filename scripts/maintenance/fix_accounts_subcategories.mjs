import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const isExecute = process.argv.includes('--execute');

async function fixAccounts() {
  process.stdout.write(`=== Fix Accounts Subcategories & Clean Up ===\n`);
  process.stdout.write(`Mode: ${isExecute ? 'LIVE EXECUTE' : 'DRY-RUN (Preview only)'}\n\n`);

  const products = [];
  let from = 0;
  while (true) {
    const { data } = await supabase.from('products').select('*').range(from, from + 999);
    if (!data || data.length === 0) break;
    products.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }

  process.stdout.write(`Total products in database: ${products.length}\n`);

  const accountProducts = products.filter(p => p.title.toLowerCase().includes('account'));
  process.stdout.write(`Total products tagged with 'account': ${accountProducts.length}\n\n`);

  const GIFTCARD_KEYWORDS = [
    'eshop card', 'gift card', 'giftcard', 'gift cards', 'itunes gift', 'try(tl)', 'card try',
    'apple gifts cards', 'nintendo card'
  ];

  const TOPUP_SERVICE_KEYWORDS = [
    'followers', 'likes', 'views', 'telegram stars', 'tiktok coins', 'twitch bits',
    'twitch chat', 'twitch viewers', 'twitch prime sub', 'twitch subscription',
    'proxy', 'v2raytun', 'wireguard', 'vless', 'boosts', 'coupon 3000 points',
    'tango live coins', 'tango - live', 'balance replenishment', 'streamhub',
    'twitter likes', 'twitter tweets', 'kick viewers'
  ];

  const SUBSCRIPTION_KEYWORDS = [
    'discord nitro', 'tinder gold', 'pure - without shame'
  ];

  const reclassifyToGiftCard = [];
  const reclassifyToTopup = [];
  const reclassifyToSubs = [];
  const reclassifyToGames = [];
  const appDuplicatesToDelete = [];
  const otherDuplicatesToDelete = [];

  for (const p of accountProducts) {
    const t = p.title.toLowerCase();
    if (GIFTCARD_KEYWORDS.some(k => t.includes(k))) {
      reclassifyToGiftCard.push(p);
    } else if (TOPUP_SERVICE_KEYWORDS.some(k => t.includes(k)) && !t.includes('telegram premium') && !t.includes('twitch account') && !t.includes('ready twitch account')) {
      reclassifyToTopup.push(p);
    } else if (SUBSCRIPTION_KEYWORDS.some(k => t.includes(k))) {
      reclassifyToSubs.push(p);
    } else if (p.category === 'software') {
      const isMobileGame = [
        'minecraft pe', 'minecraft dream', 'terraria', 'gta san andreas', 'geometry dash',
        'brawl stars', 'hitman', 'bully', 'red dead redemption'
      ].some(k => t.includes(k));
      if (isMobileGame) {
        reclassifyToGames.push(p);
      }
    }
  }

  process.stdout.write(`1. Misclassified Gift Cards -> 'giftcard' (${reclassifyToGiftCard.length} items):\n`);
  for (const p of reclassifyToGiftCard) {
    process.stdout.write(`   - "${p.title}"\n`);
  }

  process.stdout.write(`\n2. Social / Proxies / Coins -> 'topup' (${reclassifyToTopup.length} items)\n`);
  process.stdout.write(`\n3. Discord / Subscriptions -> 'subscription' (${reclassifyToSubs.length} items)\n`);
  process.stdout.write(`\n4. Mobile Games in software -> 'pc_game' for accounts_games (${reclassifyToGames.length} items)\n`);

  const reclassifiedIds = new Set([
    ...reclassifyToGiftCard.map(p => p.id),
    ...reclassifyToTopup.map(p => p.id),
    ...reclassifyToSubs.map(p => p.id),
    ...reclassifyToGames.map(p => p.id)
  ]);

  const appAccounts = accountProducts.filter(p => !reclassifiedIds.has(p.id) && p.category === 'software');

  // Exact service extraction so different software NEVER get grouped
  function getAppDedupeKey(title) {
    const t = title.toLowerCase();
    let service = '';
    if (t.includes('canva')) service = 'canva';
    else if (t.includes('chatgpt')) service = 'chatgpt';
    else if (t.includes('claude')) service = 'claude';
    else if (t.includes('google ai') || t.includes('gemini')) service = 'google_ai';
    else if (t.includes('duolingo')) service = 'duolingo';
    else if (t.includes('coreldraw')) service = 'coreldraw';
    else if (t.includes('midjourney')) service = 'midjourney';
    else if (t.includes('mullvad')) service = 'mullvad';
    else if (t.includes('apple id')) service = 'apple_id';
    else if (t.includes('faceapp')) service = 'faceapp';
    else if (t.includes('procreate')) service = 'procreate';
    else if (t.includes('visio') || t.includes('project')) service = 'ms_visio';
    else if (t.includes('office')) service = 'office';
    else if (t.includes('windows 11')) service = 'win11';
    else if (t.includes('windows 10')) service = 'win10';
    else service = `unique_${title.slice(0, 20)}`;

    let duration = 'standard';
    if (t.includes('1 month') || t.includes('30 day')) duration = '1m';
    else if (t.includes('6 month')) duration = '6m';
    else if (t.includes('12 month') || t.includes('1 year') || t.includes('15 month')) duration = '12m';
    else if (t.includes('lifetime') || t.includes('perpetual')) duration = 'lifetime';

    let tier = '';
    if (t.includes('family')) tier = 'family';
    else if (t.includes('personal')) tier = 'personal';
    else if (t.includes('pro plus') || t.includes('proplus')) tier = 'proplus';
    else if (t.includes('pro')) tier = 'pro';
    else if (t.includes('home')) tier = 'home';
    else if (t.includes('team') || t.includes('teacher') || t.includes('edu')) tier = 'team';

    let reg = '';
    if (t.includes('usa') || t.includes('american')) reg = 'us';
    else if (t.includes('russia') || t.includes('ru')) reg = 'ru';

    return `${service}::${tier}::${duration}::${reg}`;
  }

  const appClusters = new Map();
  for (const p of appAccounts) {
    const k = getAppDedupeKey(p.title);
    if (!appClusters.has(k)) appClusters.set(k, []);
    appClusters.get(k).push(p);
  }

  process.stdout.write(`\n5. Clean Application Account Duplicates:\n`);
  for (const [k, list] of appClusters) {
    if (list.length > 1) {
      list.sort((a, b) => {
        const profitA = (a.sale_price || 0) - (a.cost_price || 0);
        const profitB = (b.sale_price || 0) - (b.cost_price || 0);
        if (profitB !== profitA) return profitB - profitA;
        if (a.sale_price !== b.sale_price) return a.sale_price - b.sale_price;
        return (b.description?.length || 0) - (a.description?.length || 0);
      });

      const keep = list[0];
      const del = list.slice(1);
      appDuplicatesToDelete.push(...del);

      process.stdout.write(`   Group [${k}]: Keep 1, Delete ${del.length}\n`);
      process.stdout.write(`     ✔ KEEP: "${keep.title}" (${keep.sale_price} Tk)\n`);
      for (const d of del) {
        process.stdout.write(`     ✖ DELETE: "${d.title}" (${d.sale_price} Tk)\n`);
      }
    }
  }

  // 6. Telegram Premium clean up
  const otherAccounts = accountProducts.filter(p => !reclassifiedIds.has(p.id) && p.category !== 'software' && !['pc_game', 'xbox_game', 'ps_game'].includes(p.category));
  const otherClusters = new Map();
  for (const p of otherAccounts) {
    const t = p.title.toLowerCase();
    if (t.includes('telegram premium')) {
      const k = 'telegram_premium';
      if (!otherClusters.has(k)) otherClusters.set(k, []);
      otherClusters.get(k).push(p);
    }
  }

  for (const [k, list] of otherClusters) {
    if (list.length > 1) {
      list.sort((a, b) => (b.sale_price - b.cost_price) - (a.sale_price - a.cost_price) || a.sale_price - b.sale_price);
      const keep = list[0];
      const del = list.slice(1);
      otherDuplicatesToDelete.push(...del);
      process.stdout.write(`\n   Group [${k}]: Keep 1, Delete ${del.length}\n`);
      process.stdout.write(`     ✔ KEEP: "${keep.title}" (${keep.sale_price} Tk)\n`);
      for (const d of del) {
        process.stdout.write(`     ✖ DELETE: "${d.title}" (${d.sale_price} Tk)\n`);
      }
    }
  }

  const totalDeletes = appDuplicatesToDelete.length + otherDuplicatesToDelete.length;
  process.stdout.write(`\n=== SUMMARY OF ACTIONS ===\n`);
  process.stdout.write(`- Reclassify to Gift Card: ${reclassifyToGiftCard.length}\n`);
  process.stdout.write(`- Reclassify to Top-up: ${reclassifyToTopup.length}\n`);
  process.stdout.write(`- Reclassify to Subscription: ${reclassifyToSubs.length}\n`);
  process.stdout.write(`- Reclassify to Game Accounts: ${reclassifyToGames.length}\n`);
  process.stdout.write(`- Duplicate Application/Other Accounts to Delete: ${totalDeletes}\n`);

  if (!isExecute) {
    process.stdout.write(`\n[DRY-RUN COMPLETE] Run with --execute to apply changes.\n`);
    return;
  }

  process.stdout.write(`\nApplying database updates...\n`);

  // 1. Reclassify gift cards
  for (const p of reclassifyToGiftCard) {
    const cleanTitle = p.title.replace(/\s+Account$/i, '').trim();
    await supabase.from('products').update({ category: 'giftcard', title: cleanTitle }).eq('id', p.id);
  }
  process.stdout.write(`✔ Updated ${reclassifyToGiftCard.length} gift cards.\n`);

  // 2. Reclassify topups
  for (const p of reclassifyToTopup) {
    const cleanTitle = p.title.replace(/\s+Account$/i, '').trim();
    await supabase.from('products').update({ category: 'topup', title: cleanTitle }).eq('id', p.id);
  }
  process.stdout.write(`✔ Updated ${reclassifyToTopup.length} top-ups / services.\n`);

  // 3. Reclassify subscriptions
  for (const p of reclassifyToSubs) {
    const cleanTitle = p.title.replace(/\s+Account$/i, '').trim();
    await supabase.from('products').update({ category: 'subscription', title: cleanTitle }).eq('id', p.id);
  }
  process.stdout.write(`✔ Updated ${reclassifyToSubs.length} subscriptions.\n`);

  // 4. Reclassify mobile games to pc_game
  for (const p of reclassifyToGames) {
    await supabase.from('products').update({ category: 'pc_game' }).eq('id', p.id);
  }
  process.stdout.write(`✔ Updated ${reclassifyToGames.length} mobile games into games category.\n`);

  // 5. Delete duplicate application & other accounts
  const deleteIds = [...appDuplicatesToDelete, ...otherDuplicatesToDelete].map(p => p.id);
  for (let i = 0; i < deleteIds.length; i += 100) {
    const slice = deleteIds.slice(i, i + 100);
    await supabase.from('products').delete().in('id', slice);
  }
  process.stdout.write(`✔ Deleted ${deleteIds.length} redundant duplicate accounts.\n`);

  process.stdout.write(`\nALL DATABASE FIXES APPLIED SUCCESSFULLY!\n`);
}

fixAccounts().catch(err => {
  console.error(err);
  process.exit(1);
});
