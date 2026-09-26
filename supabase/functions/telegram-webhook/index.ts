// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const TELEGRAM_WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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

async function sendMessage(chatId: string | number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
  if (!res.ok) {
    const errText = await res.text()
    console.error('Telegram API error:', errText)
  }
  return res
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
          // Escaping is applied by caller or plain text
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

        msg += `\n💡 <b>Deliver via Bot:</b>\n<code>/deliver ${safeOrder} CODE_HERE</code>\n\n` +
          `🔗 <a href="https://retrohub.tech/admin">Go to Admin Dashboard</a>`

        await sendMessage(ADMIN_CHAT_ID, msg)

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

        msg += `📦 <b>Orders (${orderList.length}):</b>\n`
        orderList.forEach((id: string, idx: number) => {
          const safeId = escapeHtml(id)
          msg += `${idx + 1}. <code>${safeId}</code>\n` +
                 `   👉 <code>/deliver ${safeId} CODE_HERE</code>\n`
        })

        msg += `\n🔗 <a href="https://retrohub.tech/admin">Review in Admin Dashboard</a>`

        await sendMessage(ADMIN_CHAT_ID, msg)

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
          .in('status', ['pending', 'payment_submitted', 'payment_verified'])
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
                              o.status === 'payment_verified' ? '✅ Payment Verified' : '⏳ Pending'
          const safeId = escapeHtml(o.id)
          const safeTitle = escapeHtml(o.products?.title || 'Unknown')
          const safeTotal = escapeHtml(o.total)
          const trx = o.customer_input?.transaction_id ? ` (Trx: <code>${escapeHtml(o.customer_input.transaction_id)}</code>)` : ''
          
          reminderMsg += `${idx + 1}. <b>${safeTitle}</b> - ৳${safeTotal} [${statusLabel}${trx}]\n` +
                         `   <code>/deliver ${safeId} CODE_HERE</code>\n\n`
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
    // -------------------------------------------------------------
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

    if (text === '/start' || text === '/help') {
      const helpMsg = `🤖 <b>Admin Notification Bot Commands</b>\n\n` +
        `/orders - View pending & unfulfilled orders\n` +
        `/deliver [order_id] [code] - Fulfill an order\n` +
        `/summary - View today's stats (revenue, orders, etc.)\n` +
        `/custom - View recent custom order requests\n` +
        `/remind - Trigger pending orders reminder immediately`
      await sendMessage(chatId, helpMsg)
    } 
    else if (text === '/summary') {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      
      const [revenueRes, ordersRes, pendingRes] = await Promise.all([
        supabase.rpc('get_daily_revenue', { start_date: startOfDay.toISOString() }),
        supabase.from('orders').select('id', { count: 'exact' }).gte('created_at', startOfDay.toISOString()),
        supabase.from('orders').select('id', { count: 'exact' }).in('status', ['pending', 'payment_submitted', 'payment_verified']),
      ])

      const revenue = escapeHtml(revenueRes.data || 0)
      const orders = escapeHtml(ordersRes.count || 0)
      const pending = escapeHtml(pendingRes.count || 0)

      const msg = `📊 <b>Daily Store Summary</b>\n\n` +
        `💰 <b>Revenue:</b> ৳${revenue}\n` +
        `📦 <b>Orders Today:</b> ${orders}\n` +
        `⏳ <b>Waiting Fulfillment:</b> ${pending}`
      await sendMessage(chatId, msg)
    }
    else if (text === '/orders' || text === '/remind') {
      const { data } = await supabase
        .from('orders')
        .select('id, total, status, created_at, customer_input, products(title)')
        .in('status', ['pending', 'payment_submitted', 'payment_verified'])
        .order('created_at', { ascending: false })
        .limit(10)

      if (!data || data.length === 0) {
        await sendMessage(chatId, '🎉 No pending orders right now!')
      } else {
        let msg = `📦 <b>Unfulfilled Orders (${data.length}):</b>\n\n`
        data.forEach((o: any, idx: number) => {
          const statusLabel = o.status === 'payment_submitted' ? '💳 Payment Submitted' :
                              o.status === 'payment_verified' ? '✅ Payment Verified' : '⏳ Pending'
          const safeId = escapeHtml(o.id)
          const safeTitle = escapeHtml(o.products?.title || 'Unknown')
          const safeTotal = escapeHtml(o.total)
          const trx = o.customer_input?.transaction_id ? `\n   Trx: <code>${escapeHtml(o.customer_input.transaction_id)}</code>` : ''
          
          msg += `${idx + 1}. <b>${safeTitle}</b> - ৳${safeTotal}\n` +
                 `   Status: ${statusLabel}${trx}\n` +
                 `   👉 <code>/deliver ${safeId} CODE_HERE</code>\n\n`
        })
        await sendMessage(chatId, msg)
      }
    }
    else if (text === '/custom') {
      const { data } = await supabase
        .from('custom_orders')
        .select('id, name, product_name, platform, status')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5)

      if (!data || data.length === 0) {
        await sendMessage(chatId, '🎉 No pending custom requests!')
      } else {
        let msg = `📝 <b>Latest 5 Custom Requests:</b>\n\n`
        data.forEach((req: any, idx: number) => {
          msg += `${idx + 1}. <b>${escapeHtml(req.product_name)}</b> (${escapeHtml(req.platform)})\n` +
                 `   From: ${escapeHtml(req.name)}\n\n`
        })
        await sendMessage(chatId, msg)
      }
    }
    else if (text.startsWith('/deliver ')) {
      const parts = text.substring(9).trim().split(' ')
      const orderId = parts[0]?.trim()
      const output = parts.slice(1).join(' ').trim()
      
      if (!orderId || !output) {
        await sendMessage(chatId, '⚠️ Usage: /deliver [order_id] [message/code]')
      } else {
        const { data, error } = await supabase
          .from('orders')
          .update({ 
            status: 'fulfilled', 
            final_output: output 
          })
          .eq('id', orderId)
          .select('id')
          
        if (error) {
          await sendMessage(chatId, `❌ Failed to fulfill order: ${escapeHtml(error.message)}`)
        } else if (!data || data.length === 0) {
          await sendMessage(chatId, `❌ Order not found: <code>${escapeHtml(orderId)}</code>`)
        } else {
          await sendMessage(chatId, `✅ Order <code>${escapeHtml(orderId)}</code> successfully fulfilled! The customer can now see the product code on their dashboard.`)
        }
      }
    }
    else {
      await sendMessage(chatId, '❓ Unknown command. Type /help to see available commands.')
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
