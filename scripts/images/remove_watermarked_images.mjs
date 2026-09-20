import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  process.stdout.write("Checking and removing watermarked vendor images...\n");
  
  const { data, error } = await supabase
    .from('products')
    .update({ image_url: null })
    .or('image_url.ilike.%watermark%,image_url.ilike.%linodeobjects%')
    .select();
    
  if (error) {
    process.stderr.write("Error updating products: " + error.message + "\n");
    return;
  }
  
  process.stdout.write(`Successfully removed watermarked images from ${data.length} products.\n`);
}

run();
