// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CUSTOMER_BOT_TOKEN = Deno.env.get("CUSTOMER_BOT_TOKEN") || "";
const ADMIN_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const STAFF_CHAT_ID = String(
  Deno.env.get("ADMIN_CHAT_ID") ||
    Deno.env.get("TELEGRAM_CHAT_ID") ||
    "",
).trim();
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const XAI_API_KEY = (
  Deno.env.get("XAI_API_KEY") ||
  Deno.env.get("VITE_XAI_API_KEY") ||
  ""
).trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  reply_markup?: any,
) {
  try {
    const url = `https://api.telegram.org/bot${CUSTOMER_BOT_TOKEN}/sendMessage`;
    const body: any = {
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

async function sendMerchantAdminAlert(text: string, reply_markup?: any) {
  try {
    const token = ADMIN_BOT_TOKEN || CUSTOMER_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body: any = {
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
  reply_markup?: any,
) {
  try {
    const url = `https://api.telegram.org/bot${CUSTOMER_BOT_TOKEN}/editMessageText`;
    const body: any = {
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
            `- ${p.title} [${p.platform}]: ৳${p.sale_price} (Stock: ${p.in_stock})`,
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
    "looking", "want", "need", "retrohub", "key", "keys", "code", "codes", "account"
  ]);
  const words = clean.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !stopWords.has(w));
  return words.join(" ").trim();
}

function findMatchingProducts(query: string, products: CatalogProduct[]): CatalogProduct[] {
  const clean = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const stopWords = new Set([
    "do", "you", "have", "certain", "games", "game", "of", "my", "choice", "in",
    "your", "shop", "store", "is", "the", "a", "an", "for", "please", "can", "i",
    "get", "buy", "price", "any", "got", "what", "are", "there", "available",
    "stock", "tell", "me", "about", "show", "give", "much", "cost", "how", "sell",
    "looking", "want", "need", "retrohub", "key", "keys", "code", "codes", "account"
  ]);

  const words = clean.split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w));
  if (words.length === 0) return [];

  return products.filter((p) => {
    const titleLower = p.title.toLowerCase();
    const platLower = p.platform.toLowerCase();
    return words.some((w) => titleLower.includes(w) || platLower.includes(w));
  });
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
    clean.includes("warhammer") ||
    clean.includes("gta") ||
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
          `• <b>${escapeHtml(p.title)}</b> [${escapeHtml(p.platform)}]\n  💰 Price: <b>৳${p.sale_price}</b> | Stock: ${p.in_stock > 0 ? `✅ In Stock (${p.in_stock})` : "⚠️ Out of Stock"}`
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
      `• <b>${escapeHtml(p.title)}</b> (${escapeHtml(p.platform)}) — ৳${p.sale_price}`
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

/**
 * Generates an intelligent, context-aware reply using xAI (Grok) with fallback to Retro Chan Intelligence.
 */
async function getAiResponse(
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

  if (!XAI_API_KEY || XAI_API_KEY.length < 10) {
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

    const model = "grok-beta";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.5,
          max_tokens: 300,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      } else {
        const errText = await res.text();
        console.error(
          `AI API error with model ${model}: ${res.status} ${res.statusText} - ${errText}`,
        );
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        console.error(`AI API timeout with model ${model}`);
      } else {
        console.error(`AI API fetch failed with model ${model}:`, err);
      }
    }

    return fallback;
  } catch (err) {
    console.error("AI invocation failed, using local intelligence:", err);
    return fallback;
  }
}

/**
 * Paced sender that simulates authentic human typing and cadence.
 */
async function sendPacedMessage(
  chatId: string | number,
  text: string,
  reply_markup?: any,
  delayRange: [number, number] = [1000, 1800],
) {
  await sendChatAction(chatId, "typing");
  const delay =
    Math.floor(Math.random() * (delayRange[1] - delayRange[0])) + delayRange[0];
  await sleep(delay);
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
    await sendChatAction(chatId, "typing");
    await sleep(600);
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

      await sendChatAction(chatId, "typing");
      await sleep(1000);

      const { order } = await resolveOrder(orderId);
      if (order) {
        const greeting = payload.startsWith("issue_")
          ? `👋 Hi <b>${escapeHtml(fromUser.first_name || "there")}</b>, I see you're checking on Order <code>#${order.id.slice(0, 8)}</code>. Let's look into this right away!`
          : `👋 Hi <b>${escapeHtml(fromUser.first_name || "there")}</b>! Here is the latest update on your order:`;

        await sendMessage(chatId, greeting);
        await sleep(600);
        await sendChatAction(chatId, "typing");
        await sleep(1000);

        const statusText = formatOrderStatus(order);
        await sendMessage(chatId, statusText, buildOrderKeyboard(order.id));
        return new Response(JSON.stringify({ ok: true }), {
          headers: corsHeaders,
        });
      }
    }

    await sendPacedMessage(
      chatId,
      `👋 <b>Welcome to Retro Hub Customer Care!</b>\n\nI'm Retro Chan, your 24/7 automated support concierge. I can instantly verify your order status, look up your game keys & credentials, or connect you with human support whenever needed.`,
      buildGeneralKeyboard(),
      [1000, 1600],
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
    await sendChatAction(chatId, "typing");
    await sleep(1000);

    const { order } = await resolveOrder(rawText);
    if (order) {
      await updateSessionState(chatId, { last_order_id: order.id });
      await sendMessage(chatId, `🔍 Found your order!`);
      await sleep(600);
      await sendChatAction(chatId, "typing");
      await sleep(1000);
      await sendMessage(
        chatId,
        formatOrderStatus(order),
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

  await sendPacedMessage(chatId, responseText, keyboard, [800, 1800]);

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
