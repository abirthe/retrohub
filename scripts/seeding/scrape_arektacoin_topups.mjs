import { createClient } from '@supabase/supabase-js';

const topupConfigs = [
  {
    url: 'https://arektacoinstore.com/valorant/valorant-points-bd-region-redeem-code',
    baseTitle: 'Valorant Points (BD) Redeem Code',
    region: 'BD',
    delivery_type: 'instant_code',
    platform: 'Riot Games',
    image_url: '/images/topups/valorant-points.jpg',
    cleanVariant: (name) => {
      return name
        .replace(/^BD\s*-\s*/i, '')
        .replace(/\bCODE\b/i, 'Code')
        .replace(/\bOFFER\b/i, 'Offer')
        .trim();
    },
    overview: 'Instantly top up your Valorant account in the Bangladesh (BD) region using 100% official Riot Games redeem codes. Unlock the latest weapon skin bundles, battle passes, radianite points, and exclusive agent accessories immediately upon redemption.'
  },
  {
    url: 'https://arektacoinstore.com/valorant/valorant-points-php-region-philippines',
    baseTitle: 'Valorant Points (Philippines)',
    region: 'PH',
    delivery_type: 'instant_code',
    platform: 'Riot Games',
    image_url: '/images/topups/valorant-points.jpg',
    cleanVariant: (name) => {
      return name.replace(/\bOFFER\b/i, 'Offer').trim();
    },
    overview: 'Official Riot Games Valorant Points redeem codes for accounts registered in the Philippines (PHP) region. Fast digital delivery ensures you can claim limited-time store bundles and gun skins without delay.'
  },
  {
    url: 'https://arektacoinstore.com/valorant/cheapest-valorant-points-bd',
    baseTitle: 'Valorant Points (Malaysia)',
    region: 'MY',
    delivery_type: 'instant_code',
    platform: 'Riot Games',
    image_url: '/images/topups/valorant-points.jpg',
    cleanVariant: (name) => {
      return name
        .replace(/^Malaysia Region\s*/i, '')
        .replace(/\bOFFER\b/i, '(Offer)')
        .replace(/(\d+)\s*vp/i, '$1 VP')
        .trim();
    },
    overview: 'Top up your Valorant account in the Malaysia region at guaranteed best rates. Instant digital code delivery for fast redemption in your Riot client.'
  },
  {
    url: 'https://arektacoinstore.com/game-top-up/wuthering-waves',
    baseTitle: 'Wuthering Waves Lunites & Pass',
    region: 'GLOBAL',
    delivery_type: 'api_h2h',
    platform: 'Kuro Games',
    image_url: '/images/topups/wuthering-waves.webp',
    cleanVariant: (name) => {
      return name
        .replace(/^Wuthering Waves\s*/i, '')
        .replace(/Subcription/i, 'Subscription')
        .trim();
    },
    overview: 'Official direct top-up for Wuthering Waves (PC & Mobile). Recharge your Lunites or purchase the Lunite Subscription directly to your Kuro Games account using your Player ID (UID).'
  },
  {
    url: 'https://arektacoinstore.com/game-top-up/fortnite-v-bucks-pcxboxplaystation',
    baseTitle: 'Fortnite V-Bucks',
    region: 'GLOBAL',
    delivery_type: 'automation',
    platform: 'Epic Games',
    image_url: '/images/topups/fortnite-vbucks.jpg',
    cleanVariant: (name) => {
      return name.replace(/V-bucks/i, 'V-Bucks').trim();
    },
    overview: 'Top up official Fortnite V-Bucks across PC, Xbox, and PlayStation. Unlock the Battle Pass, iconic crossover outfits, emotes, harvesting tools, and exclusive festival tracks.'
  },
  {
    url: 'https://arektacoinstore.com/game-top-up/pubg-mobile',
    baseTitle: 'PUBG Mobile Unknown Cash (UC)',
    region: 'GLOBAL',
    delivery_type: 'api_h2h',
    platform: 'Tencent Games',
    image_url: '/images/topups/pubg-mobile.webp',
    cleanVariant: (name) => {
      return name.replace(/^PUBG Mobile\s*/i, '').trim();
    },
    overview: 'Recharge PUBG Mobile Unknown Cash (UC) directly to your player account using your Character ID. Open Royale Pass crates, acquire weapon skins, and participate in special lucky spins.'
  },
  {
    url: 'https://arektacoinstore.com/game-top-up/marvel-rivals-lattices',
    baseTitle: 'Marvel Rivals Lattices',
    region: 'GLOBAL',
    delivery_type: 'api_h2h',
    platform: 'NetEase Games',
    image_url: '/images/topups/marvel-rivals.webp',
    cleanVariant: (name) => {
      return name.trim();
    },
    overview: 'Direct top-up for Marvel Rivals Lattices. Unlock superhero skins, cosmetics, nameplates, and Battle Passes for your favorite Marvel heroes and villains.'
  },
  {
    url: 'https://arektacoinstore.com/game-top-up/mobile-legends-mlbb-topup',
    baseTitle: 'Mobile Legends: Bang Bang Diamonds',
    region: 'GLOBAL',
    delivery_type: 'api_h2h',
    platform: 'Moonton',
    image_url: '/images/topups/mlbb-diamonds.jpg',
    cleanVariant: (name) => {
      return name.replace(/Weekly Pass/i, 'Weekly Diamond Pass').trim();
    },
    overview: 'Top up Mobile Legends: Bang Bang (MLBB) Diamonds and Weekly Diamond Passes with instant delivery. Simply provide your User ID and Zone ID at checkout.'
  },
  {
    url: 'https://arektacoinstore.com/game-top-up/roblox-login',
    baseTitle: 'Roblox Robux (Direct Top-Up)',
    region: 'GLOBAL',
    delivery_type: 'automation',
    platform: 'Roblox',
    image_url: '/images/topups/roblox-robux.jpg',
    cleanVariant: (name) => {
      return name.replace(/^Roblox Login\s*/i, '').trim();
    },
    overview: 'Direct account top-up for Roblox Robux. Customize your avatar with limited accessories, purchase server game passes, and unlock premium in-game perks.'
  },
  {
    url: 'https://arektacoinstore.com/game-top-up/apex-legends-coins-bd',
    baseTitle: 'Apex Legends Apex Coins',
    region: 'GLOBAL',
    delivery_type: 'automation',
    platform: 'EA',
    image_url: '/images/topups/apex-legends.jpg',
    cleanVariant: (name) => {
      return name.replace(/COINS/i, 'Apex Coins').trim();
    },
    overview: 'Official Apex Coins top-up for Apex Legends. Purchase Battle Passes, exclusive event packs, heirlooms, and weapon skins directly.'
  },
  {
    url: 'https://arektacoinstore.com/game-top-up/where-winds-meet',
    baseTitle: 'Where Winds Meet Top-Up',
    region: 'GLOBAL',
    delivery_type: 'api_h2h',
    platform: 'NetEase Games',
    image_url: '/images/topups/where-winds-meet.webp',
    cleanVariant: (name) => {
      return name.replace(/^Where Winds Meet\s*/i, '').trim();
    },
    overview: 'Official direct top-up for Where Winds Meet. Secure monthly subscriptions, Elite Battle Passes, and Premium Battle Passes directly to your account.'
  },
  {
    url: 'https://arektacoinstore.com/game-top-up/efootball-pes',
    baseTitle: 'eFootball PES Coins',
    region: 'GLOBAL',
    delivery_type: 'automation',
    platform: 'Konami',
    image_url: '/images/topups/efootball-pes.png',
    cleanVariant: (name) => {
      return name
        .replace(/^eFootball \(PES\)\s*/i, '')
        .replace(/coins/i, 'Coins')
        .trim();
    },
    overview: 'Top up eFootball PES Coins for Android and iOS devices. Sign legendary epic players, boost your Dream Team, and unlock premium match passes.'
  },
  {
    url: 'https://arektacoinstore.com/game-top-up/zenless-zone-zero',
    baseTitle: 'Zenless Zone Zero Monochrome & Pass',
    region: 'GLOBAL',
    delivery_type: 'api_h2h',
    platform: 'HoYoverse',
    image_url: '/images/topups/zzz-monochrome.jpg',
    cleanVariant: (name) => {
      return name.trim();
    },
    overview: 'Direct UID top-up for Zenless Zone Zero (ZZZ). Acquire Monochrome Film and Inter-Knot Memberships securely to pull for your favorite S-rank Agents and W-Engines.'
  },
  {
    url: 'https://arektacoinstore.com/game-top-up/honkai-star-rail',
    baseTitle: 'Honkai: Star Rail Oneiric Shards',
    region: 'GLOBAL',
    delivery_type: 'api_h2h',
    platform: 'HoYoverse',
    image_url: '/images/topups/hsr-oneiric.jpg',
    cleanVariant: (name) => {
      return name.trim();
    },
    overview: 'Official direct top-up for Honkai: Star Rail. Recharge Oneiric Shards and Express Supply Passes directly to your HoYoverse account with zero account login required.'
  },
  {
    url: 'https://arektacoinstore.com/game-top-up/delta-force',
    baseTitle: 'Delta Force Delta Coins',
    region: 'GLOBAL',
    delivery_type: 'api_h2h',
    platform: 'TiMi Studio Group',
    image_url: '/images/topups/delta-force.webp',
    cleanVariant: (name) => {
      return name.replace(/^Delta Force\s*/i, '').trim();
    },
    overview: 'Direct top-up for Delta Force warfare credits and Delta Coins. Upgrade tactical gear, seasonal battle passes, and weapon blueprint camos.'
  },
  {
    url: 'https://arektacoinstore.com/game-top-up/neverness-to-everness-nte',
    baseTitle: 'Neverness to Everness Riftcrystals & Pass',
    region: 'GLOBAL',
    delivery_type: 'api_h2h',
    platform: 'Hotta Studio',
    image_url: '/images/topups/nte.webp',
    cleanVariant: (name) => {
      return name
        .replace(/^Neverness to Everness \(NTE\)\s*/i, '')
        .trim();
    },
    overview: 'Direct top-up for Neverness to Everness (NTE). Recharge Riftcrystals and acquire Riftcrystal Mining Permits directly for your urban open-world supernatural journey.'
  },
  {
    url: 'https://arektacoinstore.com/game-top-up/genshin-impact',
    baseTitle: 'Genshin Impact Genesis Crystals & Welkin',
    region: 'GLOBAL',
    delivery_type: 'api_h2h',
    platform: 'HoYoverse',
    image_url: '/images/topups/genshin-impact.webp',
    cleanVariant: (name) => {
      return name
        .replace(/^Welkin Moon$/i, 'Blessing of the Welkin Moon (30 Days)')
        .replace(/^Gnostic Hymm$/i, 'Gnostic Hymn (Battle Pass)')
        .replace(/^Gnostic Chorus$/i, 'Gnostic Chorus')
        .trim();
    },
    overview: 'Direct UID top-up for Genshin Impact. Recharge Genesis Crystals, Blessing of the Welkin Moon, or Battle Passes directly using your in-game UID and Server.'
  }
];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE credentials in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function extractProductAndVariants(html, targetSlug) {
  const match = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return null;

  const raw = JSON.parse(match[1]);

  let targetProduct = null;
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const slug = typeof item.slug === 'number' ? raw[item.slug] : item.slug;
      if (slug === targetSlug && item.children) {
        targetProduct = item;
        break;
      }
    }
  }

  if (!targetProduct) {
    for (let i = 0; i < raw.length; i++) {
      const item = raw[i];
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const slug = typeof item.slug === 'number' ? raw[item.slug] : item.slug;
        if (slug && typeof slug === 'string' && targetSlug.includes(slug) && item.children) {
          targetProduct = item;
          break;
        }
      }
    }
  }

  if (!targetProduct) return null;

  const variants = [];
  const childrenArr = typeof targetProduct.children === 'number' ? raw[targetProduct.children] : targetProduct.children;
  if (Array.isArray(childrenArr)) {
    for (const cIdx of childrenArr) {
      const c = typeof cIdx === 'number' ? raw[cIdx] : cIdx;
      if (c && typeof c === 'object') {
        const cName = typeof c.name === 'number' ? raw[c.name] : c.name;
        const cPrice = typeof c.price === 'number' ? raw[c.price] : c.price;
        if (cName && typeof cPrice === 'number' && cPrice > 0) {
          variants.push({ name: cName, price: cPrice });
        }
      }
    }
  }

  return { variants };
}

