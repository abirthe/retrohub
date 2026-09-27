// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const ADMIN_CHAT_ID = String(Deno.env.get('TELEGRAM_CHAT_ID') || Deno.env.get('ADMIN_CHAT_ID') || '5605963234').trim()
const CUSTOMER_BOT_TOKEN = Deno.env.get('CUSTOMER_BOT_TOKEN') || '8615027766:AAEM1TEoLgdSa3kV0wgmcXOKh-Z7CAFrop8'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const TELEGRAM_WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function sendToCustomer(chatId: string | number, message: string) {
  if (!CUSTOMER_BOT_TOKEN) {
    console.error('CUSTOMER_BOT_TOKEN not configured')
    return false
  }
  const url = `https://api.telegram.org/bot${CUSTOMER_BOT_TOKEN}/sendMessage`
  const body = {
    chat_id: chatId,
    text: `👤 <b>RetroHub Support Specialist:</b>\n\n${escapeHtml(message)}\n\n<i>💬 Reply to this message anytime to continue chatting with support.</i>`,
    parse_mode: 'HTML',
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    console.error('Failed to send to customer via customer-bot:', await res.text())
    return false
  }
  return true
}

async function notifyCustomerResolved(chatId: string | number) {
  if (!CUSTOMER_BOT_TOKEN) return false
  const url = `https://api.telegram.org/bot${CUSTOMER_BOT_TOKEN}/sendMessage`
  const body = {
    chat_id: chatId,
    text: `✅ <b>Your support inquiry has been resolved by our specialist team.</b>\n\nThank you for choosing RetroHub! If you ever need assistance again, simply send a message and Retro Chan will be right here.`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📦 Track My Order', callback_data: 'prompt_order' },
          { text: '🛒 Visit Store', url: 'https://www.retrohub.tech' },
        ],
      ],
    },
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.ok
}

