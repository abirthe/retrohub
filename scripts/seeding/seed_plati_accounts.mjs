import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.join(__dirname, '..', '..', '.env');
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

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function cleanProductTitle(rawTitle, defaultType = 'Account') {
  let title = rawTitle
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*гарантия[^)]*\)/gi, ' ')
    .replace(/\([^)]*автовыдача[^)]*\)/gi, ' ')
    .replace(/【[^】]*】/g, ' ')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ')
    .replace(/[⭐️✅🔥⚡️💥🎁❤️🚀⭐|#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  title = title
    .replace(/АВТОВЫДАЧА/gi, 'Auto-Delivery')
    .replace(/МОМЕНТАЛЬНО/gi, 'Instant')
    .replace(/НА ВАШ АККАУНТ/gi, 'To Your Account')
    .replace(/НА ВАШУ ПОЧТУ/gi, 'To Your Email')
    .replace(/АККАУНТ/gi, 'Account')
    .replace(/НОВЫЙ/gi, 'New')
    .replace(/ЛИЧНЫЙ/gi, 'Personal')
    .replace(/ПОДПИСКА/gi, 'Subscription')
    .replace(/МЕСЯЦ/gi, 'Month')
    .replace(/МЕС/gi, 'Month')
    .replace(/ГОД/gi, 'Year')
    .replace(/ДНЕЙ/gi, 'Days')
    .replace(/ТУРЦИЯ/gi, 'Turkey')
    .replace(/УКРАИНА/gi, 'Ukraine')
    .replace(/КАЗАХСТАН/gi, 'Kazakhstan')
    .replace(/РОССИЯ/gi, 'Russia')
    .replace(/США/gi, 'USA')
    .replace(/ИНДИЯ/gi, 'India')
    .replace(/ЕВРОПА/gi, 'Europe');

  title = title.replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();

  if (!title.toLowerCase().includes('account')) {
    title = `${title} Account`;
  }

  title = title.replace(/^[-,:;.\s]+|[-,:;.\s]+$/g, '').trim();

  if (title.length > 80) {
    title = title.slice(0, 80).trim();
  }

  return title;
}

async function fetchPlatiSection(id_r, sort = 'cnt_sell_desc', page = 1, rows = 50) {
  const url = new URL('https://plati.market/asp/block_goods_r.asp');
  url.searchParams.set('id_r', id_r.toString());
  url.searchParams.set('sort', sort);
  url.searchParams.set('page', page.toString());
  url.searchParams.set('rows', rows.toString());
  url.searchParams.set('curr', 'USD');
  url.searchParams.set('lang', 'en-US');
  url.searchParams.set('rnd', Math.random().toString());

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': 'lang=en-US; curr=USD;'
      }
    });

    if (!res.ok) return [];
    const html = await res.text();

    const items = [];
    const itemBlocks = html.split("<li class='section-list__item'>");

    for (let i = 1; i < itemBlocks.length; i++) {
      const block = itemBlocks[i];
      const idMatch = block.match(/product_id='(\d+)'/);
      const imgMatch = block.match(/class='preview-image[^']*'\s+src='([^']+)'/);
      const sellerMatch = block.match(/<span class='caption-semibold[^']*'>([^<]+)<\/span>/);
      const priceMatch = block.match(/<span name='price'[^>]*>([^<]+)<\/span>/);
      const titleMatch = block.match(/<span class='d-block footnote-medium[^']*'>([\s\S]*?)<\/span>/);
      const soldMatch = block.match(/<span name='sold'[^>]*>([\s\S]*?)<\/span>/);

      if (!idMatch || !priceMatch || !titleMatch) continue;

      const productId = idMatch[1];
      const rawPrice = priceMatch[1].replace(/[^\d.]/g, '');
      const priceUsd = parseFloat(rawPrice);
      if (isNaN(priceUsd) || priceUsd <= 0) continue;

      const rawSold = soldMatch ? soldMatch[1].trim() : '';
      let soldCount = 0;
      if (rawSold.toLowerCase().includes('sold')) {
        const numStr = rawSold.replace(/[^\d]/g, '');
        soldCount = parseInt(numStr, 10) || 0;
      }

      let imgUrl = imgMatch ? imgMatch[1] : '';
      if (imgUrl.startsWith('//')) imgUrl = `https:${imgUrl}`;
      if (!imgUrl) {
        imgUrl = `https://digiseller2.mycdn.ink/imgwebp.ashx?id_d=${productId}&w=500&h=500`;
      }

      items.push({
        productId,
        rawTitle: titleMatch[1].trim(),
        priceUsd,
        seller: sellerMatch ? sellerMatch[1].trim() : 'Verified Seller',
        soldCount,
        imgUrl
      });
    }

    return items;
  } catch (err) {
    return [];
  }
}

