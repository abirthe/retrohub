import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import crypto from 'crypto';

const env = {};
const lines = fs.readFileSync('.env', 'utf8').split('\n');
for (const line of lines) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^"|"$/g, '');
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);

const productsData = [
  {
    baseTitle: 'iTunes Gift Card | Apple (US)',
    category: 'giftcard',
    platform: 'Apple',
    region: 'US',
    delivery_type: 'instant_code',
    image_url: '/images/giftcards/apple-giftcard.jpg',
    source_url: 'https://arektacoinstore.com/gift-card/itunes-gift-card-apple-us',
    source_platform: 'arektacoinstore',
    overview: 'Instantly recharge your US Apple ID balance with 100% genuine Apple iTunes Gift Card codes. Purchase apps, games, music, movies, iCloud+ storage, Apple Music, and in-app subscriptions across your iPhone, iPad, Mac, and Apple TV.',
    instructions: `1. Select your desired denomination from the options above.\n2. Complete your payment securely via bKash, Nagad, Rocket, or Card.\n3. Your authentic Apple digital gift card code will be delivered instantly.\n4. Open the App Store on your Apple device, tap your profile icon, select "Redeem Gift Card or Code", and enter your code.`,
    variants: [
      { name: 'iTunes Gift Card (US) | $2', price: 275 },
      { name: 'iTunes Gift Card (US) | $3', price: 399 },
      { name: 'iTunes Gift Card (US) | $4', price: 525 },
      { name: 'iTunes Gift Card (US) | $5', price: 699 },
      { name: 'iTunes Gift Card (US) | $10', price: 1350 },
      { name: 'iTunes Gift Card (US) | $15', price: 2025 },
      { name: 'iTunes Gift Card (US) | $20', price: 2700 },
      { name: 'iTunes Gift Card (US) | $25', price: 3350 },
      { name: 'iTunes Gift Card (US) | $30', price: 4000 },
      { name: 'iTunes Gift Card (US) | $50', price: 6700 },
      { name: 'iTunes Gift Card (US) | $100', price: 12999 },
    ]
  },
  {
    baseTitle: 'Nintendo eShop Gift Card (US)',
    category: 'giftcard',
    platform: 'Nintendo',
    region: 'US',
    delivery_type: 'instant_code',
    image_url: '/images/giftcards/nintendo-giftcard.jpg',
    source_url: 'https://arektacoinstore.com/gift-card/nintendo',
    source_platform: 'arektacoinstore',
    overview: 'Give the gift of gaming with official Nintendo eShop digital cards for US Nintendo accounts. Buy downloadable games, DLC passes, retro classics, and indie gems directly on your Nintendo Switch console.',
    instructions: `1. Select your desired eShop credit amount above.\n2. Complete payment through our automated checkout.\n3. Your Nintendo eShop prepaid code will be delivered instantly.\n4. Select "Nintendo eShop" on the Nintendo Switch HOME Menu, scroll to "Enter Code", and enter your 16-character code.`,
    variants: [
      { name: 'Nintendo eShop Gift Card (US) | $10', price: 1250 },
      { name: 'Nintendo eShop Gift Card (US) | $20', price: 2475 },
      { name: 'Nintendo eShop Gift Card (US) | $50', price: 6200 },
    ]
  },
  {
    baseTitle: 'Roblox Gift Card (US)',
    category: 'giftcard',
    platform: 'Roblox',
    region: 'US',
    delivery_type: 'instant_code',
    image_url: '/images/giftcards/roblox-giftcard.jpg',
    source_url: 'https://arektacoinstore.com/gift-card/roblox-gift-cards-bd',
    source_platform: 'arektacoinstore',
    overview: 'Fuel your Roblox imagination! Official Roblox Gift Cards allow you to load up on Robux or upgrade to Roblox Premium. Customize your avatar with limited accessories, gear, and unlock unique perks across millions of immersive community-built experiences.',
    instructions: `1. Choose your preferred Robux denomination above.\n2. Complete secure payment via bKash/Nagad/Rocket/Card.\n3. Receive your official digital Roblox PIN instantly.\n4. Log in to your account at roblox.com/redeem, enter your PIN, and click Redeem to receive your Robux immediately.`,
    variants: [
      { name: 'Roblox Gift Card (US) | 275 Robux', price: 399 },
      { name: 'Roblox Gift Card (US) | 360 Robux', price: 499 },
      { name: 'Roblox Gift Card (US) | 550 Robux', price: 799 },
      { name: 'Roblox Gift Card (US) | 700 Robux', price: 999 },
      { name: 'Roblox Gift Card (US) | 1,000 Robux', price: 1299 },
      { name: 'Roblox Gift Card (US) | 2,500 Robux', price: 3299 },
      { name: 'Roblox Gift Card (US) | 5,250 Robux', price: 6599 },
      { name: 'Roblox Gift Card (US) | 11,000 Robux', price: 13399 },
    ]
  },
  {
    baseTitle: 'Blizzard Battle.net Gift Card (US)',
    category: 'giftcard',
    platform: 'Blizzard',
    region: 'US',
    delivery_type: 'instant_code',
    image_url: '/images/giftcards/blizzard-giftcard.jpg',
    source_url: 'https://arektacoinstore.com/gift-card/blizzard-gift-card-battlenet',
    source_platform: 'arektacoinstore',
    overview: 'Add funds directly to your Blizzard Battle.net account balance. Purchase Blizzard games like World of Warcraft, Diablo IV, Overwatch 2 Coins, Call of Duty points, Hearthstone card packs, character boosts, and services.',
    instructions: `1. Choose your desired Battle.net balance tier above.\n2. Proceed through checkout and submit payment.\n3. Your authentic Battle.net digital code will be issued instantly.\n4. Visit account.battle.net/overview, enter the code in the "Redeem a Code" box, and click Claim Code.`,
    variants: [
      { name: 'Blizzard Battle.net Balance | $10', price: 1250 },
      { name: 'Blizzard Battle.net Balance | $20', price: 2500 },
      { name: 'Blizzard Battle.net Balance | $25', price: 3125 },
      { name: 'Blizzard Battle.net Balance | $50', price: 6250 },
      { name: 'Blizzard Battle.net Balance | $100', price: 12500 },
    ]
  }
];

