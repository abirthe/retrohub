import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanupPrices() {
  console.log("Fetching products from Supabase...");
  const { data: products, error } = await supabase.from('products').select('*');

  if (error) {
    console.error("Error fetching products:", error);
    return;
  }

  console.log(`Checking prices for ${products.length} products...`);

  for (const product of products) {
    try {
      // List all prices for this product in Stripe
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
      });

      // Find the incorrect USD price (where amount equals the BDT amount)
      const wrongUsdPrice = prices.data.find(p => 
        p.currency === 'usd' && 
        p.unit_amount === Math.round(product.sale_price * 100)
      );

      if (wrongUsdPrice) {
        // Archive the incorrect price
        await stripe.prices.update(wrongUsdPrice.id, {
          active: false
        });
        console.log(`Archived incorrect USD price for: ${product.title}`);
      }
    } catch (err) {
      console.error(`Error checking product ${product.title}:`, err.message);
    }
  }

  console.log("Cleanup complete!");
}

cleanupPrices();
