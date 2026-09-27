// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CUSTOMER_BOT_TOKEN = Deno.env.get('CUSTOMER_BOT_TOKEN') || '8615027766:AAEM1TEoLgdSa3kV0wgmcXOKh-Z7CAFrop8'
const ADMIN_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || ''
const STAFF_CHAT_ID = String(Deno.env.get('ADMIN_CHAT_ID') || Deno.env.get('TELEGRAM_CHAT_ID') || '5605963234').trim()
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const XAI_API_KEY = (Deno.env.get('XAI_API_KEY') || Deno.env.get('VITE_XAI_API_KEY') || '').trim()

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function sendChatAction(chatId: string | number, action: string = 'typing') {
  try {
    await fetch(`https://api.telegram.org/bot${CUSTOMER_BOT_TOKEN}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action }),
    })
  } catch (err) {
    console.error('Failed to sendChatAction:', err)
  }
}

async function sendMessage(chatId: string | number, text: string, reply_markup?: any) {
  const url = `https://api.telegram.org/bot${CUSTOMER_BOT_TOKEN}/sendMessage`
  const body: any = { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }
  if (reply_markup) {
    body.reply_markup = reply_markup
  }
  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errText = await res.text()
    console.error('Telegram sendMessage HTML error, retrying plain text:', errText)
    // Strip HTML tags and retry as clean plain text
    const cleanText = text.replace(/<[^>]*>/g, '')
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: cleanText, reply_markup, disable_web_page_preview: true }),
    })
  }
  return res
}

async function sendMerchantAdminAlert(text: string, reply_markup?: any) {
  const token = ADMIN_BOT_TOKEN || CUSTOMER_BOT_TOKEN
  const url = `https://api.telegram.org/bot${token}/sendMessage`
  const body: any = { chat_id: STAFF_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }
  if (reply_markup) {
    body.reply_markup = reply_markup
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errText = await res.text()
    console.error('Telegram sendMerchantAdminAlert error:', errText)
  }
  return res
}

async function editMessageText(chatId: string | number, messageId: number, text: string, reply_markup?: any) {
  const url = `https://api.telegram.org/bot${CUSTOMER_BOT_TOKEN}/editMessageText`
  const body: any = { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', disable_web_page_preview: true }
  if (reply_markup !== undefined) {
    body.reply_markup = reply_markup
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errText = await res.text()
    console.error('Telegram editMessageText error:', errText)
  }
  return res
}

async function answerCallbackQuery(callbackQueryId: string, text: string = '', showAlert: boolean = false) {
  const url = `https://api.telegram.org/bot${CUSTOMER_BOT_TOKEN}/answerCallbackQuery`
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: showAlert }),
    })
  } catch (err) {
    console.error('answerCallbackQuery error:', err)
  }
}

/**
 * High-IQ Retro Chan Natural Intelligence Engine
 * Provides instant, highly accurate store assistance even if Grok xAI API is unavailable.
 */
