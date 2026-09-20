import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function analyzeProducts() {
  const { data, error } = await supabase.from('products').select('id, title, category');
  if (error) throw error;
  
  const groupedCategories = ['topup', 'subscription', 'giftcard'];
  
  console.log("Analyzing anomalous products...\n");
  
  for (const cat of groupedCategories) {
    console.log(`=== Category: ${cat} ===`);
    const prods = data.filter(p => p.category === cat);
    const anomalous = prods.filter(p => !p.title.includes(' | '));
    if (anomalous.length > 0) {
      console.log(`Found ${anomalous.length} products without '|' variant grouping:`);
      anomalous.forEach(p => console.log(`- ${p.title} (${p.id})`));
    } else {
      console.log("All good! All products use the | format.");
    }
    console.log("");
  }
}

analyzeProducts();
