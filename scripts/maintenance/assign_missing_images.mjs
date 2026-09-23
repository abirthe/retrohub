import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../../.env');
const env = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^"|"$/g, '');
  }
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const isDryRun = !process.argv.includes('--execute');

// Map of product IDs -> image_url
const IMAGE_MAP = {
  // === Xbox Gift Cards ===
  '2b9f46d9-9bc1-417b-a69d-0b23fb39d012': '/images/giftcards/xbox-giftcard.jpg', // $100 Xbox Gift Card
  '539ba17f-c5cb-4da5-aa42-f46d83169047': '/images/giftcards/xbox-giftcard.jpg', // $10 Xbox Gift Card
  'a422d310-de55-4d34-8f9c-3accb7560e89': '/images/giftcards/xbox-giftcard.jpg', // $5 Xbox Gift Card
  'ac5656a8-39e9-42f3-947f-8006469bbe16': '/images/giftcards/xbox-giftcard.jpg', // $50 Xbox Gift Card
  'd7489faa-2563-4684-ac3c-11cc6a5a993b': '/images/giftcards/xbox-giftcard.jpg', // Xbox Gift Card (USD) | $5
  'fb52b8c1-b945-4c6f-a12a-9835e50b99f7': '/images/giftcards/xbox-giftcard.jpg', // Xbox Gift Card (TL) | 25 TL
  '91203f12-0968-4897-9ec8-11a3abdc5f77': '/images/giftcards/xbox-giftcard.jpg', // Xbox Gift Card (USD) | $20
  'babf454d-585c-4820-9242-a1145b12337d': '/images/giftcards/xbox-giftcard.jpg', // $25 Xbox Gift Card

  // === PlayStation Gift Cards ===
  'c0be12b1-9c97-47e7-9ac4-5bea5159c7c6': '/images/giftcards/playstation-giftcard.jpg', // $100 PlayStation Store Gift Card
  '870be03e-391f-4634-9aa6-169fbad9a1bf': '/images/giftcards/playstation-giftcard.jpg', // PlayStation Gift Card (Turkey) | 500 TL
  'e1ada12d-bd08-494f-9289-5d025efc4576': '/images/giftcards/playstation-giftcard.jpg', // PlayStation Gift Card (Turkey) | 750 TL
  '564cae30-db3e-4c2e-8780-d5001b5df359': '/images/giftcards/playstation-giftcard.jpg', // PlayStation Store Gift Card (UK) | £10
  'd0c0d858-8b80-4303-93e0-9c0c1ff8330d': '/images/giftcards/playstation-giftcard.jpg', // PlayStation Store Gift Card (UK) | £20
  '5c850ef6-9e93-4e5a-a070-03d4e05a4f14': '/images/giftcards/playstation-giftcard.jpg', // PlayStation Store Gift Card (UK) | £50
  'd6b76aef-8930-4d27-b351-1a8bfb75473f': '/images/giftcards/playstation-giftcard.jpg', // $50 PlayStation Store Gift Card
  '6858f6ce-402e-4cbb-a0b7-0452efca3782': '/images/giftcards/playstation-giftcard.jpg', // $25 PlayStation Gift Card

  // === Steam Gift Cards ===
  '87779b0a-2e07-4ac9-b23e-5101b567e7a3': '/images/giftcards/steam-giftcard.jpg', // Steam Gift Card (Global) | $5
  'ea92a3ad-3abb-4db3-94ce-5be323a38fdf': '/images/giftcards/steam-giftcard.jpg', // Steam Gift Card (INR) | 150 INR
  '1fd5ee73-0431-4fff-ba99-4f2b9f51e712': '/images/giftcards/steam-giftcard.jpg', // Steam Gift Card (INR) | 500 INR
  'b8cded93-b49b-445a-be7f-973246762f10': '/images/giftcards/steam-giftcard.jpg', // Steam Gift Card (INR) | 1000 INR
  'fd93db49-8021-4779-a7e2-0ef59c9d3143': '/images/giftcards/steam-giftcard.jpg', // Steam Gift Card (Global) | $25
  'b3154e4c-810e-4fca-9886-d1fc3b2a259b': '/images/giftcards/steam-giftcard.jpg', // Steam Gift Card (Global) | $50

  // === PS Plus Essential ===
  '39cd3141-1349-488f-8cc3-d89d1221ce13': '/images/subscriptions/ps-plus-extra.jpg', // PlayStation Plus Extra (Turkey) | 1 Month
  'e4578089-b3ba-4b1d-87a8-17737d2e8946': '/images/subscriptions/ps-plus-essential.jpg', // PlayStation Plus Essential (Turkey) | 12 Month
  '17da4533-f15f-46d6-9ad4-e9404846291a': '/images/subscriptions/ps-plus-essential.jpg', // PlayStation Plus Essential (Turkey) | 3 Month
  '8add2314-ee4b-4405-97c8-7698ab9664fa': '/images/subscriptions/ps-plus-extra.jpg', // PlayStation Plus Extra (Turkey) | 3 Month
  '574e03a7-5404-41ec-a878-df34ceda1ff9': '/images/subscriptions/ps-plus-extra.jpg', // PlayStation Plus Extra (Turkey) | 12 Month
  'bf209e1d-5cdf-493b-b490-015b7bff5f2e': '/images/subscriptions/ps-plus-deluxe.jpg', // PlayStation Plus Deluxe (Turkey) | 3 Month
  '184dff4e-d12e-4499-9217-bf4475b0bf40': '/images/subscriptions/ps-plus-deluxe.jpg', // PlayStation Plus Deluxe (Turkey) | 12 Month
  '095ce810-bd26-4440-b990-6009befb29c5': '/images/subscriptions/ps-plus-essential.jpg', // PlayStation Plus Essential (Turkey) | 1 Month
  '1bc8fec8-c9fc-4f62-9ce1-3731d2bc3484': '/images/subscriptions/ps-plus-deluxe.jpg', // PlayStation Plus Deluxe (Turkey) | 1 Month

  // === Xbox Game Pass ===
  '5454dcb7-544e-4386-9c3b-54c4073d2675': '/images/subscriptions/xbox-game-pass.jpg', // Xbox Game Pass (India) | Essential 1M
  '7aa4eea0-0f1f-418c-8e8d-3e8a73695d5a': '/images/subscriptions/xbox-game-pass.jpg', // Xbox Game Pass (India) | Premium 1M
  '3033dc14-3d39-4e03-854b-c106945dec34': '/images/subscriptions/xbox-game-pass.jpg', // Xbox Game Pass (India) | Essential 6M
  '26995dfd-6590-47d4-b138-4bcc01e3cec6': '/images/subscriptions/xbox-game-pass.jpg', // Xbox Game Pass (India) | Essential 12M
  '1c56bd66-ad78-4ea2-861e-b8bdf8c8bb4f': '/images/subscriptions/xbox-game-pass.jpg', // Xbox Game Pass (India) | PC 3M
  '6aace1a6-c3f2-4cdb-b3a3-c9fd297aa8ab': '/images/subscriptions/xbox-game-pass.jpg', // Xbox Game Pass (India) | Ultimate 1M
  '79482d77-59c8-49f1-8e99-168073ae67f0': '/images/subscriptions/xbox-game-pass.jpg', // Xbox Game Pass (India) | Ultimate 3M

  // === PC Games ===
  '89d11838-cade-4298-b89e-b9f86c6c2528': '/images/games/cyberpunk-2077.jpg',           // Cyberpunk 2077 (ARS)
  '6289376d-305c-4756-a0e9-143c811f7583': '/images/games/resident-evil-4.jpg',          // Resident Evil 4 (USA)

  // === Xbox Games ===
  '328ae756-8dd1-4471-b058-61e9a26667ab': '/images/games/hot-wheels-unleashed.jpg',     // HOT WHEELS UNLEASHED GOTY (ARS)
  'c4f81a2c-2cec-4895-9ebf-1d179b08557a': '/images/games/palworld.jpg',                 // Palworld Xbox/PC (ARS)
};

async function assignMissingImages() {
  process.stdout.write(`=== Missing Image Assigner ===\n`);
  process.stdout.write(`Mode: ${isDryRun ? 'DRY-RUN (no DB changes)' : 'LIVE EXECUTE'}\n\n`);
  process.stdout.write(`Products to update: ${Object.keys(IMAGE_MAP).length}\n\n`);

  if (isDryRun) {
    for (const [id, url] of Object.entries(IMAGE_MAP)) {
      process.stdout.write(`  ${id} -> ${url}\n`);
    }
    process.stdout.write(`\n[DRY-RUN] Re-run with --execute to apply.\n`);
    return;
  }

  const entries = Object.entries(IMAGE_MAP);
  let updated = 0;
  let failed = 0;

  for (const [id, imageUrl] of entries) {
    const { error } = await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', id);

    if (error) {
      process.stderr.write(`  FAIL [${id}]: ${error.message}\n`);
      failed++;
    } else {
      updated++;
    }
  }

  process.stdout.write(`\nResult: ${updated} updated, ${failed} failed out of ${entries.length} products.\n`);
}

assignMissingImages().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