function getRetroChanIntelligenceResponse(
  rawText: string,
  sessionContext?: { order?: any; customerName?: string }
): string {
  const clean = rawText.toLowerCase().trim()
  const name = sessionContext?.customerName || 'there'
  const activeOrder = sessionContext?.order

  // 1. Order Status & Tracking inquiries
  if (clean.includes('order') || clean.includes('status') || clean.includes('track') || clean.includes('update') || clean.includes('where is')) {
    if (activeOrder) {
      return `Hey ${escapeHtml(name)}! 📦 I pulled up your latest order (<b>#${activeOrder.id.slice(0, 8)}</b>):\n\n` +
        `🎮 <b>Item:</b> ${escapeHtml(activeOrder.products?.title || 'Digital License')}\n` +
        `📊 <b>Status:</b> <b>${activeOrder.status}</b>\n` +
        `💰 <b>Amount:</b> ৳${Number(activeOrder.total).toFixed(2)}\n\n` +
        (activeOrder.status === 'fulfilled'
          ? `🎉 Your code is delivered! Tap "View Key / Code" below to reveal it.`
          : activeOrder.status === 'payment_verified' || activeOrder.status === 'sourcing'
          ? `🚀 Your payment is verified and our engine is actively preparing your key. Most codes arrive within 5–15 minutes!`
          : `💳 We're verifying your transaction. If you've already sent bKash, make sure you submitted the TrxID at retrohub.tech/payment!`)
    }
    return `I can track any order for you instantly! 🔍 Just send your <b>8-character Order ID</b> (from your checkout receipt or confirmation SMS), or tap <b>Track My Order</b> below.`
  }

  // 2. bKash & Payment inquiries
  if (clean.includes('bkash') || clean.includes('pay') || clean.includes('payment') || clean.includes('number') || clean.includes('charge') || clean.includes('fee')) {
    return `💳 <b>RetroHub bKash Payment Guide:</b>\n\n` +
      `• <b>Method:</b> We accept exclusively <b>bKash Send Money</b>.\n` +
      `• <b>Official Number:</b> <code>01580382868</code> (Tap to copy)\n` +
      `• <b>Charge:</b> Please include the <b>1% bKash fee</b> in your payment amount.\n` +
      `• <b>Reference:</b> Use your Order ID as the transaction reference.\n\n` +
      `After sending money, enter your 10-character Transaction ID at <a href="https://www.retrohub.tech/payment">retrohub.tech/payment</a> for instant verification! ⚡`
  }

  // 3. Digital Key & Delivery Speed
  if (clean.includes('key') || clean.includes('code') || clean.includes('how long') || clean.includes('delivery') || clean.includes('instant') || clean.includes('when')) {
    return `⚡ <b>Digital Delivery Speed:</b>\n\n` +
      `All automated items (Steam keys, Apple/Google gift cards, game top-ups) are delivered within <b>1 to 15 minutes</b> after bKash payment verification!\n\n` +
      `Once delivered, your digital credentials will appear right here in Telegram and in your web Customer Console at <a href="https://www.retrohub.tech/orders">retrohub.tech/orders</a>. ✨`
  }

  // 4. Products & Catalog
  if (clean.includes('game') || clean.includes('product') || clean.includes('steam') || clean.includes('gift card') || clean.includes('buy') || clean.includes('catalog') || clean.includes('price')) {
    return `🎮 <b>What We Offer at RetroHub:</b>\n\n` +
      `• <b>Global Game Keys:</b> Steam, PlayStation Network, Xbox Game Pass, Nintendo eShop\n` +
      `• <b>Digital Gift Cards:</b> Apple App Store, Google Play, Razer Gold, Roblox\n` +
      `• <b>In-Game Top-Ups:</b> Free Fire Diamonds, PUBG UC, Valorant Points\n` +
      `• <b>Custom Orders:</b> On-demand sourcing for regional titles!\n\n` +
      `Explore live stock and pricing at our storefront: <a href="https://www.retrohub.tech">retrohub.tech</a> 🛒`
  }

  // 5. Issues, Complaints & Refund Policy
  if (clean.includes('refund') || clean.includes('scam') || clean.includes('broken') || clean.includes('invalid') || clean.includes('not working') || clean.includes('fake') || clean.includes('issue')) {
    return `We sincerely apologize for the frustration, ${escapeHtml(name)}! 🛡️\n\n` +
      `At RetroHub, every purchase comes with our <b>100% Genuine Key & Verified Delivery Guarantee</b>. If a key has region issues or cannot be redeemed, we immediately verify and replace it or issue a prompt refund.\n\n` +
      `If you'd like our merchant team to inspect your case personally, tap <b>Talk to Human Agent</b> below, or send your Order ID so I can look up the details right now!`
  }

  // 6. Explicit Request for Human Support
  if (clean.includes('human') || clean.includes('agent') || clean.includes('person') || clean.includes('support') || clean.includes('admin') || clean.includes('talk to someone')) {
    return `I would be happy to connect you with our human merchant specialist! 👨‍💻\n\n` +
      `Tap <b>Talk to Human Agent</b> below to alert the merchant desk. An agent will review your chat transcript and reply to you directly right here.`
  }

  // 7. Friendly Greetings & Chit-chat
  if (clean.includes('hi') || clean.includes('hello') || clean.includes('hey') || clean.includes('salam') || clean.includes('hola') || clean.includes('good morning') || clean.includes('good evening')) {
    return `Hello ${escapeHtml(name)}! 👋 Welcome to <b>RetroHub Customer Care</b>! I'm Retro Chan, your 24/7 automated support concierge.\n\n` +
      `I can help you check orders, look up game keys, answer payment questions, or connect you with human support. What can I do for you today? ✨`
  }

  // 8. Polite Appreciation
  if (clean.includes('thank') || clean.includes('thanks') || clean.includes('tysm') || clean.includes('great') || clean.includes('awesome') || clean.includes('ok')) {
    return `You're very welcome, ${escapeHtml(name)}! 😊 It's always my pleasure to help. If you ever have another question or need a new game, RetroHub is here for you 24/7! 🎮`
  }

  // Default smart fallback
  return `Thanks for reaching out, ${escapeHtml(name)}! 😊\n\n` +
    `I'm Retro Chan, your support concierge at RetroHub. I can check your order status, look up game credentials, explain bKash payment, or route you to a live agent. What would you like assistance with?`
}

