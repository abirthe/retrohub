import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanTitles() {
  const { data: allTopups } = await supabase.from('products').select('*').eq('category', 'topup');
  let toUpdate = [];
  let toDelete = [];

  for (let p of allTopups) {
    let newTitle = p.title;

    if (p.title.startsWith('"Fortnite V-Bucks ( PC |') || p.title.startsWith('"Fortnite V-Bucks ( PC')) {
      newTitle = p.title.replace('"Fortnite V-Bucks ( PC', 'Fortnite V-Bucks (PC)');
    }
    else if (p.title.startsWith('Roblox Login |')) {
      newTitle = p.title.replace('Roblox Login |', 'Roblox Robux (Login) |');
    }
    else if (p.title.startsWith('MARVEL RIVALS |')) {
      newTitle = p.title.replace('MARVEL RIVALS |', 'Marvel Rivals Lattices |');
    }
    else if (p.title.startsWith('Honkai Star Rail |')) {
      newTitle = p.title.replace('Honkai Star Rail |', 'Honkai: Star Rail Oneinic Shard |');
    }
    else if (p.title.startsWith('PUBG Mobile |')) {
       newTitle = p.title.replace('PUBG Mobile |', 'PUBG Mobile UC (Global) |');
    }

    if (newTitle !== p.title) {
      toUpdate.push({ id: p.id, title: newTitle, sale_price: p.sale_price, image_url: p.image_url });
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
    await supabase.from('products').update({ title: p.title }).eq('id', p.id);
    console.log('Updated:', p.title);
  }
}
cleanTitles();
