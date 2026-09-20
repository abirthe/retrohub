import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRemaining() {
  const { data: allTopups, error } = await supabase.from('products').select('*').eq('category', 'topup');
  
  let toUpdate = [];
  let toDelete = [];

  for (let p of allTopups) {
    let newTitle = p.title;
    let newImageUrl = p.image_url;

    if (p.title === 'Sale | Welkin Moon') {
      newTitle = 'Genshin Impact Genesis Crystals | Welkin Moon';
      newImageUrl = 'https://upload.wikimedia.org/wikipedia/en/5/5d/Genshin_Impact_logo.svg';
    } else if (p.title === 'Sale | Gnostic Hymm') {
      newTitle = 'Genshin Impact Genesis Crystals | Gnostic Hymm';
      newImageUrl = 'https://upload.wikimedia.org/wikipedia/en/5/5d/Genshin_Impact_logo.svg';
    } else if (p.title === 'Sale | Gnostic Chorus') {
      newTitle = 'Genshin Impact Genesis Crystals | Gnostic Chorus';
      newImageUrl = 'https://upload.wikimedia.org/wikipedia/en/5/5d/Genshin_Impact_logo.svg';
    } else if (p.title.startsWith('Sale | ') && p.title.includes('Genesis Crystal')) {
       newTitle = p.title.replace('Sale | ', 'Genshin Impact Genesis Crystals | ');
       newImageUrl = 'https://upload.wikimedia.org/wikipedia/en/5/5d/Genshin_Impact_logo.svg';
    } else if (p.title.startsWith('Sale | ')) {
      const variant = p.title.replace('Sale | ', '').trim();
      newTitle = `Valorant Points (Global) | ${variant}`;
    }

    if (newTitle !== p.title) {
      toUpdate.push({ id: p.id, title: newTitle, image_url: newImageUrl, sale_price: p.sale_price });
    }
  }

  // Deduplicate before updating
  const titleGroups = {};
  for (let p of allTopups) {
    let title = p.title;
    let updateMatch = toUpdate.find(u => u.id === p.id);
    if (updateMatch) {
      title = updateMatch.title;
    }
    if (!titleGroups[title]) titleGroups[title] = [];
    titleGroups[title].push(updateMatch || p);
  }

  const finalUpdates = [];
  for (const [title, products] of Object.entries(titleGroups)) {
    if (products.length > 1) {
      products.sort((a, b) => b.sale_price - a.sale_price);
      finalUpdates.push(products[0]);
      for (let i = 1; i < products.length; i++) {
        toDelete.push(products[i].id);
      }
    } else {
      // If it's a product that was renamed (in toUpdate), add it
      if (toUpdate.find(u => u.id === products[0].id)) {
        finalUpdates.push(products[0]);
      }
    }
  }

  console.log('To delete:', toDelete.length);
  for (let id of toDelete) {
    await supabase.from('products').delete().eq('id', id);
  }

  console.log('To update:', finalUpdates.length);
  for (let p of finalUpdates) {
    if (p.image_url) {
      await supabase.from('products').update({ title: p.title, image_url: p.image_url }).eq('id', p.id);
    } else {
      await supabase.from('products').update({ title: p.title }).eq('id', p.id);
    }
    console.log('Updated:', p.title);
  }
  
  console.log('Done!');
}

fixRemaining();