/**
 * Generates an intelligent, context-aware reply using xAI (Grok) with fallback to Retro Chan Intelligence.
 */
async function getAiResponse(
  history: Array<{ sender: string; text: string }>,
  latestMessage: string,
  sessionContext?: { order?: any; customerName?: string }
): Promise<string> {
  const fallback = getRetroChanIntelligenceResponse(latestMessage, sessionContext)

  // Validate xAI Key format (xAI keys start with 'xai-' and are min 25 chars)
  if (!XAI_API_KEY || !XAI_API_KEY.startsWith('xai-') || XAI_API_KEY.length < 25) {
    return fallback
  }

  try {
    const orderSnippet = sessionContext?.order
      ? `\nActive Customer Order: #${sessionContext.order.id.slice(0, 8)} | Item: ${sessionContext.order.products?.title || 'Digital Item'} | Status: ${sessionContext.order.status} | Total: ৳${sessionContext.order.total}`
      : ''

    const systemPrompt = `You are Retro Chan, the witty, charming, and highly intelligent customer support AI for Retro Hub (https://www.retrohub.tech).
RetroHub Rules & Context:
- RetroHub is a premier instant digital game key & gaming gift card storefront.
- Payment: RETROHUB accepts exclusively bKash Send Money to 01580382868 (+1% bKash fee, use Order ID as reference). Payment confirmation happens at retrohub.tech/payment.
- Delivery: Digital keys and credentials are automatically delivered within 1–15 minutes after payment verification.
- Human Escalation: If a customer specifically requires manual intervention, account refunds, or custom quotes, politely let them know they can use the "Talk to Human Agent" button or /human command. Do not ping staff yourself unless they ask.
- Keep responses friendly, concise, empathetic, human-like, and use tasteful emojis.${orderSnippet}`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((m) => ({
        role: m.sender === 'customer' ? 'user' : 'assistant',
        content: m.text,
      })),
      { role: 'user', content: latestMessage },
    ]

    const models = ['grok-2-latest', 'grok-2', 'grok-beta']
    for (const model of models) {
      try {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${XAI_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 300,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const text = data.choices?.[0]?.message?.content?.trim()
          if (text) return text
        }
      } catch (_) {
        // Try fallback model
      }
    }

    return fallback
  } catch (err) {
    console.error('AI invocation failed, using local intelligence:', err)
    return fallback
  }
}

/**
 * Paced sender that simulates authentic human typing and cadence.
 */
async function sendPacedMessage(chatId: string | number, text: string, reply_markup?: any, delayRange: [number, number] = [1000, 1800]) {
  await sendChatAction(chatId, 'typing')
  const delay = Math.floor(Math.random() * (delayRange[1] - delayRange[0])) + delayRange[0]
  await sleep(delay)
  return await sendMessage(chatId, text, reply_markup)
}

/**
 * Resolve order from UUID or short prefix
 */
