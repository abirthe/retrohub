import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PRICE_INCREMENT = 50; // 50 BDT (~0.5 USD)

async function fetchAllProducts() {
  const allProducts = [];
  const pageSize = 1000;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("products")
      .select("id, title, sale_price")
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allProducts.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  return allProducts;
}

async function updateInBatches(products, batchSize = 30) {
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < products.length; i += batchSize) {
    const chunk = products.slice(i, i + batchSize);
    await Promise.all(
      chunk.map(async (p) => {
        const oldPrice = Number(p.sale_price) || 0;
        const newPrice = Math.round((oldPrice + PRICE_INCREMENT) * 100) / 100;
        try {
          const { error } = await supabase
            .from("products")
            .update({ sale_price: newPrice, updated_at: new Date().toISOString() })
            .eq("id", p.id);

          if (error) {
            failCount++;
            console.error(`Error updating product ${p.id} (${p.title}):`, error.message);
          } else {
            successCount++;
          }
        } catch (err) {
          failCount++;
          console.error(`Exception updating product ${p.id}:`, err);
        }
      })
    );

    const progress = Math.min(i + batchSize, products.length);
    if (progress % 300 === 0 || progress === products.length) {
      console.log(`Progress: ${progress} / ${products.length} products processed...`);
    }
  }

  return { successCount, failCount };
}

async function main() {
  console.log(`Fetching all products from Supabase...`);
  const products = await fetchAllProducts();
  console.log(`Total products found: ${products.length}`);

  if (products.length === 0) {
    console.log("No products found.");
    return;
  }

  console.log(`Sample before update:`);
  console.log(products.slice(0, 3).map((p) => `${p.title}: ৳${p.sale_price}`));

  console.log(`\nIncreasing sale_price by +৳${PRICE_INCREMENT} (+0.5 USD) for all ${products.length} products...`);
  const { successCount, failCount } = await updateInBatches(products, 30);

  console.log(`\nUpdate finished!`);
  console.log(`Successfully updated: ${successCount}`);
  console.log(`Failed: ${failCount}`);

  // Verification sample
  const { data: sampleAfter } = await supabase
    .from("products")
    .select("id, title, sale_price")
    .in("id", products.slice(0, 3).map((p) => p.id));

  console.log(`\nSample after update:`);
  console.log(sampleAfter.map((p) => `${p.title}: ৳${p.sale_price}`));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
