import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const IMAGE_MAP = [
  { keyword: 'valorant', url: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Valorant_logo_-_pink_color_version.svg' },
  { keyword: 'steam', url: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg' },
  { keyword: 'fortnite', url: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/FortniteLogo.svg' },
  { keyword: 'pubg', url: 'https://upload.wikimedia.org/wikipedia/en/2/22/PlayerUnknown%27s_Battlegrounds_cover.jpg' },
  { keyword: 'mobile legends', url: 'https://upload.wikimedia.org/wikipedia/en/1/18/Mobile_Legends_Bang_Bang_logo.png' },
  { keyword: 'discord', url: 'https://upload.wikimedia.org/wikipedia/en/9/98/Discord_logo.svg' },
  { keyword: 'netflix', url: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg' },
  { keyword: 'prime video', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png' },
  { keyword: 'spotify', url: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg' },
  { keyword: 'adobe', url: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Adobe_Acrobat_DC_logo_2020.svg' },
  { keyword: 'windows', url: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Windows_logo_-_2012_%28dark_blue%29.svg' },
  { keyword: 'office', url: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Microsoft_Office_logo_%282019%E2%80%93present%29.svg' },
  { keyword: 'microsoft', url: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg' },
  { keyword: 'telegram', url: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg' },
  { keyword: 'google', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' },
  { keyword: 'playstation', url: 'https://upload.wikimedia.org/wikipedia/commons/0/00/PlayStation_logo.svg' },
  { keyword: 'xbox', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Xbox_one_logo.svg' },
  { keyword: 'genshin', url: 'https://upload.wikimedia.org/wikipedia/en/5/5d/Genshin_Impact_logo.svg' },
  { keyword: 'honkai', url: 'https://upload.wikimedia.org/wikipedia/en/4/44/Honkai_Star_Rail_logo.svg' },
  { keyword: 'roblox', url: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Roblox_player_icon_black.svg' },
  { keyword: 'apex', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Apex_legends_title.svg' },
  { keyword: 'grammarly', url: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Grammarly_logo.svg' },
  { keyword: 'linkedin', url: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png' },
  { keyword: 'marvel', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Marvel_Logo.svg' }
];

async function run() {
  console.log("Mapping images for topups and subscriptions...");
  
  const { data, error } = await supabase
    .from('products')
    .select('id, title')
    .or('image_url.is.null,image_url.eq.,image_url.eq.https://via.placeholder.com/300');
    
  if (error) {
    console.error("Error fetching products:", error);
    return;
  }
  
  let successCount = 0;
  for (const p of data) {
    const titleLower = p.title.toLowerCase();
    
    let matchUrl = null;
    for (const map of IMAGE_MAP) {
      if (titleLower.includes(map.keyword)) {
        matchUrl = map.url;
        break;
      }
    }
    
    if (matchUrl) {
      await supabase.from('products').update({ image_url: matchUrl }).eq('id', p.id);
      successCount++;
    }
  }
  
  console.log(`Successfully mapped images for ${successCount} products out of ${data.length} missing.`);
}

run();
