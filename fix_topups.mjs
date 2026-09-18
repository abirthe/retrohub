import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixProducts() {
  // Fix Wuthering Waves
  await supabase
    .from('products')
    .update({ category: 'pc_game' })
    .eq('title', 'Wuthering Waves');

  // Fix Roblox Gift Cards
  await supabase
    .from('products')
    .update({ 
      title: 'Roblox Gift Card (Global) | $10',
      category: 'giftcard'
    })
    .eq('title', '$10 Roblox Gift Card – Global');

  await supabase
    .from('products')
    .update({ 
      title: 'Roblox Gift Card (Global) | $25',
      category: 'giftcard'
    })
    .eq('title', '$25 Roblox Gift Card – Global');

  console.log("Fixed anomalous products!");
}
fixProducts();
