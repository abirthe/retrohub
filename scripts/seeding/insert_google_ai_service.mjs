import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import crypto from 'crypto';

const env = {};
const lines = fs.readFileSync('.env', 'utf8').split('\n');
for (const line of lines) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^"|"$/g, '');
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);

const description = `### ⚡ Google AI Pro (6 Months) — Official Activation

Upgrade your personal Google account to **Google AI Pro** for a full 6 months. Get instant access to Google's most powerful AI reasoning models, massive 5TB cloud storage, and premium developer & creative tools.

---

### 💎 What's Included:
- **🧠 Gemini 3.1 Pro & Gemini 3.8 Flash:** Google's flagship multimodal reasoning AI models with expanded context windows.
- **🛸 Antigravity 2.0:** Access to Google's next-generation AI coding & development environment with 4× higher rate limits.
- **☁️ Google One — 5TB Cloud Storage:** Shared across your personal Google Drive, Google Photos, and Gmail.
- **🎬 Veo 3.1 & Gemini Omni:** AI video generation with synchronized audio from text prompts (includes 1,000 monthly credits).
- **🖼️ Nano Banana 2 & Pro:** High-resolution photorealistic AI image generation.
- **🎵 Lyria 3:** Full AI music and vocal track creation.
- **📝 Workspace AI & NotebookLM Pro:** Gemini built directly into Gmail, Docs, Sheets, Slides, and NotebookLM with 5× usage limits.

---

### 🛡️ Why Choose This Service?
- **🔐 100% Safe — Zero Password Sharing:** No need to give us your password or email login. Activation is completed via an official Google activation link.
- **📧 On Your Own Personal Gmail:** Connected directly to your own account, keeping all your personal data, files, and photos safe.
- **🌐 Global Compatibility:** Works across all regions worldwide on any standard Google account.
- **⚡ 24/7 Fast Delivery:** Receive your activation instructions immediately after order confirmation.

---

### 📋 Activation Instructions:
1. Place your order and enter your Gmail address.
2. Receive your unique official activation link.
3. Open the link while signed into your Google account and accept the upgrade.
4. Your account is immediately upgraded to Google AI Pro with 5TB storage for 6 months!`;

async function insertService() {
  const title = 'Google AI Pro | 6 Months (Gemini 3.1 Pro + 5TB Storage)';
  
  // Check if product already exists
  const { data: existing } = await supabase
    .from('products')
    .select('id, title, category')
    .ilike('title', '%Google AI Pro%')
    .maybeSingle();

  if (existing) {
    process.stdout.write(`Product already exists with ID: ${existing.id}\nUpdating...\n`);
    const { data, error } = await supabase
      .from('products')
      .update({
        title,
        category: 'service',
        delivery_type: 'automation',
        platform: 'Google',
        region: 'GLOBAL',
        cost_price: 420,
        sale_price: 499,
        in_stock: 999,
        is_active: true,
        image_url: '/images/services/google-ai-pro.jpg',
        source_url: 'https://plati.market/itm/24-7-instant-google-ai-pro-6-months-on-your-mail-gemini-3-1-pro-5tb/5816660',
        source_platform: 'plati',
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select();
    
    if (error) {
      process.stderr.write(`Update error: ${error.message}\n`);
    } else {
      process.stdout.write(`Updated successfully: ${JSON.stringify(data[0], null, 2)}\n`);
    }
    return;
  }

  const newId = crypto.randomUUID();
  const { data, error } = await supabase
    .from('products')
    .insert({
      id: newId,
      title,
      category: 'service',
      delivery_type: 'automation',
      platform: 'Google',
      region: 'GLOBAL',
      cost_price: 420,
      sale_price: 499,
      in_stock: 999,
      is_active: true,
      image_url: '/images/services/google-ai-pro.jpg',
      source_url: 'https://plati.market/itm/24-7-instant-google-ai-pro-6-months-on-your-mail-gemini-3-1-pro-5tb/5816660',
      source_platform: 'plati',
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select();

  if (error) {
    process.stderr.write(`Insert error: ${error.message}\n`);
  } else {
    process.stdout.write(`Inserted successfully: ${JSON.stringify(data[0], null, 2)}\n`);
  }
}

insertService();
