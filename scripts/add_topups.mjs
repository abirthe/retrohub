import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const dir = 'Products/top ups/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));

const GENERIC_VALORANT_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Valorant_logo_-_pink_color_version.svg';

async function run() {
  let count = 0;
  for (const f of files) {
    const content = fs.readFileSync(path.join(dir, f), 'utf-8');
    const lines = content.split('\n');
    if (lines.length > 2) {
      const cols2 = lines[1].split(',');
      const cols3 = lines[2].split(',');
      let imageUrl = cols2[0] || '';
      const title = cols3[1] || cols2[1] || '';
      
      if (!title) continue;

      if (title.toLowerCase().includes('valorant')) {
        imageUrl = GENERIC_VALORANT_LOGO;
      }
      
      // Check if product already exists
      const { data: existing } = await supabase.from('products').select('*').eq('title', title).single();
      
      if (!existing) {
        // Insert new product
        const { error } = await supabase.from('products').insert({
          title,
          category: 'topup',
          delivery_type: 'api_h2h',
          cost_price: 0,
          sale_price: 0,
          image_url: imageUrl,
          in_stock: 9999, // default stock so it can be sold
          is_active: true
        });
        
        if (error) {
          console.error("Error inserting", title, error);
        } else {
          console.log("Inserted new product:", title);
          count++;
        }
      } else {
        console.log("Product already exists:", title);
        
        // Ensure Valorant logo is fixed for existing products too
        if (title.toLowerCase().includes('valorant') && existing.image_url !== GENERIC_VALORANT_LOGO) {
          await supabase.from('products').update({ image_url: GENERIC_VALORANT_LOGO }).eq('id', existing.id);
          console.log("Updated Valorant logo for:", title);
        }
      }
    }
  }
  console.log("Added", count, "new products.");
}

run().catch(console.error);
