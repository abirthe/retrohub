import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Removing Arekta images...");
  
  const { data, error } = await supabase
    .from('products')
    .update({ image_url: null })
    .ilike('image_url', '%arekta%')
    .select();
    
  if (error) {
    console.error("Error updating products:", error);
    return;
  }
  
  console.log(`Successfully removed Arekta logo images from ${data.length} products.`);
}

run();
