// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CUSTOMER_BOT_TOKEN, ADMIN_BOT_TOKEN, STAFF_CHAT_ID, supabase, corsHeaders, XAI_API_KEY, XAI_TEAM_ID } from "./config.ts";
import { escapeHtml, sleep } from "./utils.ts";

async function sendChatAction(
  chatId: string | number,
  action: string = "typing",
) {
  try {
    await fetch(
      `https://api.telegram.org/bot${CUSTOMER_BOT_TOKEN}/sendChatAction`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, action }),
      },
    );
  } catch (err) {
    console.error("Failed to sendChatAction:", err);
  }
}

async function sendMessage(
  chatId: string | number,
  text: string,
  reply_markup?: any /* eslint-disable-line */,
) {
  try {
    const url = `https://api.telegram.org/bot${CUSTOMER_BOT_TOKEN}/sendMessage`;
    const body: any /* eslint-disable-line */ = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };
    if (reply_markup) {
      body.reply_markup = reply_markup;
    }
    let res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(
        "Telegram sendMessage HTML error, retrying plain text:",
        errText,
      );
      // Strip HTML tags and retry as clean plain text
      const cleanText = text.replace(/<[^>]*>/g, "");
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: cleanText,
          reply_markup,
          disable_web_page_preview: true,
        }),
      });
    }
    return res;
  } catch (err) {
    console.error("Telegram sendMessage network error:", err);
    return null;
  }
}

async function sendMerchantAdminAlert(text: string, reply_markup?: any /* eslint-disable-line */) {
  try {
    const token = ADMIN_BOT_TOKEN || CUSTOMER_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body: any /* eslint-disable-line */ = {
      chat_id: STAFF_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };
    if (reply_markup) {
      body.reply_markup = reply_markup;
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Telegram sendMerchantAdminAlert error:", errText);
    }
    return res;
  } catch (err) {
    console.error("Telegram sendMerchantAdminAlert network error:", err);
    return null;
  }
}

async function editMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
  reply_markup?: any /* eslint-disable-line */,
) {
  try {
    const url = `https://api.telegram.org/bot${CUSTOMER_BOT_TOKEN}/editMessageText`;
    const body: any /* eslint-disable-line */ = {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };
    if (reply_markup !== undefined) {
      body.reply_markup = reply_markup;
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Telegram editMessageText error:", errText);
    }
    return res;
  } catch (err) {
    console.error("Telegram editMessageText network error:", err);
    return null;
  }
}

async function answerCallbackQuery(
  callbackQueryId: string,
  text: string = "",
  showAlert: boolean = false,
) {
  const url = `https://api.telegram.org/bot${CUSTOMER_BOT_TOKEN}/answerCallbackQuery`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    });
  } catch (err) {
    console.error("answerCallbackQuery error:", err);
  }
}

/**
 * ============================================================================
 * RetroHub Telegram support bot — HARDENED VERSION
 * ============================================================================
 * This file is a drop-in replacement for everything you pasted, starting at
 * `getRetroChanIntelligenceResponse` and ending at the closing of `serve(...)`.
 * It assumes your existing file still has, above this point and unchanged:
 *   - imports (Deno std `serve`, `supabase-js`, etc.)
 *   - the `supabase` client
 *   - `corsHeaders`
 *   - `escapeHtml(str)`
 *   - `sleep(ms)`
 *   - the Telegram senders: `sendMessage`, `editMessageText`, `sendChatAction`,
 *     `answerCallbackQuery`, `sendMerchantAdminAlert`
 *   - `XAI_API_KEY`
 *
 * WHAT CHANGED AND WHY (see inline "ROBUSTNESS FIX" comments for detail):
 *
 *   1. Cross-customer order leak (CRITICAL). The old `resolveOrder` matched
 *      on a prefix as short as 4 hex characters against the last 100 orders
 *      system-wide, and silently returned the newest match on a collision.
 *      That meant a short, even accidental, prefix could surface — and let
 *      someone view/deliver — a different customer's order and key. Fixed to
 *      require the full 8-char short ID customers actually see, and to
 *      report ambiguity instead of guessing.
 *
 *   2. No webhook authentication. Anyone who found the webhook URL could
 *      POST forged Telegram updates. Added a secret-token check.
 *
 *   3. No idempotency. Telegram redelivers updates on any slow/failed
 *      response, which could double-send messages or double-escalate.
 *      Added a claim/release pattern keyed on `update_id`.
 *
 *   4. Session creation race. Two near-simultaneous first messages from a
 *      new customer could both fall through the "no existing session"
 *      branch. Switched to `upsert`.
 *
 *   5. Message-history race. `appendSessionMessage` did a plain
 *      read-then-write, so two fast messages could clobber each other.
 *      Moved the append to a row-locking Postgres function (SQL below),
 *      with a same-behavior fallback if that migration hasn't run yet.
 *
 *   6. AI fallback chain could take ~30s (3 models x 10s) before falling
 *      back to the perfectly good local responder. Capped to one attempt.
 *
 *   7. `Number(order.total).toFixed(2)` could render "NaN" if `total` were
 *      ever null/undefined. Added `formatMoney`.
 *
 *   8. The "is this message just an order ID" detector used an unanchored
 *      regex, so any 8 consecutive hex characters anywhere in a spaceless
 *      message (e.g. a promo code) would trigger an order lookup. Anchored.
 *
 *   9. Added a light per-chat rate limit so one user can't cheaply flood
 *      the bot into burning xAI/Telegram quota.
 *
 * REQUIRED — run this once in the Supabase SQL editor:
 *
 *   create table if not exists telegram_processed_updates (
 *     update_id bigint primary key,
 *     processed_at timestamptz not null default now()
 *   );
 *
 *   create or replace function append_session_message(
 *     p_chat_id bigint,
 *     p_message jsonb,
 *     p_max_messages int default 8
 *   ) returns void
 *   language plpgsql
 *   set search_path = ''
 *   as $$
 *   declare
 *     v_combined jsonb;
 *     v_len int;
 *   begin
 *     select coalesce(recent_messages, '[]'::jsonb) || jsonb_build_array(p_message)
 *       into v_combined
 *       from public.customer_support_sessions
 *       where chat_id = p_chat_id
 *       for update;
 *
 *     v_len := jsonb_array_length(v_combined);
 *
 *     update public.customer_support_sessions
 *     set recent_messages = (
 *           select jsonb_agg(value order by ord)
 *           from jsonb_array_elements(v_combined) with ordinality as t(value, ord)
 *           where ord > greatest(v_len - p_max_messages, 0)
 *         ),
 *         updated_at = now()
 *     where chat_id = p_chat_id;
 *   end;
 *   $$;
 *
 * REQUIRED — set this env var and pass it as `secret_token` when you call
 * Telegram's setWebhook, so Telegram signs every request to you:
 *
 *   TELEGRAM_WEBHOOK_SECRET
 *
 * NOT fixed here (worth doing next): order lookups are still only as safe
 * as "does the full 8-char ID match" — nothing binds an order to the
 * Telegram chat_id that's allowed to view it. If these keys have real
 * resale value, the robust fix is to require a second factor the first
 * time a chat looks up an order (e.g. the phone number used for the bKash
 * payment) and remember that chat<->order binding afterwards.
 * ============================================================================
 */

const ORDER_SELECT =
  "*, products(id, title, platform, category, delivery_type), deliveries(*)";
const ORDER_SCAN_LIMIT = 200;

function formatMoney(value: any): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function orderNotFoundMessage(identifier: string, ambiguous: boolean): string {
  return ambiguous
    ? `⚠️ That ID matches more than one order. Please send the <b>full</b> order ID from your receipt or confirmation email.`
    : `⚠️ Order <code>#${escapeHtml(identifier)}</code> was not found. Please verify the ID on your receipt.`;
}

interface CatalogProduct {
  id: string;
  title: string;
  platform: string;
  sale_price: number;
  in_stock: number;
}

// ============================================================================
// Three-Stage Pipeline Types: Grok → BrainGine → Grok
// ============================================================================

type IntentType =
  | "product_search"
  | "order_status"
  | "payment_help"
  | "delivery_info"
  | "complaint"
  | "human_request"
  | "greeting"
  | "thanks"
  | "general_question";

type SentimentType = "positive" | "neutral" | "negative" | "frustrated";

interface CustomerIntent {
  intent: IntentType;
  entities: {
    game?: string;
    platform?: string;
    order_id?: string;
    keywords?: string[];
  };
  sentiment: SentimentType;
}

interface BrainGineProduct {
  title: string;
  platform: string;
  price: number;
  stock: number;
}

interface BrainGineOrder {
  id: string;
  shortId: string;
  status: string;
  product: string;
  platform: string;
  total: string;
  createdAt: string;
  deliveries: Array<{ code: string; notes?: string }>;
  finalOutput?: string;
}

interface BrainGineFacts {
  customerName?: string;
  products?: BrainGineProduct[];
  order?: BrainGineOrder;
  payment?: {
    method: string;
    number: string;
    fee: string;
    verificationUrl: string;
  };
  delivery?: {
    sla: string;
    channels: string[];
  };
  refundPolicy?: string;
  storeOverview?: {
    url: string;
    categories: string[];
  };
  searchQuery?: string;
  noResults?: boolean;
  customSourceAvailable?: boolean;
  escalate?: boolean;
}

interface BrainGinePayload {
  intent: IntentType;
  sentiment: SentimentType;
  facts: BrainGineFacts;
}

let cachedProducts: CatalogProduct[] = [];
let cachedCatalog = "";
let lastCatalogFetch = 0;

async function getLiveProducts(): Promise<CatalogProduct[]> {
  const now = Date.now();
  if (cachedProducts.length > 0 && now - lastCatalogFetch < 1000 * 60 * 5) {
    return cachedProducts;
  }
  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("id, title, platform, sale_price, in_stock")
      .eq("is_active", true);

    if (error || !products) return cachedProducts;

    cachedProducts = products;
    cachedCatalog =
      "8. Live Product Catalog (Suggest from these):\n" +
      products
        .map(
          (p) =>
            `- ${p.title || "Unknown"} [${p.platform || "Global"}]: ৳${p.sale_price} (Stock: ${p.in_stock})`,
        )
        .join("\n");
    lastCatalogFetch = now;
    return cachedProducts;
  } catch (e) {
    console.error("Failed to fetch live products catalog:", e);
    return cachedProducts;
  }
}

