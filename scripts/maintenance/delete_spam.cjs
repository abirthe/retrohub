const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = fs.existsSync(path.join(__dirname, '..', '..', '.env')) ? path.join(__dirname, '..', '..', '.env') : path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  const key = t.slice(0, eq).trim();
  const val = t.slice(eq + 1).trim().replace(/^\"|\"$/g, '');
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: products, error } = await supabase.from('products').select('id, title, image_url');
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  
  // Find the exact image URL used by "Dolby Atmos" or products containing watermarked logos
  let badImageUrl = null;
  for (const p of products) {
    if (p.title.toLowerCase().includes('dolby atmos') && p.image_url) {
      badImageUrl = p.image_url;
      console.log(`Found bad image URL from ${p.title}: ${badImageUrl}`);
      break;
    }
    // Or if the image url literally contains watermarked linode storage
    if (p.image_url && p.image_url.toLowerCase().includes('linodeobjects')) {
       badImageUrl = p.image_url;
       console.log(`Found bad image URL containing external storage: ${badImageUrl}`);
       break;
    }
  }

  if (!badImageUrl) {
    console.log("Could not find the target image URL. Checking all products just in case...");
    // Fallback: list unique image URLs
    const urls = new Set(products.map(p => p.image_url).filter(Boolean));
    console.log(Array.from(urls).slice(0, 10));
    return;
  }

  let deletedCount = 0;
  
  for (const p of products) {
    if (p.image_url === badImageUrl || (p.image_url && p.image_url.includes('linodeobjects'))) {
      console.log(`Deleting product: ${p.title} (ID: ${p.id})`);
      const { error: delError } = await supabase.from('products').delete().eq('id', p.id);
      if (delError) {
        console.error(`Failed to delete ${p.id}:`, delError);
      } else {
        deletedCount++;
      }
    }
  }

  console.log(`Successfully deleted ${deletedCount} products with that image.`);
}

run();