function buildDescription(config) {
  const deliveryText = config.delivery_type === 'instant_code'
    ? 'Official digital redeem code delivered directly upon payment confirmation.'
    : 'Direct in-game account recharge via User ID (UID) / Player ID.';

  const stepsText = config.delivery_type === 'instant_code'
    ? `1. Select your desired package variant above.\n2. Proceed to secure checkout and complete your payment.\n3. Your 100% genuine redeem code will be delivered instantly.\n4. Redeem the code in-game or via the official publisher redemption portal.`
    : `1. Select your desired top-up package from the options above.\n2. Enter your In-Game User ID (UID) and Server accurately during checkout.\n3. Complete your payment via bKash, Nagad, Rocket, or Card.\n4. Your currency will be credited directly to your player account within minutes.`;

  return `### ⚡ Product Overview
${config.overview}

#### 🛡️ Product Highlights
- ⚡ **Delivery Method**: ${deliveryText}
- 🔒 **100% Authentic & Safe**: Sourced strictly through official channels, fully compliant with publisher terms of service.
- 💎 **Guaranteed Best Value**: Competitive pricing in Bangladeshi Taka (BDT) with maximum savings.
- 🎯 **Region Compatibility**: Specifically designated for **${config.region}** accounts.

#### 📋 How to Order & Receive
${stepsText}
`;
}