function extractSearchTerms(clean: string): string {
  const stopWords = new Set([
    "do", "you", "have", "certain", "games", "game", "of", "my", "choice", "in",
    "your", "shop", "store", "is", "the", "a", "an", "for", "please", "can", "i",
    "get", "buy", "price", "any", "got", "what", "are", "there", "available",
    "stock", "tell", "me", "about", "show", "give", "much", "cost", "how", "sell",
    "looking", "want", "need", "retrohub", "key", "keys", "code", "codes", "account",
    "deal", "deals", "cheap", "cheapest", "best", "rate", "rates", "latest", "top"
  ]);
  const words = clean
    .replace(/\bgtav\b/g, "gta 5")
    .replace(/\bgta5\b/g, "gta 5")
    .replace(/\brdr2\b/g, "red dead redemption 2")
    .replace(/\brdr\b/g, "red dead redemption")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));
  return words.join(" ").trim();
}

const GAME_ALIAS_MAP: Record<string, string> = {
  "gtav": "gta 5", "gta5": "gta 5", "gta v": "gta 5", "grand theft auto v": "gta 5",
  "gta4": "gta 4", "gta iv": "gta 4", "gta": "grand theft auto",
  "rdr2": "red dead redemption 2", "rdr 2": "red dead redemption 2", "rdr": "red dead redemption",
  "cod": "call of duty", "mw": "modern warfare", "mw2": "modern warfare 2", "mw3": "modern warfare 3",
  "warzone": "call of duty warzone", "bo": "black ops", "bo2": "black ops 2", "bo3": "black ops 3",
  "bf": "battlefield", "bf1": "battlefield 1", "bf4": "battlefield 4", "bf5": "battlefield 5", "bf2042": "battlefield 2042",
  "vp": "valorant points", "valorant point": "valorant points",
  "uc": "pubg uc", "pubguc": "pubg uc", "bgmi": "pubg bgmi", "pubg mobile": "pubg mobile uc",
  "ff": "free fire", "ffdia": "free fire diamonds", "ff diamond": "free fire diamonds",
  "fc25": "ea fc 25", "fc24": "ea fc 24", "fifa25": "ea fc 25", "fifa24": "ea fc 24", "fifa": "ea sports fc",
  "mc": "minecraft", "mine craft": "minecraft", "vbucks": "fortnite v bucks", "robux": "roblox robux",
  "gplay": "google play", "googleplay": "google play", "appstore": "apple", "itunes": "apple",
  "gp": "game pass", "xgp": "xbox game pass", "gpu": "game pass ultimate",
  "psplus": "playstation plus", "ps plus": "playstation plus", "ps+": "playstation plus",
  "er": "elden ring", "ds": "dark souls", "cp77": "cyberpunk 2077", "tw3": "witcher 3", "re4": "resident evil 4",
  "dite": "give", "nite": "take", "ache": "is", "koto": "how much", "dam": "price",
  "playstation 5": "ps5", "playstation 4": "ps4", "playstation network": "psn", "switch": "nintendo switch",
};

function applyAliases(text: string): string {
  let out = text;
  const entries = Object.entries(GAME_ALIAS_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, canonical] of entries) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`\\b${escaped}\\b`, "gi"), canonical);
  }
  return out;
}

function findMatchingProducts(query: string, products: CatalogProduct[]): CatalogProduct[] {
  const queryLower = applyAliases(query.toLowerCase());
  const stopWords = new Set([
    "do", "you", "have", "certain", "games", "game", "of", "my", "choice", "in",
    "your", "shop", "store", "is", "the", "a", "an", "for", "please", "can", "i",
    "get", "buy", "price", "any", "got", "what", "are", "there", "available",
    "stock", "tell", "me", "about", "show", "give", "much", "cost", "how", "sell",
    "looking", "want", "need", "retrohub", "key", "keys", "code", "codes", "account",
    "deal", "deals", "cheap", "cheapest", "best", "rate", "rates", "latest", "top",
    "ache", "naki", "koto", "dam", "daam", "dite", "parben", "hobe", "bhai", "bro",
    "apnaer", "apnader", "khobor", "khoj", "lagbe", "chai", "dorkar"
  ]);

  const clean = queryLower.replace(/[^a-z0-9\s]/g, " ");
  const rawTokens = clean.split(/\s+/).filter((w) => w.length > 0);
  const searchTokens = rawTokens.filter((w) => !stopWords.has(w) && w.length > 1);

  if (searchTokens.length === 0) return products.slice(0, 5);

  const wantsXbox = rawTokens.includes("xbox") || rawTokens.includes("series");
  const wantsSteam = rawTokens.includes("steam") || rawTokens.includes("pc");
  const wantsPlaystation = rawTokens.includes("psn") || rawTokens.includes("playstation") || rawTokens.includes("ps4") || rawTokens.includes("ps5");
  const wantsCheapest = rawTokens.includes("cheapest") || rawTokens.includes("cheap");

  const scored: Array<{ product: CatalogProduct; score: number }> = [];

  for (const p of products) {
    const title = (p.title || "").toLowerCase();
    const platform = (p.platform || "Global").toLowerCase();
    const combined = `${title} ${platform}`;

    let score = 0;
    let matchedTitleTokens = 0;

    if (title.includes(clean.trim())) score += 100;
    else if (combined.includes(clean.trim())) score += 60;

    for (const token of searchTokens) {
      if (title.includes(token)) {
        score += 25;
        matchedTitleTokens++;
      } else if (platform.includes(token)) {
        score += 15;
      }
    }

    if (matchedTitleTokens === 0 && !combined.includes(clean.trim())) continue;

    const matchRatio = matchedTitleTokens / searchTokens.length;
    if (searchTokens.length >= 2 && matchRatio < 0.3) continue;

    score += matchRatio * 50;
    if (wantsXbox && (platform.includes("xbox") || title.includes("xbox"))) score += 40;
    if (wantsSteam && (platform.includes("steam") || title.includes("steam"))) score += 40;
    if (wantsPlaystation && (platform.includes("playstation") || platform.includes("psn"))) score += 40;
    if (p.in_stock > 0) score += 5;

    scored.push({ product: p, score });
  }

  if (scored.length === 0) {
    return products.filter((p) => {
      const title = (p.title || "").toLowerCase();
      return searchTokens.some((t) => t.length >= 3 && title.includes(t));
    });
  }

  scored.sort((a, b) => {
    if (wantsCheapest && Math.abs(b.score - a.score) < 30) {
      return a.product.sale_price - b.product.sale_price;
    }
    return b.score - a.score || a.product.sale_price - b.product.sale_price;
  });

  const topScore = scored[0].score;
  const highQualityMatches = scored.filter((s) => s.score >= topScore * 0.6);
  return highQualityMatches.map((s) => s.product);
}

/**
 * High-IQ Retro Chan Natural Intelligence Engine
 * Provides instant, catalog-aware store assistance even if Grok xAI API is unavailable or rate-limited.
 */
