#!/usr/bin/env node

/**
 * ==============================================================================
 * RetroHub - Intelligent Product Image Finder & Validator
 * ==============================================================================
 * Searches for images matching a product title and verifies they meet custom
 * image requirements (dimensions, aspect ratio, format, accessibility, quality).
 *
 * Supported providers:
 *   1. Curated High-Res Brand & Service Registry (Instant, pixel-perfect logos)
 *   2. Steam Store API (Official PC/console game headers & capsules)
 *   3. iTunes / App Store API (Official 512x512/1024x1024 app/game icons)
 *   4. DuckDuckGo Image Search (Real-time web search for any brand/game/software)
 *
 * Usage:
 *   # Search single product with default requirements:
 *   node scripts/images/search_product_image.mjs --title "QuillBot Premium"
 *
 *   # Search with strict aspect ratio and minimum resolution:
 *   node scripts/images/search_product_image.mjs --title "Cyberpunk 2077" --aspect 16:9 --min-width 600
 *
 *   # Scan catalog for missing images (Dry-run preview):
 *   node scripts/images/search_product_image.mjs --all-missing --limit 10
 *
 *   # Scan and automatically update Supabase database:
 *   node scripts/images/search_product_image.mjs --all-missing --limit 20 --apply
 * ==============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ------------------------------------------------------------------------------
// Environment & Supabase Setup
// ------------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const possiblePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../.env')
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx === -1) continue;
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) process.env[key] = val;
        }
        return envPath;
      } catch (e) {
        // continue
      }
    }
  }
  return null;
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// ------------------------------------------------------------------------------
// Curated Brand & Service Registry (Instant & Clean)
// ------------------------------------------------------------------------------
const CURATED_REGISTRY = [
  // Subscriptions & Productivity
  { keyword: 'quillbot', url: 'https://assets.quillbot.com/images/og-quillbot-img.png', width: 1200, height: 630 },
  { keyword: 'tryhackme', url: 'https://www.hostingadvice.com/wp-content/uploads/2020/07/HA-TryHackMe.jpg', width: 1300, height: 620 },
  { keyword: 'grammarly', url: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Grammarly_logo.svg', width: 800, height: 800 },
  { keyword: 'chegg', url: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Chegg_logo.svg', width: 800, height: 300 },
  { keyword: 'discord', url: 'https://upload.wikimedia.org/wikipedia/en/9/98/Discord_logo.svg', width: 800, height: 600 },
  { keyword: 'netflix', url: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg', width: 1280, height: 720 },
  { keyword: 'prime video', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png', width: 1200, height: 675 },
  { keyword: 'spotify', url: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg', width: 1200, height: 600 },
  { keyword: 'adobe', url: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Adobe_Acrobat_DC_logo_2020.svg', width: 800, height: 800 },
  { keyword: 'windows', url: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Windows_logo_-_2012_%28dark_blue%29.svg', width: 800, height: 800 },
  { keyword: 'telegram', url: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg', width: 800, height: 800 },
  { keyword: 'google one', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg', width: 800, height: 400 },
  { keyword: 'linkedin', url: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png', width: 800, height: 800 },

  // Top-ups & In-Game Currencies
  { keyword: 'valorant', url: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Valorant_logo_-_pink_color_version.svg', width: 1200, height: 600 },
  { keyword: 'vp', url: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Valorant_logo_-_pink_color_version.svg', width: 1200, height: 600 },
  { keyword: 'fortnite', url: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/FortniteLogo.svg', width: 1200, height: 600 },
  { keyword: 'v-bucks', url: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/FortniteLogo.svg', width: 1200, height: 600 },
  { keyword: 'pubg', url: 'https://upload.wikimedia.org/wikipedia/en/2/22/PlayerUnknown%27s_Battlegrounds_cover.jpg', width: 800, height: 1000 },
  { keyword: 'mobile legends', url: 'https://upload.wikimedia.org/wikipedia/en/1/18/Mobile_Legends_Bang_Bang_logo.png', width: 800, height: 600 },
  { keyword: 'free fire', url: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Garena_Free_Fire_logo.png', width: 800, height: 600 },
  { keyword: 'genshin', url: 'https://upload.wikimedia.org/wikipedia/en/5/5d/Genshin_Impact_logo.svg', width: 1200, height: 600 },
  { keyword: 'honkai', url: 'https://upload.wikimedia.org/wikipedia/en/4/44/Honkai_Star_Rail_logo.svg', width: 1200, height: 600 },
  { keyword: 'roblox', url: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Roblox_player_icon_black.svg', width: 800, height: 800 },
  { keyword: 'apex', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Apex_legends_title.svg', width: 1200, height: 600 },
  { keyword: 'marvel rivals', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Marvel_Logo.svg', width: 1200, height: 600 },

  // Platforms & Gift Cards
  { keyword: 'playstation', url: 'https://upload.wikimedia.org/wikipedia/commons/0/00/PlayStation_logo.svg', width: 800, height: 600 },
  { keyword: 'psn', url: 'https://upload.wikimedia.org/wikipedia/commons/0/00/PlayStation_logo.svg', width: 800, height: 600 },
  { keyword: 'ps plus', url: 'https://upload.wikimedia.org/wikipedia/commons/0/00/PlayStation_logo.svg', width: 800, height: 600 },
  { keyword: 'xbox', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Xbox_one_logo.svg', width: 800, height: 600 },
  { keyword: 'steam', url: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg', width: 800, height: 800 }
];

// ------------------------------------------------------------------------------
// Title Cleaning & Semantic Analysis
// ------------------------------------------------------------------------------
export function cleanProductTitle(rawTitle) {
  if (!rawTitle) return '';

  // Extract base title before any pipe '|' (e.g. "Product Name | 1 Month" -> "Product Name")
  let title = rawTitle.split('|')[0].trim();

  // Strip region tags
  const regions = [
    'GLOBAL', 'TURKEY', 'ARGENTINA', 'EUROPE', 'UNITED STATES',
    'BRAZIL', 'ASIA', 'LATAM', 'INDIA', 'BANGLADESH', 'UK', 'USA'
  ];
  const regionRegex = new RegExp(`\\b(${regions.join('|')})\\b`, 'gi');
  title = title.replace(regionRegex, '');

  // Strip common packaging / delivery words
  const noiseWords = [
    'XBOX LIVE Key', 'Xbox Live', 'PSN Key', 'Steam Key', 'PC Key',
    'Digital Code', 'Gift Card', 'Gift Code', 'Activation Key',
    'Login Method', 'Personal Account', 'Monthly Pass', 'Subscription',
    'Standard Edition', 'Deluxe Edition', 'Ultimate Edition', 'Premium Edition',
    'Gold Edition', 'Complete Edition', 'GOTY Edition', 'Pre-Order',
    'Pre-purchase', 'Cross-Gen Bundle', 'Bundle', 'DLC'
  ];
  const noiseRegex = new RegExp(`\\b(${noiseWords.join('|')})\\b`, 'gi');
  title = title.replace(noiseRegex, '');

  // Remove parenthesis content e.g. "(PC)", "(PS5)", "(Xbox)"
  title = title.replace(/\([^)]*\)/g, '');
  title = title.replace(/\[[^\]]*\]/g, '');

  // Strip isolated special characters and clean whitespace
  title = title.replace(/[™®©]/g, '');
  title = title.replace(/[-_:]/g, ' ');
  title = title.replace(/\s+/g, ' ').trim();

  return title;
}

// ------------------------------------------------------------------------------
// Pure JS Fast Image Dimension Prober (Header Stream Parsing)
// ------------------------------------------------------------------------------
export function parseImageDimensionsFromBuffer(buf) {
  if (!buf || buf.length < 16) return null;

  // 1. PNG: 0x89 0x50 0x4E 0x47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    if (buf.length >= 24) {
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      return { format: 'png', width, height };
    }
  }

  // 2. GIF: GIF87a or GIF89a
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    if (buf.length >= 10) {
      const width = buf.readUInt16LE(6);
      const height = buf.readUInt16LE(8);
      return { format: 'gif', width, height };
    }
  }

  // 3. WEBP: RIFF....WEBP
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) {
    // VP8 (lossy)
    if (buf[12] === 0x56 && buf[13] === 0x50 && buf[14] === 0x38 && buf[15] === 0x20) {
      if (buf.length >= 30) {
        const width = (buf.readUInt16LE(26) & 0x3FFF);
        const height = (buf.readUInt16LE(28) & 0x3FFF);
        return { format: 'webp', width, height };
      }
    }
    // VP8L (lossless)
    if (buf[12] === 0x56 && buf[13] === 0x50 && buf[14] === 0x38 && buf[15] === 0x4C) {
      if (buf.length >= 25 && buf[20] === 0x2F) {
        const b0 = buf[21], b1 = buf[22];
        const width = 1 + (((b1 & 0x3F) << 8) | b0);
        const height = 1 + (((buf[24] & 0xF) << 10) | (buf[23] << 2) | ((buf[22] & 0xC0) >> 6));
        return { format: 'webp', width, height };
      }
    }
    // VP8X (extended)
    if (buf[12] === 0x56 && buf[13] === 0x50 && buf[14] === 0x38 && buf[15] === 0x58) {
      if (buf.length >= 30) {
        const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
        const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
        return { format: 'webp', width, height };
      }
    }
  }

  // 4. JPEG: 0xFF 0xD8
  if (buf[0] === 0xFF && buf[1] === 0xD8) {
    let offset = 2;
    while (offset < buf.length - 8) {
      if (buf[offset] !== 0xFF) {
        offset++;
        continue;
      }
      const marker = buf[offset + 1];
      const isSOF = (marker >= 0xC0 && marker <= 0xC3) ||
                    (marker >= 0xC5 && marker <= 0xC7) ||
                    (marker >= 0xC9 && marker <= 0xCB) ||
                    (marker >= 0xCD && marker <= 0xCF);
      if (isSOF) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        return { format: 'jpeg', width, height };
      }
      if (marker === 0xD9 || marker === 0xDA) break;
      const len = buf.readUInt16BE(offset + 2);
      offset += 2 + len;
    }
  }

  // 5. SVG: check text for <svg
  const text = buf.slice(0, 1024).toString('utf8');
  if (text.includes('<svg')) {
    const wMatch = text.match(/width="([0-9.]+)(?:px)?"/i);
    const hMatch = text.match(/height="([0-9.]+)(?:px)?"/i);
    const vbMatch = text.match(/viewBox="[^"]*?\s+[^"]*?\s+([0-9.]+)\s+([0-9.]+)"/i);
    const width = wMatch ? Math.round(parseFloat(wMatch[1])) : (vbMatch ? Math.round(parseFloat(vbMatch[1])) : 800);
    const height = hMatch ? Math.round(parseFloat(hMatch[1])) : (vbMatch ? Math.round(parseFloat(vbMatch[2])) : 800);
    return { format: 'svg', width, height };
  }

  return null;
}

// ------------------------------------------------------------------------------
// Image Validator Engine
// ------------------------------------------------------------------------------
const BAD_DOMAINS = [
  'alamy.com', 'shutterstock.com', 'gettyimages.com', 'dreamstime.com',
  '123rf.com', 'stockphoto.com', 'via.placeholder.com', 'placeholder.com'
];

export async function validateImageRequirements(imageUrl, requirements = {}) {
  const {
    minWidth = 300,
    minHeight = 200,
    maxWidth = 4096,
    maxHeight = 4096,
    aspect = 'any', // '16:9', '4:3', '1:1', '3:4', '2:3', 'landscape', 'portrait', 'any'
    tolerance = 0.25,
    timeoutMs = 6000
  } = requirements;

  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
    return { valid: false, reason: 'Invalid URL string' };
  }

  // Check bad/watermarked domains
  for (const bad of BAD_DOMAINS) {
    if (imageUrl.toLowerCase().includes(bad)) {
      return { valid: false, reason: `Excluded domain: ${bad}` };
    }
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Fetch partial range first (first 32KB is enough for image headers)
    let res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Range': 'bytes=0-32768'
      }
    });

    clearTimeout(timer);

    if (!res.ok && res.status !== 206) {
      // Fallback without range header in case server rejects Range
      const fallbackController = new AbortController();
      const fbTimer = setTimeout(() => fallbackController.abort(), timeoutMs);
      res = await fetch(imageUrl, {
        signal: fallbackController.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      clearTimeout(fbTimer);
      if (!res.ok) {
        return { valid: false, reason: `HTTP error ${res.status}` };
      }
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('image') && !imageUrl.match(/\.(png|jpe?g|webp|svg)/i)) {
      return { valid: false, reason: `Invalid content-type: ${contentType}` };
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 100) {
      return { valid: false, reason: 'Image payload too small (<100B)' };
    }

    const dims = parseImageDimensionsFromBuffer(buffer);
    if (!dims) {
      // If SVG by extension/content-type, give fallback
      if (contentType.includes('svg') || imageUrl.endsWith('.svg')) {
        return { valid: true, width: 800, height: 800, format: 'svg', ratio: 1.0 };
      }
      return { valid: false, reason: 'Unable to parse image dimension headers' };
    }

    const { width, height, format } = dims;

    // Check bounds
    if (width < minWidth || height < minHeight) {
      return {
        valid: false,
        reason: `Resolution too low (${width}x${height}), required min (${minWidth}x${minHeight})`,
        width,
        height
      };
    }

    if (maxWidth && width > maxWidth) {
      return { valid: false, reason: `Width exceeds max (${width} > ${maxWidth})` };
    }
    if (maxHeight && height > maxHeight) {
      return { valid: false, reason: `Height exceeds max (${height} > ${maxHeight})` };
    }

    // Check aspect ratio
    const currentRatio = width / height;

    if (aspect !== 'any') {
      let targetRatio = null;
      if (aspect === '16:9') targetRatio = 16 / 9;
      else if (aspect === '4:3') targetRatio = 4 / 3;
      else if (aspect === '1:1') targetRatio = 1.0;
      else if (aspect === '3:4') targetRatio = 3 / 4;
      else if (aspect === '2:3') targetRatio = 2 / 3;
      else if (aspect === 'landscape') {
        if (currentRatio < 1.15) {
          return { valid: false, reason: `Not landscape (ratio: ${currentRatio.toFixed(2)})`, width, height };
        }
      } else if (aspect === 'portrait') {
        if (currentRatio > 0.85) {
          return { valid: false, reason: `Not portrait (ratio: ${currentRatio.toFixed(2)})`, width, height };
        }
      }

      if (targetRatio !== null) {
        const lowerBound = targetRatio * (1 - tolerance);
        const upperBound = targetRatio * (1 + tolerance);
        if (currentRatio < lowerBound || currentRatio > upperBound) {
          return {
            valid: false,
            reason: `Aspect ratio mismatch (got ${currentRatio.toFixed(2)}, expected ${aspect} ~ ${targetRatio.toFixed(2)})`,
            width,
            height
          };
        }
      }
    }

    return {
      valid: true,
      width,
      height,
      format,
      ratio: Number(currentRatio.toFixed(2))
    };
  } catch (err) {
    return { valid: false, reason: `Verification error: ${err.message}` };
  }
}

// ------------------------------------------------------------------------------
// Search Provider 1: Curated Registry
// ------------------------------------------------------------------------------
export function searchCuratedRegistry(title) {
  const titleLower = title.toLowerCase();
  for (const entry of CURATED_REGISTRY) {
    if (titleLower.includes(entry.keyword)) {
      return {
        provider: 'Curated Registry',
        url: entry.url,
        estimatedWidth: entry.width,
        estimatedHeight: entry.height
      };
    }
  }
  return null;
}

// ------------------------------------------------------------------------------
// Search Provider 2: Steam Store API (Official Game Headers)
// ------------------------------------------------------------------------------
export async function searchSteamImage(gameTitle) {
  try {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameTitle)}&l=english&cc=US`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const appid = data.items[0].id;
      // High-res Steam header image
      const headerUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;
      return {
        provider: 'Steam Store API',
        url: headerUrl,
        title: data.items[0].name,
        estimatedWidth: 460,
        estimatedHeight: 215
      };
    }
  } catch (err) {
    // Ignore network error
  }
  return null;
}

// ------------------------------------------------------------------------------
// Search Provider 3: iTunes / App Store API (Official 512x512/1024x1024 Art)
// ------------------------------------------------------------------------------
export async function searchItunesImage(appName) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(appName)}&entity=software&limit=3`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const item = data.results[0];
      const artwork = item.artworkUrl512 || item.artworkUrl100 || item.artworkUrl60;
      if (artwork) {
        return {
          provider: 'iTunes / App Store API',
          url: artwork.replace(/512x512bb/, '1024x1024bb'),
          title: item.trackName,
          estimatedWidth: 1024,
          estimatedHeight: 1024
        };
      }
    }
  } catch (err) {
    // Ignore network error
  }
  return null;
}

// ------------------------------------------------------------------------------
// Search Provider 4: DuckDuckGo Image Search (Deep Web Search)
// ------------------------------------------------------------------------------
export async function searchDuckDuckGoImages(query) {
  try {
    const tokenUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
    const tokenRes = await fetch(tokenUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!tokenRes.ok) return [];
    const html = await tokenRes.text();
    const vqdMatch = html.match(/vqd=([0-9-_]+)/) || html.match(/vqd="([^"]+)"/);
    if (!vqdMatch) return [];

    const vqd = vqdMatch[1];
    const apiUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`;
    const apiRes = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!apiRes.ok) return [];
    const data = await apiRes.json();
    return (data.results || []).map(r => ({
      provider: 'DuckDuckGo Images',
      url: r.image,
      title: r.title,
      width: r.width,
      height: r.height,
      source: r.url
    }));
  } catch (err) {
    return [];
  }
}

// ------------------------------------------------------------------------------
// Orchestrator: Find & Verify Image for a Product Title
// ------------------------------------------------------------------------------
export async function findProductImage(productTitle, options = {}) {
  const {
    requirements = {},
    providerPriority = 'all', // 'all', 'curated', 'steam', 'ddg', 'itunes'
    category = 'games'
  } = options;

  const cleanedTitle = cleanProductTitle(productTitle);
  const candidates = [];

  // 1. Curated Registry
  if (providerPriority === 'all' || providerPriority === 'curated') {
    const curated = searchCuratedRegistry(productTitle) || searchCuratedRegistry(cleanedTitle);
    if (curated) candidates.push(curated);
  }

  // 2. Steam Store (Prioritized for games)
  if (providerPriority === 'all' || providerPriority === 'steam') {
    if (category.includes('game') || category === 'pc_game' || category === 'xbox_game' || category === 'ps_game') {
      const steamMatch = await searchSteamImage(cleanedTitle);
      if (steamMatch) candidates.push(steamMatch);
    }
  }

  // 3. iTunes / App Store (Useful for mobile games and apps)
  if (providerPriority === 'all' || providerPriority === 'itunes') {
    if (category === 'topup' || category === 'subscription' || category === 'software') {
      const itunesMatch = await searchItunesImage(cleanedTitle);
      if (itunesMatch) candidates.push(itunesMatch);
    }
  }

  // 4. DuckDuckGo Image Search
  if (providerPriority === 'all' || providerPriority === 'ddg') {
    const searchQueries = [
      `${cleanedTitle} cover wallpaper banner`,
      `${cleanedTitle} logo official`,
      `${cleanedTitle} game header`
    ];

    for (const query of searchQueries) {
      const ddgResults = await searchDuckDuckGoImages(query);
      if (ddgResults.length > 0) {
        candidates.push(...ddgResults.slice(0, 4));
        break; // Stop after first query with results to reduce requests
      }
    }
  }

  // 5. Verify candidates against image requirements
  for (const candidate of candidates) {
    const validation = await validateImageRequirements(candidate.url, requirements);
    if (validation.valid) {
      return {
        success: true,
        originalTitle: productTitle,
        cleanedTitle,
        imageUrl: candidate.url,
        provider: candidate.provider,
        width: validation.width,
        height: validation.height,
        ratio: validation.ratio,
        format: validation.format
      };
    }
  }

  return {
    success: false,
    originalTitle: productTitle,
    cleanedTitle,
    error: `No candidate images passed requirements (tested ${candidates.length} sources).`
  };
}

// ------------------------------------------------------------------------------
// CLI Handler & Batch Processing
// ------------------------------------------------------------------------------
function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {
    title: null,
    allMissing: false,
    limit: 10,
    category: null,
    minWidth: 300,
    minHeight: 200,
    maxWidth: null,
    maxHeight: null,
    aspect: 'any',
    tolerance: 0.25,
    apply: false,
    saveJson: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--title') options.title = args[++i];
    else if (arg === '--all-missing') options.allMissing = true;
    else if (arg === '--limit') options.limit = parseInt(args[++i], 10);
    else if (arg === '--category') options.category = args[++i];
    else if (arg === '--min-width') options.minWidth = parseInt(args[++i], 10);
    else if (arg === '--min-height') options.minHeight = parseInt(args[++i], 10);
    else if (arg === '--max-width') options.maxWidth = parseInt(args[++i], 10);
    else if (arg === '--max-height') options.maxHeight = parseInt(args[++i], 10);
    else if (arg === '--aspect') options.aspect = args[++i];
    else if (arg === '--tolerance') options.tolerance = parseFloat(args[++i]);
    else if (arg === '--apply') options.apply = true;
    else if (arg === '--save-json') options.saveJson = args[++i];
    else if (arg === '--help' || arg === '-h') options.help = true;
  }

  return options;
}

function printHelp() {
  console.log(`
RetroHub Product Image Search & Requirement Validator
=====================================================

Options:
  --title "<title>"      Search image for a specific product title.
  --all-missing          Scan Supabase database for products missing images.
  --limit <num>          Number of missing products to process (default: 10).
  --category <name>      Filter missing products by category (e.g. subscription, games).
  --aspect <ratio>       Required aspect ratio: '16:9', '4:3', '1:1', '3:4', '2:3', 'landscape', 'portrait', 'any' (default: 'any').
  --min-width <px>       Minimum width in pixels (default: 300).
  --min-height <px>      Minimum height in pixels (default: 200).
  --tolerance <float>    Aspect ratio deviation allowed (default: 0.25).
  --apply                Commit validated images to Supabase database (default is dry-run preview).
  --save-json <path>     Write search report to a JSON file.
  --help, -h             Show this help screen.

Examples:
  node scripts/images/search_product_image.mjs --title "QuillBot 12 Month"
  node scripts/images/search_product_image.mjs --title "Forza Horizon 5" --aspect 16:9 --min-width 450
  node scripts/images/search_product_image.mjs --all-missing --limit 5
  node scripts/images/search_product_image.mjs --all-missing --limit 10 --apply
`);
}

async function main() {
  const opts = parseCliArgs();

  if (opts.help || (!opts.title && !opts.allMissing)) {
    printHelp();
    return;
  }

  const requirements = {
    minWidth: opts.minWidth,
    minHeight: opts.minHeight,
    maxWidth: opts.maxWidth,
    maxHeight: opts.maxHeight,
    aspect: opts.aspect,
    tolerance: opts.tolerance
  };

  console.log(`\n======================================================`);
  console.log(`🚀 RetroHub Image Search & Validation Engine`);
  console.log(`Requirements: Min [${opts.minWidth}x${opts.minHeight}] | Aspect: ${opts.aspect} (±${(opts.tolerance * 100).toFixed(0)}%) | Mode: ${opts.apply ? 'APPLY (Live DB)' : 'PREVIEW (Dry-Run)'}`);
  console.log(`======================================================\n`);

  // Single product search mode
  if (opts.title) {
    console.log(`🔍 Searching image for: "${opts.title}"`);
    const result = await findProductImage(opts.title, { requirements });

    if (result.success) {
      console.log(`\n✅ MATCH FOUND!`);
      console.log(`   Cleaned Title : ${result.cleanedTitle}`);
      console.log(`   Provider      : ${result.provider}`);
      console.log(`   Dimensions    : ${result.width}x${result.height} (${result.format.toUpperCase()}, aspect: ${result.ratio})`);
      console.log(`   Image URL     : ${result.imageUrl}\n`);
    } else {
      console.log(`\n❌ FAILED: ${result.error}\n`);
    }

    if (opts.saveJson) {
      fs.writeFileSync(opts.saveJson, JSON.stringify(result, null, 2));
      console.log(`Saved result to ${opts.saveJson}`);
    }
    return;
  }

  // Batch database mode
  if (opts.allMissing) {
    if (!supabase) {
      console.error(`❌ Error: Supabase credentials not found in .env. Cannot query database.`);
      process.exit(1);
    }

    console.log(`Fetching products missing images from Supabase...`);
    let query = supabase
      .from('products')
      .select('id, title, category, platform, image_url')
      .or('image_url.is.null,image_url.eq.,image_url.eq.https://via.placeholder.com/300')
      .order('created_at', { ascending: false });

    if (opts.category) {
      query = query.eq('category', opts.category);
    }

    if (opts.limit > 0) {
      query = query.limit(opts.limit);
    }

    const { data: missingProducts, error } = await query;
    if (error) {
      console.error(`Database query error:`, error.message);
      process.exit(1);
    }

    console.log(`Found ${missingProducts.length} missing products to process.\n`);

    const report = [];
    let updatedCount = 0;

    for (let i = 0; i < missingProducts.length; i++) {
      const p = missingProducts[i];
      process.stdout.write(`[${i + 1}/${missingProducts.length}] "${p.title.slice(0, 45)}" ... `);

      const result = await findProductImage(p.title, {
        requirements,
        category: p.category || 'games'
      });

      if (result.success) {
        console.log(`✅ [${result.provider}] ${result.width}x${result.height}`);
        report.push({ id: p.id, title: p.title, ...result });

        if (opts.apply) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ image_url: result.imageUrl })
            .eq('id', p.id);

          if (!updateError) updatedCount++;
        }
      } else {
        console.log(`❌ No valid image`);
        report.push({ id: p.id, title: p.title, success: false, error: result.error });
      }

      // Small throttle to be courteous to external APIs
      await new Promise(r => setTimeout(r, 250));
    }

    console.log(`\n======================================================`);
    console.log(`Summary: Processed ${missingProducts.length} items | Matches found: ${report.filter(r => r.success).length}`);
    if (opts.apply) {
      console.log(`💾 Live DB Updates Applied: ${updatedCount} products updated`);
    } else {
      console.log(`💡 Preview mode only. Re-run with --apply to commit these images to the database.`);
    }
    console.log(`======================================================\n`);

    if (opts.saveJson) {
      fs.writeFileSync(opts.saveJson, JSON.stringify(report, null, 2));
      console.log(`Saved full report to ${opts.saveJson}`);
    }
  }
}

main().catch(err => {
  console.error(`Fatal script error:`, err);
  process.exit(1);
});
