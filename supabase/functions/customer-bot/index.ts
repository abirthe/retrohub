// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CUSTOMER_BOT_TOKEN = Deno.env.get('CUSTOMER_BOT_TOKEN') || '8615027766:AAG2yqz0h_umPAK76qz6RoETIXqKFkz6zmM'
const STAFF_CHAT_ID = Deno.env.get('STAFF_CHAT_ID') || Deno.env.get('TELEGRAM_CHAT_ID') || '5605963234'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errText = await res.text()
    console.error('Telegram sendMessage error:', errText)
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
 * Paced sender that simulates authentic human typing and cadence.
 */
async function sendPacedMessage(chatId: string | number, text: string, reply_markup?: any, delayRange: [number, number] = [1400, 2400]) {
  await sendChatAction(chatId, 'typing')
  const delay = Math.floor(Math.random() * (delayRange[1] - delayRange[0])) + delayRange[0]
  await sleep(delay)
  return await sendMessage(chatId, text, reply_markup)
}

/**
 * Sentiment & Intent Analysis:
 * Detects frustration, keywords, and computes an escalation score.
 */
function analyzeSentimentAndIntent(text: string): { score: number; intent: string; isUrgent: boolean } {
  const clean = text.toLowerCase()
  let score = 0
  let intent = 'general_inquiry'

  const highFrustrationWords = [
    'scam', 'fraud', 'thief', 'robbed', 'stolen', 'broken', 'not working', 'fake', 'invalid',
    'sue', 'police', 'report', 'cheat', 'waste', 'worst', 'liar', 'stuck', 'terrible', 'horrible'
  ]
  const refundWords = ['refund', 'money back', 'return', 'cancel order', 'cancel my order']
  const humanWords = ['human', 'agent', 'person', 'support rep', 'manager', 'speak to someone', 'talk to someone', 'real person']
  const statusWords = ['where is my', 'order status', 'track', 'tracking', 'not received', 'haven\'t received', 'when will']
  const keyWords = ['key', 'code', 'license', 'activation', 'login', 'credentials', 'password']

  for (const word of highFrustrationWords) {
    if (clean.includes(word)) score += 35
  }
  for (const word of refundWords) {
    if (clean.includes(word)) {
      score += 20
      intent = 'refund_request'
    }
  }
  for (const word of humanWords) {
    if (clean.includes(word)) {
      score += 30
      intent = 'agent_request'
    }
  }
  for (const word of statusWords) {
    if (clean.includes(word)) {
      intent = 'order_status'
    }
  }
  for (const word of keyWords) {
    if (clean.includes(word)) {
      intent = 'digital_delivery'
    }
  }

  // Capital letters / exclamation marks heuristic
  const exclamationCount = (text.match(/!/g) || []).length
  if (exclamationCount >= 2) score += 15

  return {
    score: Math.min(score, 100),
    intent,
    isUrgent: score >= 40 || intent === 'agent_request',
  }
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
      if (matches.length === 1) return matches[0]
      if (matches.length > 1) return matches[0] // pick most recent
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
    // Keep last 15 messages
    const trimmed = history.slice(-15)

    await supabase
      .from('customer_support_sessions')
      .update({ recent_messages: trimmed, updated_at: new Date().toISOString() })
      .eq('chat_id', chatId)
  } catch (err) {
    console.error('appendSessionMessage error:', err)
  }
}

/**
 * Build primary triage menu for an order
 */
function buildOrderKeyboard(orderId: string) {
  const shortId = orderId.slice(0, 8)
  return {
    inline_keyboard: [
      [
        { text: '📦 Check Status', callback_data: `status_${shortId}` },
        { text: '🔑 View Key / Code', callback_data: `key_${shortId}` },
      ],
      [
        { text: '⚠️ Report Issue / Refund', callback_data: `issue_${shortId}` },
        { text: '👤 Talk to Human Agent', callback_data: `escalate_${shortId}` },
      ],
      [
        { text: '🌐 Open Web Console', url: 'https://www.retrohub.tech/orders' },
      ],
    ],
  }
}

/**
 * Build generic greeting menu
 */
function buildGeneralKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📦 Track My Order', callback_data: 'prompt_order' },
        { text: '❓ FAQ & Delivery Times', callback_data: 'faq' },
      ],
      [
        { text: '👤 Talk to Human Support', callback_data: 'escalate_general' },
        { text: '🛒 Visit Store', url: 'https://www.retrohub.tech' },
      ],
    ],
  }
}

/**
 * Escalation Trigger: Alerts staff and sets session state to 'escalated'
 */
async function escalateToStaff(chatId: number, fromUser: any, reason: string, orderId?: string) {
  await updateSessionState(chatId, {
    state: 'escalated',
    escalated_at: new Date().toISOString(),
    last_order_id: orderId || null,
  })

  // Fetch session history
  const { data: session } = await supabase
    .from('customer_support_sessions')
    .select('*')
    .eq('chat_id', chatId)
    .maybeSingle()

  const history = (session?.recent_messages || []) as Array<{ sender: string; text: string; time: string }>
  const historyText = history.length > 0
    ? history.map((m) => `• <b>${m.sender.toUpperCase()}</b>: ${escapeHtml(m.text)}`).join('\n')
    : '<i>No prior history</i>'

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

📜 <b>Recent Context:</b>
${historyText}

━━━━━━━━━━━━━━━━━━
💬 <b>To reply directly to customer:</b>
<code>/reply ${chatId} &lt;your message&gt;</code>

✅ <b>To resolve & return to bot:</b>
<code>/resolve ${chatId}</code>`

  const staffKeyboard = {
    inline_keyboard: [
      [
        { text: `💬 Quick Reply`, url: `tg://user?id=${chatId}` },
        { text: `✅ Mark Resolved`, callback_data: `staff_resolve_${chatId}` },
      ],
    ],
  }

  await sendMessage(STAFF_CHAT_ID, staffAlert, staffKeyboard)
}