function getRetroChanIntelligenceResponse(
  rawText: string,
  sessionContext?: { order?: any; customerName?: string },
  products: CatalogProduct[] = [],
): string {
  const clean = rawText.toLowerCase().trim();
  const name = sessionContext?.customerName || "there";
  const activeOrder = sessionContext?.order;

  // 1. Order Status & Tracking inquiries
  if (
    clean.includes("order") ||
    clean.includes("status") ||
    clean.includes("track") ||
    clean.includes("update") ||
    clean.includes("where is")
  ) {
    if (activeOrder) {
      return (
        `Hey ${escapeHtml(name)}! 📦 I pulled up your latest order (<b>#${activeOrder.id.slice(0, 8)}</b>):\n\n` +
        `🎮 <b>Item:</b> ${escapeHtml(activeOrder.products?.title || "Digital License")}\n` +
        `📊 <b>Status:</b> <b>${activeOrder.status}</b>\n` +
        `💰 <b>Amount:</b> ৳${formatMoney(activeOrder.total)}\n\n` +
        (activeOrder.status === "fulfilled"
          ? `🎉 Your code is delivered! Tap "View Key / Code" below to reveal it.`
          : activeOrder.status === "payment_verified" ||
              activeOrder.status === "sourcing"
            ? `🚀 Your payment is verified and our engine is actively preparing your key. Most codes arrive within 5–15 minutes!`
            : `💳 We're verifying your transaction. If you've already sent bKash, make sure you submitted the TrxID at retrohub.tech/payment!`)
      );
    }
    return `I can track any order for you instantly! 🔍 Just send your <b>8-character Order ID</b> (from your checkout receipt or confirmation SMS), or tap <b>Track My Order</b> below.`;
  }

  // 2. bKash & Payment inquiries
  if (
    clean.includes("bkash") ||
    clean.includes("pay") ||
    clean.includes("payment") ||
    clean.includes("number") ||
    clean.includes("charge") ||
    clean.includes("fee")
  ) {
    return (
      `💳 <b>RetroHub bKash Payment Guide:</b>\n\n` +
      `• <b>Method:</b> We accept exclusively <b>bKash Send Money</b>.\n` +
      `• <b>Official Number:</b> <code>01580382868</code> (Tap to copy)\n` +
      `• <b>Charge:</b> Please include the <b>1% bKash fee</b> in your payment amount.\n` +
      `• <b>Reference:</b> Use your Order ID as the transaction reference.\n\n` +
      `After sending money, enter your 10-character Transaction ID at <a href="https://www.retrohub.tech/payment">retrohub.tech/payment</a> for instant verification! ⚡`
    );
  }

  // 3. Digital Key & Delivery Speed
  if (
    clean.includes("key") ||
    clean.includes("code") ||
    clean.includes("how long") ||
    clean.includes("delivery") ||
    clean.includes("instant") ||
    clean.includes("when")
  ) {
    return (
      `⚡ <b>Digital Delivery Speed:</b>\n\n` +
      `All automated items (Steam keys, Apple/Google gift cards, game top-ups) are delivered within <b>1 to 15 minutes</b> after bKash payment verification!\n\n` +
      `Once delivered, your digital credentials will appear right here in Telegram and in your web Customer Console at <a href="https://www.retrohub.tech/orders">retrohub.tech/orders</a>. ✨`
    );
  }

  // 4. Products, Catalog Inquiries & Specific Game Availability
  if (
    clean.includes("game") ||
    clean.includes("product") ||
    clean.includes("steam") ||
    clean.includes("gift card") ||
    clean.includes("buy") ||
    clean.includes("catalog") ||
    clean.includes("price") ||
    clean.includes("stock") ||
    clean.includes("fifa") ||
    clean.includes("valorant") ||
    clean.includes("resident") ||
    clean.includes("witcher") ||
    clean.includes("gta") ||
    clean.includes("red dead") ||
    clean.includes("rdr") ||
    clean.includes("deal") ||
    clean.includes("discount") ||
    clean.includes("cheap") ||
    clean.includes("mine") ||
    clean.includes("got") ||
    clean.includes("have")
  ) {
    // A. Specific Custom Game / User Choice inquiries
    if (
      clean.includes("choice") ||
      clean.includes("custom") ||
      clean.includes("request") ||
      clean.includes("on demand") ||
      clean.includes("specific")
    ) {
      return (
        `🎮 <b>Custom Games & Special Requests:</b>\n\n` +
        `Yes, absolutely! At RetroHub, even if a specific game of your choice is not currently listed in our automated catalog, we offer <b>Custom On-Demand Game Sourcing</b> for virtually ANY title on PC (Steam, EA, Epic) or Consoles (PlayStation, Xbox, Nintendo)!\n\n` +
        `👉 <b>How to get it:</b> Simply tap <b>👨‍💻 Talk to Human Agent</b> below and tell our merchant desk which game and edition you want. We will check regional distributor pricing and provide an instant bKash checkout quote for you! ⚡`
      );
    }

    // B. Search against live catalog products
    if (products && products.length > 0) {
      const matches = findMatchingProducts(clean, products);
      if (matches.length > 0) {
        const itemsList = matches.slice(0, 4).map((p) =>
          `• <b>${escapeHtml(p.title || "Unknown")}</b> [${escapeHtml(p.platform || "Global")}]\n  💰 Price: <b>৳${p.sale_price}</b> | Stock: ${p.in_stock > 0 ? `✅ In Stock (${p.in_stock})` : "⚠️ Out of Stock"}`
        ).join("\n\n");
        return (
          `🎮 <b>Found in our Live Catalog:</b>\n\n` +
          `${itemsList}\n\n` +
          `🛒 Order instantly at <a href="https://www.retrohub.tech">retrohub.tech</a> with bKash Send Money to <code>01580382868</code>!`
        );
      }

      // Check if user inquired about a specific game title not in automated stock
      const searchTerms = extractSearchTerms(clean);
      if (searchTerms.length > 1) {
        return (
          `🔍 <b>Live Catalog Search:</b>\n\n` +
          `I searched our inventory for "<b>${escapeHtml(searchTerms)}</b>", but it is not currently in our automated instant catalog.\n\n` +
          `✨ <b>Good news:</b> We offer <b>Custom On-Demand Game Sourcing</b>! We can source almost ANY game key or gift card upon request.\n\n` +
          `Tap <b>👨‍💻 Talk to Human Agent</b> below, let our merchant team know what you'd like, and we'll arrange it for you right away! 🎮`
        );
      }
    }

    // C. General Product Overview with live sample items
    const sampleProducts = (products || []).slice(0, 5).map((p) =>
      `• <b>${escapeHtml(p.title || "Unknown")}</b> (${escapeHtml(p.platform || "Global")}) — ৳${p.sale_price}`
    ).join("\n");

    return (
      `🎮 <b>RetroHub Live Catalog & Featured Stock:</b>\n\n` +
      (sampleProducts ? `${sampleProducts}\n\n` : "") +
      `• <b>Global Game Keys:</b> Steam, PlayStation Network, Xbox Game Pass, Nintendo eShop\n` +
      `• <b>Digital Gift Cards:</b> Apple App Store, Google Play, Razer Gold, Roblox\n` +
      `• <b>In-Game Top-Ups:</b> Free Fire Diamonds, PUBG UC, Valorant Points\n` +
      `• <b>Custom Orders:</b> On-demand sourcing for regional titles!\n\n` +
      `Explore live stock and instant delivery at: <a href="https://www.retrohub.tech">retrohub.tech</a> 🛒`
    );
  }

  // 5. Issues, Complaints & Refund Policy
  if (
    clean.includes("refund") ||
    clean.includes("scam") ||
    clean.includes("broken") ||
    clean.includes("invalid") ||
    clean.includes("not working") ||
    clean.includes("fake") ||
    clean.includes("issue")
  ) {
    return (
      `We sincerely apologize for the frustration, ${escapeHtml(name)}! 🛡️\n\n` +
      `At RetroHub, every purchase comes with our <b>100% Genuine Key & Verified Delivery Guarantee</b>. If a key has region issues or cannot be redeemed, we immediately verify and replace it or issue a prompt refund.\n\n` +
      `If you'd like our merchant team to inspect your case personally, tap <b>Talk to Human Agent</b> below, or send your Order ID so I can look up the details right now!`
    );
  }

  // 6. Explicit Request for Human Support
  if (
    clean.includes("human") ||
    clean.includes("agent") ||
    clean.includes("person") ||
    clean.includes("support") ||
    clean.includes("admin") ||
    clean.includes("talk to someone")
  ) {
    return (
      `I would be happy to connect you with our human merchant specialist! 👨‍💻\n\n` +
      `Tap <b>Talk to Human Agent</b> below to alert the merchant desk. An agent will review your chat transcript and reply to you directly right here.`
    );
  }

  // 7. Friendly Greetings & Chit-chat
  if (
    clean.includes("hi") ||
    clean.includes("hello") ||
    clean.includes("hey") ||
    clean.includes("salam") ||
    clean.includes("hola") ||
    clean.includes("good morning") ||
    clean.includes("good evening")
  ) {
    return (
      `Hello ${escapeHtml(name)}! 👋 Welcome to <b>RetroHub Customer Care</b>! I'm Retro Chan, your 24/7 automated support concierge.\n\n` +
      `I can help you check orders, look up game keys, answer payment questions, or connect you with human support. What can I do for you today? ✨`
    );
  }

  // 8. Polite Appreciation
  if (
    clean.includes("thank") ||
    clean.includes("thanks") ||
    clean.includes("tysm") ||
    clean.includes("great") ||
    clean.includes("awesome") ||
    clean.includes("ok")
  ) {
    return `You're very welcome, ${escapeHtml(name)}! 😊 It's always my pleasure to help. If you ever have another question or need a new game, RetroHub is here for you 24/7! 🎮`;
  }

  // Default smart fallback
  return (
    `Thanks for reaching out, ${escapeHtml(name)}! 😊\n\n` +
    `I'm Retro Chan, your support concierge at RetroHub. I can check your order status, look up game credentials, check our live game catalog, explain bKash payment, or route you to a live agent. What would you like assistance with?`
  );
}

function extractResponseText(data: any): string {
  if (Array.isArray(data?.output)) {
    for (const item of data.output) {
      if (item.type === "message" && Array.isArray(item.content)) {
        const block = item.content.find(
          (c: any) => c.type === "output_text" || typeof c.text === "string",
        );
        if (block?.text) return block.text.trim();
      }
      if (typeof item.text === "string") return item.text.trim();
    }
  }
  if (data?.choices?.[0]?.message?.content) {
    return data.choices[0].message.content.trim();
  }
  return "";
}

