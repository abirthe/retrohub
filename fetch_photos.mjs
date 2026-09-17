import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function cleanTitle(title) {
  let cleaned = title
    .replace(/\(.*\)/g, '') // Remove anything in parentheses
    .replace(/XBOX LIVE Key/ig, '')
    .replace(/PSN Key/ig, '')
    .replace(/Xbox Live/ig, '')
    .replace(/Steam Key/ig, '')
    .replace(/Key/ig, '')
    .replace(/ARGENTINA/ig, '')
    .replace(/EUROPE/ig, '')
    .replace(/GLOBAL/ig, '')
    .replace(/TURKEY/ig, '')
    .replace(/UNITED STATES/ig, '')
    .replace(/BRAZIL/ig, '')
    .replace(/PC\/XBOX/ig, '')
    .replace(/PC\//ig, '')
    .replace(/Deluxe Edition/ig, '')
    .replace(/Ultimate Edition/ig, '')
    .replace(/Complete Edition/ig, '')
    .replace(/Standard Edition/ig, '')
    .replace(/Gold Edition/ig, '')
    .replace(/Premium Edition/ig, '')
    .replace(/Game of the Year Edition/ig, '')
    .replace(/GOTY Edition/ig, '')
    .replace(/Edition/ig, '')
    .replace(/-/g, ' ')
    .trim();
    
    // Remove double spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
}

async function searchSteamImage(gameTitle) {
  try {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameTitle)}&l=english&cc=US`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      // Find exact or closest match, but taking the first is usually good enough for storesearch
      const appid = data.items[0].id;
      return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;
    }
  } catch (err) {
    // ignore
  }
  return null;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log("Fetching products missing photos...");
  const { data, error } = await supabase
    .from('products')
    .select('id, title, category, platform, image_url')
    .or('image_url.is.null,image_url.eq.,image_url.eq.https://via.placeholder.com/300')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return;
  }

  console.log(`Found ${data.length} products to process. Starting batch update...`);
  
  let successCount = 0;
  
  // Process in smaller chunks to avoid overwhelming the console
  for (let i = 0; i < data.length; i++) {
    const p = data[i];
    const clean = cleanTitle(p.title);
    if (!clean) continue;
    
    const imgUrl = await searchSteamImage(clean);
    
    if (imgUrl) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: imgUrl })
        .eq('id', p.id);
        
      if (!updateError) {
        successCount++;
        if (successCount % 10 === 0) {
           console.log(`✅ Updated ${successCount} products... (Last: ${clean})`);
        }
      }
    }
    
    // Rate limit to be nice to Steam API (5 requests per second)
    await sleep(200);
  }

  console.log(`\n🎉 Finished! Successfully found and updated photos for ${successCount} out of ${data.length} products.`);
}

run();
