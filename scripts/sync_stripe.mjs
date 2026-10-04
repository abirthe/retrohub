import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function syncProducts() {
  console.log("Fetching products from Supabase...");
  const { data: products, error } = await supabase.from('products').select('*');

  if (error) {
    console.error("Error fetching products:", error);
    return;
  }

  console.log(`Found ${products.length} products. Syncing to Stripe...`);

  for (const product of products) {
    let stripeProductId = product.id;
    try {
      // Create product in Stripe using Supabase ID
      await stripe.products.create({
        id: product.id,
        name: product.title,
        description: product.description || undefined,
        images: product.image_url ? [product.image_url] : undefined,
        metadata: {
          category: product.category,
          platform: product.platform,
        },
      });
      console.log(`Created new product: ${product.title}`);
    } catch (err) {
      if (err.code === 'resource_already_exists') {
        console.log(`Product ${product.title} already exists in Stripe.`);
      } else {
        console.error(`Failed to create product ${product.title}:`, err.message);
        continue;
      }
    }

    try {
      // Convert BDT to USD (Assuming 1 USD = ~120 BDT, adjust as needed or use an API)
      // Let's use a fixed rate of 120 for now, or you can replace it.
      const EXCHANGE_RATE_BDT_TO_USD = 1 / 120; 
      const priceInUsd = product.sale_price * EXCHANGE_RATE_BDT_TO_USD;

      // Create USD price in Stripe
      const stripePrice = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: Math.round(priceInUsd * 100), // Stripe expects cents
        currency: 'usd',
      });

      // Set this USD price as the default for the product
      await stripe.products.update(stripeProductId, {
        default_price: stripePrice.id
      });

      console.log(`  -> Added USD Price ID: ${stripePrice.id} (Converted from ${product.sale_price} BDT)`);
    } catch (err) {
      console.error(`Failed to create USD price for ${product.title}:`, err.message);
    }
  }

  console.log("Sync complete!");
}

syncProducts();