/** @deprecated Superseded by the three-stage BrainGine pipeline below. Retained as emergency fallback reference. */
async function _getAiResponseLegacy(
  history: Array<{ sender: string; text: string }>,
  latestMessage: string,
  sessionContext?: { order?: any; customerName?: string },
): Promise<string> {
  const liveProducts = await getLiveProducts();
  const fallback = getRetroChanIntelligenceResponse(
    latestMessage,
    sessionContext,
    liveProducts,
  );

  if (!XAI_API_KEY || !XAI_API_KEY.startsWith("xai-")) {
    return fallback;
  }

  try {
    const orderSnippet = sessionContext?.order
      ? `\nActive Customer Order: #${sessionContext.order.id.slice(0, 8)} | Item: ${sessionContext.order.products?.title || "Digital Item"} | Status: ${sessionContext.order.status} | Total: ৳${formatMoney(sessionContext.order.total)}`
      : "";

    const catalogSnippet = cachedCatalog;

    const systemPrompt = `You are Retro Chan, the witty, charming, and highly intelligent customer support AI for Retro Hub (https://www.retrohub.tech).
RetroHub Knowledge Base & Rules:
1. Core Business: Premier instant digital game key & gaming gift card storefront. We sell Steam, PSN, Xbox, Nintendo keys, Apple/Google gift cards, and game top-ups (Free Fire, PUBG, Valorant).
2. Payments: EXCLUSIVELY bKash Send Money to 01580382868. Customers must add a 1% bKash fee and use their Order ID as reference. Verification happens at retrohub.tech/payment.
3. Delivery: 1–15 minutes automated delivery after payment verification.
4. Refunds & Issues: 100% Genuine Key Guarantee. If a key is invalid/region-locked, we verify and replace or refund immediately.
5. Interaction Policy: Handle ALL customer queries confidently and accurately. Do NOT hallucinate prices or policies. If you do not know something, politely offer to escalate. Be extremely concise to save tokens and provide rapid, accurate answers.
6. Escalation: If they explicitly demand human help, refunds, or custom quotes, tell them to use the "Talk to Human Agent" button or /human command. Do not ping staff yourself.
7. Engaging Gamer Tone: Be warm, playful, and enthusiastic! Use gamer terminology where appropriate (e.g., "GG", "GLHF", "level up"). Occasionally ask them what game they are currently playing or excited about to spark brief, fun engagement. Keep it friendly and use tasteful emojis!\n${catalogSnippet}${orderSnippet}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6).map((m) => ({
        role: m.sender === "customer" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: latestMessage },
    ];

    const xaiHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    };
    if (XAI_TEAM_ID) {
      xaiHeaders["X-Team-Id"] = XAI_TEAM_ID;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      // 1. Try modern xAI v1/responses with grok-4.7
      const res = await fetch("https://api.x.ai/v1/responses", {
        method: "POST",
        headers: xaiHeaders,
        body: JSON.stringify({
          model: "grok-4.7",
          input: messages,
        }),
        signal: controller.signal,
      });

      if (res.ok) {
        clearTimeout(timeoutId);
        const data = await res.json();
        const text = extractResponseText(data);
        if (text) return text;
      } else {
        // 2. Fallback to v1/chat/completions with grok-beta
        const fallbackRes = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: xaiHeaders,
          body: JSON.stringify({
            model: "grok-beta",
            messages,
            temperature: 0.5,
            max_tokens: 300,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          const text = data.choices?.[0]?.message?.content?.trim();
          if (text) return text;
        } else {
          const errText = await fallbackRes.text();
          console.error(
            `AI API error with model grok-beta: ${fallbackRes.status} ${fallbackRes.statusText} - ${errText}`,
          );
        }
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        console.error("AI API timeout");
      } else {
        console.error("AI API fetch failed:", err);
      }
    }

    return fallback;
  } catch (err) {
    console.error("AI invocation failed, using local intelligence:", err);
    return fallback;
  }
}

// ============================================================================
// THREE-STAGE AI PIPELINE: Grok Classifier → BrainGine → Grok Composer
// ============================================================================

/**
 * STAGE 1 FALLBACK: Local intent classifier using keyword matching (sub-ms execution).
 * Used when Grok is unavailable or times out.
 */
function classifyIntentLocally(rawText: string): CustomerIntent {
  const clean = rawText.toLowerCase().trim();
  const entities: CustomerIntent["entities"] = {};

  const orderIdMatch = clean.match(/\b([0-9a-f]{8})\b/i);
  if (orderIdMatch) entities.order_id = orderIdMatch[1];

  const searchTerms = extractSearchTerms(clean);
  if (searchTerms.length > 0) {
    entities.keywords = searchTerms.split(" ").filter(Boolean);
  }

  if (/\b(steam|pc)\b/.test(clean)) entities.platform = "Steam";
  else if (/\b(xbox|series\s*[xs])\b/.test(clean)) entities.platform = "Xbox";
  else if (/\b(psn|playstation|ps[45])\b/.test(clean)) entities.platform = "PlayStation";
  else if (/\b(nintendo|switch)\b/.test(clean)) entities.platform = "Nintendo";

  let sentiment: SentimentType = "neutral";
  if (/\b(scam|fake|fraud|waste|worst|terrible|horrible|cheat)\b/.test(clean)) {
    sentiment = "frustrated";
  } else if (/\b(broken|invalid|not working|issue|problem|wrong|error|bug)\b/.test(clean)) {
    sentiment = "negative";
  } else if (/\b(thank|great|awesome|love|perfect|excellent|amazing|good)\b/.test(clean)) {
    sentiment = "positive";
  }

  // Intent classification — most specific first (priority order)
  if (/\b(human|agent|person|admin|talk to someone|real person|staff)\b/.test(clean)) {
    return { intent: "human_request", entities, sentiment };
  }
  if (/\b(refund|scam|broken|invalid|not working|fake|issue|problem|complaint)\b/.test(clean)) {
    return { intent: "complaint", entities, sentiment };
  }
  if (/\b(order|status|track|where is|update|tracking|receipt)\b/.test(clean)) {
    return { intent: "order_status", entities, sentiment };
  }
  if (/\b(bkash|pay|payment|send money|transaction|trxid|trx)\b/.test(clean)) {
    return { intent: "payment_help", entities, sentiment };
  }
  if (/\b(key|code|how long|delivery|instant|when|deliver|credential|time)\b/.test(clean)) {
    return { intent: "delivery_info", entities, sentiment };
  }
  if (/\b(game|product|steam|gift\s*card|buy|catalog|price|stock|deal|discount|cheap|fifa|valorant|gta|rdr|pubg|cod|minecraft)\b/.test(clean)) {
    return { intent: "product_search", entities, sentiment };
  }
  if (/\b(hi|hello|hey|salam|hola|good\s*(morning|evening|afternoon)|assalamu|sup|yo)\b/.test(clean)) {
    return { intent: "greeting", entities, sentiment: "positive" };
  }
  if (/\b(thank|thanks|tysm|ok|okay|cool|nice|appreciate)\b/.test(clean)) {
    return { intent: "thanks", entities, sentiment: "positive" };
  }

  return { intent: "general_question", entities, sentiment };
}

/**
 * STAGE 1: Grok-powered intent classifier with structured JSON output.
 * 3-second hard timeout → falls back to classifyIntentLocally().
 */
async function classifyCustomerIntent(
  latestMessage: string,
  history: Array<{ sender: string; text: string }>,
): Promise<CustomerIntent> {
  const localResult = classifyIntentLocally(latestMessage);

  if (!XAI_API_KEY || !XAI_API_KEY.startsWith("xai-")) {
    return localResult;
  }

  try {
    const classifierPrompt = `You are an intent classifier for RetroHub, a digital game key & gift card store in Bangladesh.
Return ONLY valid JSON matching this exact schema — no markdown, no explanation:
{"intent":"product_search|order_status|payment_help|delivery_info|complaint|human_request|greeting|thanks|general_question","entities":{"game":"name or null","platform":"Steam|Xbox|PlayStation|Nintendo|null","order_id":"hex id or null","keywords":["search","terms"]},"sentiment":"positive|neutral|negative|frustrated"}

Intent guide:
- product_search: wants a game, price, stock, gift card, catalog
- order_status: checking order, tracking, existing purchase
- payment_help: bKash, payment, fees, transaction
- delivery_info: delivery time, how codes arrive
- complaint: refund, invalid key, broken, not working
- human_request: wants to talk to a human
- greeting: hello, hi, hey
- thanks: thank you, ok, cool
- general_question: anything else`;

    const msgs = [
      { role: "system" as const, content: classifierPrompt },
      ...history.slice(-4).map((m) => ({
        role: (m.sender === "customer" ? "user" : "assistant") as "user" | "assistant",
        content: m.text,
      })),
      { role: "user" as const, content: latestMessage },
    ];

    const xaiHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    };
    if (XAI_TEAM_ID) xaiHeaders["X-Team-Id"] = XAI_TEAM_ID;

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 3000);

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: xaiHeaders,
      body: JSON.stringify({
        model: "grok-4.7",
        messages: msgs,
        temperature: 0.1,
        max_tokens: 150,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    clearTimeout(tid);

    if (res.ok) {
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content?.trim();
      if (raw) {
        const parsed = JSON.parse(raw);
        const validIntents = new Set<string>([
          "product_search", "order_status", "payment_help", "delivery_info",
          "complaint", "human_request", "greeting", "thanks", "general_question",
        ]);
        const validSentiments = new Set<string>(["positive", "neutral", "negative", "frustrated"]);

        return {
          intent: (validIntents.has(parsed.intent) ? parsed.intent : localResult.intent) as IntentType,
          entities: {
            ...localResult.entities,
            ...(parsed.entities?.game ? { game: String(parsed.entities.game) } : {}),
            ...(parsed.entities?.platform ? { platform: String(parsed.entities.platform) } : {}),
            ...(parsed.entities?.order_id ? { order_id: String(parsed.entities.order_id) } : {}),
            ...(Array.isArray(parsed.entities?.keywords) ? { keywords: parsed.entities.keywords.map(String) } : {}),
          },
          sentiment: (validSentiments.has(parsed.sentiment) ? parsed.sentiment : localResult.sentiment) as SentimentType,
        };
      }
    }
  } catch (_err: any) {
    // Silent fallback — local classification is perfectly adequate
  }

  return localResult;
}

/**
 * STAGE 2: BrainGine — Local data retrieval engine.
 * Queries products, orders, policies based on classified intent.
 * Pure local execution — no external dependencies, never fails.
 */
async function queryBrainGine(
  intent: CustomerIntent,
  sessionContext?: { order?: any; customerName?: string },
): Promise<BrainGinePayload> {
  const payload: BrainGinePayload = {
    intent: intent.intent,
    sentiment: intent.sentiment,
    facts: { customerName: sessionContext?.customerName || "there" },
  };

  const buildOrderFacts = (o: any): BrainGineOrder => ({
    id: o.id,
    shortId: o.id.slice(0, 8),
    status: o.status,
    product: o.products?.title || "Digital Item",
    platform: o.products?.platform || "Global",
    total: formatMoney(o.total),
    createdAt: new Date(o.created_at).toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    deliveries: (o.deliveries || []).map((d: any) => ({
      code: d.delivery_code,
      notes: d.delivery_notes || undefined,
    })),
    finalOutput: o.final_output || undefined,
  });

  switch (intent.intent) {
    case "product_search": {
      const products = await getLiveProducts();
      const query = intent.entities.game || intent.entities.keywords?.join(" ") || "";

      // Check for explicit custom game sourcing request
      const isCustomRequest = intent.entities.keywords?.some((k) =>
        ["choice", "custom", "request", "demand", "specific"].includes(k),
      );
      if (isCustomRequest) {
        payload.facts.customSourceAvailable = true;
        payload.facts.storeOverview = {
          url: "https://www.retrohub.tech",
          categories: [
            "Custom On-Demand Game Sourcing for PC (Steam, EA, Epic)",
            "Console Keys (PlayStation, Xbox, Nintendo)",
          ],
        };
        break;
      }

      if (query && products.length > 0) {
        const matches = findMatchingProducts(query, products);
        if (matches.length > 0) {
          payload.facts.products = matches.slice(0, 5).map((p) => ({
            title: p.title || "Unknown",
            platform: p.platform || "Global",
            price: p.sale_price,
            stock: p.in_stock,
          }));
        } else {
          payload.facts.searchQuery = query;
          payload.facts.noResults = true;
          payload.facts.customSourceAvailable = true;
        }
      } else {
        const featured = products.slice(0, 5);
        if (featured.length > 0) {
          payload.facts.products = featured.map((p) => ({
            title: p.title || "Unknown",
            platform: p.platform || "Global",
            price: p.sale_price,
            stock: p.in_stock,
          }));
        }
        payload.facts.storeOverview = {
          url: "https://www.retrohub.tech",
          categories: [
            "Global Game Keys (Steam, PSN, Xbox, Nintendo)",
            "Digital Gift Cards (Apple, Google Play, Razer Gold, Roblox)",
            "In-Game Top-Ups (Free Fire Diamonds, PUBG UC, Valorant Points)",
            "Custom On-Demand Game Sourcing",
          ],
        };
      }
      break;
    }
    case "order_status": {
      if (sessionContext?.order) {
        payload.facts.order = buildOrderFacts(sessionContext.order);
      } else if (intent.entities.order_id) {
        const { order } = await resolveOrder(intent.entities.order_id);
        if (order) payload.facts.order = buildOrderFacts(order);
      }
      break;
    }
    case "payment_help": {
      payload.facts.payment = {
        method: "bKash Send Money",
        number: "01580382868",
        fee: "1% bKash fee (include in payment amount)",
        verificationUrl: "https://www.retrohub.tech/payment",
      };
      break;
    }
    case "delivery_info": {
      payload.facts.delivery = {
        sla: "1\u201315 minutes after bKash payment verification",
        channels: ["Telegram (this chat)", "Web Customer Console at retrohub.tech/orders"],
      };
      if (sessionContext?.order) payload.facts.order = buildOrderFacts(sessionContext.order);
      break;
    }
    case "complaint": {
      payload.facts.refundPolicy =
        "100% Genuine Key & Verified Delivery Guarantee. If a key is invalid or region-locked, RetroHub immediately verifies and replaces it or issues a prompt refund.";
      if (sessionContext?.order) payload.facts.order = buildOrderFacts(sessionContext.order);
      break;
    }
    case "human_request": {
      payload.facts.escalate = true;
      break;
    }
    case "greeting": {
      const products = await getLiveProducts();
      payload.facts.storeOverview = {
        url: "https://www.retrohub.tech",
        categories: ["Order Tracking", "Game Key Lookup", "bKash Payment Help", "Live Agent Connection"],
      };
      if (products.length > 0) {
        payload.facts.products = products.slice(0, 3).map((p) => ({
          title: p.title || "Unknown",
          platform: p.platform || "Global",
          price: p.sale_price,
          stock: p.in_stock,
        }));
      }
      break;
    }
    case "thanks": {
      break;
    }
    default: {
      payload.facts.storeOverview = {
        url: "https://www.retrohub.tech",
        categories: ["Order Tracking", "Game Key Lookup", "bKash Payment Help", "Live Agent Connection"],
      };
      break;
    }
  }

  return payload;
}

/**
 * STAGE 3 FALLBACK: Format BrainGine payload into Telegram HTML locally.
 * Used when Grok composer is unavailable or times out.
 */
function formatBrainGineResponse(data: BrainGinePayload): string {
  const name = escapeHtml(data.facts.customerName || "there");

  switch (data.intent) {
    case "product_search": {
      if (data.facts.customSourceAvailable && !data.facts.noResults && !data.facts.products?.length) {
        return (
          `\u{1F3AE} <b>Custom Games & Special Requests:</b>\n\n` +
          `Yes, absolutely! At RetroHub, even if a specific game is not in our automated catalog, we offer <b>Custom On-Demand Game Sourcing</b> for virtually ANY title on PC (Steam, EA, Epic) or Consoles (PlayStation, Xbox, Nintendo)!\n\n` +
          `\u{1F449} <b>How to get it:</b> Tap <b>\u{1F468}\u200D\u{1F4BB} Talk to Human Agent</b> below and tell our merchant desk which game and edition you want. We will provide an instant bKash checkout quote! \u26A1`
        );
      }
      if (data.facts.noResults && data.facts.searchQuery) {
        return (
          `\u{1F50D} <b>Live Catalog Search:</b>\n\n` +
          `I searched our inventory for \"<b>${escapeHtml(data.facts.searchQuery)}</b>\", but it's not currently in our automated instant catalog.\n\n` +
          `\u2728 <b>Good news:</b> We offer <b>Custom On-Demand Game Sourcing</b>! We can source almost ANY game key or gift card upon request.\n\n` +
          `Tap <b>\u{1F468}\u200D\u{1F4BB} Talk to Human Agent</b> below, and our merchant team will arrange it for you! \u{1F3AE}`
        );
      }
      if (data.facts.products && data.facts.products.length > 0) {
        const items = data.facts.products
          .slice(0, 4)
          .map(
            (p) =>
              `\u2022 <b>${escapeHtml(p.title)}</b> [${escapeHtml(p.platform)}]\n  \u{1F4B0} Price: <b>\u09F3${p.price}</b> | Stock: ${p.stock > 0 ? `\u2705 In Stock (${p.stock})` : "\u26A0\uFE0F Out of Stock"}`,
          )
          .join("\n\n");
        return (
          `\u{1F3AE} <b>Found in our Live Catalog:</b>\n\n${items}\n\n` +
          `\u{1F6D2} Order instantly at <a href="https://www.retrohub.tech">retrohub.tech</a> with bKash Send Money to <code>01580382868</code>!`
        );
      }
      const cats = (data.facts.storeOverview?.categories || []).map((c) => `\u2022 <b>${escapeHtml(c)}</b>`).join("\n");
      return `\u{1F3AE} <b>RetroHub Live Catalog:</b>\n\n${cats}\n\nExplore live stock and instant delivery at: <a href="https://www.retrohub.tech">retrohub.tech</a> \u{1F6D2}`;
    }
    case "order_status": {
      if (data.facts.order) {
        const o = data.facts.order;
        const statusMap: Record<string, string> = {
          pending: "\u23F3 Pending Payment Verification",
          payment_submitted: "\u{1F4B3} Payment Submitted (Under Review)",
          payment_verified: "\u2705 Payment Verified & Queued",
          sourcing: "\u26A1 Processing / Sourcing Key",
          fulfilled: "\u{1F389} Fulfilled & Delivered",
          cancelled: "\u274C Order Cancelled",
          refunded: "\u{1F504} Refunded to Customer",
        };
        const label = statusMap[o.status] || `Status: ${o.status}`;
        let text =
          `\u{1F4E6} <b>Order #${escapeHtml(o.shortId)}</b>\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n` +
          `\u{1F3AE} <b>Product:</b> ${escapeHtml(o.product)}\n` +
          `\u{1F3F7}\uFE0F <b>Platform:</b> ${escapeHtml(o.platform)}\n` +
          `\u{1F4B0} <b>Total:</b> \u09F3${o.total}\n` +
          `\u{1F555} <b>Placed:</b> ${o.createdAt} (BST)\n` +
          `\u{1F4CA} <b>Current Status:</b> <b>${label}</b>\n\n`;
        if (o.status === "fulfilled") {
          text += '\u2728 <i>Your product has been delivered! Tap "View Key / Code" below to reveal your credentials.</i>';
        } else if (o.status === "sourcing" || o.status === "payment_verified") {
          text += "\u{1F680} <i>Our automated delivery engine is actively preparing your digital license. Most codes are issued within 5\u201315 minutes.</i>";
        } else {
          text += "\u2139\uFE0F <i>We are verifying your transaction. If you need expedited handling, tap Talk to Human Agent below.</i>";
        }
        return text;
      }
      return `I can track any order for you instantly! \u{1F50D} Just send your <b>8-character Order ID</b> (from your checkout receipt), or tap <b>Track My Order</b> below.`;
    }
    case "payment_help": {
      const p = data.facts.payment;
      if (!p) return "Please contact support for payment assistance.";
      return (
        `\u{1F4B3} <b>RetroHub bKash Payment Guide:</b>\n\n` +
        `\u2022 <b>Method:</b> ${escapeHtml(p.method)}\n` +
        `\u2022 <b>Official Number:</b> <code>${escapeHtml(p.number)}</code> (Tap to copy)\n` +
        `\u2022 <b>Charge:</b> Please include the <b>${escapeHtml(p.fee)}</b> in your payment amount.\n` +
        `\u2022 <b>Reference:</b> Use your Order ID as the transaction reference.\n\n` +
        `After sending money, enter your 10-character Transaction ID at <a href="${escapeHtml(p.verificationUrl)}">${escapeHtml(p.verificationUrl.replace("https://www.", ""))}</a> for instant verification! \u26A1`
      );
    }
    case "delivery_info": {
      const d = data.facts.delivery;
      if (!d) return "Digital items are delivered within 1\u201315 minutes after payment verification.";
      let text =
        `\u26A1 <b>Digital Delivery Speed:</b>\n\n` +
        `All automated items are delivered within <b>${escapeHtml(d.sla)}</b>!\n\n` +
        `Once delivered, your credentials appear in:\n` +
        d.channels.map((ch) => `\u2022 ${escapeHtml(ch)}`).join("\n") + " \u2728";
      if (data.facts.order) {
        text += `\n\n\u{1F4E6} Your order <b>#${escapeHtml(data.facts.order.shortId)}</b> is currently: <b>${escapeHtml(data.facts.order.status)}</b>`;
      }
      return text;
    }
    case "complaint": {
      let text = `We sincerely apologize for the frustration, ${name}! \u{1F6E1}\uFE0F\n\n${escapeHtml(data.facts.refundPolicy || "")}\n\n`;
      if (data.facts.order) {
        text += `Your order <b>#${escapeHtml(data.facts.order.shortId)}</b> (${escapeHtml(data.facts.order.product)}) is currently <b>${escapeHtml(data.facts.order.status)}</b>.\n\n`;
      }
      text += `Tap <b>Talk to Human Agent</b> below for personal assistance, or send your Order ID so I can look up the details!`;
      return text;
    }
    case "human_request": {
      return `I'd be happy to connect you with our human merchant specialist! \u{1F468}\u200D\u{1F4BB}\n\nTap <b>Talk to Human Agent</b> below to alert the merchant desk. An agent will review your chat transcript and reply directly here.`;
    }
    case "greeting": {
      let text = `Hello ${name}! \u{1F44B} Welcome to <b>RetroHub Customer Care</b>! I'm Retro Chan, your 24/7 support concierge.\n\nI can help you with:\n`;
      if (data.facts.storeOverview) {
        text += data.facts.storeOverview.categories.map((c) => `\u2022 ${escapeHtml(c)}`).join("\n");
      }
      if (data.facts.products && data.facts.products.length > 0) {
        text += `\n\n\u{1F525} <b>Featured right now:</b>\n`;
        text += data.facts.products.map((p) => `\u2022 ${escapeHtml(p.title)} \u2014 \u09F3${p.price}`).join("\n");
      }
      text += `\n\nWhat can I do for you today? \u2728`;
      return text;
    }
    case "thanks": {
      return `You're very welcome, ${name}! \u{1F60A} It's always my pleasure to help. If you ever have another question or need a new game, RetroHub is here for you 24/7! \u{1F3AE}`;
    }
    default: {
      return (
        `Thanks for reaching out, ${name}! \u{1F60A}\n\n` +
        `I'm Retro Chan, your support concierge at RetroHub. I can check your order status, look up game credentials, check our live catalog, explain bKash payment, or route you to a live agent. What would you like assistance with?`
      );
    }
  }
}

