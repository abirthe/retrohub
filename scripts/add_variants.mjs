import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const dirs = ['Products/top ups/', 'Products/subscription/'];
const GENERIC_VALORANT_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Valorant_logo_-_pink_color_version.svg';

async function run() {
  let count = 0;
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));
    
    for (const f of files) {
      const content = fs.readFileSync(path.join(dir, f), 'utf-8');
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) continue;
      
      const titleLine = lines[1].split(',');
      const title = titleLine[1] || lines[2]?.split(',')[1] || '';
      let imageUrl = titleLine[0] || '';
      
      if (!title) continue;
      
      if (title.toLowerCase().includes('valorant')) {
        imageUrl = GENERIC_VALORANT_LOGO;
      }
      
      // Determine category based on folder
      let category = dir.includes('subscription') ? 'subscription' : 'topup';
      
      const amountLine = lines.find(l => l.includes('Amount,'));
      if (amountLine) {
        const parts = amountLine.split('Amount,')[1].split(',');
        const variants = parts.filter(p => p && p !== 'Login to Place Order' && p !== 'Amount' && p.trim() !== '');
        
        for (let variant of variants) {
          variant = variant.replace(/"/g, '').trim(); // remove quotes if any
          if (!variant) continue;
          
          const variantTitle = `${title} | ${variant}`;
          
          // Check if variant exists
          const { data: existing } = await supabase.from('products').select('*').eq('title', variantTitle).single();
          
          if (!existing) {
            const { error } = await supabase.from('products').insert({
              title: variantTitle,
              category,
              delivery_type: 'api_h2h',
              cost_price: 0,
              sale_price: 0,
              image_url: imageUrl,
              in_stock: 9999,
              is_active: true
            });
            if (error) {
              console.error('Error inserting', variantTitle, error.message);
            } else {
              console.log('Inserted variant:', variantTitle);
              count++;
            }
          } else {
             // ensure correct category
             if (existing.category !== category) {
                 await supabase.from('products').update({ category }).eq('id', existing.id);
                 console.log('Updated category for variant:', variantTitle);
             }
          }
        }
      }
    }
  }
  console.log('Added', count, 'variants.');
}

run().catch(console.error);