async function main() {
  console.log("Starting RetroHub top-up product ingestion...");

  // 1. Remove old dead/inactive topups with 0 stock
  const { error: delInactiveErr } = await supabase
    .from('products')
    .delete()
    .eq('category', 'topup')
    .eq('is_active', false)
    .eq('in_stock', 0);

  if (delInactiveErr) {
    console.warn("Notice when cleaning inactive topups:", delInactiveErr.message);
  } else {
    console.log("Cleaned old inactive topup placeholders.");
  }

  let totalVariantsInserted = 0;
  let successfulConfigs = 0;

  for (const config of topupConfigs) {
    const slug = config.url.split('/').pop();
    try {
      console.log(`\nFetching ${config.baseTitle} (${slug})...`);
      const res = await fetch(config.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!res.ok) {
        console.error(`Failed to fetch ${config.url} - Status ${res.status}`);
        continue;
      }

      const html = await res.text();
      const extracted = extractProductAndVariants(html, slug);

      if (!extracted || extracted.variants.length === 0) {
        console.error(`No variants found for ${config.baseTitle}`);
        continue;
      }

      // Clean existing variants for this baseTitle to prevent duplicate rows on re-runs
      await supabase
        .from('products')
        .delete()
        .ilike('title', `${config.baseTitle} | %`);

      const description = buildDescription(config);

      const rowsToInsert = extracted.variants.map((v) => {
        const optionName = config.cleanVariant(v.name);
        const fullTitle = `${config.baseTitle} | ${optionName}`;
        const salePrice = Number(v.price);
        const costPrice = Math.round(salePrice * 0.92);

        return {
          title: fullTitle,
          category: 'topup',
          region: config.region,
          delivery_type: config.delivery_type,
          platform: config.platform,
          sale_price: salePrice,
          cost_price: costPrice,
          in_stock: 999,
          is_active: true,
          image_url: config.image_url,
          description: description,
          source_url: config.url,
          source_platform: 'arektacoinstore'
        };
      });

      // Insert in chunks of 50
      const chunkSize = 50;
      for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
        const chunk = rowsToInsert.slice(i, i + chunkSize);
        const { error: insertErr } = await supabase.from('products').insert(chunk);
        if (insertErr) {
          console.error(`Error inserting chunk for ${config.baseTitle}:`, insertErr);
        }
      }

      console.log(`✅ [SUCCESS] Ingested ${rowsToInsert.length} variants for: ${config.baseTitle}`);
      totalVariantsInserted += rowsToInsert.length;
      successfulConfigs++;

    } catch (err) {
      console.error(`Error processing ${config.baseTitle}:`, err.message);
    }
  }

  console.log("\n==========================================");
  console.log(`Ingestion Complete!`);
  console.log(`Games Ingested: ${successfulConfigs}/${topupConfigs.length}`);
  console.log(`Total Variants Created: ${totalVariantsInserted}`);
  console.log("==========================================");
}

main().catch(console.error);
