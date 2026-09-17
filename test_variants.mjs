import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function testQuery() {
  const baseName = 'Valorant VP (Malaysia)';
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('title', `${baseName} | %`)
    .eq('is_active', true);
    
  console.log('Error:', error);
  console.log('Found variants:', data?.length);
  if (data?.length > 0) {
    console.log('First variant title:', data[0].title);
  }
}
testQuery();
