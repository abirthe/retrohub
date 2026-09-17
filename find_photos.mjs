import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findMissingPhotos() {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, category, platform, image_url')
    .or('image_url.is.null,image_url.eq.,image_url.eq.https://via.placeholder.com/300')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return;
  }

  console.log(`Found ${data.length} products missing photos.`);
  data.slice(0, 10).forEach(p => {
    console.log(`- [${p.platform}] ${p.title} (Category: ${p.category})`);
  });
}

findMissingPhotos();