async function searchDigisellerApi(query, count = 50, page = 1) {
  const url = new URL('https://api.digiseller.com/api/cataloguer/front/products');
  url.searchParams.set('productName', query);
  url.searchParams.set('ownerId', 'plati');
  url.searchParams.set('currency', 'USD');
  url.searchParams.set('page', page.toString());
  url.searchParams.set('count', count.toString());
  url.searchParams.set('sortBy', 'popular');
  url.searchParams.set('lang', 'en-US');

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.content?.items) return [];

    return data.content.items.map(item => {
      const enName = item.name?.find(n => n.locale === 'en-US')?.value || item.name?.[0]?.value || '';
      return {
        productId: item.product_id?.toString(),
        rawTitle: enName,
        priceUsd: Number(item.price) || 0,
        seller: item.seller_name || 'Verified Seller',
        sellerRating: Number(item.seller_rating) || 0,
        soldCount: Number(item.total_sales) || Number(item.month_sales) || 0,
        imgUrl: `https://digiseller2.mycdn.ink/imgwebp.ashx?id_d=${item.product_id}&w=500&h=500`
      };
    }).filter(i => i.productId && i.priceUsd > 0);
  } catch (err) {
    return [];
  }
}

function generateAccountDescription(title, platform, type, seller) {
  return `### ⚡ ${title}

Get instant access to a verified **${type}** for **${platform}**. 100% genuine and sourced from top-rated sellers with verified reputation.

#### 🛡️ Product Highlights:
- **Instant Delivery:** Account credentials / activation details delivered directly after payment verification.
- **Top Reputation:** Verified seller (\`${seller}\`) on Plati Marketplace.
- **Safety Guarantee:** Tested and confirmed fully functional before order completion.
- **Full Ownership:** Allows email/password change where applicable.

---

#### 📋 How to Use:
1. Complete your order on RetroHub.
2. Receive your account login details (Username / Email + Password / Token) instantly.
3. Sign in to **${platform}** and follow security recommendations (change password, set up 2FA if supported).
4. Contact RetroHub customer support if you need any assistance with login or activation.`;
}

function getProductDedupeKey(title) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
}