/**
 * Format order status detail message
 */
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
  : 'ℹ️ <i>We are verifying your transaction with the payment gateway. If you need manual expedited handling, tap Talk to Human Agent.</i>'}`
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
    console.log('Received customer bot update:', JSON.stringify(update))

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

      // Staff resolution via button
      if (data.startsWith('staff_resolve_')) {
        const targetChatId = Number(data.replace('staff_resolve_', ''))
        await updateSessionState(targetChatId, {
          state: 'bot_active',
          resolved_at: new Date().toISOString(),
        })
        await sendMessage(targetChatId, '✅ <b>Your support ticket has been resolved by our team.</b>\n\nIf you have any further questions, simply send a message and I will assist you right away!')
        await editMessageText(chatId, messageId, `✅ <i>Ticket for Chat #${targetChatId} was marked as resolved.</i>`)
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
          `📝 <b>Issue Resolution & Refund Request</b>
━━━━━━━━━━━━━━━━━━
We apologize for the inconvenience with Order <code>#${escapeHtml(orderPrefix)}</code>.

Please type a quick message explaining what happened (e.g. invalid key, wrong region, delayed delivery). I will immediately forward your full order history to a human support agent.`,
          {
            inline_keyboard: [
              [{ text: '🚨 Connect to Human Support Now', callback_data: `escalate_${orderPrefix}` }],
              [{ text: '🔙 Back to Order Options', callback_data: `status_${orderPrefix}` }],
            ],
          }
        )
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
      }

      // Escalate to human
      if (data.startsWith('escalate_')) {
        const orderPrefix = data.replace('escalate_', '')
        const effectiveOrder = orderPrefix !== 'general' ? orderPrefix : undefined

        await editMessageText(
          chatId,
          messageId,
          `🛡️ <b>Handoff to Support Agent</b>
━━━━━━━━━━━━━━━━━━
I have notified our live customer support team. Your order context, conversation transcript, and account details have been shared directly with an agent.

An agent will review your case and respond here shortly. Please feel free to send any additional screenshots or details!`
        )
        await escalateToStaff(chatId, fromUser, 'Customer requested human agent via interactive menu', effectiveOrder)
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
      }

      // Prompt for order ID
      if (data === 'prompt_order') {
        await editMessageText(
          chatId,
          messageId,
          `🔍 <b>Order Lookup</b>\n\nPlease send your <b>Order ID</b> (for example: <code>${new Date().getFullYear()}-XXXX</code> or the 8-character ID from your receipt).`,
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
Instant items are fulfilled within 1–15 minutes after payment verification.

💳 <b>Which payment methods are accepted?</b>
bKash, Nagad, Rocket, and Bank transfers via our secure checkout.

🔑 <b>Where do I redeem my code?</b>
Check the platform instructions on your order confirmation, or visit your customer console at retrohub.tech/orders.

🚨 <b>Need more help?</b>
Tap the button below to reach our support team directly.`
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
    // STAFF COMMANDS (Sent from STAFF_CHAT_ID)
    // ─────────────────────────────────────────────────────────────
    if (String(chatId) === String(STAFF_CHAT_ID)) {
      // /resolve <chat_id>
      if (rawText.startsWith('/resolve')) {
        const parts = rawText.split(' ')
        const targetChatId = Number(parts[1])
        if (!targetChatId) {
          await sendMessage(STAFF_CHAT_ID, '⚠️ Usage: <code>/resolve &lt;chat_id&gt;</code>')
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
        }

        await updateSessionState(targetChatId, {
          state: 'bot_active',
          resolved_at: new Date().toISOString(),
        })

        await sendMessage(
          targetChatId,
          '✅ <b>Your support session has been resolved.</b>\n\nThank you for choosing Retro Hub! If you ever need anything else, I am always here to help 24/7.'
        )
        await sendMessage(STAFF_CHAT_ID, `✅ Chat <code>${targetChatId}</code> marked resolved and returned to bot.`)
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
      }

      // /reply <chat_id> <message>
      if (rawText.startsWith('/reply')) {
        const match = rawText.match(/^\/reply\s+(\d+)\s+(.+)$/s)
        if (!match) {
          await sendMessage(STAFF_CHAT_ID, '⚠️ Usage: <code>/reply &lt;chat_id&gt; &lt;your message&gt;</code>')
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
        }

        const targetChatId = Number(match[1])
        const replyText = match[2]

        await updateSessionState(targetChatId, { state: 'agent_active' })
        await appendSessionMessage(targetChatId, 'agent', replyText)

        await sendChatAction(targetChatId, 'typing')
        await sleep(1000)
        await sendMessage(targetChatId, `👨‍💻 <b>Retro Hub Support Agent:</b>\n\n${escapeHtml(replyText)}`)

        await sendMessage(STAFF_CHAT_ID, `📤 <b>Sent to customer #${targetChatId}:</b>\n${escapeHtml(replyText)}`)
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
      }

      // Staff status overview
      if (rawText === '/status') {
        const { data: openTickets } = await supabase
          .from('customer_support_sessions')
          .select('*')
          .eq('state', 'escalated')
          .order('escalated_at', { ascending: false })

        const count = openTickets?.length || 0
        if (count === 0) {
          await sendMessage(STAFF_CHAT_ID, '🎉 <b>No open escalated tickets!</b> All customer chats are being handled smoothly by the bot.')
        } else {
          const list = openTickets
            .map((t: any) => `• <code>${t.chat_id}</code> (@${t.username || 'unknown'}) | Order: ${t.last_order_id || 'N/A'}`)
            .join('\n')
          await sendMessage(STAFF_CHAT_ID, `🚨 <b>${count} Open Support Escalation(s):</b>\n\n${list}\n\nUse <code>/reply &lt;chat_id&gt; &lt;message&gt;</code> to respond.`)
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
      }
    }

    // ─────────────────────────────────────────────────────────────
    // CUSTOMER FLOW
    // ─────────────────────────────────────────────────────────────
    const session = await getOrCreateSession(fromUser, chatId)
    await appendSessionMessage(chatId, 'customer', rawText)

    // Check if session is already escalated or in agent session
    if (session.state === 'escalated' || session.state === 'agent_active') {
      // Forward new customer message to staff chat so agent stays in sync
      const fwdText =
`📩 <b>New message from customer #${chatId}</b> ${fromUser.username ? `(@${escapeHtml(fromUser.username)})` : ''}:
"${escapeHtml(rawText)}"

Reply using: <code>/reply ${chatId} &lt;text&gt;</code>`
      await sendMessage(STAFF_CHAT_ID, fwdText)

      // Send subtle typing indicator acknowledging receipt without interrupting
      await sendChatAction(chatId, 'typing')
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // ─────────────────────────────────────────────────────────────
    // /start COMMAND & DEEP LINK HANDLING
    // e.g. /start order_c7c482a2 or /start issue_c7c482a2
    // ─────────────────────────────────────────────────────────────
    if (rawText.startsWith('/start')) {
      const parts = rawText.split(' ')
      const payload = parts[1] || ''

      if (payload.startsWith('order_') || payload.startsWith('issue_')) {
        const orderId = payload.replace(/^(order_|issue_)/, '')
        await updateSessionState(chatId, { last_order_id: orderId })

        await sendChatAction(chatId, 'typing')
        await sleep(1500)

        const order = await resolveOrder(orderId)
        if (order) {
          const greeting = payload.startsWith('issue_')
            ? `👋 Hi <b>${escapeHtml(fromUser.first_name || 'there')}</b>, I see you're reporting an issue with Order <code>#${order.id.slice(0, 8)}</code>. Let's get this resolved for you right away!`
            : `👋 Hi <b>${escapeHtml(fromUser.first_name || 'there')}</b>! Here is the latest update on your order:`

          await sendMessage(chatId, greeting)
          await sleep(1000)
          await sendChatAction(chatId, 'typing')
          await sleep(1200)

          const statusText = formatOrderStatus(order)
          await sendMessage(chatId, statusText, buildOrderKeyboard(order.id))
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
        }
      }

      // Generic Start Greeting
      await sendPacedMessage(
        chatId,
        `👋 <b>Welcome to Retro Hub Customer Care!</b>\n\nI'm your 24/7 automated concierge. I can instantly verify your order status, look up your game keys & credentials, or connect you directly with our support team.`,
        buildGeneralKeyboard(),
        [1200, 2000]
      )
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // ─────────────────────────────────────────────────────────────
    // ORDER LOOKUP VIA MESSAGE TEXT
    // Detect if user sent a UUID or 8-char hex order ID
    // ─────────────────────────────────────────────────────────────
    const orderMatch = rawText.match(/[0-9a-f]{8}(-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?/i)
    if (orderMatch) {
      await sendChatAction(chatId, 'typing')
      await sleep(1500)

      const order = await resolveOrder(orderMatch[0])
      if (order) {
        await updateSessionState(chatId, { last_order_id: order.id })
        await sendMessage(chatId, `🔍 Found your order!`)
        await sleep(800)
        await sendChatAction(chatId, 'typing')
        await sleep(1200)
        await sendMessage(chatId, formatOrderStatus(order), buildOrderKeyboard(order.id))
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
      }
    }

    // ─────────────────────────────────────────────────────────────
    // SENTIMENT & INTENT TRIAGE
    // ─────────────────────────────────────────────────────────────
    const { score, intent, isUrgent } = analyzeSentimentAndIntent(rawText)
    await updateSessionState(chatId, { sentiment_score: score })

    // High frustration or direct agent request: Proactive Empathy + Fast Track Handoff
    if (isUrgent) {
      // Chunk 1: Empathy bubble
      await sendChatAction(chatId, 'typing')
      await sleep(1600)
      await sendMessage(
        chatId,
        'I completely understand why this is stressful, and I want to make sure you are taken care of right away.'
      )

      // Chunk 2: Action bubble
      await sleep(1000)
      await sendChatAction(chatId, 'typing')
      await sleep(1400)
      await sendMessage(
        chatId,
        'I am prioritizing your request and pinging our staff right now. Can you confirm if you have an Order ID handy?',
        {
          inline_keyboard: [
            [{ text: '👤 Connect to Human Agent Now', callback_data: 'escalate_general' }],
            [{ text: '🔍 Look Up My Order', callback_data: 'prompt_order' }],
          ],
        }
      )
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // General FAQ or unrecognized query
    await sendChatAction(chatId, 'typing')
    await sleep(1800)
    await sendMessage(
      chatId,
      `Thanks for your message! To help you fastest, please select an option below, or send your <b>Order ID</b> if you have a question about a purchase:`,
      buildGeneralKeyboard()
    )

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
  } catch (err: any) {
    console.error('Customer bot webhook handler error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