async function resolveOrder(identifier: string) {
  const clean = identifier.trim()
  if (!clean) return null

  // Direct UUID match
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(clean)) {
    const { data } = await supabase
      .from('orders')
      .select('*, products(id, title, platform, category, delivery_type), deliveries(*)')
      .eq('id', clean)
      .maybeSingle()
    if (data) return data
  }

  // Short prefix match
  if (clean.length >= 4) {
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('*, products(id, title, platform, category, delivery_type), deliveries(*)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (recentOrders && recentOrders.length > 0) {
      const matches = recentOrders.filter((o: any) => o.id.toLowerCase().startsWith(clean.toLowerCase()))
      if (matches.length >= 1) return matches[0]
    }
  }

  return null
}

/**
 * Session State Management
 */
async function getOrCreateSession(fromUser: any, chatId: number) {
  try {
    const { data: existing } = await supabase
      .from('customer_support_sessions')
      .select('*')
      .eq('chat_id', chatId)
      .maybeSingle()

    if (existing) {
      return existing
    }

    const newSession = {
      chat_id: chatId,
      username: fromUser.username || null,
      first_name: fromUser.first_name || null,
      last_name: fromUser.last_name || null,
      state: 'bot_active',
      sentiment_score: 0,
      recent_messages: [],
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: created, error } = await supabase
      .from('customer_support_sessions')
      .insert(newSession)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error creating support session:', error)
      return newSession
    }
    return created || newSession
  } catch (err) {
    console.error('Session getOrCreate error:', err)
    return {
      chat_id: chatId,
      username: fromUser.username || null,
      first_name: fromUser.first_name || null,
      state: 'bot_active',
      recent_messages: [],
    }
  }
}

async function updateSessionState(chatId: number, updates: any) {
  try {
    await supabase
      .from('customer_support_sessions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('chat_id', chatId)
  } catch (err) {
    console.error('Failed to update session state:', err)
  }
}

async function appendSessionMessage(chatId: number, sender: 'customer' | 'bot' | 'agent', text: string) {
  try {
    const { data: session } = await supabase
      .from('customer_support_sessions')
      .select('recent_messages')
      .eq('chat_id', chatId)
      .maybeSingle()

    const history = (session?.recent_messages || []) as Array<{ sender: string; text: string; time: string }>
    history.push({
      sender,
      text,
      time: new Date().toISOString(),
    })
    const trimmed = history.slice(-20)

    await supabase
      .from('customer_support_sessions')
      .update({ recent_messages: trimmed, updated_at: new Date().toISOString() })
      .eq('chat_id', chatId)
  } catch (err) {
    console.error('appendSessionMessage error:', err)
  }
}

function buildOrderKeyboard(orderId: string) {
  const shortId = orderId.slice(0, 8)
  return {
    inline_keyboard: [
      [
        { text: '📦 Check Status', callback_data: `status_${shortId}` },
        { text: '🔑 View Key / Code', callback_data: `key_${shortId}` },
      ],
      [
        { text: '⚠️ Report Issue', callback_data: `issue_${shortId}` },
        { text: '👤 Talk to Human Agent', callback_data: `escalate_${shortId}` },
      ],
      [
        { text: '🌐 Customer Console', url: 'https://www.retrohub.tech/orders' },
      ],
    ],
  }
}

function buildGeneralKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📦 Track My Order', callback_data: 'prompt_order' },
        { text: '❓ FAQ & Delivery Times', callback_data: 'faq' },
      ],
      [
        { text: '👤 Talk to Human Agent', callback_data: 'escalate_general' },
        { text: '🛒 Visit Store', url: 'https://www.retrohub.tech' },
      ],
    ],
  }
}

/**
 * Explicit Human Escalation: ONLY called when customer explicitly clicks human agent or calls /human
 */