async function appendAgentSessionMessage(chatId: number, text: string) {
  try {
    const { data: session } = await supabase
      .from('customer_support_sessions')
      .select('recent_messages')
      .eq('chat_id', chatId)
      .maybeSingle()

    const history = (session?.recent_messages || []) as Array<{ sender: string; text: string; time: string }>
    history.push({
      sender: 'agent',
      text,
      time: new Date().toISOString(),
    })
    const trimmed = history.slice(-20)

    await supabase
      .from('customer_support_sessions')
      .update({
        state: 'agent_active',
        recent_messages: trimmed,
        updated_at: new Date().toISOString(),
      })
      .eq('chat_id', chatId)
  } catch (err) {
    console.error('appendAgentSessionMessage error:', err)
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token, x-internal-secret',
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

async function sendMessage(chatId: string | number, text: string, reply_markup?: any) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`
  const body: any = { chat_id: chatId, text, parse_mode: 'HTML' }
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
    console.error('Telegram API error:', errText)
  }
  return res
}

async function answerCallbackQuery(callbackQueryId: string, text: string = '', showAlert: boolean = false) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: showAlert }),
  })
}

/**
 * Intelligent Order Resolver:
 * Supports both full UUIDs (e.g. c7c482a2-aaa1-479e-b130-32c67ec02ac5)
 * and short ID prefixes (e.g. c7c482a2 or c7c4) for friction-free mobile operation.
 */
async function resolveOrder(identifier: string) {
  const clean = identifier.trim()
  if (!clean) return { error: '⚠️ Please provide an Order ID or short ID prefix.' }

  // 1. Direct match if it is a complete UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(clean)) {
    const { data: directMatch } = await supabase
      .from('orders')
      .select('id, total, status, created_at, customer_input, final_output, user_id, products(id, title, platform, category)')
      .eq('id', clean)
      .maybeSingle()
    if (directMatch) return { order: directMatch }
  }

  // 2. Prefix matching across the most recent 100 orders
  if (clean.length >= 4) {
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, total, status, created_at, customer_input, final_output, user_id, products(id, title, platform, category)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (recentOrders && recentOrders.length > 0) {
      const matches = recentOrders.filter((o: any) => o.id.toLowerCase().startsWith(clean.toLowerCase()))
      if (matches.length === 1) {
        return { order: matches[0] }
      }
      if (matches.length > 1) {
        return {
          error: `⚠️ Multiple recent orders match prefix "<code>${escapeHtml(clean)}</code>". Please provide more characters (e.g. <code>${matches[0].id.substring(0, 10)}</code>).`
        }
      }
    }
  }

  return { error: `❌ Order not found with identifier: <code>${escapeHtml(clean)}</code>` }
}

async function sendOrderInspection(chatId: string | number, orderIdentifier: string) {
  const { order, error: resolveError } = await resolveOrder(orderIdentifier)
  if (resolveError) {
    await sendMessage(chatId, resolveError)
    return
  }

  const safeTitle = escapeHtml(order.products?.title || 'Unknown Product')
  const safePlatform = escapeHtml(order.products?.platform || 'General')
  const safeCategory = escapeHtml(order.products?.category || 'Item')
  const safeTotal = escapeHtml(order.total)
  const shortId = order.id.substring(0, 8)
  const statusEmoji = order.status === 'fulfilled' ? '🎉 Fulfilled' :
                      order.status === 'payment_verified' ? '✅ Payment Verified' :
                      order.status === 'payment_submitted' ? '💳 Payment Submitted' :
                      order.status === 'sourcing' ? '🔄 Sourcing' :
                      order.status === 'cancelled' ? '🚫 Cancelled' :
                      order.status === 'refunded' ? '💸 Refunded' : '⏳ Pending'

  let card = `🔍 <b>Order Details:</b> <code>${shortId}</code>\n\n` +
    `📦 <b>Product:</b> ${safeTitle}\n` +
    `🎮 <b>Platform / Category:</b> ${safePlatform} (${safeCategory})\n` +
    `💰 <b>Price:</b> ৳${safeTotal}\n` +
    `📊 <b>Status:</b> ${statusEmoji}\n` +
    `🆔 <b>Full ID:</b> <code>${escapeHtml(order.id)}</code>\n` +
    `📅 <b>Created:</b> ${new Date(order.created_at).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })}\n`

  if (order.customer_input?.game_id || order.customer_input?.player_id) {
    const uid = order.customer_input.game_id || order.customer_input.player_id
    card += `🎯 <b>Player ID / UID:</b> <code>${escapeHtml(uid)}</code>\n`
  }
  if (order.customer_input?.server_id || order.customer_input?.zone_id) {
    const server = order.customer_input.server_id || order.customer_input.zone_id
    card += `🌐 <b>Server / Zone:</b> <code>${escapeHtml(server)}</code>\n`
  }
  if (order.customer_input?.transaction_id) {
    card += `🧾 <b>bKash TrxID:</b> <code>${escapeHtml(order.customer_input.transaction_id)}</code>\n`
  }
  if (order.customer_input?.contact_number) {
    card += `📱 <b>Contact:</b> <code>${escapeHtml(order.customer_input.contact_number)}</code>\n`
  }
  if (order.customer_input?.cancel_reason) {
    card += `📝 <b>Cancel Reason:</b> <i>${escapeHtml(order.customer_input.cancel_reason)}</i>\n`
  }
  if (order.final_output) {
    card += `🔑 <b>Delivered Output:</b> <code>${escapeHtml(order.final_output)}</code>\n`
  }

  card += `\n⚡ <b>Quick Shortcuts:</b>\n` +
    `• <code>/deliver ${shortId} CODE</code>\n` +
    `• <code>/verify ${shortId}</code>\n` +
    `• <code>/cancel ${shortId} Reason</code>`

  const reply_markup = {
    inline_keyboard: [
      [
        { text: '✅ Verify', callback_data: `verify:${shortId}` },
        { text: '❌ Cancel', callback_data: `cancel:${shortId}` }
      ]
    ]
  }

  await sendMessage(chatId, card, reply_markup)
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))

    // -------------------------------------------------------------
    // 1. Direct App Notifications (invoked from frontend or backend)
    // -------------------------------------------------------------
    if (body.action) {
      // Security Check: Verify caller is authorized via Supabase apikey, auth bearer, or internal secret
      const authHeader = req.headers.get('authorization') || ''
      const apikeyHeader = req.headers.get('apikey') || ''
      const internalHeader = req.headers.get('x-internal-secret') || ''

      const isAuthorized =
        (apikeyHeader && (apikeyHeader === SUPABASE_ANON_KEY || apikeyHeader === SUPABASE_SERVICE_ROLE_KEY)) ||
        (authHeader && (authHeader.includes(SUPABASE_ANON_KEY) || authHeader.includes(SUPABASE_SERVICE_ROLE_KEY) || authHeader.startsWith('Bearer '))) ||
        (TELEGRAM_WEBHOOK_SECRET && internalHeader === TELEGRAM_WEBHOOK_SECRET)

      if (!isAuthorized) {
        return new Response(JSON.stringify({ error: 'Unauthorized request' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (body.action === 'notify') {
        if (body.message) {
          await sendMessage(ADMIN_CHAT_ID, body.message)
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (body.action === 'order_created') {
        const { orderId, productName, total, userId, lowStock, remainingStock, gameId } = body
        const safeOrder = escapeHtml(orderId)
        const safeProduct = escapeHtml(productName || 'Unknown Product')
        const safeTotal = escapeHtml(total)
        const safeGameId = escapeHtml(gameId)
        const safeUser = escapeHtml(userId)
        const shortId = safeOrder.substring(0, 8)

        let msg = `🛍️ <b>New Order Created!</b>\n\n` +
          `📦 <b>Product:</b> ${safeProduct}\n` +
          `💰 <b>Total:</b> ৳${safeTotal}\n` +
          `🆔 <b>Order ID:</b> <code>${safeOrder}</code>\n`
        
        if (safeGameId) {
          msg += `🎮 <b>Game ID / Account:</b> <code>${safeGameId}</code>\n`
        }
        if (safeUser) {
          msg += `👤 <b>User ID:</b> <code>${safeUser}</code>\n`
        }

        msg += `\n⚡ <b>Fast Bot Actions:</b>\n` +
          `• Deliver: <code>/deliver ${shortId} CODE</code>\n` +
          `• Inspect: <code>/order ${shortId}</code>\n` +
          `• Cancel:  <code>/cancel ${shortId} Out of stock</code>\n\n` +
          `🔗 <a href="https://retrohub.tech/admin">Go to Admin Dashboard</a>`

        const reply_markup = {
          inline_keyboard: [
            [
              { text: '❌ Cancel Order', callback_data: `cancel:${shortId}` },
              { text: '🔍 Inspect', callback_data: `order:${shortId}` }
            ]
          ]
        }

        await sendMessage(ADMIN_CHAT_ID, msg, reply_markup)

        if (lowStock && remainingStock !== undefined) {
          const stockMsg = `⚠️ <b>LOW STOCK ALERT!</b>\n\n` +
            `📦 <b>Product:</b> ${safeProduct}\n` +
            `📉 <b>Remaining Stock:</b> ${escapeHtml(remainingStock)}\n\n` +
            `<i>Please restock this product soon!</i>`
          await sendMessage(ADMIN_CHAT_ID, stockMsg)
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (body.action === 'payment_submitted') {
        const { orderIds, transactionId, total } = body
        const orderList = Array.isArray(orderIds) ? orderIds : [orderIds]
        const safeTrx = escapeHtml(transactionId)

        let duplicateWarning = ''
        try {
          const { data: duplicateOrders } = await supabase
            .from('orders')
            .select('id, status, created_at')
            .not('id', 'in', `(${orderList.join(',')})`)
            .contains('customer_input', { transaction_id: transactionId })
            .limit(2)

          if (duplicateOrders && duplicateOrders.length > 0) {
            duplicateWarning = `🚨 <b>FRAUD WARNING: DUPLICATE TRANSACTION ID!</b>\n` +
              `This TrxID was already used on order <code>${escapeHtml(duplicateOrders[0].id)}</code> (${escapeHtml(duplicateOrders[0].status)})!\n\n`
          }
        } catch (_) {}

        let msg = `💳 <b>Payment Submitted by Customer!</b>\n\n` +
          duplicateWarning +
          `🧾 <b>Transaction ID:</b> <code>${safeTrx}</code>\n`
        
        if (total) {
          msg += `💰 <b>Total Amount:</b> ৳${escapeHtml(total)}\n`
        }

        msg += `\n📦 <b>Orders (${orderList.length}):</b>\n`
        orderList.forEach((id: string, idx: number) => {
          const safeId = escapeHtml(id)
          const shortId = safeId.substring(0, 8)
          msg += `${idx + 1}. <code>${safeId}</code>\n` +
                 `   ✅ Verify:  <code>/verify ${shortId}</code>\n` +
                 `   🚀 Deliver: <code>/deliver ${shortId} CODE</code>\n` +
                 `   ❌ Cancel:  <code>/cancel ${shortId} Invalid Trx</code>\n\n`
        })

        msg += `🔗 <a href="https://retrohub.tech/admin">Review in Admin Dashboard</a>`

        const inline_keyboard = orderList.map((id: string) => {
          const shortId = id.substring(0, 8)
          return [
            { text: `✅ Verify ${shortId}`, callback_data: `verify:${shortId}` },
            { text: `❌ Cancel ${shortId}`, callback_data: `cancel:${shortId}` }
          ]
        })

        await sendMessage(ADMIN_CHAT_ID, msg, { inline_keyboard })

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (body.action === 'custom_order') {
        const { name, email, productName, platform, details } = body
        const msg = `📝 <b>New Custom Order Request!</b>\n\n` +
          `👤 <b>Name:</b> ${escapeHtml(name)}\n` +
          `📧 <b>Email:</b> ${escapeHtml(email)}\n` +
          `📦 <b>Product:</b> ${escapeHtml(productName)}\n` +
          `💻 <b>Platform:</b> ${escapeHtml(platform)}\n` +
          `📋 <b>Details:</b> ${escapeHtml(details || 'None')}\n\n` +
          `🔗 <a href="https://retrohub.tech/admin">Go to Admin Dashboard</a>`

        await sendMessage(ADMIN_CHAT_ID, msg)

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (body.action === 'check_pending') {
        const { data: pendingOrders } = await supabase
          .from('orders')
          .select('id, total, status, created_at, customer_input, products(title)')
          .in('status', ['pending', 'payment_submitted', 'payment_verified', 'sourcing'])
          .order('created_at', { ascending: false })
          .limit(10)

        if (!pendingOrders || pendingOrders.length === 0) {
          return new Response(JSON.stringify({ success: true, count: 0 }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        let reminderMsg = `⏰ <b>Pending Orders Reminder!</b>\n\n` +
          `You have <b>${pendingOrders.length}</b> orders waiting for fulfillment:\n\n`

        pendingOrders.forEach((o: any, idx: number) => {
          const statusLabel = o.status === 'payment_submitted' ? '💳 Payment Submitted' :
                              o.status === 'payment_verified' ? '✅ Payment Verified' :
                              o.status === 'sourcing' ? '🔄 Sourcing' : '⏳ Pending'
          const safeId = escapeHtml(o.id)
          const shortId = safeId.substring(0, 8)
          const safeTitle = escapeHtml(o.products?.title || 'Unknown')
          const safeTotal = escapeHtml(o.total)
          const trx = o.customer_input?.transaction_id ? ` (Trx: <code>${escapeHtml(o.customer_input.transaction_id)}</code>)` : ''
          
          reminderMsg += `${idx + 1}. <b>${safeTitle}</b> - ৳${safeTotal} [${statusLabel}${trx}]\n` +
                         `   👉 <code>/deliver ${shortId} CODE</code> | <code>/cancel ${shortId}</code>\n\n`
        })

        await sendMessage(ADMIN_CHAT_ID, reminderMsg)

        return new Response(JSON.stringify({ success: true, count: pendingOrders.length }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // -------------------------------------------------------------
    // 2. Telegram Webhook Updates (commands from Telegram chat)
    if (body.callback_query) {
      const cq = body.callback_query
      const chatId = cq.message?.chat?.id
      if (chatId?.toString() !== ADMIN_CHAT_ID) {
        await answerCallbackQuery(cq.id, 'Unauthorized', true)
        return new Response('OK', { status: 200, headers: corsHeaders })
      }
      
      const [action, ...args] = (cq.data || '').split(':')
      const orderIdentifier = args[0]
      
      if (action === 'cancel' && orderIdentifier) {
        const { order, error: resolveError } = await resolveOrder(orderIdentifier)
        if (resolveError) {
          await answerCallbackQuery(cq.id, 'Order not found', true)
        } else if (order.status === 'cancelled' || order.status === 'fulfilled') {
          await answerCallbackQuery(cq.id, 'Order already ' + order.status, true)
        } else {
          const cancelReason = 'Cancelled via inline button'
          const updatedInput = {
            ...(order.customer_input || {}),
            cancel_reason: cancelReason,
            cancelled_at: new Date().toISOString(),
          }

          const { error } = await supabase
            .from('orders')
            .update({
              status: 'cancelled',
              customer_input: updatedInput,
              final_output: `Cancelled: ${cancelReason}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id)

          if (!error) {
            try {
              await supabase.from('inventory_keys').update({ status: 'available', order_id: null, sold_at: null }).eq('order_id', order.id)
              await supabase.from('admin_action_logs').insert({ order_id: order.id, action: 'cancel_order', before_status: order.status, after_status: 'cancelled', notes: cancelReason })
            } catch (_) {}
            await sendMessage(chatId, `🚫 <b>Order Cancelled!</b>\nOrder <code>${order.id.substring(0,8)}</code> cancelled.`)
            await answerCallbackQuery(cq.id, 'Order Cancelled')
          } else {
            await answerCallbackQuery(cq.id, 'Failed to cancel', true)
          }
        }
      } else if (action === 'verify' && orderIdentifier) {
        const { order, error: resolveError } = await resolveOrder(orderIdentifier)
        if (resolveError) {
          await answerCallbackQuery(cq.id, 'Order not found', true)
        } else if (order.status === 'payment_verified' || order.status === 'fulfilled') {
          await answerCallbackQuery(cq.id, 'Order already ' + order.status, true)
        } else {
          const { error } = await supabase.from('orders').update({ status: 'payment_verified', updated_at: new Date().toISOString() }).eq('id', order.id)
          if (!error) {
            await sendMessage(chatId, `✅ <b>Payment Verified!</b>\nOrder <code>${order.id.substring(0,8)}</code> verified.`)
            await answerCallbackQuery(cq.id, 'Payment Verified')
          } else {
            await answerCallbackQuery(cq.id, 'Failed to verify', true)
          }
        }
      } else if ((action === 'order' || action === 'inspect') && orderIdentifier) {
        await answerCallbackQuery(cq.id, '🔍 Inspecting order...')
        await sendOrderInspection(chatId, orderIdentifier)
      } else if (action === 'support_reply' && orderIdentifier) {
        await answerCallbackQuery(cq.id, 'Tap command to copy')
        await sendMessage(
          chatId,
          `💬 <b>Reply to Customer #<code>${orderIdentifier}</code>:</b>\n\n` +
          `Copy and send:\n` +
          `<code>/reply ${orderIdentifier} Hello, I am here to help you!</code>`
        )
      } else if (action === 'support_resolve' && orderIdentifier) {
        const targetChatId = Number(orderIdentifier)
        const { error } = await supabase
          .from('customer_support_sessions')
          .update({
            state: 'bot_active',
            resolved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('chat_id', targetChatId)

        if (!error) {
          await notifyCustomerResolved(targetChatId)
          await answerCallbackQuery(cq.id, 'Ticket resolved!')
          await sendMessage(
            chatId,
            `✅ <b>Ticket for Chat #<code>${targetChatId}</code> marked resolved</b> and customer returned to Retro Chan AI bot.`
          )
        } else {
          await answerCallbackQuery(cq.id, 'Failed to resolve ticket', true)
        }
      } else {
        await answerCallbackQuery(cq.id)
      }
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    if (!body.message || !body.message.text) {
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    // SECURITY CHECK: Verify Telegram Webhook Secret Token header
    if (TELEGRAM_WEBHOOK_SECRET) {
      const secretHeader = req.headers.get('x-telegram-bot-api-secret-token')
      if (secretHeader !== TELEGRAM_WEBHOOK_SECRET) {
        console.warn('Unauthorized webhook request rejected: missing or invalid secret token.')
        return new Response('Unauthorized', { status: 401, headers: corsHeaders })
      }
    }

    const chatId = body.message.chat.id
    const text = body.message.text.trim()

    // Authorization check: only admin chat ID can issue commands
    if (chatId.toString() !== ADMIN_CHAT_ID) {
      await sendMessage(chatId, '⛔ Unauthorized access. This bot is private.')
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    // -------------------------------------------------------------
    // Command Router
    // -------------------------------------------------------------
    if (text === '/start' || text === '/help') {
      const helpMsg = `🤖 <b>RetroHub Merchant Command Center</b>\n\n` +
        `📦 <b>Order Management:</b>\n` +
        `• <code>/orders</code> - View pending & unfulfilled orders\n` +
        `• <code>/order [id]</code> - Inspect full order details\n` +
        `• <code>/verify [id]</code> - Confirm customer payment\n` +
        `• <code>/deliver [id] [code]</code> - Deliver digital key/credentials\n` +
        `• <code>/cancel [id] [reason]</code> - Cancel order & release stock\n` +
        `• <code>/hold [id] [reason]</code> - Place order on hold\n` +
        `• <code>/refund [id] [reason]</code> - Mark order as refunded\n\n` +
        `🎧 <b>Live Customer Support (@retrochanbot):</b>\n` +
        `• <code>/tickets</code> - View open customer support requests\n` +
        `• <code>/reply [chat_id] [text]</code> - Reply directly to customer\n` +
        `• <code>/resolve [chat_id]</code> - Resolve ticket & return to AI bot\n\n` +
        `📊 <b>Store & Inventory:</b>\n` +
        `• <code>/summary</code> - Today's financial metrics & revenue\n` +
        `• <code>/stock [search]</code> - Check stock or view low inventory\n` +
        `• <code>/custom</code> - View pending custom quote requests\n` +
        `• <code>/remind</code> - Trigger instant pending orders scan\n\n` +
        `💡 <i>Tip: You can use short IDs (first 6-8 characters) instead of typing full UUIDs!</i>`
      await sendMessage(chatId, helpMsg)
    } 
    else if (text === '/summary') {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const startIso = startOfDay.toISOString()

      const [ordersTodayRes, waitingRes, completedOrdersRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact' }).gte('created_at', startIso),
        supabase.from('orders').select('id', { count: 'exact' }).in('status', ['pending', 'payment_submitted', 'payment_verified', 'sourcing']),
        supabase.from('orders').select('total, cost').gte('created_at', startIso).in('status', ['fulfilled', 'completed']),
      ])

      const ordersCount = ordersTodayRes.count || 0
      const pendingCount = waitingRes.count || 0

      let totalRevenue = 0
      let totalCost = 0
      if (completedOrdersRes.data && completedOrdersRes.data.length > 0) {
        completedOrdersRes.data.forEach((o: any) => {
          totalRevenue += Number(o.total || 0)
          totalCost += Number(o.cost || 0)
        })
      }
      const netProfit = totalRevenue - totalCost

      const msg = `📊 <b>Daily Store Summary</b>\n\n` +
        `💰 <b>Revenue Today:</b> ৳${escapeHtml(totalRevenue.toFixed(2))}\n` +
        `📈 <b>Net Profit:</b> ৳${escapeHtml(netProfit.toFixed(2))}\n` +
        `📦 <b>Orders Today:</b> ${escapeHtml(ordersCount)}\n` +
        `⏳ <b>Waiting Fulfillment:</b> ${escapeHtml(pendingCount)}\n\n` +
        `<i>Fulfilled: ${completedOrdersRes.data?.length || 0} orders</i>`
      await sendMessage(chatId, msg)
    }
    else if (text === '/orders' || text === '/remind') {
      const { data } = await supabase
        .from('orders')
        .select('id, total, status, created_at, customer_input, products(title)')
        .in('status', ['pending', 'payment_submitted', 'payment_verified', 'sourcing'])
        .order('created_at', { ascending: false })
        .limit(10)

      if (!data || data.length === 0) {
        await sendMessage(chatId, '🎉 <b>All caught up!</b> No pending or unfulfilled orders right now.')
      } else {
        let msg = `📦 <b>Unfulfilled Orders (${data.length}):</b>\n\n`
        data.forEach((o: any, idx: number) => {
          const statusLabel = o.status === 'payment_submitted' ? '💳 Payment Submitted' :
                              o.status === 'payment_verified' ? '✅ Payment Verified' :
                              o.status === 'sourcing' ? '🔄 Sourcing' : '⏳ Pending'
          const safeId = escapeHtml(o.id)
          const shortId = safeId.substring(0, 8)
          const safeTitle = escapeHtml(o.products?.title || 'Unknown Product')
          const safeTotal = escapeHtml(o.total)
          const trx = o.customer_input?.transaction_id ? ` (Trx: <code>${escapeHtml(o.customer_input.transaction_id)}</code>)` : ''
          const gameId = o.customer_input?.game_id || o.customer_input?.player_id
          const gameIdStr = gameId ? `\n   🎮 UID: <code>${escapeHtml(gameId)}</code>` : ''
          
          msg += `${idx + 1}. <b>${safeTitle}</b> - ৳${safeTotal}\n` +
                 `   Status: ${statusLabel}${trx}${gameIdStr}\n` +
                 `   👉 <code>/verify ${shortId}</code>\n` +
                 `   👉 <code>/deliver ${shortId} CODE</code>\n` +
                 `   👉 <code>/cancel ${shortId} Reason</code>\n\n`
        })
        await sendMessage(chatId, msg)
      }
    }
    else if (text.startsWith('/order') || text.startsWith('/inspect')) {
      const orderIdentifier = text.replace(/^\/(order|inspect)/, '').trim()
      if (!orderIdentifier) {
        await sendMessage(chatId, '⚠️ <b>Usage:</b> <code>/order [order_id]</code> or <code>/inspect [order_id]</code>\n<i>Example:</i> <code>/order c7c482a2</code>')
      } else {
        await sendOrderInspection(chatId, orderIdentifier)
      }
    }
    else if (text.startsWith('/verify')) {
      const parts = text.substring(7).trim().split(' ')
      const orderIdentifier = parts[0]?.trim()

      if (!orderIdentifier) {
        await sendMessage(chatId, '⚠️ <b>Usage:</b> <code>/verify [order_id]</code>\n<i>Example:</i> <code>/verify c7c482a2</code>')
      } else {
        const { order, error: resolveError } = await resolveOrder(orderIdentifier)
        if (resolveError) {
          await sendMessage(chatId, resolveError)
        } else if (order.status === 'payment_verified') {
          await sendMessage(chatId, `ℹ️ Order <code>${escapeHtml(order.id)}</code> is already marked as Payment Verified.`)
        } else if (order.status === 'fulfilled') {
          await sendMessage(chatId, `ℹ️ Order <code>${escapeHtml(order.id)}</code> is already fulfilled!`)
        } else {
          const { error } = await supabase
            .from('orders')
            .update({
              status: 'payment_verified',
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id)

          if (error) {
            await sendMessage(chatId, `❌ Failed to verify payment: ${escapeHtml(error.message)}`)
          } else {
            try {
              await supabase.from('admin_action_logs').insert({
                order_id: order.id,
                action: 'verify_payment',
                before_status: order.status,
                after_status: 'payment_verified',
                notes: 'Verified via Telegram Bot',
              })
            } catch (_) {}

            const safeTitle = escapeHtml(order.products?.title || 'Unknown Product')
            const shortId = order.id.substring(0, 8)
            const msg = `✅ <b>Payment Verified!</b>\n\n` +
              `📦 <b>Product:</b> ${safeTitle}\n` +
              `💰 <b>Amount:</b> ৳${escapeHtml(order.total)}\n` +
              `🆔 <b>Order ID:</b> <code>${escapeHtml(order.id)}</code>\n\n` +
              `⚡ <b>Next Steps:</b>\n` +
              `• Fulfill: <code>/deliver ${shortId} CODE_HERE</code>\n` +
              `• Cancel:  <code>/cancel ${shortId} Reason</code>`
            await sendMessage(chatId, msg)
          }
        }
      }
    }
    else if (text.startsWith('/cancel')) {
      const parts = text.substring(7).trim().split(' ')
      const orderIdentifier = parts[0]?.trim()
      const reason = parts.slice(1).join(' ').trim()

      if (!orderIdentifier) {
        await sendMessage(chatId, '⚠️ <b>Usage:</b> <code>/cancel [order_id] [optional reason]</code>\n<i>Example:</i> <code>/cancel c7c482a2 Fake TrxID</code>')
      } else {
        const { order, error: resolveError } = await resolveOrder(orderIdentifier)
        if (resolveError) {
          await sendMessage(chatId, resolveError)
        } else if (order.status === 'cancelled') {
          await sendMessage(chatId, `⚠️ Order <code>${escapeHtml(order.id)}</code> is already cancelled!`)
        } else if (order.status === 'fulfilled') {
          await sendMessage(chatId, `⚠️ Order <code>${escapeHtml(order.id)}</code> is already fulfilled. Use <code>/refund ${order.id.substring(0, 8)}</code> instead.`)
        } else {
          const cancelReason = reason || 'Cancelled by admin via Telegram Bot'
          const updatedInput = {
            ...(order.customer_input || {}),
            cancel_reason: cancelReason,
            cancelled_at: new Date().toISOString(),
          }

          const { error } = await supabase
            .from('orders')
            .update({
              status: 'cancelled',
              customer_input: updatedInput,
              final_output: `Cancelled: ${cancelReason}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id)

          if (error) {
            await sendMessage(chatId, `❌ Failed to cancel order: ${escapeHtml(error.message)}`)
          } else {
            // Release any reserved inventory keys back to available
            try {
              await supabase
                .from('inventory_keys')
                .update({ status: 'available', order_id: null, sold_at: null })
                .eq('order_id', order.id)
            } catch (_) {}

            // Record action in admin_action_logs
            try {
              await supabase.from('admin_action_logs').insert({
                order_id: order.id,
                action: 'cancel_order',
                before_status: order.status,
                after_status: 'cancelled',
                notes: cancelReason,
              })
            } catch (_) {}

            const safeTitle = escapeHtml(order.products?.title || 'Unknown Product')
            const msg = `🚫 <b>Order Cancelled Successfully</b>\n\n` +
              `📦 <b>Product:</b> ${safeTitle}\n` +
              `💰 <b>Amount:</b> ৳${escapeHtml(order.total)}\n` +
              `🆔 <b>Order ID:</b> <code>${escapeHtml(order.id)}</code>\n` +
              `📝 <b>Reason:</b> ${escapeHtml(cancelReason)}\n\n` +
              `<i>Any reserved stock or inventory keys have been released back to catalog.</i>`
            await sendMessage(chatId, msg)
          }
        }
      }
    }
    else if (text.startsWith('/hold')) {
      const parts = text.substring(5).trim().split(' ')
      const orderIdentifier = parts[0]?.trim()
      const reason = parts.slice(1).join(' ').trim()

      if (!orderIdentifier) {
        await sendMessage(chatId, '⚠️ <b>Usage:</b> <code>/hold [order_id] [reason]</code>\n<i>Example:</i> <code>/hold c7c482a2 Invalid Server ID</code>')
      } else {
        const { order, error: resolveError } = await resolveOrder(orderIdentifier)
        if (resolveError) {
          await sendMessage(chatId, resolveError)
        } else {
          const holdReason = reason || 'Order placed on hold for verification'
          const updatedInput = {
            ...(order.customer_input || {}),
            hold_reason: holdReason,
            held_at: new Date().toISOString(),
          }

          const { error } = await supabase
            .from('orders')
            .update({
              status: 'pending',
              customer_input: updatedInput,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id)

          if (error) {
            await sendMessage(chatId, `❌ Failed to place hold: ${escapeHtml(error.message)}`)
          } else {
            try {
              await supabase.from('admin_action_logs').insert({
                order_id: order.id,
                action: 'hold_order',
                before_status: order.status,
                after_status: 'pending',
                notes: holdReason,
              })
            } catch (_) {}

            const safeTitle = escapeHtml(order.products?.title || 'Unknown Product')
            const msg = `⏸️ <b>Order Placed on Hold</b>\n\n` +
              `📦 <b>Product:</b> ${safeTitle}\n` +
              `🆔 <b>Order ID:</b> <code>${escapeHtml(order.id)}</code>\n` +
              `⚠️ <b>Reason:</b> ${escapeHtml(holdReason)}`
            await sendMessage(chatId, msg)
          }
        }
      }
    }
    else if (text.startsWith('/refund')) {
      const parts = text.substring(7).trim().split(' ')
      const orderIdentifier = parts[0]?.trim()
      const reason = parts.slice(1).join(' ').trim()

      if (!orderIdentifier) {
        await sendMessage(chatId, '⚠️ <b>Usage:</b> <code>/refund [order_id] [reason]</code>\n<i>Example:</i> <code>/refund c7c482a2 Customer requested refund</code>')
      } else {
        const { order, error: resolveError } = await resolveOrder(orderIdentifier)
        if (resolveError) {
          await sendMessage(chatId, resolveError)
        } else {
          const refundReason = reason || 'Refunded by admin via Telegram Bot'
          const updatedInput = {
            ...(order.customer_input || {}),
            refund_reason: refundReason,
            refunded_at: new Date().toISOString(),
          }

          const { error } = await supabase
            .from('orders')
            .update({
              status: 'refunded',
              customer_input: updatedInput,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id)

          if (error) {
            await sendMessage(chatId, `❌ Failed to refund order: ${escapeHtml(error.message)}`)
          } else {
            try {
              await supabase.from('admin_action_logs').insert({
                order_id: order.id,
                action: 'refund_order',
                before_status: order.status,
                after_status: 'refunded',
                notes: refundReason,
              })
            } catch (_) {}

            const safeTitle = escapeHtml(order.products?.title || 'Unknown Product')
            const msg = `💸 <b>Order Refunded</b>\n\n` +
              `📦 <b>Product:</b> ${safeTitle}\n` +
              `💰 <b>Amount:</b> ৳${escapeHtml(order.total)}\n` +
              `🆔 <b>Order ID:</b> <code>${escapeHtml(order.id)}</code>\n` +
              `📝 <b>Reason:</b> ${escapeHtml(refundReason)}`
            await sendMessage(chatId, msg)
          }
        }
      }
    }
    else if (text.startsWith('/deliver')) {
      const parts = text.substring(8).trim().split(' ')
      const orderIdentifier = parts[0]?.trim()
      const output = parts.slice(1).join(' ').trim()
      
      if (!orderIdentifier || !output) {
        await sendMessage(chatId, '⚠️ <b>Usage:</b> <code>/deliver [order_id] [code/credentials]</code>\n<i>Example:</i> <code>/deliver c7c482a2 RA-9842-8821</code>')
      } else {
        const { order, error: resolveError } = await resolveOrder(orderIdentifier)
        if (resolveError) {
          await sendMessage(chatId, resolveError)
        } else {
          const { error } = await supabase
            .from('orders')
            .update({ 
              status: 'fulfilled', 
              final_output: output,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id)
            
          if (error) {
            await sendMessage(chatId, `❌ Failed to fulfill order: ${escapeHtml(error.message)}`)
          } else {
            try {
              await supabase.from('admin_action_logs').insert({
                order_id: order.id,
                action: 'fulfill_order',
                before_status: order.status,
                after_status: 'fulfilled',
                notes: `Fulfilled via Telegram Bot: ${output.substring(0, 30)}...`,
              })
            } catch (_) {}

            const safeTitle = escapeHtml(order.products?.title || 'Product')
            const shortId = order.id.substring(0, 8)
            const msg = `🎉 <b>Order Fulfilled Successfully!</b>\n\n` +
              `📦 <b>Product:</b> ${safeTitle}\n` +
              `💰 <b>Amount:</b> ৳${escapeHtml(order.total)}\n` +
              `🆔 <b>Order ID:</b> <code>${escapeHtml(order.id)}</code>\n` +
              `🔑 <b>Delivered Code:</b> <code>${escapeHtml(output)}</code>\n\n` +
              `<i>The customer can now see this code immediately on their dashboard.</i>`
            await sendMessage(chatId, msg)
          }
        }
      }
    }
    else if (text.startsWith('/stock')) {
      const searchQuery = text.substring(6).trim()
      if (searchQuery) {
        const { data: searchResults } = await supabase
          .from('products')
          .select('id, title, platform, in_stock, sale_price, is_active')
          .ilike('title', `%${searchQuery}%`)
          .limit(8)

        if (!searchResults || searchResults.length === 0) {
          await sendMessage(chatId, `🔍 No products matching "<code>${escapeHtml(searchQuery)}</code>".`)
        } else {
          let stockMsg = `🔍 <b>Search Results for "${escapeHtml(searchQuery)}":</b>\n\n`
          searchResults.forEach((p: any, idx: number) => {
            const stockBadge = p.in_stock <= 0 ? '❌ Out of Stock' :
                               p.in_stock <= 3 ? `⚠️ Low (${p.in_stock})` : `✅ Stock: ${p.in_stock}`
            stockMsg += `${idx + 1}. <b>${escapeHtml(p.title)}</b> (${escapeHtml(p.platform || 'General')})\n` +
                        `   ৳${escapeHtml(p.sale_price)} | ${stockBadge}\n\n`
          })
          await sendMessage(chatId, stockMsg)
        }
      } else {
        const { data: lowStock } = await supabase
          .from('products')
          .select('id, title, platform, in_stock, sale_price')
          .eq('is_active', true)
          .lte('in_stock', 5)
          .order('in_stock', { ascending: true })
          .limit(10)

        if (!lowStock || lowStock.length === 0) {
          await sendMessage(chatId, '✅ <b>Inventory Healthy!</b> No active products are currently low in stock (≤ 5).')
        } else {
          let stockMsg = `⚠️ <b>Low Stock Inventory Alert (${lowStock.length} items):</b>\n\n`
          lowStock.forEach((p: any, idx: number) => {
            const badge = p.in_stock <= 0 ? '❌ Out of Stock' : `⚠️ Only ${p.in_stock} left`
            stockMsg += `${idx + 1}. <b>${escapeHtml(p.title)}</b> (${escapeHtml(p.platform || 'General')})\n` +
                        `   ${badge} | ৳${escapeHtml(p.sale_price)}\n\n`
          })
          stockMsg += `<i>Tip: Type <code>/stock &lt;name&gt;</code> to check any specific product.</i>`
          await sendMessage(chatId, stockMsg)
        }
      }
    }
    else if (text === '/custom') {
      const { data } = await supabase
        .from('custom_orders')
        .select('id, name, product_name, platform, status, details, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5)

      if (!data || data.length === 0) {
        await sendMessage(chatId, '🎉 No pending custom requests right now!')
      } else {
        let msg = `📝 <b>Pending Custom Requests (${data.length}):</b>\n\n`
        data.forEach((req: any, idx: number) => {
          msg += `${idx + 1}. <b>${escapeHtml(req.product_name)}</b> (${escapeHtml(req.platform)})\n` +
                 `   From: ${escapeHtml(req.name)}\n`
          if (req.details) {
            msg += `   Details: <i>${escapeHtml(req.details)}</i>\n`
          }
          msg += '\n'
        })
        await sendMessage(chatId, msg)
      }
    }
    else if (text.startsWith('/reply')) {
      const trimmed = text.substring(6).trim()
      const firstSpace = trimmed.indexOf(' ')
      if (firstSpace === -1) {
        await sendMessage(chatId, '⚠️ <b>Usage:</b> <code>/reply &lt;chat_id&gt; &lt;your message&gt;</code>\n\nExample:\n<code>/reply 123456789 Hello! We have verified your transaction.</code>')
      } else {
        const targetChatId = Number(trimmed.substring(0, firstSpace).trim())
        const replyContent = trimmed.substring(firstSpace + 1).trim()

        if (isNaN(targetChatId) || !replyContent) {
          await sendMessage(chatId, '❌ Invalid Chat ID or empty reply message.')
        } else {
          const sent = await sendToCustomer(targetChatId, replyContent)
          if (sent) {
            await appendAgentSessionMessage(targetChatId, replyContent)
            await sendMessage(
              chatId,
              `✅ <b>Reply delivered to customer</b> (Chat #<code>${targetChatId}</code>):\n\n` +
              `<i>"${escapeHtml(replyContent)}"</i>\n\n` +
              `Session marked <code>agent_active</code>. Use <code>/resolve ${targetChatId}</code> when finished.`
            )
          } else {
            await sendMessage(chatId, `❌ Failed to deliver message to customer #<code>${targetChatId}</code>. Ensure the customer has started @retrochanbot.`)
          }
        }
      }
    }
    else if (text.startsWith('/resolve')) {
      const targetChatIdStr = text.substring(8).trim()
      const targetChatId = Number(targetChatIdStr)
      if (!targetChatIdStr || isNaN(targetChatId)) {
        await sendMessage(chatId, '⚠️ <b>Usage:</b> <code>/resolve &lt;chat_id&gt;</code>')
      } else {
        const { error } = await supabase
          .from('customer_support_sessions')
          .update({
            state: 'bot_active',
            resolved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('chat_id', targetChatId)

        if (error) {
          await sendMessage(chatId, `❌ Error resolving session: ${escapeHtml(error.message)}`)
        } else {
          await notifyCustomerResolved(targetChatId)
          await sendMessage(
            chatId,
            `✅ <b>Ticket for Chat #<code>${targetChatId}</code> marked resolved!</b>\nCustomer notified and returned to Retro Chan AI bot.`
          )
        }
      }
    }
    else if (text === '/tickets' || text === '/support') {
      const { data: tickets, error } = await supabase
        .from('customer_support_sessions')
        .select('chat_id, username, first_name, state, last_order_id, escalated_at, updated_at, recent_messages')
        .in('state', ['escalated', 'agent_active'])
        .order('updated_at', { ascending: false })
        .limit(10)

      if (error) {
        await sendMessage(chatId, `❌ Failed to fetch support tickets: ${escapeHtml(error.message)}`)
      } else if (!tickets || tickets.length === 0) {
        await sendMessage(chatId, '🎉 <b>No open support tickets!</b> All customer chats are being handled smoothly by Retro Chan AI.')
      } else {
        let msg = `🎧 <b>Active Customer Support Tickets (${tickets.length}):</b>\n━━━━━━━━━━━━━━━━━━\n\n`
        tickets.forEach((t: any, idx: number) => {
          const stateBadge = t.state === 'agent_active' ? '🟢 Agent Active' : '🔴 Escalated (Waiting)'
          const lastMsg = (t.recent_messages || []).slice(-1)[0]?.text || 'No messages'
          const snippet = lastMsg.length > 50 ? lastMsg.substring(0, 47) + '...' : lastMsg
          msg += `${idx + 1}. <b>${escapeHtml(t.first_name || 'Customer')}</b> ${t.username ? `(@${escapeHtml(t.username)})` : ''}\n` +
                 `   🆔 Chat: <code>${t.chat_id}</code> | ${stateBadge}\n` +
                 `   📦 Order: ${t.last_order_id ? `<code>${t.last_order_id.substring(0, 8)}</code>` : 'None'}\n` +
                 `   💬 <i>"${escapeHtml(snippet)}"</i>\n` +
                 `   👉 Reply: <code>/reply ${t.chat_id} &lt;msg&gt;</code>\n\n`
        })
        await sendMessage(chatId, msg)
      }
    }
    else {
      await sendMessage(chatId, '❓ Unknown command. Type <code>/help</code> to see all available commands.')
    }

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (err: any) {
    console.error('Error handling webhook:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
