import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

function cleanTitle(title) {
  return title
    .replace(/\(PC\/Xbox X\|S\)/i, '')
    .replace(/\(PS[45]\)/i, '')
    .replace(/XBOX LIVE Key ARGENTINA/i, '')
    .replace(/PSN Key EUROPE/i, '')
    .replace(/Xbox Live Key/i, '')
    .replace(/ARGENTINA/i, '')
    .replace(/Deluxe Edition/i, '')
    .replace(/Ultimate Edition/i, '')
    .replace(/Complete Edition/i, '')
    .trim();
}

async function searchSteamImage(gameTitle) {
  try {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameTitle)}&l=english&cc=US`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const appid = data.items[0].id;
      return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;
    }
  } catch (err) {
    // console.error("Error searching steam for", gameTitle, err.message);
  }
  return null;
}

async function run() {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, category, platform, image_url')
    .or('image_url.is.null,image_url.eq.,image_url.eq.https://via.placeholder.com/300')
    .order('created_at', { ascending: false })
    .limit(10); // test 10

  for (const p of data) {
    const clean = cleanTitle(p.title);
    const img = await searchSteamImage(clean);
    console.log(`Title: ${p.title}\nCleaned: ${clean}\nImage: ${img}\n`);
  }
}

run();
