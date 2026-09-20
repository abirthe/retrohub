import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const dir = 'Products/subscription/';

async function run() {
  let baseCount = 0;
  let variantCount = 0;

  if (!fs.existsSync(dir)) {
    console.log('No subscription folder found');
    return;
  }
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));
  
  for (const f of files) {
    const content = fs.readFileSync(path.join(dir, f), 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    
    const titleLine = lines[1].split(',');
    const title = titleLine[1] || lines[2]?.split(',')[1] || '';
    let imageUrl = titleLine[0] || '';
    
    if (!title) continue;
    
    // 1. Insert Base Product
    const { data: existingBase } = await supabase.from('products').select('*').eq('title', title).single();
    if (!existingBase) {
      const { error } = await supabase.from('products').insert({
        title,
        category: 'subscription',
        delivery_type: 'api_h2h',
        cost_price: 0,
        sale_price: 0,
        image_url: imageUrl,
        in_stock: 9999,
        is_active: true
      });
      if (error) console.error('Error inserting base', title, error.message);
      else {
        console.log('Inserted base product:', title);
        baseCount++;
      }
    } else {
        // Ensure category is subscription
        if (existingBase.category !== 'subscription') {
            await supabase.from('products').update({ category: 'subscription' }).eq('id', existingBase.id);
        }
    }

    // 2. Insert Variants
    const amountLine = lines.find(l => l.includes('Amount,'));
    if (amountLine) {
      const parts = amountLine.split('Amount,')[1].split(',');
      const variants = parts.filter(p => p && p !== 'Login to Place Order' && p !== 'Amount' && p.trim() !== '');
      
      for (let variant of variants) {
        variant = variant.replace(/"/g, '').trim();
        if (!variant) continue;
        
        const variantTitle = `${title} | ${variant}`;
        const { data: existingVariant } = await supabase.from('products').select('*').eq('title', variantTitle).single();
        
        if (!existingVariant) {
          const { error } = await supabase.from('products').insert({
            title: variantTitle,
            category: 'subscription',
            delivery_type: 'api_h2h',
            cost_price: 0,
            sale_price: 0,
            image_url: imageUrl,
            in_stock: 9999,
            is_active: true
          });
          if (error) console.error('Error inserting variant', variantTitle, error.message);
          else {
            console.log('Inserted variant:', variantTitle);
            variantCount++;
          }
        }
      }
    }
  }
  
  console.log(`Added ${baseCount} base products and ${variantCount} variants.`);
}

run().catch(console.error);
