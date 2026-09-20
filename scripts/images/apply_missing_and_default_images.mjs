import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.resolve(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

const GENERIC_XBOX_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Xbox_one_logo.svg';

// Verified high-res artworks for services, top-ups & subscriptions
const CURATED_TARGETS = [
  // Top-ups & Special
  { match: t => t.includes('blood strike'), url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2574250/header.jpg', provider: 'Steam (Blood Strike)' },
  { match: t => t.includes('delta force'), url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2507950/header.jpg', provider: 'Steam (Delta Force)' },
  { match: t => t.includes('where winds meet'), url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2933480/header.jpg', provider: 'Steam (Where Winds Meet)' },
  { match: t => t.includes('wuthering waves'), url: 'https://lblog.fp.guinfra.com/file/68ef7170facff357e4b89ed9Xf3IStV003', provider: 'Official Artwork' },
  { match: t => t.includes('zenless zone zero') || t.includes('zzz'), url: 'https://4kwallpapers.com/images/wallpapers/zenless-zone-zero-3840x2160-20255.jpg', provider: 'Official Artwork' },
  { match: t => t.includes('neverness to everness') || t.includes('nte'), url: 'https://cdn.mos.cms.futurecdn.net/fP2W3c2xYvP6q2iE4LpMvV.jpg', provider: 'Official Artwork' },
  { match: t => t.includes('vp') || t.includes('valorant'), url: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Valorant_logo_-_pink_color_version.svg', provider: 'Official Logo' },
  { match: t => t.includes('genesis crystal') || t.includes('welkin') || t.includes('gnostic'), url: 'https://upload.wikimedia.org/wikipedia/en/5/5d/Genshin_Impact_logo.svg', provider: 'Official Logo' },
  { match: t => t.includes('honkai') || t.includes('stellar jade'), url: 'https://upload.wikimedia.org/wikipedia/en/4/44/Honkai_Star_Rail_logo.svg', provider: 'Official Logo' },
  { match: t => t.includes('pubg') || t.includes('unknown cash') || t.includes(' uc'), url: 'https://upload.wikimedia.org/wikipedia/en/2/22/PlayerUnknown%27s_Battlegrounds_cover.jpg', provider: 'Official Cover' },
  { match: t => t.includes('free fire') || t.includes('diamond'), url: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Garena_Free_Fire_logo.png', provider: 'Official Logo' },
  { match: t => t.includes('mobile legends') || t.includes('mlbb'), url: 'https://upload.wikimedia.org/wikipedia/en/1/18/Mobile_Legends_Bang_Bang_logo.png', provider: 'Official Logo' },
  { match: t => t.includes('roblox') || t.includes('robux'), url: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Roblox_player_icon_black.svg', provider: 'Official Logo' },
  { match: t => t.includes('fortnite') || t.includes('v-bucks'), url: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/FortniteLogo.svg', provider: 'Official Logo' },

  // Subscriptions & Software
  { match: t => t.includes('quillbot'), url: 'https://assets.quillbot.com/images/og-quillbot-img.png', provider: 'Official Artwork' },
  { match: t => t.includes('tryhackme'), url: 'https://www.hostingadvice.com/wp-content/uploads/2020/07/HA-TryHackMe.jpg', provider: 'Official Artwork' },
  { match: t => t.includes('chegg'), url: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Chegg_logo.svg', provider: 'Official Logo' },
  { match: t => t.includes('malwarebytes'), url: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Malwarebytes_logo.svg', provider: 'Official Logo' },
  { match: t => t.includes('dolby'), url: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Dolby_Atmos_logo.svg', provider: 'Official Logo' },
  { match: t => t.includes('expressvpn'), url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/ExpressVPN_logo.svg', provider: 'Official Logo' },
  { match: t => t.includes('discord'), url: 'https://upload.wikimedia.org/wikipedia/en/9/98/Discord_logo.svg', provider: 'Official Logo' },
  { match: t => t.includes('grammarly'), url: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Grammarly_logo.svg', provider: 'Official Logo' },
  { match: t => t.includes('telegram'), url: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg', provider: 'Official Logo' },
  { match: t => t.includes('google one'), url: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg', provider: 'Official Logo' },
  { match: t => t.includes('adobe'), url: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Adobe_Acrobat_DC_logo_2020.svg', provider: 'Official Logo' },
  { match: t => t.includes('windows'), url: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Windows_logo_-_2012_%28dark_blue%29.svg', provider: 'Official Logo' },
  { match: t => t.includes('netflix'), url: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg', provider: 'Official Logo' },
  { match: t => t.includes('prime video'), url: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png', provider: 'Official Logo' },
  { match: t => t.includes('spotify'), url: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg', provider: 'Official Logo' }
];

export function cleanTitle(rawTitle) {
  if (!rawTitle) return '';

  let title = rawTitle;

  // 1. Remove platform tags inside parentheses before splitting pipes
  title = title.replace(/\(Xbox Series [^)]*\)/gi, '');
  title = title.replace(/\(Xbox One[^)]*\)/gi, '');
  title = title.replace(/\(PS[45][^)]*\)/gi, '');
  title = title.replace(/\(PC\/XBOX[^)]*\)/gi, '');
  title = title.replace(/\(PC[^)]*\)/gi, '');
  title = title.replace(/\(PSVR2[^)]*\)/gi, '');
  title = title.replace(/\[PSVR2\]/gi, '');

  // 2. Only split on variant delimiter " | "
  if (title.includes(' | ')) {
    title = title.split(/\s+\|\s+/)[0];
  }

  // 3. Remove region tags
  const regions = [
    'GLOBAL', 'TURKEY', 'ARGENTINA', 'EUROPE', 'UNITED STATES',
    'BRAZIL', 'ASIA', 'LATAM', 'INDIA', 'UK', 'USA', 'AUSTRALIA', 'CANADA'
  ];
  title = title.replace(new RegExp(`\\b(${regions.join('|')})\\b`, 'gi'), '');

  // 4. Remove packaging/noise keywords
  const noise = [
    'XBOX LIVE Key', 'Xbox Live Key', 'Xbox Live', 'PSN Key', 'Steam Key', 'PC Key',
    'Standard Edition', 'Deluxe Edition', 'Ultimate Edition', 'Premium Edition',
    'Gold Edition', 'Complete Edition', 'GOTY Edition', 'Pre-Order', 'Pre-purchase',
    'Cross-Gen Bundle', 'Cross-Gen', 'Bundle', 'DLC'
  ];
  title = title.replace(new RegExp(`\\b(${noise.join('|')})\\b`, 'gi'), '');

  // 5. Remove any remaining parenthesis content, brackets, trademark symbols
  title = title.replace(/\([^)]*\)/g, '');
  title = title.replace(/\[[^\]]*\]/g, '');
  title = title.replace(/[™®©]/g, '');
  title = title.replace(/[-_:]/g, ' ');
  title = title.replace(/\s+/g, ' ').trim();

  return title;
}

// Search Steam Store
async function searchSteam(query) {
  try {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      return {
        url: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`,
        name: item.name,
        provider: 'Steam Store'
      };
    }
  } catch (e) {}
  return null;
}

// Search DuckDuckGo Images
async function searchDDG(query) {
  try {
    const tokenUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
    const tokenRes = await fetch(tokenUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!tokenRes.ok) return null;
    const html = await tokenRes.text();
    const vqdMatch = html.match(/vqd=([0-9-_]+)/) || html.match(/vqd="([^"]+)"/);
    if (!vqdMatch) return null;

    const vqd = vqdMatch[1];
    const apiUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`;
    const apiRes = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!apiRes.ok) return null;
    const data = await apiRes.json();
    if (data.results && data.results.length > 0) {
      for (const r of data.results.slice(0, 4)) {
        if (!r.image || r.image.includes('placeholder') || r.image.includes('alamy') || r.image.includes('shutterstock')) {
          continue;
        }
        if (r.width >= 300 && r.height >= 200) {
          return {
            url: r.image,
            provider: 'DuckDuckGo Web'
          };
        }
      }
    }
  } catch (e) {}
  return null;
}

async function findImage(rawTitle, category) {
  const clean = cleanTitle(rawTitle);
  const rawLower = rawTitle.toLowerCase();

  // 1. Check curated list
  for (const entry of CURATED_TARGETS) {
    if (entry.match(rawLower)) {
      return { url: entry.url, provider: entry.provider };
    }
  }

  // 2. If it's a game, try Steam first!
  if (category.includes('game')) {
    const steam = await searchSteam(clean);
    if (steam) {
      return steam;
    }
  }

  // 3. DuckDuckGo Image Search Fallback
  const queries = [
    `${clean} game cover art wallpaper`,
    `${clean} official artwork banner`
  ];

  for (const q of queries) {
    const ddg = await searchDDG(q);
    if (ddg) return ddg;
  }

  return null;
}

async function main() {
  console.log('======================================================');
  console.log('🚀 RetroHub Product Image Auto-Finder & Database Updater');
  console.log('======================================================\n');

  console.log('Fetching all products from Supabase...');
  const PAGE_SIZE = 1000;
  const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const numPages = Math.ceil((count || 0) / PAGE_SIZE);

  const promises = Array.from({ length: numPages }, (_, i) => {
    return supabase
      .from('products')
      .select('id, title, category, platform, image_url')
      .range(i * PAGE_SIZE, (i + 1) * PAGE_SIZE - 1);
  });

  const res = await Promise.all(promises);
  const allProducts = res.flatMap(r => r.data || []);
  console.log(`Total products in catalog: ${allProducts.length}`);

  // Filter targets: missing images or generic default logos on games
  const targets = allProducts.filter(p => {
    if (!p.image_url || p.image_url.trim() === '') return true;
    if (p.image_url.includes('placeholder')) return true;
    if (p.image_url === GENERIC_XBOX_LOGO && p.category.includes('game')) return true;
    return false;
  });

  console.log(`Found ${targets.length} products needing real cover images.\n`);

  // Group by clean title to minimize network queries
  const groupMap = new Map();
  for (const p of targets) {
    const clean = cleanTitle(p.title);
    if (!groupMap.has(clean)) {
      groupMap.set(clean, []);
    }
    groupMap.get(clean).push(p);
  }

  console.log(`Grouped into ${groupMap.size} unique product search targets.`);
  console.log(`Starting automated search & database updates...\n`);

  let matchedGroups = 0;
  let updatedProducts = 0;
  const failed = [];

  let idx = 0;
  for (const [clean, items] of groupMap.entries()) {
    idx++;
    const sample = items[0];
    process.stdout.write(`[${idx}/${groupMap.size}] "${clean.slice(0, 38)}" (${items.length} item${items.length > 1 ? 's' : ''})... `);

    const match = await findImage(sample.title, sample.category);

    if (match) {
      console.log(`✅ [${match.provider}]`);

      // Update in Supabase
      const ids = items.map(p => p.id);
      const { error: updateErr } = await supabase
        .from('products')
        .update({ image_url: match.url, updated_at: new Date().toISOString() })
        .in('id', ids);

      if (updateErr) {
        console.error(`   ❌ Supabase update error:`, updateErr.message);
      } else {
        matchedGroups++;
        updatedProducts += items.length;
      }
    } else {
      console.log(`❌ No match found`);
      failed.push(clean);
    }

    // Rate-limiting pause
    await new Promise(r => setTimeout(r, 120));
  }

  console.log('\n======================================================');
  console.log(`🎉 ALL DONE!`);
  console.log(`Unique titles matched: ${matchedGroups}/${groupMap.size} (${((matchedGroups/groupMap.size)*100).toFixed(1)}%)`);
  console.log(`Total database products updated: ${updatedProducts}/${targets.length}`);
  if (failed.length > 0) {
    console.log(`Remaining unassigned titles (${failed.length}):`);
    failed.slice(0, 15).forEach(f => console.log(` - ${f}`));
  }
  console.log('======================================================\n');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