/**
 * STAGE 3: Grok-powered response composer.
 * Takes BrainGine-verified facts and composes a polished "Retro Chan" reply.
 * 3.5-second hard timeout → falls back to formatBrainGineResponse().
 */
async function composeCustomerResponse(
  latestMessage: string,
  brainGineData: BrainGinePayload,
  history: Array<{ sender: string; text: string }>,
): Promise<string> {
  const localFormatted = formatBrainGineResponse(brainGineData);

  if (!XAI_API_KEY || !XAI_API_KEY.startsWith("xai-")) {
    return localFormatted;
  }

  // Skip Grok for trivial intents — local formatting is optimal
  if (brainGineData.intent === "thanks" || brainGineData.intent === "human_request") {
    return localFormatted;
  }

  try {
    const composerPrompt = `You are Retro Chan, the witty and charming customer support AI for RetroHub (retrohub.tech), a digital game key store in Bangladesh.

CRITICAL RULES:
1. Use ONLY the verified facts in the DATA section. NEVER invent prices, stock, order statuses, or policies.
2. Format with Telegram HTML: <b>, <i>, <code>, <a href="">.
3. Keep responses concise (under 200 words). Use emojis tastefully.
4. Warm, playful gamer tone. Occasional "GG", "GLHF", "level up".
5. If products are listed, show them with exact prices and stock from the data.
6. For escalation, tell them to tap "Talk to Human Agent" button.
7. Include retrohub.tech when relevant.

CUSTOMER INTENT: ${brainGineData.intent}
CUSTOMER SENTIMENT: ${brainGineData.sentiment}
CUSTOMER NAME: ${brainGineData.facts.customerName || "Gamer"}

DATA (verified facts from BrainGine \u2014 use ONLY these):
${JSON.stringify(brainGineData.facts, null, 2)}`;

    const msgs = [
      { role: "system" as const, content: composerPrompt },
      ...history.slice(-4).map((m) => ({
        role: (m.sender === "customer" ? "user" : "assistant") as "user" | "assistant",
        content: m.text,
      })),
      { role: "user" as const, content: latestMessage },
    ];

    const xaiHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    };
    if (XAI_TEAM_ID) xaiHeaders["X-Team-Id"] = XAI_TEAM_ID;

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch("https://api.x.ai/v1/responses", {
        method: "POST",
        headers: xaiHeaders,
        body: JSON.stringify({ model: "grok-4.7", input: msgs }),
        signal: controller.signal,
      });

      if (res.ok) {
        clearTimeout(tid);
        const data = await res.json();
        const text = extractResponseText(data);
        if (text && text.length > 10) return text;
      } else {
        const fallbackRes = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: xaiHeaders,
          body: JSON.stringify({
            model: "grok-beta",
            messages: msgs,
            temperature: 0.5,
            max_tokens: 300,
          }),
          signal: controller.signal,
        });
        clearTimeout(tid);

        if (fallbackRes.ok) {
          const resData = await fallbackRes.json();
          const text = resData.choices?.[0]?.message?.content?.trim();
          if (text && text.length > 10) return text;
        }
      }
    } catch (fetchErr: any) {
      clearTimeout(tid);
      if (fetchErr.name !== "AbortError") {
        // Non-timeout fetch error — fall through to local formatting
      }
    }
  } catch (_err: any) {
    // Silent fallback to local formatting
  }

  return localFormatted;
}