function buildDescription(p) {
  return `### ⚡ Product Overview
${p.overview}

---

#### 🛡️ Product Highlights
- ⚡ **Delivery Method**: Instant official digital code delivery upon payment confirmation.
- 🔒 **100% Genuine & Authentic**: Sourced directly from official publisher distribution channels.
- 💎 **Guaranteed Best Value**: Transparent pricing in Bangladeshi Taka (BDT).
- 🎯 **Region**: Specifically designated for **${p.region}** accounts.

---

#### 📋 How to Redeem
${p.instructions}
`;
}

async function seedGiftCards() {
  process.stdout.write("Starting gift card product seeding...\n");

  for (const group of productsData) {
    const desc = buildDescription(group);

    // Delete existing variants for this baseTitle if any to ensure clean state
    const { data: existing } = await supabase
      .from('products')
      .select('id, title')
      .ilike('title', `${group.baseTitle.split(' | ')[0]}%`);

    if (existing && existing.length > 0) {
      const ids = existing.map(e => e.id);
      await supabase.from('products').delete().in('id', ids);
      process.stdout.write(`Cleaned up ${existing.length} existing products for ${group.baseTitle}\n`);
    }

    // Insert all variants
    const insertPayload = group.variants.map((v) => {
      const costPrice = Math.round(v.price * 0.92);
      return {
        id: crypto.randomUUID(),
        title: v.name,
        category: group.category,
        delivery_type: group.delivery_type,
        platform: group.platform,
        region: group.region,
        cost_price: costPrice,
        sale_price: v.price,
        in_stock: 999,
        is_active: true,
        image_url: group.image_url,
        source_url: group.source_url,
        source_platform: group.source_platform,
        description: desc,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    const { data, error } = await supabase.from('products').insert(insertPayload).select('id, title, sale_price');
    if (error) {
      process.stderr.write(`Error inserting variants for ${group.baseTitle}: ${error.message}\n`);
    } else {
      process.stdout.write(`Successfully inserted ${data.length} variants for ${group.baseTitle}:\n`);
      data.forEach(d => process.stdout.write(`  - ${d.title} (৳${d.sale_price})\n`));
    }
  }

  process.stdout.write("\nFinished seeding all 4 gift card product groups.\n");
}

seedGiftCards();
