import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPUBG() {
  const { data } = await supabase.from('products').select('*').eq('category', 'topup');
  
  let pubg = data.filter(p => p.title.toLowerCase().includes('pubg'));
  
  // 1. Normalize titles
  for (let p of pubg) {
    let variant = '';
    if (p.title === 'PUBG Mobile') {
      variant = '60 UC'; // Assuming 130 price is 60 UC based on existing duplicates
    } else if (p.title.includes('|')) {
      variant = p.title.split('|')[1].trim();
      // Remove redundant 'PUBG Mobile ' from variant
      if (variant.startsWith('PUBG Mobile ')) {
        variant = variant.replace('PUBG Mobile ', '').trim();
      }
    }
    
    let newTitle = `PUBG Mobile UC (Global) | ${variant}`;
    p.normalizedTitle = newTitle;
  }
  
  // 2. Deduplicate
  const groups = {};
  for (let p of pubg) {
    if (!groups[p.normalizedTitle]) groups[p.normalizedTitle] = [];
    groups[p.normalizedTitle].push(p);
  }
  
  const toDelete = [];
  const toUpdate = [];
  
  for (const [title, products] of Object.entries(groups)) {
    products.sort((a, b) => b.sale_price - a.sale_price);
    const keep = products[0];
    
    if (keep.title !== title) {
      toUpdate.push({ id: keep.id, title });
    }
    
    for (let i = 1; i < products.length; i++) {
      toDelete.push(products[i].id);
    }
  }
  
  console.log('To delete:', toDelete);
  for (let id of toDelete) {
    await supabase.from('products').delete().eq('id', id);
  }
  
  console.log('To update:', toUpdate);
  for (let u of toUpdate) {
    await supabase.from('products').update({ title: u.title }).eq('id', u.id);
  }
  
  console.log('Done!');
}
fixPUBG();