/**
 * Three-Stage AI Pipeline: Grok Classifier \u2192 BrainGine Data Engine \u2192 Grok Composer
 *
 * Stage 1: Grok classifies customer intent and extracts entities (3s timeout \u2192 local keyword fallback)
 * Stage 2: BrainGine retrieves verified store data (products, orders, policies) \u2014 pure local, never fails
 * Stage 3: Grok composes a polished \"Retro Chan\" reply using only BrainGine's verified facts (3.5s timeout \u2192 local format fallback)
 */
async function getAiResponse(
  history: Array<{ sender: string; text: string }>,
  latestMessage: string,
  sessionContext?: { order?: any; customerName?: string },
): Promise<string> {
  // STAGE 1: Classify intent (Grok with local fallback)
  const intent = await classifyCustomerIntent(latestMessage, history);

  // STAGE 2: BrainGine data retrieval (always local, never fails)
  const brainGineData = await queryBrainGine(intent, sessionContext);

  // Short-circuit: if BrainGine flags escalation, use local format directly
  if (brainGineData.facts.escalate) {
    return formatBrainGineResponse(brainGineData);
  }

  // STAGE 3: Compose final response (Grok with local format fallback)
  return await composeCustomerResponse(latestMessage, brainGineData, history);
}

/**
 * High-speed message sender with optional subtle typing cadence.
 */
async function sendPacedMessage(
  chatId: string | number,
  text: string,
  reply_markup?: any /* eslint-disable-line */,
  delayRange?: [number, number],
) {
  if (delayRange && delayRange[1] > 0) {
    await sendChatAction(chatId, "typing");
    const delay =
      Math.floor(Math.random() * (delayRange[1] - delayRange[0])) + delayRange[0];
    if (delay > 0) await sleep(delay);
  }
  return await sendMessage(chatId, text, reply_markup);
}

/**
 * Resolve an order from a full UUID or the full 8-character short ID
 * customers see on their receipt.
 *
 * ROBUSTNESS FIX (CRITICAL): the original accepted prefixes as short as 4
 * hex characters and, on a collision, silently returned the *most recent*
 * matching order — scanned across ALL customers, not just this chat. With
 * only 65,536 possible 4-char prefixes and up to 100 recent orders in the
 * scan, collisions are realistic, which meant a short or even accidental
 * prefix could surface — and let someone view or "View Key/Code" — a
 * different customer's order.
 *
 * This version requires the full 8-char ID and returns `ambiguous: true`
 * instead of guessing when more than one order matches, so the caller can
 * ask for the complete ID rather than silently showing the wrong order.
 * It narrows the hole; it doesn't close it — see the file header note on
 * binding orders to chat_id for the complete fix.
 */
async function resolveOrder(
  identifier: string,
): Promise<{ order: any | null; ambiguous: boolean }> {
  const clean = identifier.trim();
  if (!clean) return { order: null, ambiguous: false };

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(clean)) {
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", clean)
      .maybeSingle();
    if (error) {
      console.error("resolveOrder exact-match error:", error);
      return { order: null, ambiguous: false };
    }
    return { order: data, ambiguous: false };
  }

  // Require the full 8-char short ID (not an arbitrary shorter prefix).
  if (clean.length >= 8) {
    const { data: recentOrders, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .order("created_at", { ascending: false })
      .limit(ORDER_SCAN_LIMIT);

    if (error) {
      console.error("resolveOrder prefix-scan error:", error);
      return { order: null, ambiguous: false };
    }

    const matches = (recentOrders || []).filter((o: any) =>
      o.id.toLowerCase().startsWith(clean.toLowerCase()),
    );
    if (matches.length === 1) return { order: matches[0], ambiguous: false };
    if (matches.length > 1) return { order: null, ambiguous: true };
  }

  return { order: null, ambiguous: false };
}

/**
 * Session State Management
 */
async function getOrCreateSession(fromUser: any, chatId: number) {
  try {
    const { data: existing } = await supabase
      .from("customer_support_sessions")
      .select("*")
      .eq("chat_id", chatId)
      .maybeSingle();

    if (existing) {
      // Auto-terminate / reset session if inactive for more than 1 hour (3600000 ms)
      const lastUpdated = new Date(existing.updated_at).getTime();
      const now = Date.now();
      if (now - lastUpdated > 3600000) {
        existing.recent_messages = [];
        existing.state = "bot_active";

        await supabase
          .from("customer_support_sessions")
          .update({
            recent_messages: [],
            state: "bot_active",
            updated_at: new Date().toISOString(),
          })
          .eq("chat_id", chatId);
      }
      return existing;
    }

    const newSession = {
      chat_id: chatId,
      username: fromUser.username || null,
      first_name: fromUser.first_name || null,
      last_name: fromUser.last_name || null,
      state: "bot_active",
      sentiment_score: 0,
      recent_messages: [],
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // ROBUSTNESS FIX: upsert instead of insert. Two messages arriving in
    // quick succession from a brand-new customer can both reach this
    // branch before either write completes; a plain insert either throws
    // on a unique constraint or creates two session rows for one chat.
    const { data: created, error } = await supabase
      .from("customer_support_sessions")
      .upsert(newSession, { onConflict: "chat_id", ignoreDuplicates: false })
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error creating support session:", error);
      // The concurrent request may have won the upsert — re-read before giving up.
      const { data: retryRead } = await supabase
        .from("customer_support_sessions")
        .select("*")
        .eq("chat_id", chatId)
        .maybeSingle();
      return retryRead || newSession;
    }
    return created || newSession;
  } catch (err) {
    console.error("Session getOrCreate error:", err);
    return {
      chat_id: chatId,
      username: fromUser.username || null,
      first_name: fromUser.first_name || null,
      state: "bot_active",
      recent_messages: [],
      metadata: {},
    };
  }
}

async function updateSessionState(chatId: number, updates: any) {
  try {
    await supabase
      .from("customer_support_sessions")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("chat_id", chatId);
  } catch (err) {
    console.error("Failed to update session state:", err);
  }
}

async function appendSessionMessage(
  chatId: number,
  sender: "customer" | "bot" | "agent",
  text: string,
) {
  const message = {
    sender,
    text: text.substring(0, 800),
    time: new Date().toISOString(),
  };

  // ROBUSTNESS FIX: the original was a plain read-then-write, so two
  // messages landing within the same few hundred ms (a double-send, or a
  // Telegram retry) could race — both read the same `recent_messages`,
  // and whichever write lands second silently drops the other message.
  // `append_session_message` (SQL in the file header) row-locks the
  // session for the duration of the read-modify-write, so appends from
  // the same chat serialize correctly. Falls back to the old behavior if
  // that migration hasn't been run yet.
  try {
    const { error } = await supabase.rpc("append_session_message", {
      p_chat_id: chatId,
      p_message: message,
      p_max_messages: 8,
    });
    if (error) throw error;
  } catch (err) {
    console.error(
      "appendSessionMessage RPC failed, falling back to read-modify-write:",
      err,
    );
    try {
      const { data: session } = await supabase
        .from("customer_support_sessions")
        .select("recent_messages")
        .eq("chat_id", chatId)
        .maybeSingle();

      const history = (session?.recent_messages || []) as Array<{
        sender: string;
        text: string;
        time?: string;
      }>;
      history.push(message);
      const trimmed = history.slice(-8);

      await supabase
        .from("customer_support_sessions")
        .update({
          recent_messages: trimmed,
          updated_at: new Date().toISOString(),
        })
        .eq("chat_id", chatId);
    } catch (fallbackErr) {
      console.error("appendSessionMessage fallback also failed:", fallbackErr);
    }
  }
}

/**
 * Very light per-chat rate limit so a single user (or a script) can't
 * cheaply flood the bot into burning xAI calls and Telegram quota. Not a
 * substitute for a real limiter — just enough to blunt obvious abuse.
 */
function isRateLimited(session: any): boolean {
  const now = Date.now();
  const windowMs = 10_000;
  const maxInWindow = 6;

  const timestamps: number[] = (
    session.metadata?.recent_msg_times || []
  ).filter((t: number) => now - t < windowMs);
  timestamps.push(now);
  session.metadata = {
    ...(session.metadata || {}),
    recent_msg_times: timestamps.slice(-(maxInWindow + 5)),
  };

  return timestamps.length > maxInWindow;
}

/**
 * ROBUSTNESS FIX: idempotency for Telegram's at-least-once delivery.
 * `claimUpdate` inserts a row for this update_id; a unique-constraint
 * conflict means we've already claimed (and are processing or finished)
 * this exact update, so the caller should treat it as a duplicate and
 * no-op. If processing later throws, `releaseUpdateClaim` removes the
 * claim so a genuine Telegram retry can actually try again instead of
 * being silently swallowed.
 */
async function claimUpdate(updateId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("telegram_processed_updates")
      .insert({ update_id: updateId });
    if (error) {
      if (error.code === "23505") return false; // already claimed
      console.error(
        "claimUpdate insert error, failing open (will process):",
        error,
      );
      return true;
    }
    return true;
  } catch (err) {
    console.error("claimUpdate threw, failing open (will process):", err);
    return true;
  }
}

async function releaseUpdateClaim(updateId: number) {
  try {
    await supabase
      .from("telegram_processed_updates")
      .delete()
      .eq("update_id", updateId);
  } catch (err) {
    console.error("releaseUpdateClaim failed:", err);
  }
}

function buildOrderKeyboard(orderId: string) {
  const shortId = orderId.slice(0, 8);
  return {
    inline_keyboard: [
      [
        { text: "📦 Check Status", callback_data: `status_${shortId}` },
        { text: "🔑 View Key / Code", callback_data: `key_${shortId}` },
      ],
      [
        { text: "⚠️ Report Issue", callback_data: `issue_${shortId}` },
        {
          text: "👤 Talk to Human Agent",
          callback_data: `escalate_${shortId}`,
        },
      ],
      [
        {
          text: "🌐 Customer Console",
          url: "https://www.retrohub.tech/orders",
        },
      ],
    ],
  };
}

function buildGeneralKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📦 Track My Order", callback_data: "prompt_order" },
        { text: "❓ FAQ & Delivery Times", callback_data: "faq" },
      ],
      [
        { text: "👤 Talk to Human Agent", callback_data: "escalate_general" },
        { text: "🛒 Visit Store", url: "https://www.retrohub.tech" },
      ],
    ],
  };
}

/**
 * Explicit Human Escalation: ONLY called when customer explicitly clicks human agent or calls /human
 */
async function escalateToStaff(
  chatId: number,
  fromUser: any,
  reason: string,
  orderId?: string,
) {
  await updateSessionState(chatId, {
    state: "escalated",
    escalated_at: new Date().toISOString(),
    last_order_id: orderId || null,
  });

  let orderInfo = "None specified";
  if (orderId) {
    const { order, ambiguous } = await resolveOrder(orderId);
    if (order) {
      orderInfo = `#<code>${order.id.slice(0, 8)}</code> | <b>${escapeHtml(order.products?.title || "Unknown")}</b> | ৳${formatMoney(order.total)} (${order.status})`;
    } else if (ambiguous) {
      orderInfo = `Ambiguous ID "${escapeHtml(orderId)}" — matches multiple orders, ask the customer for the full ID`;
    }
  }

  const staffAlert = `🚨 <b>CUSTOMER SUPPORT ESCALATION</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Customer:</b> ${escapeHtml(fromUser.first_name || "Customer")} ${fromUser.username ? `(@${escapeHtml(fromUser.username)})` : ""}
🆔 <b>Chat ID:</b> <code>${chatId}</code>
📦 <b>Order:</b> ${orderInfo}
⚡ <b>Trigger:</b> ${escapeHtml(reason)}

━━━━━━━━━━━━━━━━━━
💬 <b>To reply directly to customer:</b>
<code>/reply ${chatId} &lt;your message&gt;</code>

✅ <b>To resolve & return to bot:</b>
<code>/resolve ${chatId}</code>`;

  const staffKeyboard = {
    inline_keyboard: [
      [
        {
          text: `💬 Reply (/reply ${chatId})`,
          callback_data: `support_reply:${chatId}`,
        },
        {
          text: `✅ Mark Resolved`,
          callback_data: `support_resolve:${chatId}`,
        },
      ],
      ...(fromUser.username
        ? [
            [
              {
                text: `👤 Open Direct PM`,
                url: `https://t.me/${fromUser.username}`,
              },
            ],
          ]
        : []),
    ],
  };

  await sendMerchantAdminAlert(staffAlert, staffKeyboard);
}