async function escalateToStaff(chatId: number, fromUser: any, reason: string, orderId?: string) {
  await updateSessionState(chatId, {
    state: 'escalated',
    escalated_at: new Date().toISOString(),
    last_order_id: orderId || null,
  })

  let orderInfo = 'None specified'
  if (orderId) {
    const order = await resolveOrder(orderId)
    if (order) {
      orderInfo = `#<code>${order.id.slice(0, 8)}</code> | <b>${escapeHtml(order.products?.title || 'Unknown')}</b> | ৳${Number(order.total).toFixed(2)} (${order.status})`
    }
  }

  const staffAlert =
`🚨 <b>CUSTOMER SUPPORT ESCALATION</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Customer:</b> ${escapeHtml(fromUser.first_name || 'Customer')} ${fromUser.username ? `(@${escapeHtml(fromUser.username)})` : ''}
🆔 <b>Chat ID:</b> <code>${chatId}</code>
📦 <b>Order:</b> ${orderInfo}
⚡ <b>Trigger:</b> ${escapeHtml(reason)}

━━━━━━━━━━━━━━━━━━
💬 <b>To reply directly to customer:</b>
<code>/reply ${chatId} &lt;your message&gt;</code>

✅ <b>To resolve & return to bot:</b>
<code>/resolve ${chatId}</code>`

  const staffKeyboard = {
    inline_keyboard: [
      [
        { text: `💬 Reply (/reply ${chatId})`, callback_data: `support_reply:${chatId}` },
        { text: `✅ Mark Resolved`, callback_data: `support_resolve:${chatId}` },
      ],
      ...(fromUser.username ? [[{ text: `👤 Open Direct PM`, url: `https://t.me/${fromUser.username}` }]] : []),
    ],
  }

  await sendMerchantAdminAlert(staffAlert, staffKeyboard)
}

