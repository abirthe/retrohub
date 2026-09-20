import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: allTopups, error } = await supabase.from('products').select('*').eq('category', 'topup');
  if (error) {
    console.error(error);
    return;
  }

  // 1. Rename "Sale | <something>" to the proper base title
  for (let p of allTopups) {
    if (p.title.startsWith('Sale | ')) {
      const variant = p.title.replace('Sale | ', '').trim();
      let newTitle = p.title;
      let newImageUrl = p.image_url;

      // Check if it's Genshin Impact
      if (
        variant.toLowerCase().includes('genesis crystal') ||
        variant.toLowerCase().includes('welkin') ||
        variant.toLowerCase().includes('gnostic')
      ) {
        // Map variants to cleaner names
        let cleanVariant = variant;
        if (variant.includes('60 Genesis Crystal')) cleanVariant = '60 Crystals';
        if (variant.includes('300+30 (330)')) cleanVariant = '330 Crystals';
        if (variant.includes('980+110 (1090)')) cleanVariant = '1090 Crystals';
        if (variant.includes('1980+260 (2240)')) cleanVariant = '2240 Crystals';
        if (variant.includes('3280+600 (3880)')) cleanVariant = '3880 Crystals';
        if (variant.includes('6480+1600 (8080)')) cleanVariant = '8080 Crystals';

        newTitle = `Genshin Impact Genesis Crystals | ${cleanVariant}`;
        newImageUrl = 'https://upload.wikimedia.org/wikipedia/en/5/5d/Genshin_Impact_logo.svg';
      } 
      // Check if it's Valorant VP (Global)
      else if (variant.toLowerCase().includes('vp global')) {
        const cleanVariant = variant.replace(' Global', '').trim();
        newTitle = `Valorant Points (Global) | ${cleanVariant}`;
      }
      // Check if it's just Valorant VP
      else if (variant.toLowerCase().includes('vp')) {
        newTitle = `Valorant Points (Global) | ${variant}`;
      }

      if (newTitle !== p.title) {
        p.title = newTitle;
        p.image_url = newImageUrl;
      }
    }

    // 2. Rename existing "Valorant Points | PHP Region | Philippines"
    if (p.title.includes('Valorant Points | PHP Region | Philippines |')) {
      const variant = p.title.split(' | Philippines | ')[1]?.trim();
      if (variant) {
        let cleanVariant = variant;
        if (cleanVariant === 'Philippines 6700 VP') cleanVariant = '6700 VP';
        p.title = `Valorant Points (Philippines) | ${cleanVariant}`;
      }
    }
    else if (p.title.includes('Valorant VP (Philippines) |')) {
      const variant = p.title.split(' | ')[1]?.trim();
      p.title = `Valorant Points (Philippines) | ${variant}`;
    }
    
    // Normalize other Valorant regions
    if (p.title.includes('Valorant Points Indonesia Region | Valorant Points Indonesia Region ')) {
      const variant = p.title.split(' Indonesia Region ')[2]?.trim();
      if (variant) p.title = `Valorant Points (Indonesia) | ${variant}`;
    }
    if (p.title.includes('Valorant VP (Malaysia) |')) {
      const variant = p.title.split(' | ')[1]?.trim();
      p.title = `Valorant Points (Malaysia) | ${variant}`;
    }
    if (p.title.includes('Valorant Points BD Region | Redeem Code | BD - ') || p.title.includes('Valorant Points BD Region | Redeem Code | Bangladesh ')) {
      const variantMatch = p.title.match(/(\d+)\s*VP/i);
      if (variantMatch) p.title = `Valorant Points (Bangladesh) | ${variantMatch[1]} VP`;
    }
    if (p.title.includes('Valorant VP (Bangladesh) |')) {
      const variant = p.title.split(' | ')[1]?.trim();
      p.title = `Valorant Points (Bangladesh) | ${variant}`;
    }
  }

  // 3. Deduplicate: For each newTitle, keep the one with the highest sale_price, delete the rest.
  const titleGroups = {};
  for (let p of allTopups) {
    if (!titleGroups[p.title]) {
      titleGroups[p.title] = [];
    }
    titleGroups[p.title].push(p);
  }

  const toUpdate = [];
  const toDelete = [];

  for (const [title, products] of Object.entries(titleGroups)) {
    if (products.length > 1) {
      // Sort descending by price
      products.sort((a, b) => b.sale_price - a.sale_price);
      
      const keep = products[0];
      // Note: we update the one we keep in case its title/image changed during step 1/2
      toUpdate.push(keep);
      
      for (let i = 1; i < products.length; i++) {
        toDelete.push(products[i].id);
      }
    } else {
      toUpdate.push(products[0]);
    }
  }

  // 4. Execute updates and deletes
  console.log(`To delete: ${toDelete.length} duplicates`);
  for (const id of toDelete) {
    await supabase.from('products').delete().eq('id', id);
  }

  console.log(`To update: ${toUpdate.length} records with correct titles`);
  for (const p of toUpdate) {
    await supabase.from('products').update({
      title: p.title,
      image_url: p.image_url
    }).eq('id', p.id);
  }

  console.log('Done!');
}

run();