async function fillMissingAccounts() {
  const BDT_RATE = 127;
  const PROFIT_MARKUP = 400;

  // 1. Fetch existing accounts from DB
  const { data: existing, error } = await supabase
    .from('products')
    .select('id, title, category, source_url')
    .ilike('title', '%account%');

  if (error) {
    process.exit(1);
  }

  const existingTitles = new Set(existing.map(p => getProductDedupeKey(p.title)));
  const existingSourceUrls = new Set(existing.map(p => p.source_url).filter(Boolean));

  const existingGames = existing.filter(p => ['pc_game', 'xbox_game', 'ps_game'].includes(p.category));
  const existingApps = existing.filter(p => p.category === 'software');
  const existingOthers = existing.filter(p => !['pc_game', 'xbox_game', 'ps_game', 'software'].includes(p.category));

  const neededGames = Math.max(0, 100 - existingGames.length);
  const neededApps = Math.max(0, 100 - existingApps.length);
  const neededOthers = Math.max(0, 100 - existingOthers.length);

  // Helper to process extra candidates
  function filterAndFormat(candidates, countNeeded, category, defaultPlatform, subcategoryType) {
    const newItems = [];
    // Sort candidates by sold count descending
    candidates.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));

    for (const c of candidates) {
      if (newItems.length >= countNeeded) break;
      const cleanTitle = cleanProductTitle(c.rawTitle, 'Account');
      if (!cleanTitle || cleanTitle.length < 5) continue;

      const key = getProductDedupeKey(cleanTitle);
      const url = `https://plati.market/itm/${c.productId}`;

      if (existingTitles.has(key) || existingSourceUrls.has(url)) continue;
      existingTitles.add(key);
      existingSourceUrls.add(url);

      const costBDT = Math.max(50, Math.round(c.priceUsd * BDT_RATE));
      const saleBDT = costBDT + PROFIT_MARKUP;

      let platform = defaultPlatform;
      const lower = cleanTitle.toLowerCase();
      if (lower.includes('steam')) platform = 'Steam';
      else if (lower.includes('playstation') || lower.includes('psn') || lower.includes('ps4') || lower.includes('ps5')) platform = 'PlayStation';
      else if (lower.includes('xbox')) platform = 'Xbox';
      else if (lower.includes('epic')) platform = 'Epic Games';
      else if (lower.includes('ea') || lower.includes('origin')) platform = 'EA App';
      else if (lower.includes('ubisoft')) platform = 'Ubisoft';
      else if (lower.includes('minecraft')) platform = 'Minecraft';
      else if (lower.includes('gta')) platform = 'Rockstar Games';
      else if (lower.includes('nintendo')) platform = 'Nintendo';
      else if (lower.includes('chatgpt') || lower.includes('openai')) platform = 'OpenAI';
      else if (lower.includes('claude')) platform = 'Anthropic';
      else if (lower.includes('canva')) platform = 'Canva';
      else if (lower.includes('vpn') || lower.includes('surfshark') || lower.includes('nordvpn')) platform = 'VPN';
      else if (lower.includes('telegram')) platform = 'Telegram';
      else if (lower.includes('discord')) platform = 'Discord';
      else if (lower.includes('twitter') || lower.includes(' x ')) platform = 'Twitter / X';
      else if (lower.includes('instagram')) platform = 'Instagram';
      else if (lower.includes('tiktok')) platform = 'TikTok';
      else if (lower.includes('reddit')) platform = 'Reddit';
      else if (lower.includes('google') || lower.includes('gmail')) platform = 'Google';
      else if (lower.includes('twitch')) platform = 'Twitch';

      const desc = generateAccountDescription(cleanTitle, platform, subcategoryType, c.seller);

      newItems.push({
        title: cleanTitle,
        category,
        platform,
        region: 'GLOBAL',
        delivery_type: 'instant_code',
        cost_price: costBDT,
        sale_price: saleBDT,
        in_stock: 100,
        is_active: true,
        image_url: c.imgUrl,
        source_platform: 'Plati.market',
        source_url: url,
        description: desc
      });
    }

    return newItems;
  }

  // ── Fetch Games page 2 & extra sections if needed ─────────────────────────
  const additionalGames = [];
  if (neededGames > 0) {
    const extraSections = [22764, 22380, 22229, 26472, 24103, 24108, 24127, 24290];
    for (const s of extraSections) {
      const items = await fetchPlatiSection(s, 'cnt_sell_desc', 2, 40);
      additionalGames.push(...items);
    }
  }
  const gamesToAdd = filterAndFormat(additionalGames, neededGames, 'pc_game', 'PC', 'Gaming Account');

  // ── Fetch Apps page 2 & extra terms if needed ─────────────────────────────
  const additionalApps = [];
  if (neededApps > 0) {
    const extraTerms = [
      'ChatGPT Plus account',
      'Claude Pro account',
      'Canva account',
      'NordVPN account',
      'Surfshark account',
      'ExpressVPN account',
      'Office 365 account',
      'Grammarly account',
      'Spotify Premium account',
      'Apple Music account'
    ];
    for (const t of extraTerms) {
      const items = await searchDigisellerApi(t, 25, 1);
      additionalApps.push(...items);
    }
  }
  const appsToAdd = filterAndFormat(additionalApps, neededApps, 'software', 'Web', 'Application Account');

  // ── Fetch Others page 2 & extra sections if needed ────────────────────────
  const additionalOthers = [];
  if (neededOthers > 0) {
    const extraSections = [24281, 27642, 24278, 24276, 25676, 203570, 24275];
    for (const s of extraSections) {
      const items = await fetchPlatiSection(s, 'cnt_sell_desc', 2, 40);
      additionalOthers.push(...items);
    }
  }
  const othersToAdd = filterAndFormat(additionalOthers, neededOthers, 'topup', 'Service', 'Other Account');

  const toInsert = [...gamesToAdd, ...appsToAdd, ...othersToAdd];
  if (toInsert.length > 0) {
    await supabase.from('products').insert(toInsert);
  }
}

fillMissingAccounts().catch(() => process.exit(1));