function formatOrderStatus(order: any): string {
  const statusEmojis: Record<string, string> = {
    pending: '⏳ Pending Payment Verification',
    payment_submitted: '💳 Payment Submitted (Under Review)',
    payment_verified: '✅ Payment Verified & Queued',
    sourcing: '⚡ Processing / Sourcing Key',
    fulfilled: '🎉 Fulfilled & Delivered',
    cancelled: '❌ Order Cancelled',
    refunded: '🔄 Refunded to Customer',
  }

  const label = statusEmojis[order.status] || `Status: ${order.status}`
  const createdDate = new Date(order.created_at).toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return `📦 <b>Order #${order.id.slice(0, 8)}</b>
━━━━━━━━━━━━━━━━━━
🎮 <b>Product:</b> ${escapeHtml(order.products?.title || 'Digital Item')}
🏷️ <b>Platform:</b> ${escapeHtml(order.products?.platform || 'Global')}
💰 <b>Total:</b> ৳${Number(order.total).toFixed(2)}
🕒 <b>Placed:</b> ${createdDate} (BST)
📊 <b>Current Status:</b> <b>${label}</b>

${order.status === 'fulfilled'
  ? '✨ <i>Your product has been delivered! Tap "View Key / Code" below to reveal your credentials.</i>'
  : order.status === 'sourcing' || order.status === 'payment_verified'
  ? '🚀 <i>Our automated delivery engine is actively preparing your digital license. Most codes are issued within 5–15 minutes.</i>'
  : 'ℹ️ <i>We are verifying your transaction with the payment gateway. If you need manual expedited handling, tap Talk to Human Agent below.</i>'}`
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const update = await req.json()

    // ─────────────────────────────────────────────────────────────
    // 1. HANDLE CALLBACK QUERIES (Inline Buttons)
    // ─────────────────────────────────────────────────────────────
    if (update.callback_query) {
      const query = update.callback_query
      const callbackQueryId = query.id
      const data = query.data || ''
      const chatId = query.message?.chat?.id
      const messageId = query.message?.message_id
      const fromUser = query.from

      await answerCallbackQuery(callbackQueryId)

      // Customer self-cancels escalation / returns to AI bot
      if (data === 'resume_bot') {
        await updateSessionState(chatId, {
          state: 'bot_active',
          resolved_at: new Date().toISOString(),
        })
        await editMessageText(
          chatId,
          messageId,
          `👋 <b>Back to Retro Chan!</b>\n\nI am ready to help you with orders, keys, payment guidelines, or store recommendations. What can I do for you?`,
          buildGeneralKeyboard()
        )
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
      }

      // Check Status
      if (data.startsWith('status_')) {
        const orderPrefix = data.replace('status_', '')
        const order = await resolveOrder(orderPrefix)
        if (!order) {
          await editMessageText(chatId, messageId, `⚠️ Order <code>#${escapeHtml(orderPrefix)}</code> was not found. Please verify the ID on your receipt.`, buildGeneralKeyboard())
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
        }
        const text = formatOrderStatus(order)
        await editMessageText(chatId, messageId, text, buildOrderKeyboard(order.id))
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
      }

      // View Key / Code
      if (data.startsWith('key_')) {
        const orderPrefix = data.replace('key_', '')
        const order = await resolveOrder(orderPrefix)
        if (!order) {
          await editMessageText(chatId, messageId, `⚠️ Order <code>#${escapeHtml(orderPrefix)}</code> was not found.`, buildGeneralKeyboard())
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
        }

        const deliveries = order.deliveries || []
        if (deliveries.length > 0) {
          const codes = deliveries
            .map((d: any, idx: number) => `🔑 <b>Item #${idx + 1}:</b>\n<code>${escapeHtml(d.delivery_code)}</code>${d.delivery_notes ? `\n<i>Note: ${escapeHtml(d.delivery_notes)}</i>` : ''}`)
            .join('\n\n')

          const text =
`🎉 <b>Digital Delivery for Order #${order.id.slice(0, 8)}</b>
━━━━━━━━━━━━━━━━━━
🎮 <b>Product:</b> ${escapeHtml(order.products?.title || 'Digital License')}

${codes}

⚠️ <i>Keep your code safe and do not share it with third parties.</i>`

          await editMessageText(chatId, messageId, text, buildOrderKeyboard(order.id))
        } else if (order.final_output) {
          const text =
`🎉 <b>Delivery Credentials for Order #${order.id.slice(0, 8)}</b>
━━━━━━━━━━━━━━━━━━
<code>${escapeHtml(order.final_output)}</code>`
          await editMessageText(chatId, messageId, text, buildOrderKeyboard(order.id))
        } else {
          const text =
`⏳ <b>Credentials Not Ready Yet</b>
━━━━━━━━━━━━━━━━━━
Order <code>#${order.id.slice(0, 8)}</code> is currently in state: <b>${order.status}</b>.

Your code is being provisioned. As soon as it's ready, it will appear here and in your web Customer Console!`
          await editMessageText(chatId, messageId, text, buildOrderKeyboard(order.id))
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
      }

      // Report Issue / Refund
      if (data.startsWith('issue_')) {
        const orderPrefix = data.replace('issue_', '')
        await editMessageText(
          chatId,
          messageId,
          `📝 <b>Issue Resolution & Guarantee</b>
━━━━━━━━━━━━━━━━━━
We apologize for the inconvenience with Order <code>#${escapeHtml(orderPrefix)}</code>.

All RetroHub orders are protected under our full replacement & refund policy. Tap below if you would like to connect directly with our human merchant desk!`,
          {
            inline_keyboard: [
              [{ text: '🚨 Connect to Human Support Now', callback_data: `escalate_${orderPrefix}` }],
              [{ text: '🔙 Back to Order Options', callback_data: `status_${orderPrefix}` }],
            ],
          }
        )
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
      }

      // Escalate to human: Explicit user action
      if (data.startsWith('escalate_')) {
        const orderPrefix = data.replace('escalate_', '')
        const effectiveOrder = orderPrefix !== 'general' ? orderPrefix : undefined

        await editMessageText(
          chatId,
          messageId,
          `🛡️ <b>Handoff to Merchant Specialist</b>
━━━━━━━━━━━━━━━━━━
I have notified our merchant desk! An agent will review your chat transcript and reply directly here shortly.

In the meantime, feel free to send any additional screenshots or keep asking questions — Retro Chan is still here for you!`,
          {
            inline_keyboard: [
              [{ text: '🤖 Resume with Retro Chan AI', callback_data: 'resume_bot' }],
              [{ text: '🌐 Customer Console', url: 'https://www.retrohub.tech/orders' }],
            ],
          }
        )
        await escalateToStaff(chatId, fromUser, 'Customer requested human assistance via interactive button', effectiveOrder)
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
      }

      // Prompt for order ID
      if (data === 'prompt_order') {
        await editMessageText(
          chatId,
          messageId,
          `🔍 <b>Order Lookup</b>\n\nPlease send your <b>Order ID</b> (for example: the 8-character code from your receipt like <code>c7c482a2</code>).`,
          {
            inline_keyboard: [[{ text: '🔙 Cancel', callback_data: 'back_general' }]],
          }
        )
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
      }

      // FAQ
      if (data === 'faq') {
        const faqText =
`ℹ️ <b>Frequently Asked Questions</b>
━━━━━━━━━━━━━━━━━━
⚡ <b>How long does delivery take?</b>
Instant items are fulfilled within 1–15 minutes after bKash payment verification.

💳 <b>Which payment methods are accepted?</b>
We accept exclusively bKash Send Money to 01580382868 (+1% fee).

🔑 <b>Where do I find my code?</b>
Tap "View Key / Code" in your order menu, or visit your customer console at retrohub.tech/orders.

🚨 <b>Need more help?</b>
Tap the button below to reach our merchant specialist directly.`

        await editMessageText(chatId, messageId, faqText, {
          inline_keyboard: [
            [{ text: '👤 Talk to Human Agent', callback_data: 'escalate_general' }],
            [{ text: '🔙 Back', callback_data: 'back_general' }],
          ],
        })
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
      }

      if (data === 'back_general') {
        await editMessageText(
          chatId,
          messageId,
          `👋 <b>Welcome to Retro Hub Customer Care!</b>\n\nHow can we help you today?`,
          buildGeneralKeyboard()
        )
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
      }

      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // ─────────────────────────────────────────────────────────────
    // 2. HANDLE INCOMING TEXT MESSAGES
    // ─────────────────────────────────────────────────────────────
    if (!update.message || !update.message.text) {
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    const message = update.message
    const chatId = message.chat.id
    const fromUser = message.from
    const rawText = message.text.trim()

    // ─────────────────────────────────────────────────────────────
    // A. EXPLICIT HUMAN ESCALATION COMMANDS (/human, /agent, /support, /help)
    // ─────────────────────────────────────────────────────────────
    if (rawText === '/help' || rawText === '/support' || rawText === '/agent' || rawText === '/human' || rawText === '/staff') {
      await sendChatAction(chatId, 'typing')
      await sleep(600)
      await sendMessage(
        chatId,
        `👨‍💻 <b>Connecting to Live Human Support...</b>\n\nI have routed your inquiry directly to our merchant desk. An agent will review your chat transcript and reply directly to you right here.\n\nIn the meantime, feel free to ask any other questions!`,
        {
          inline_keyboard: [
            [{ text: '🤖 Resume with Retro Chan AI', callback_data: 'resume_bot' }],
          ],
        }
      )
      await escalateToStaff(chatId, fromUser, `Customer invoked human command: ${rawText}`)
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // ─────────────────────────────────────────────────────────────
    // B. ORDER TRACKING COMMAND (/track)
    // ─────────────────────────────────────────────────────────────
    if (rawText.startsWith('/track')) {
      const parts = rawText.split(' ')
      const orderArg = parts[1] || ''
      if (!orderArg) {
        await sendMessage(chatId, '🔍 <b>Order Lookup:</b> Please provide an Order ID.\nExample: <code>/track c7c482a2</code>', {
          inline_keyboard: [[{ text: '📦 Prompt for Order ID', callback_data: 'prompt_order' }]],
        })
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
      }
      const order = await resolveOrder(orderArg)
      if (order) {
        await updateSessionState(chatId, { last_order_id: order.id })
        await sendMessage(chatId, formatOrderStatus(order), buildOrderKeyboard(order.id))
      } else {
        await sendMessage(chatId, `⚠️ Order <code>#${escapeHtml(orderArg)}</code> was not found. Please verify the ID on your receipt.`, buildGeneralKeyboard())
      }
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // ─────────────────────────────────────────────────────────────
    // C. /start COMMAND & DEEP LINK HANDLING
    // ─────────────────────────────────────────────────────────────
    if (rawText.startsWith('/start')) {
      const parts = rawText.split(' ')
      const payload = parts[1] || ''

      if (payload.startsWith('order_') || payload.startsWith('issue_')) {
        const orderId = payload.replace(/^(order_|issue_)/, '')
        await updateSessionState(chatId, { last_order_id: orderId })

        await sendChatAction(chatId, 'typing')
        await sleep(1000)

        const order = await resolveOrder(orderId)
        if (order) {
          const greeting = payload.startsWith('issue_')
            ? `👋 Hi <b>${escapeHtml(fromUser.first_name || 'there')}</b>, I see you're checking on Order <code>#${order.id.slice(0, 8)}</code>. Let's look into this right away!`
            : `👋 Hi <b>${escapeHtml(fromUser.first_name || 'there')}</b>! Here is the latest update on your order:`

          await sendMessage(chatId, greeting)
          await sleep(600)
          await sendChatAction(chatId, 'typing')
          await sleep(1000)

          const statusText = formatOrderStatus(order)
          await sendMessage(chatId, statusText, buildOrderKeyboard(order.id))
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
        }
      }

      await sendPacedMessage(
        chatId,
        `👋 <b>Welcome to Retro Hub Customer Care!</b>\n\nI'm Retro Chan, your 24/7 automated support concierge. I can instantly verify your order status, look up your game keys & credentials, or connect you with human support whenever needed.`,
        buildGeneralKeyboard(),
        [1000, 1600]
      )
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // ─────────────────────────────────────────────────────────────
    // D. ORDER ID PATTERN DETECTION (8-char hex or UUID)
    // ─────────────────────────────────────────────────────────────
    const orderMatch = rawText.match(/[0-9a-f]{8}(-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?/i)
    if (orderMatch && !rawText.includes(' ')) {
      await sendChatAction(chatId, 'typing')
      await sleep(1000)

      const order = await resolveOrder(orderMatch[0])
      if (order) {
        await updateSessionState(chatId, { last_order_id: order.id })
        await sendMessage(chatId, `🔍 Found your order!`)
        await sleep(600)
        await sendChatAction(chatId, 'typing')
        await sleep(1000)
        await sendMessage(chatId, formatOrderStatus(order), buildOrderKeyboard(order.id))
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
      }
    }

    // ─────────────────────────────────────────────────────────────
    // E. SESSION MANAGEMENT & CONTEXT PREPARATION
    // ─────────────────────────────────────────────────────────────
    const session = await getOrCreateSession(fromUser, chatId)
    await appendSessionMessage(chatId, 'customer', rawText)

    // Load active order context if known
    let activeOrderData: any = null
    if (session.last_order_id) {
      activeOrderData = await resolveOrder(session.last_order_id)
    }

    // ─────────────────────────────────────────────────────────────
    // F. LIVE AGENT SESSION RELAY
    // ONLY forward customer message to staff if the agent has ACTIVELY replied (agent_active)
    // ─────────────────────────────────────────────────────────────
    if (session.state === 'agent_active') {
      const fwdText =
`📩 <b>Customer Reply (Chat #<code>${chatId}</code>)</b> ${fromUser.username ? `(@${escapeHtml(fromUser.username)})` : ''}:
"${escapeHtml(rawText)}"

💬 Reply using: <code>/reply ${chatId} &lt;text&gt;</code>`

      const fwdKeyboard = {
        inline_keyboard: [
          [
            { text: `💬 Reply`, callback_data: `support_reply:${chatId}` },
            { text: `✅ Resolve`, callback_data: `support_resolve:${chatId}` },
          ],
        ],
      }
      await sendMerchantAdminAlert(fwdText, fwdKeyboard)
      await sendChatAction(chatId, 'typing')
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // ─────────────────────────────────────────────────────────────
    // G. FULL CUSTOMER SERVICE POWERED BY RETRO CHAN FT. GROK
    // The bot handles 100% of the customer service conversation without bothering the merchant!
    // ─────────────────────────────────────────────────────────────
    await sendChatAction(chatId, 'typing')

    const responseText = await getAiResponse(
      session.recent_messages || [],
      rawText,
      {
        order: activeOrderData,
        customerName: fromUser.first_name || 'Gamer',
      }
    )

    await appendSessionMessage(chatId, 'bot', responseText)

    const keyboard = activeOrderData
      ? buildOrderKeyboard(activeOrderData.id)
      : buildGeneralKeyboard()

    await sendPacedMessage(chatId, responseText, keyboard, [800, 1800])

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
  } catch (err: any) {
    console.error('Customer bot webhook handler error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
