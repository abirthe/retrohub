import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const productsToInsert = [
  // Valorant (Malaysia)
  { title: 'Valorant VP (Malaysia) | 475 VP', category: 'topup', sale_price: 592, cost_price: 590, delivery_type: 'instant_code', platform: 'Riot Games' },
  { title: 'Valorant VP (Malaysia) | 1000 VP', category: 'topup', sale_price: 1217, cost_price: 1213, delivery_type: 'instant_code', platform: 'Riot Games' },
  { title: 'Valorant VP (Malaysia) | 2050 VP', category: 'topup', sale_price: 2374, cost_price: 2366, delivery_type: 'instant_code', platform: 'Riot Games' },
  { title: 'Valorant VP (Malaysia) | 3650 VP', category: 'topup', sale_price: 4144, cost_price: 4129, delivery_type: 'instant_code', platform: 'Riot Games' },
  { title: 'Valorant VP (Malaysia) | 5350 VP', category: 'topup', sale_price: 5911, cost_price: 5890, delivery_type: 'instant_code', platform: 'Riot Games' },
  { title: 'Valorant VP (Malaysia) | 11000 VP', category: 'topup', sale_price: 11850, cost_price: 11809, delivery_type: 'instant_code', platform: 'Riot Games' },
  
  // Valorant (Philippines)
  { title: 'Valorant VP (Philippines) | 475 VP', category: 'topup', sale_price: 404, cost_price: 390, delivery_type: 'api_h2h', platform: 'Riot Games' },
  { title: 'Valorant VP (Philippines) | 1000 VP', category: 'topup', sale_price: 810, cost_price: 790, delivery_type: 'api_h2h', platform: 'Riot Games' },
  { title: 'Valorant VP (Philippines) | 2050 VP', category: 'topup', sale_price: 1623, cost_price: 1600, delivery_type: 'api_h2h', platform: 'Riot Games' },
  { title: 'Valorant VP (Philippines) | 3650 VP', category: 'topup', sale_price: 2842, cost_price: 2800, delivery_type: 'api_h2h', platform: 'Riot Games' },
  { title: 'Valorant VP (Philippines) | 5350 VP', category: 'topup', sale_price: 4060, cost_price: 4000, delivery_type: 'api_h2h', platform: 'Riot Games' },
  { title: 'Valorant VP (Philippines) | 11000 VP', category: 'topup', sale_price: 8124, cost_price: 8000, delivery_type: 'api_h2h', platform: 'Riot Games' },

  // Valorant (Bangladesh)
  { title: 'Valorant VP (Bangladesh) | 475 VP', category: 'topup', sale_price: 590, cost_price: 580, delivery_type: 'automation', platform: 'Riot Games' },
  { title: 'Valorant VP (Bangladesh) | 1000 VP', category: 'topup', sale_price: 1200, cost_price: 1180, delivery_type: 'automation', platform: 'Riot Games' },
  { title: 'Valorant VP (Bangladesh) | 1525 VP', category: 'topup', sale_price: 1840, cost_price: 1820, delivery_type: 'automation', platform: 'Riot Games' },
  { title: 'Valorant VP (Bangladesh) | 2575 VP', category: 'topup', sale_price: 3100, cost_price: 3000, delivery_type: 'automation', platform: 'Riot Games' },
  { title: 'Valorant VP (Bangladesh) | 5350 VP', category: 'topup', sale_price: 6060, cost_price: 6000, delivery_type: 'automation', platform: 'Riot Games' },
  { title: 'Valorant VP (Bangladesh) | 8700 VP', category: 'topup', sale_price: 9440, cost_price: 9400, delivery_type: 'automation', platform: 'Riot Games' },

  // Vbucks (Epic Turkey)
  { title: 'Fortnite V-Bucks (Turkey) | 1000 V-Bucks', category: 'topup', sale_price: 779, cost_price: 750, delivery_type: 'automation', platform: 'Epic Games' },
  { title: 'Fortnite V-Bucks (Turkey) | 2800 V-Bucks', category: 'topup', sale_price: 1989, cost_price: 1950, delivery_type: 'automation', platform: 'Epic Games' },
  { title: 'Fortnite V-Bucks (Turkey) | 5000 V-Bucks', category: 'topup', sale_price: 3198, cost_price: 3100, delivery_type: 'automation', platform: 'Epic Games' },
  { title: 'Fortnite V-Bucks (Turkey) | 13500 V-Bucks', category: 'topup', sale_price: 7782, cost_price: 7700, delivery_type: 'automation', platform: 'Epic Games' },

  // PUBG Mobile UC
  { title: 'PUBG Mobile UC (Global) | 60 UC', category: 'topup', sale_price: 120, cost_price: 110, delivery_type: 'api_h2h', platform: 'Tencent' },
  { title: 'PUBG Mobile UC (Global) | 325 UC', category: 'topup', sale_price: 599, cost_price: 580, delivery_type: 'api_h2h', platform: 'Tencent' },
  { title: 'PUBG Mobile UC (Global) | 660 UC', category: 'topup', sale_price: 1196, cost_price: 1150, delivery_type: 'api_h2h', platform: 'Tencent' },
  { title: 'PUBG Mobile UC (Global) | 1800 UC', category: 'topup', sale_price: 2991, cost_price: 2900, delivery_type: 'api_h2h', platform: 'Tencent' },
  { title: 'PUBG Mobile UC (Global) | 3850 UC', category: 'topup', sale_price: 5981, cost_price: 5900, delivery_type: 'api_h2h', platform: 'Tencent' },
  { title: 'PUBG Mobile UC (Global) | 8100 UC', category: 'topup', sale_price: 11962, cost_price: 11900, delivery_type: 'api_h2h', platform: 'Tencent' },

  // Blood Strike
  { title: 'Blood Strike Golds | 105 Golds', category: 'topup', sale_price: 129, cost_price: 120, delivery_type: 'api_h2h', platform: 'NetEase' },
  { title: 'Blood Strike Golds | 320 Golds', category: 'topup', sale_price: 373, cost_price: 360, delivery_type: 'api_h2h', platform: 'NetEase' },
  { title: 'Blood Strike Golds | 540 Golds', category: 'topup', sale_price: 620, cost_price: 600, delivery_type: 'api_h2h', platform: 'NetEase' },
  { title: 'Blood Strike Golds | 1100 Golds', category: 'topup', sale_price: 1227, cost_price: 1200, delivery_type: 'api_h2h', platform: 'NetEase' },
  { title: 'Blood Strike Golds | 2260 Golds', category: 'topup', sale_price: 2468, cost_price: 2400, delivery_type: 'api_h2h', platform: 'NetEase' },
  { title: 'Blood Strike Golds | 5800 Golds', category: 'topup', sale_price: 6188, cost_price: 6100, delivery_type: 'api_h2h', platform: 'NetEase' },

  // Marvel Rivals
  { title: 'Marvel Rivals Lattices | 100 Lattices', category: 'topup', sale_price: 107, cost_price: 100, delivery_type: 'api_h2h', platform: 'NetEase' },
  { title: 'Marvel Rivals Lattices | 500 Lattices', category: 'topup', sale_price: 533, cost_price: 500, delivery_type: 'api_h2h', platform: 'NetEase' },
  { title: 'Marvel Rivals Lattices | 1000 Lattices', category: 'topup', sale_price: 1067, cost_price: 1000, delivery_type: 'api_h2h', platform: 'NetEase' },
  { title: 'Marvel Rivals Lattices | 2180 Lattices', category: 'topup', sale_price: 2133, cost_price: 2100, delivery_type: 'api_h2h', platform: 'NetEase' },
  { title: 'Marvel Rivals Lattices | 5680 Lattices', category: 'topup', sale_price: 5331, cost_price: 5300, delivery_type: 'api_h2h', platform: 'NetEase' },
  { title: 'Marvel Rivals Lattices | 11680 Lattices', category: 'topup', sale_price: 10662, cost_price: 10600, delivery_type: 'api_h2h', platform: 'NetEase' },

  // Genshin Impact
  { title: 'Genshin Impact Genesis Crystals | 60 Crystals', category: 'topup', sale_price: 88, cost_price: 85, delivery_type: 'api_h2h', platform: 'HoYoverse' },
  { title: 'Genshin Impact Genesis Crystals | 330 Crystals', category: 'topup', sale_price: 443, cost_price: 430, delivery_type: 'api_h2h', platform: 'HoYoverse' },
  { title: 'Genshin Impact Genesis Crystals | 1090 Crystals', category: 'topup', sale_price: 1367, cost_price: 1350, delivery_type: 'api_h2h', platform: 'HoYoverse' },
  { title: 'Genshin Impact Genesis Crystals | 2240 Crystals', category: 'topup', sale_price: 2851, cost_price: 2800, delivery_type: 'api_h2h', platform: 'HoYoverse' },
  { title: 'Genshin Impact Genesis Crystals | 3880 Crystals', category: 'topup', sale_price: 4677, cost_price: 4600, delivery_type: 'api_h2h', platform: 'HoYoverse' },
  { title: 'Genshin Impact Genesis Crystals | 8080 Crystals', category: 'topup', sale_price: 8957, cost_price: 8900, delivery_type: 'api_h2h', platform: 'HoYoverse' },
  { title: 'Genshin Impact Genesis Crystals | Welkin Moon', category: 'subscription', sale_price: 443, cost_price: 430, delivery_type: 'api_h2h', platform: 'HoYoverse' },

  // Honkai Star Rail
  { title: 'Honkai: Star Rail Oneinic Shard | 60 Shards', category: 'topup', sale_price: 99, cost_price: 90, delivery_type: 'api_h2h', platform: 'HoYoverse' },
  { title: 'Honkai: Star Rail Oneinic Shard | 330 Shards', category: 'topup', sale_price: 482, cost_price: 470, delivery_type: 'api_h2h', platform: 'HoYoverse' },
  { title: 'Honkai: Star Rail Oneinic Shard | 1090 Shards', category: 'topup', sale_price: 1485, cost_price: 1450, delivery_type: 'api_h2h', platform: 'HoYoverse' },
  { title: 'Honkai: Star Rail Oneinic Shard | 2240 Shards', category: 'topup', sale_price: 3028, cost_price: 3000, delivery_type: 'api_h2h', platform: 'HoYoverse' },
  { title: 'Honkai: Star Rail Oneinic Shard | 3880 Shards', category: 'topup', sale_price: 4980, cost_price: 4900, delivery_type: 'api_h2h', platform: 'HoYoverse' },
  { title: 'Honkai: Star Rail Oneinic Shard | 8080 Shards', category: 'topup', sale_price: 9723, cost_price: 9700, delivery_type: 'api_h2h', platform: 'HoYoverse' },

  // Roblox
  { title: 'Roblox Robux (Login) | 80 Robux', category: 'topup', sale_price: 150, cost_price: 140, delivery_type: 'automation', platform: 'Roblox' },
  { title: 'Roblox Robux (Login) | 400 Robux', category: 'topup', sale_price: 620, cost_price: 600, delivery_type: 'automation', platform: 'Roblox' },
  { title: 'Roblox Robux (Login) | 800 Robux', category: 'topup', sale_price: 1240, cost_price: 1200, delivery_type: 'automation', platform: 'Roblox' },
  { title: 'Roblox Robux (Login) | 1700 Robux', category: 'topup', sale_price: 2480, cost_price: 2400, delivery_type: 'automation', platform: 'Roblox' },
  { title: 'Roblox Robux (Login) | 4500 Robux', category: 'topup', sale_price: 6200, cost_price: 6100, delivery_type: 'automation', platform: 'Roblox' },
  { title: 'Roblox Robux (Login) | 10000 Robux', category: 'topup', sale_price: 12400, cost_price: 12300, delivery_type: 'automation', platform: 'Roblox' },
  { title: 'Roblox Robux (Login) | 22500 Robux', category: 'topup', sale_price: 24800, cost_price: 24700, delivery_type: 'automation', platform: 'Roblox' },
  { title: 'Roblox Premium | 1 Month', category: 'subscription', sale_price: 1260, cost_price: 1200, delivery_type: 'automation', platform: 'Roblox' },

  // Subscriptions
  { title: 'Netflix | 1 Month', category: 'subscription', sale_price: 260, cost_price: 240, delivery_type: 'instant_code', platform: 'Netflix' },
  { title: 'Prime Video | 1 Month', category: 'subscription', sale_price: 100, cost_price: 90, delivery_type: 'instant_code', platform: 'Amazon' },
  { title: 'Netflix & Prime Video Bundle | 1 Month', category: 'subscription', sale_price: 330, cost_price: 310, delivery_type: 'instant_code', platform: 'Netflix' },
  { title: 'LinkedIn Premium (Business) | 1 Year', category: 'subscription', sale_price: 2500, cost_price: 2400, delivery_type: 'automation', platform: 'LinkedIn' },
  
  // Software
  { title: 'MS Office 21 | Lifetime Key', category: 'software', sale_price: 300, cost_price: 280, delivery_type: 'instant_code', platform: 'Microsoft' },
  { title: 'Windows 10/11 Pro | Retail Key', category: 'software', sale_price: 250, cost_price: 230, delivery_type: 'instant_code', platform: 'Microsoft' },

  // Steam Gift Cards (MYR)
  { title: 'Steam Wallet Code (MYR) | MYR 5', category: 'giftcard', sale_price: 161, cost_price: 150, delivery_type: 'instant_code', platform: 'Steam' },
  { title: 'Steam Wallet Code (MYR) | MYR 8', category: 'giftcard', sale_price: 257, cost_price: 250, delivery_type: 'instant_code', platform: 'Steam' },
  { title: 'Steam Wallet Code (MYR) | MYR 10', category: 'giftcard', sale_price: 322, cost_price: 310, delivery_type: 'instant_code', platform: 'Steam' },
  { title: 'Steam Wallet Code (MYR) | MYR 16', category: 'giftcard', sale_price: 515, cost_price: 500, delivery_type: 'instant_code', platform: 'Steam' },
  { title: 'Steam Wallet Code (MYR) | MYR 20', category: 'giftcard', sale_price: 644, cost_price: 630, delivery_type: 'instant_code', platform: 'Steam' },
  { title: 'Steam Wallet Code (MYR) | MYR 24', category: 'giftcard', sale_price: 772, cost_price: 760, delivery_type: 'instant_code', platform: 'Steam' },
  { title: 'Steam Wallet Code (MYR) | MYR 50', category: 'giftcard', sale_price: 1609, cost_price: 1600, delivery_type: 'instant_code', platform: 'Steam' },
  { title: 'Steam Wallet Code (MYR) | MYR 80', category: 'giftcard', sale_price: 2575, cost_price: 2550, delivery_type: 'instant_code', platform: 'Steam' },
  { title: 'Steam Wallet Code (MYR) | MYR 100', category: 'giftcard', sale_price: 3219, cost_price: 3200, delivery_type: 'instant_code', platform: 'Steam' },
  { title: 'Steam Wallet Code (MYR) | MYR 200', category: 'giftcard', sale_price: 6437, cost_price: 6400, delivery_type: 'instant_code', platform: 'Steam' },

  // Steam Gift Cards (HKD)
  { title: 'Steam Wallet Code (HKD) | HKD 40', category: 'giftcard', sale_price: 670, cost_price: 650, delivery_type: 'instant_code', platform: 'Steam' },
  { title: 'Steam Wallet Code (HKD) | HKD 50', category: 'giftcard', sale_price: 815, cost_price: 800, delivery_type: 'instant_code', platform: 'Steam' },
  { title: 'Steam Wallet Code (HKD) | HKD 80', category: 'giftcard', sale_price: 1310, cost_price: 1300, delivery_type: 'instant_code', platform: 'Steam' },
  { title: 'Steam Wallet Code (HKD) | HKD 100', category: 'giftcard', sale_price: 1620, cost_price: 1600, delivery_type: 'instant_code', platform: 'Steam' },
  { title: 'Steam Wallet Code (HKD) | HKD 120', category: 'giftcard', sale_price: 1950, cost_price: 1900, delivery_type: 'instant_code', platform: 'Steam' },

  // PlayStation Gift Cards (USD)
  { title: 'PlayStation Gift Card (USD) | $10', category: 'giftcard', sale_price: 1180, cost_price: 1150, delivery_type: 'instant_code', platform: 'PlayStation' },
  { title: 'PlayStation Gift Card (USD) | $25', category: 'giftcard', sale_price: 2950, cost_price: 2900, delivery_type: 'instant_code', platform: 'PlayStation' },
  { title: 'PlayStation Gift Card (USD) | $50', category: 'giftcard', sale_price: 5900, cost_price: 5800, delivery_type: 'instant_code', platform: 'PlayStation' },
  { title: 'PlayStation Gift Card (USD) | $100', category: 'giftcard', sale_price: 11800, cost_price: 11700, delivery_type: 'instant_code', platform: 'PlayStation' },

  // Xbox Gift Cards (USD)
  { title: 'Xbox Gift Card (USD) | $5', category: 'giftcard', sale_price: 625, cost_price: 600, delivery_type: 'instant_code', platform: 'Xbox' },
  { title: 'Xbox Gift Card (USD) | $10', category: 'giftcard', sale_price: 1170, cost_price: 1150, delivery_type: 'instant_code', platform: 'Xbox' },
  { title: 'Xbox Gift Card (USD) | $25', category: 'giftcard', sale_price: 2925, cost_price: 2900, delivery_type: 'instant_code', platform: 'Xbox' },
  { title: 'Xbox Gift Card (USD) | $50', category: 'giftcard', sale_price: 5850, cost_price: 5800, delivery_type: 'instant_code', platform: 'Xbox' },
  { title: 'Xbox Gift Card (USD) | $100', category: 'giftcard', sale_price: 11700, cost_price: 11600, delivery_type: 'instant_code', platform: 'Xbox' },
].map(p => ({
  ...p,
  in_stock: 1000,
  is_active: true,
  region: 'GLOBAL' // Default, wait some are specific
}));

async function seed() {
  console.log("Seeding PDF products...");
  const { error } = await supabase.from('products').insert(productsToInsert);
  if (error) console.error("Error inserting:", error);
  else console.log("Seeded successfully!");
}

seed();
