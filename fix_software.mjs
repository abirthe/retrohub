import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixSoftware() {
  await supabase
    .from('products')
    .update({ category: 'pc_game' })
    .eq('title', 'Fallout 76 - Windows 10 Store Key GLOBAL');

  await supabase
    .from('products')
    .update({ title: 'Dolby Atmos | Lifetime Subscription' })
    .eq('title', 'Dolby Atmos - Lifetime Subscription');

  await supabase
    .from('products')
    .update({ title: 'ExpressVPN | 1 Month' })
    .eq('title', 'ExpressVPN');

  console.log("Fixed software titles!");
}
fixSoftware();
