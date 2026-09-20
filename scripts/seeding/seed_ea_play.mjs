import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const descTurkey = `### 🎮 EA Play Subscription for PS4 / PS5 [Turkey Region]

Get more from the games you love with an EA Play subscription on PlayStation Network.

#### ✨ What's Included:
- **The Play List:** Unlimited access to a collection of top EA titles including EA Sports FC, Battlefield, Need for Speed, Star Wars Jedi, Mass Effect, Dead Space, and more.
- **Early Trials:** Try selected new-release games for up to 10 hours with zero commitment.
- **Exclusive Member Discounts:** Save 10% on EA digital purchases on the PlayStation Store, including full games, points packs, and DLCs.
- **Member-Only Rewards:** Unlock in-game challenges, special rewards, and unique content.

---

#### ⚠️ Activation Instructions:
- **How it Works:** Account-based activation service for Turkish PSN accounts.
- **New Account:** We can set up a fresh Turkish PSN account with 100% full personal ownership (email and password provided to you).
- **Existing Account:** If applying to your existing Turkish account, provide your login credentials + 2FA backup codes during order checkout/processing.
- **Console Sharing (PS4/PS5):** Enable "Console Sharing and Offline Play" on PS5 (or set as "Primary PS4") to play all downloaded EA Play games from your main personal account!`;

const descUkraine = `### 🎮 EA Play Subscription for PS4 / PS5 [Ukraine Region]

Get more from the games you love with an EA Play subscription on PlayStation Network.

#### ✨ What's Included:
- **The Play List:** Unlimited access to a collection of top EA titles including EA Sports FC, Battlefield, Need for Speed, Star Wars Jedi, Mass Effect, Dead Space, and more.
- **Early Trials:** Try selected new-release games for up to 10 hours with zero commitment.
- **Exclusive Member Discounts:** Save 10% on EA digital purchases on the PlayStation Store, including full games, points packs, and DLCs.
- **Member-Only Rewards:** Unlock in-game challenges, special rewards, and unique content.

---

#### ⚠️ Activation Instructions:
- **How it Works:** Account-based activation service for Ukrainian PSN accounts.
- **New Account:** We can set up a fresh Ukrainian PSN account with 100% full personal ownership (email and password provided to you).
- **Existing Account:** If applying to your existing Ukrainian account, provide your login credentials + 2FA backup codes during order checkout/processing.
- **Console Sharing (PS4/PS5):** Enable "Console Sharing and Offline Play" on PS5 (or set as "Primary PS4") to play all downloaded EA Play games from your main personal account!`;

const products = [
  {
    title: 'EA Play PSN (Ukraine) | 1 Month',
    category: 'subscription',
    platform: 'PlayStation',
    region: 'GLOBAL',
    delivery_type: 'instant_code',
    cost_price: 845,
    sale_price: 1245,
    in_stock: 100,
    is_active: true,
    image_url: '/images/ea-play-psn.webp',
    source_url: 'https://plati.market/itm/ea-play-ps4-ps5-psn-turkey-ukraine/3703126',
    source_platform: 'plati.market',
    description: descUkraine
  },
  {
    title: 'EA Play PSN (Ukraine) | 12 Month',
    category: 'subscription',
    platform: 'PlayStation',
    region: 'GLOBAL',
    delivery_type: 'instant_code',
    cost_price: 3780,
    sale_price: 4180,
    in_stock: 100,
    is_active: true,
    image_url: '/images/ea-play-psn.webp',
    source_url: 'https://plati.market/itm/ea-play-ps4-ps5-psn-turkey-ukraine/3703126',
    source_platform: 'plati.market',
    description: descUkraine
  },
  {
    title: 'EA Play PSN (Turkey) | 1 Month',
    category: 'subscription',
    platform: 'PlayStation',
    region: 'TR',
    delivery_type: 'instant_code',
    cost_price: 1155,
    sale_price: 1555,
    in_stock: 100,
    is_active: true,
    image_url: '/images/ea-play-psn.webp',
    source_url: 'https://plati.market/itm/ea-play-ps4-ps5-psn-turkey-ukraine/3703126',
    source_platform: 'plati.market',
    description: descTurkey
  },
  {
    title: 'EA Play PSN (Turkey) | 12 Month',
    category: 'subscription',
    platform: 'PlayStation',
    region: 'TR',
    delivery_type: 'instant_code',
    cost_price: 4965,
    sale_price: 5365,
    in_stock: 100,
    is_active: true,
    image_url: '/images/ea-play-psn.webp',
    source_url: 'https://plati.market/itm/ea-play-ps4-ps5-psn-turkey-ukraine/3703126',
    source_platform: 'plati.market',
    description: descTurkey
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
