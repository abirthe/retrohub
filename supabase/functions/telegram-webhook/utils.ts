import { supabase, TELEGRAM_TOKEN, ADMIN_CHAT_ID } from "./config.ts";

export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendMessage(chatId: string | number, text: string, reply_markup?: any) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const body: any = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (reply_markup) {
    body.reply_markup = reply_markup;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error('Telegram API error:', errText);
  }
  return res;
}

export async function answerCallbackQuery(callbackQueryId: string, text: string = '', showAlert: boolean = false) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: showAlert }),
  });
}

/**
 * Intelligent Order Resolver:
 * Supports both full UUIDs (e.g. c7c482a2-aaa1-479e-b130-32c67ec02ac5)
 * and short ID prefixes (e.g. c7c482a2 or c7c4) for friction-free mobile operation.
 */
export async function resolveOrder(identifier: string) {
  const clean = identifier.trim();
  if (!clean) return { error: '⚠️ Please provide an Order ID or short ID prefix.' };

  // 1. Direct match if it is a complete UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(clean)) {
    const { data: directMatch } = await supabase
      .from('orders')
      .select('id, total, status, created_at, customer_input, final_output, user_id, products(id, title, platform, category)')
      .eq('id', clean)
      .maybeSingle();
    if (directMatch) return { order: directMatch };
  }

  // 2. Prefix matching across the most recent 100 orders
  if (clean.length >= 4) {
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, total, status, created_at, customer_input, final_output, user_id, products(id, title, platform, category)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (recentOrders && recentOrders.length > 0) {
      const matches = recentOrders.filter((o: any) => o.id.toLowerCase().startsWith(clean.toLowerCase()));
      if (matches.length === 1) {
        return { order: matches[0] };
      }
      if (matches.length > 1) {
        return {
          error: `⚠️ Multiple recent orders match prefix "<code>${escapeHtml(clean)}</code>". Please provide more characters (e.g. <code>${matches[0].id.substring(0, 10)}</code>).`
        };
      }
    }
  }

  return { error: `❌ Order not found with identifier: <code>${escapeHtml(clean)}</code>` };
}

export async function sendOrderInspection(chatId: string | number, orderIdentifier: string) {
  const { order, error: resolveError } = await resolveOrder(orderIdentifier);
  if (resolveError) {
    await sendMessage(chatId, resolveError);
    return;
  }

  const safeTitle = escapeHtml(order.products?.title || 'Unknown Product');
  const safePlatform = escapeHtml(order.products?.platform || 'General');
  const safeCategory = escapeHtml(order.products?.category || 'Item');
  const safeTotal = escapeHtml(order.total);
  const shortId = order.id.substring(0, 8);
  const statusEmoji = order.status === 'fulfilled' ? '🎉 Fulfilled' :
                      order.status === 'payment_verified' ? '✅ Payment Verified' :
                      order.status === 'payment_submitted' ? '💳 Payment Submitted' :
                      order.status === 'sourcing' ? '🔄 Sourcing' :
                      order.status === 'cancelled' ? '🚫 Cancelled' :
                      order.status === 'refunded' ? '💸 Refunded' : '⏳ Pending';

  let card = `🔍 <b>Order Details:</b> <code>${shortId}</code>\n\n` +
    `📦 <b>Product:</b> ${safeTitle}\n` +
    `🎮 <b>Platform / Category:</b> ${safePlatform} (${safeCategory})\n` +
    `💰 <b>Price:</b> ৳${safeTotal}\n` +
    `📊 <b>Status:</b> ${statusEmoji}\n` +
    `🆔 <b>Full ID:</b> <code>${escapeHtml(order.id)}</code>\n` +
    `📅 <b>Created:</b> ${new Date(order.created_at).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })}\n`;

  if (order.customer_input?.game_id || order.customer_input?.player_id) {
    const uid = order.customer_input.game_id || order.customer_input.player_id;
    card += `🎯 <b>Player ID / UID:</b> <code>${escapeHtml(uid)}</code>\n`;
  }
  if (order.customer_input?.server_id || order.customer_input?.zone_id) {
    const server = order.customer_input.server_id || order.customer_input.zone_id;
    card += `🌐 <b>Server / Zone:</b> <code>${escapeHtml(server)}</code>\n`;
  }
  if (order.customer_input?.transaction_id) {
    card += `🧾 <b>bKash TrxID:</b> <code>${escapeHtml(order.customer_input.transaction_id)}</code>\n`;
  }
  if (order.customer_input?.contact_number) {
    card += `📱 <b>Contact:</b> <code>${escapeHtml(order.customer_input.contact_number)}</code>\n`;
  }
  if (order.customer_input?.cancel_reason) {
    card += `📝 <b>Cancel Reason:</b> <i>${escapeHtml(order.customer_input.cancel_reason)}</i>\n`;
  }
  if (order.final_output) {
    card += `🔑 <b>Delivered Output:</b> <code>${escapeHtml(order.final_output)}</code>\n`;
  }

  card += `\n⚡ <b>Quick Shortcuts:</b>\n` +
    `• <code>/deliver ${shortId} CODE</code>\n` +
    `• <code>/verify ${shortId}</code>\n` +
    `• <code>/cancel ${shortId} Reason</code>`;

  const reply_markup = {
    inline_keyboard: [
      [
        { text: '✅ Verify', callback_data: `verify:${shortId}` },
        { text: '❌ Cancel', callback_data: `cancel:${shortId}` }
      ]
    ]
  };

  await sendMessage(chatId, card, reply_markup);
}