function formatOrderStatus(order: any): string {
  const statusEmojis: Record<string, string> = {
    pending: "⏳ Pending Payment Verification",
    payment_submitted: "💳 Payment Submitted (Under Review)",
    payment_verified: "✅ Payment Verified & Queued",
    sourcing: "⚡ Processing / Sourcing Key",
    fulfilled: "🎉 Fulfilled & Delivered",
    cancelled: "❌ Order Cancelled",
    refunded: "🔄 Refunded to Customer",
  };

  const label = statusEmojis[order.status] || `Status: ${order.status}`;
  const createdDate = new Date(order.created_at).toLocaleString("en-US", {
    timeZone: "Asia/Dhaka",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `📦 <b>Order #${order.id.slice(0, 8)}</b>
━━━━━━━━━━━━━━━━━━
🎮 <b>Product:</b> ${escapeHtml(order.products?.title || "Digital Item")}
🏷️ <b>Platform:</b> ${escapeHtml(order.products?.platform || "Global")}
💰 <b>Total:</b> ৳${formatMoney(order.total)}
🕒 <b>Placed:</b> ${createdDate} (BST)
📊 <b>Current Status:</b> <b>${label}</b>

${
  order.status === "fulfilled"
    ? '✨ <i>Your product has been delivered! Tap "View Key / Code" below to reveal your credentials.</i>'
    : order.status === "sourcing" || order.status === "payment_verified"
      ? "🚀 <i>Our automated delivery engine is actively preparing your digital license. Most codes are issued within 5–15 minutes.</i>"
      : "ℹ️ <i>We are verifying your transaction with the payment gateway. If you need manual expedited handling, tap Talk to Human Agent below.</i>"
}`;
}

/**
 * All actual update handling, extracted out of `serve` so the outer
 * handler can release an update's idempotency claim if this throws
 * partway through (see claimUpdate/releaseUpdateClaim above).
 */
async function handleUpdate(update: any): Promise<Response> {
  // ─────────────────────────────────────────────────────────────
  // 1. HANDLE CALLBACK QUERIES (Inline Buttons)
  // ─────────────────────────────────────────────────────────────
  if (update.callback_query) {
    const query = update.callback_query;
    const callbackQueryId = query.id;
    const data = query.data || "";
    const chatId = query.message?.chat?.id;
    const messageId = query.message?.message_id;
    const fromUser = query.from;

    await answerCallbackQuery(callbackQueryId);

    if (data === "resume_bot") {
      await updateSessionState(chatId, {
        state: "bot_active",
        resolved_at: new Date().toISOString(),
      });
      await editMessageText(
        chatId,
        messageId,
        `👋 <b>Back to Retro Chan!</b>\n\nI am ready to help you with orders, keys, payment guidelines, or store recommendations. What can I do for you?`,
        buildGeneralKeyboard(),
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: corsHeaders,
      });
    }

    if (data.startsWith("status_")) {
      const orderPrefix = data.replace("status_", "");
      const { order, ambiguous } = await resolveOrder(orderPrefix);
      if (!order) {
        await editMessageText(
          chatId,
          messageId,
          orderNotFoundMessage(orderPrefix, ambiguous),
          buildGeneralKeyboard(),
        );
        return new Response(JSON.stringify({ ok: true }), {
          headers: corsHeaders,
        });
      }
      const text = formatOrderStatus(order);
      await editMessageText(
        chatId,
        messageId,
        text,
        buildOrderKeyboard(order.id),
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: corsHeaders,
      });
    }

    if (data.startsWith("key_")) {
      const orderPrefix = data.replace("key_", "");
      const { order, ambiguous } = await resolveOrder(orderPrefix);
      if (!order) {
        await editMessageText(
          chatId,
          messageId,
          orderNotFoundMessage(orderPrefix, ambiguous),
          buildGeneralKeyboard(),
        );
        return new Response(JSON.stringify({ ok: true }), {
          headers: corsHeaders,
        });
      }

      const deliveries = order.deliveries || [];
      if (deliveries.length > 0) {
        const codes = deliveries
          .map(
            (d: any, idx: number) =>
              `🔑 <b>Item #${idx + 1}:</b>\n<code>${escapeHtml(d.delivery_code)}</code>${d.delivery_notes ? `\n<i>Note: ${escapeHtml(d.delivery_notes)}</i>` : ""}`,
          )
          .join("\n\n");

        const text = `🎉 <b>Digital Delivery for Order #${order.id.slice(0, 8)}</b>
━━━━━━━━━━━━━━━━━━
🎮 <b>Product:</b> ${escapeHtml(order.products?.title || "Digital License")}

${codes}

⚠️ <i>Keep your code safe and do not share it with third parties.</i>`;

        await editMessageText(
          chatId,
          messageId,
          text,
          buildOrderKeyboard(order.id),
        );
      } else if (order.final_output) {
        const text = `🎉 <b>Delivery Credentials for Order #${order.id.slice(0, 8)}</b>
━━━━━━━━━━━━━━━━━━
<code>${escapeHtml(order.final_output)}</code>`;
        await editMessageText(
          chatId,
          messageId,
          text,
          buildOrderKeyboard(order.id),
        );
      } else {
        const text = `⏳ <b>Credentials Not Ready Yet</b>
━━━━━━━━━━━━━━━━━━
Order <code>#${order.id.slice(0, 8)}</code> is currently in state: <b>${order.status}</b>.

Your code is being provisioned. As soon as it's ready, it will appear here and in your web Customer Console!`;
        await editMessageText(
          chatId,
          messageId,
          text,
          buildOrderKeyboard(order.id),
        );
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: corsHeaders,
      });
    }

    if (data.startsWith("issue_")) {
      const orderPrefix = data.replace("issue_", "");
      await editMessageText(
        chatId,
        messageId,
        `📝 <b>Issue Resolution & Guarantee</b>
━━━━━━━━━━━━━━━━━━
We apologize for the inconvenience with Order <code>#${escapeHtml(orderPrefix)}</code>.

All RetroHub orders are protected under our full replacement & refund policy. Tap below if you would like to connect directly with our human merchant desk!`,
        {
          inline_keyboard: [
            [
              {
                text: "🚨 Connect to Human Support Now",
                callback_data: `escalate_${orderPrefix}`,
              },
            ],
            [
              {
                text: "🔙 Back to Order Options",
                callback_data: `status_${orderPrefix}`,
              },
            ],
          ],
        },
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: corsHeaders,
      });
    }

    if (data.startsWith("escalate_")) {
      const orderPrefix = data.replace("escalate_", "");
      const effectiveOrder =
        orderPrefix !== "general" ? orderPrefix : undefined;

      await editMessageText(
        chatId,
        messageId,
        `🛡️ <b>Handoff to Merchant Specialist</b>
━━━━━━━━━━━━━━━━━━
I have notified our merchant desk! An agent will review your chat transcript and reply directly here shortly.

In the meantime, feel free to send any additional screenshots or keep asking questions — Retro Chan is still here for you!`,
        {
          inline_keyboard: [
            [
              {
                text: "🤖 Resume with Retro Chan AI",
                callback_data: "resume_bot",
              },
            ],
            [
              {
                text: "🌐 Customer Console",
                url: "https://www.retrohub.tech/orders",
              },
            ],
          ],
        },
      );
      await escalateToStaff(
        chatId,
        fromUser,
        "Customer requested human assistance via interactive button",
        effectiveOrder,
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: corsHeaders,
      });
    }

    if (data === "prompt_order") {
      await editMessageText(
        chatId,
        messageId,
        `🔍 <b>Order Lookup</b>\n\nPlease send your <b>Order ID</b> (for example: the 8-character code from your receipt like <code>c7c482a2</code>).`,
        {
          inline_keyboard: [
            [{ text: "🔙 Cancel", callback_data: "back_general" }],
          ],
        },
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: corsHeaders,
      });
    }

    if (data === "faq") {
      const faqText = `ℹ️ <b>Frequently Asked Questions</b>
━━━━━━━━━━━━━━━━━━
⚡ <b>How long does delivery take?</b>
Instant items are fulfilled within 1–15 minutes after bKash payment verification.

💳 <b>Which payment methods are accepted?</b>
We accept exclusively bKash Send Money to 01580382868 (+1% fee).

🔑 <b>Where do I find my code?</b>
Tap "View Key / Code" in your order menu, or visit your customer console at retrohub.tech/orders.

🚨 <b>Need more help?</b>
Tap the button below to reach our merchant specialist directly.`;

      await editMessageText(chatId, messageId, faqText, {
        inline_keyboard: [
          [
            {
              text: "👤 Talk to Human Agent",
              callback_data: "escalate_general",
            },
          ],
          [{ text: "🔙 Back", callback_data: "back_general" }],
        ],
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: corsHeaders,
      });
    }

    if (data === "back_general") {
      await editMessageText(
        chatId,
        messageId,
        `👋 <b>Welcome to Retro Hub Customer Care!</b>\n\nHow can we help you today?`,
        buildGeneralKeyboard(),
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  }

  // ─────────────────────────────────────────────────────────────
  // 2. HANDLE INCOMING TEXT MESSAGES
  // ─────────────────────────────────────────────────────────────
  if (!update.message || !update.message.text) {
    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  }

  const message = update.message;
  const chatId = message.chat.id;
  const fromUser = message.from;
  const rawText = message.text.trim();

  // Load/create the session once, up front, so it's available both for
  // rate limiting and for every branch below (previously fetched again,
  // later, only for the AI-response branch).
  const session = await getOrCreateSession(fromUser, chatId);

  // ROBUSTNESS FIX: basic per-chat flood guard.
  if (isRateLimited(session)) {
    await updateSessionState(chatId, { metadata: session.metadata });
    return new Response(JSON.stringify({ ok: true, rateLimited: true }), {
      headers: corsHeaders,
    });
  }
  await updateSessionState(chatId, { metadata: session.metadata });

  // ─────────────────────────────────────────────────────────────
  // A. EXPLICIT SESSION TERMINATION (/terminate, /reset)
  // ─────────────────────────────────────────────────────────────
  if (rawText === "/terminate" || rawText === "/reset") {
    await sendChatAction(chatId, "typing");
    await updateSessionState(chatId, {
      recent_messages: [],
      state: "bot_active",
    });
    // Also reset local memory so immediate appends don't resurrect the ghost session
    session.recent_messages = [];
    session.state = "bot_active";

    await sendMessage(
      chatId,
      "🧹 <b>Session Cleared!</b>\n\nI have forgotten our previous conversation context. How can I help you today?",
      buildGeneralKeyboard(),
    );
    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  }

  // ─────────────────────────────────────────────────────────────
  // B. EXPLICIT HUMAN ESCALATION COMMANDS (/human, /agent, /support, /help)
  // ─────────────────────────────────────────────────────────────
  if (
    rawText === "/help" ||
    rawText === "/support" ||
    rawText === "/agent" ||
    rawText === "/human" ||
    rawText === "/staff"
  ) {
    await sendMessage(
      chatId,
      `👨‍💻 <b>Connecting to Live Human Support...</b>\n\nI have routed your inquiry directly to our merchant desk. An agent will review your chat transcript and reply directly to you right here.\n\nIn the meantime, feel free to ask any other questions!`,
      {
        inline_keyboard: [
          [
            {
              text: "🤖 Resume with Retro Chan AI",
              callback_data: "resume_bot",
            },
          ],
        ],
      },
    );
    await escalateToStaff(
      chatId,
      fromUser,
      `Customer invoked human command: ${rawText}`,
    );
    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  }

  // ─────────────────────────────────────────────────────────────
  // B. ORDER TRACKING COMMAND (/track)
  // ─────────────────────────────────────────────────────────────
  if (rawText.startsWith("/track")) {
    const parts = rawText.split(" ");
    const orderArg = parts[1] || "";
    if (!orderArg) {
      await sendMessage(
        chatId,
        "🔍 <b>Order Lookup:</b> Please provide an Order ID.\nExample: <code>/track c7c482a2</code>",
        {
          inline_keyboard: [
            [{ text: "📦 Prompt for Order ID", callback_data: "prompt_order" }],
          ],
        },
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: corsHeaders,
      });
    }
    const { order, ambiguous } = await resolveOrder(orderArg);
    if (order) {
      await updateSessionState(chatId, { last_order_id: order.id });
      await sendMessage(
        chatId,
        formatOrderStatus(order),
        buildOrderKeyboard(order.id),
      );
    } else {
      await sendMessage(
        chatId,
        orderNotFoundMessage(orderArg, ambiguous),
        buildGeneralKeyboard(),
      );
    }
    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  }

  // ─────────────────────────────────────────────────────────────
  // C. /start COMMAND & DEEP LINK HANDLING
  // ─────────────────────────────────────────────────────────────
  if (rawText.startsWith("/start")) {
    const parts = rawText.split(" ");
    const payload = parts[1] || "";

    if (payload.startsWith("order_") || payload.startsWith("issue_")) {
      const orderId = payload.replace(/^(order_|issue_)/, "");
      await updateSessionState(chatId, { last_order_id: orderId });

      const { order } = await resolveOrder(orderId);
      if (order) {
        const greeting = payload.startsWith("issue_")
          ? `👋 Hi <b>${escapeHtml(fromUser.first_name || "there")}</b>, I see you're checking on Order <code>#${order.id.slice(0, 8)}</code>. Let's look into this right away!`
          : `👋 Hi <b>${escapeHtml(fromUser.first_name || "there")}</b>! Here is the latest update on your order:`;

        const statusText = formatOrderStatus(order);
        await sendMessage(chatId, `${greeting}\n\n${statusText}`, buildOrderKeyboard(order.id));
        return new Response(JSON.stringify({ ok: true }), {
          headers: corsHeaders,
        });
      }
    }

    await sendPacedMessage(
      chatId,
      `👋 <b>Welcome to Retro Hub Customer Care!</b>\n\nI'm Retro Chan, your 24/7 automated support concierge. I can instantly verify your order status, look up your game keys & credentials, or connect you with human support whenever needed.`,
      buildGeneralKeyboard(),
    );
    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  }

  // ─────────────────────────────────────────────────────────────
  // D. ORDER ID PATTERN DETECTION (full 8-char hex or UUID, and ONLY that)
  // ─────────────────────────────────────────────────────────────
  // ROBUSTNESS FIX: the original regex wasn't anchored, so any message
  // containing 8 consecutive hex characters anywhere (e.g. a promo code,
  // a product SKU) would be treated as an order-ID lookup. Anchored to
  // require the whole trimmed message to be exactly an ID.
  const orderIdOnlyRegex =
    /^[0-9a-f]{8}(-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?$/i;
  if (orderIdOnlyRegex.test(rawText)) {
    const { order } = await resolveOrder(rawText);
    if (order) {
      await updateSessionState(chatId, { last_order_id: order.id });
      await sendMessage(
        chatId,
        `🔍 Found your order!\n\n${formatOrderStatus(order)}`,
        buildOrderKeyboard(order.id),
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: corsHeaders,
      });
    }
    // No match (or ambiguous, deliberately unlikely for a full 8-char ID) —
    // fall through to the normal AI/local-intelligence response below,
    // same as the original behavior.
  }

  // ─────────────────────────────────────────────────────────────
  // E. LOG THIS MESSAGE
  // ─────────────────────────────────────────────────────────────
  await appendSessionMessage(chatId, "customer", rawText);

  let activeOrderData: any = null;
  if (session.last_order_id) {
    const { order } = await resolveOrder(session.last_order_id);
    activeOrderData = order;
  }

  // ─────────────────────────────────────────────────────────────
  // F. LIVE AGENT SESSION RELAY
  // ONLY forward customer message to staff if the agent has ACTIVELY replied (agent_active)
  // ─────────────────────────────────────────────────────────────
  if (session.state === "agent_active") {
    const fwdText = `📩 <b>Customer Reply (Chat #<code>${chatId}</code>)</b> ${fromUser.username ? `(@${escapeHtml(fromUser.username)})` : ""}:
"${escapeHtml(rawText)}"

💬 Reply using: <code>/reply ${chatId} &lt;text&gt;</code>`;

    const fwdKeyboard = {
      inline_keyboard: [
        [
          { text: `💬 Reply`, callback_data: `support_reply:${chatId}` },
          { text: `✅ Resolve`, callback_data: `support_resolve:${chatId}` },
        ],
      ],
    };
    await sendMerchantAdminAlert(fwdText, fwdKeyboard);
    await sendChatAction(chatId, "typing");
    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  }

  // ─────────────────────────────────────────────────────────────
  // G. FULL CUSTOMER SERVICE POWERED BY RETRO CHAN FT. GROK
  // The bot handles 100% of the customer service conversation without bothering the merchant!
  // ─────────────────────────────────────────────────────────────
  await sendChatAction(chatId, "typing");

  const responseText = await getAiResponse(
    session.recent_messages || [],
    rawText,
    {
      order: activeOrderData,
      customerName: fromUser.first_name || "Gamer",
    },
  );

  await appendSessionMessage(chatId, "bot", responseText);

  const keyboard = activeOrderData
    ? buildOrderKeyboard(activeOrderData.id)
    : buildGeneralKeyboard();

  await sendPacedMessage(chatId, responseText, keyboard);

  return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  // ROBUSTNESS FIX: verify the request actually came from Telegram. Without
  // this, anyone who finds the webhook URL can POST forged updates — fake
  // escalations, fake order views, etc. Set TELEGRAM_WEBHOOK_SECRET and pass
  // the same value as `secret_token` in your setWebhook call.
  const expectedSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
  if (expectedSecret) {
    const gotSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (gotSecret !== expectedSecret) {
      console.error(
        "Rejected webhook call with invalid or missing secret token",
      );
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders,
      });
    }
  }

  let claimedUpdateId: number | null = null;

  try {
    const update = await req.json();

    // ROBUSTNESS FIX: idempotency. Telegram guarantees at-least-once
    // delivery and will redeliver an update if your response is slow or
    // errors. Without this, a single retry can double-send messages or
    // double-escalate the same customer message.
    if (typeof update.update_id === "number") {
      const fresh = await claimUpdate(update.update_id);
      if (!fresh) {
        return new Response(JSON.stringify({ ok: true, duplicate: true }), {
          headers: corsHeaders,
        });
      }
      claimedUpdateId = update.update_id;
    }

    return await handleUpdate(update);
  } catch (err: any) {
    console.error("Customer bot webhook handler error:", err);
    // Processing failed after we claimed this update — release the claim
    // so a real Telegram retry can try again instead of being silently
    // treated as a duplicate forever.
    if (claimedUpdateId !== null) await releaseUpdateClaim(claimedUpdateId);
    return new Response(
      JSON.stringify({ error: err.message || "Internal Server Error" }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
