import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const descStandard = `### 🎮 EA Play Subscription for PC [EA App / Origin / Steam]

Get unlimited access to a top collection of EA's best-loved titles on PC.

#### ✨ What's Included:
- **The Play List:** Access a huge collection of top EA games including EA Sports FC, Battlefield, Need for Speed, Star Wars Jedi, Mass Effect, Dead Space, The Sims, and more.
- **Early Game Trials:** Try new-release EA games for up to 10 hours before buying.
- **10% Member Discount:** Save 10% on EA digital purchases on EA App, including full games, season passes, and DLCs.
- **Exclusive In-Game Rewards:** Unlock special member-only items and vanity drops each month.

---

#### ⚠️ Activation Instructions:
- **Platform:** PC (EA App / Origin / Steam).
- **Region:** Global (works on any regional EA account).
- **Delivery:** Account activation service. Provide your EA account login (email & password) during checkout.
- **Requirement:** Recommended that your EA account is linked with a Gmail email address.`;

const descPro = `### 🚀 EA Play Pro Subscription for PC [EA App / Origin / Steam]

The ultimate gaming subscription from Electronic Arts. Get complete and unlimited access to all premium EA games on PC from day one.

#### ✨ What's Included:
- **Day-One Premium Editions:** Full access to premium editions of all new EA releases from day one, including all deluxe editions, DLCs, season passes, and expansions.
- **Unlimited Play List:** Full unlimited access to the entire EA catalog on PC with no time limits or restrictions.
- **Pro Member Exclusive Rewards:** Premium member-only monthly content, weapon skins, player packs, and unique cosmetics.
- **10% Member Discount:** Save 10% on EA digital purchases on the EA App.

---

#### ⚠️ Activation Instructions:
- **Platform:** PC (EA App / Origin / Steam).
- **Region:** Global (works on any regional EA account).
- **Delivery:** Account activation service. Provide your EA account login (email & password) during checkout.
- **Requirement:** Recommended that your EA account is linked with a Gmail email address.`;

const products = [
  {
    title: 'EA Play (PC) | 1 Month',
    category: 'subscription',
    platform: 'PC',
    region: 'GLOBAL',
    delivery_type: 'instant_code',
    cost_price: 1415,
    sale_price: 1815,
    in_stock: 100,
    is_active: true,
    image_url: '/images/ea-play-pro-pc.webp',
    source_url: 'https://plati.market/itm/ea-play-pro-subscription-1-12-months-ea-app-origin-pc-ea-play-subscription/5404108',
    source_platform: 'plati.market',
    description: descStandard
  },
  {
    title: 'EA Play (PC) | 12 Month',
    category: 'subscription',
    platform: 'PC',
    region: 'GLOBAL',
    delivery_type: 'instant_code',
    cost_price: 6140,
    sale_price: 6540,
    in_stock: 100,
    is_active: true,
    image_url: '/images/ea-play-pro-pc.webp',
    source_url: 'https://plati.market/itm/ea-play-pro-subscription-1-12-months-ea-app-origin-pc-ea-play-subscription/5404108',
    source_platform: 'plati.market',
    description: descStandard
  },
  {
    title: 'EA Play Pro (PC) | 1 Month',
    category: 'subscription',
    platform: 'PC',
    region: 'GLOBAL',
    delivery_type: 'instant_code',
    cost_price: 3980,
    sale_price: 4380,
    in_stock: 100,
    is_active: true,
    image_url: '/images/ea-play-pro-pc.webp',
    source_url: 'https://plati.market/itm/ea-play-pro-subscription-1-12-months-ea-app-origin-pc-ea-play-subscription/5404108',
    source_platform: 'plati.market',
    description: descPro
  },
  {
    title: 'EA Play Pro (PC) | 12 Month',
    category: 'subscription',
    platform: 'PC',
    region: 'GLOBAL',
    delivery_type: 'instant_code',
    cost_price: 10540,
    sale_price: 10940,
    in_stock: 100,
    is_active: true,
    image_url: '/images/ea-play-pro-pc.webp',
    source_url: 'https://plati.market/itm/ea-play-pro-subscription-1-12-months-ea-app-origin-pc-ea-play-subscription/5404108',
    source_platform: 'plati.market',
    description: descPro
  }
];

async function seed() {
  try {
    for (const item of products) {
      const { data: existing, error: findError } = await supabase
        .from('products')
        .select('id')
        .eq('title', item.title)
        .maybeSingle();

      if (findError) {
        throw findError;
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            ...item,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert(item);

        if (insertError) {
          throw insertError;
        }
      }
    }
  } catch (error) {
    process.exit(1);
  }
}

seed();
