// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const body = await req.json()

    // -------------------------------------------------------------
    // 1. Direct App Notifications (invoked from frontend or backend)
    // -------------------------------------------------------------
    if (body.action) {
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
        let msg = `🛍️ <b>New Order Created!</b>\n\n` +
          `📦 <b>Product:</b> ${productName || 'Unknown Product'}\n` +
          `💰 <b>Total:</b> ৳${total}\n` +
          `🆔 <b>Order ID:</b> <code>${orderId}</code>\n`
        
        if (gameId) {
          msg += `🎮 <b>Game ID / Account:</b> <code>${gameId}</code>\n`
        }
        if (userId) {
          msg += `👤 <b>User ID:</b> <code>${userId}</code>\n`
        }

        msg += `\n💡 <b>Deliver via Bot:</b>\n<code>/deliver ${orderId} CODE_HERE</code>\n\n` +
          `🔗 <a href="https://retrohub.tech/admin">Go to Admin Dashboard</a>`

        await sendMessage(ADMIN_CHAT_ID, msg)

        if (lowStock && remainingStock !== undefined) {
          const stockMsg = `⚠️ <b>LOW STOCK ALERT!</b>\n\n` +
            `📦 <b>Product:</b> ${productName}\n` +
            `📉 <b>Remaining Stock:</b> ${remainingStock}\n\n` +
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

        let msg = `💳 <b>Payment Submitted by Customer!</b>\n\n` +
          `🧾 <b>Transaction ID:</b> <code>${transactionId}</code>\n`
        
        if (total) {
          msg += `💰 <b>Total Amount:</b> ৳${total}\n`
        }

        msg += `📦 <b>Orders (${orderList.length}):</b>\n`
        orderList.forEach((id: string, idx: number) => {
          msg += `${idx + 1}. <code>${id}</code>\n` +
                 `   👉 <code>/deliver ${id} CODE_HERE</code>\n`
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
          `👤 <b>Name:</b> ${name}\n` +
          `📧 <b>Email:</b> ${email}\n` +
          `📦 <b>Product:</b> ${productName}\n` +
          `💻 <b>Platform:</b> ${platform}\n` +
          `📋 <b>Details:</b> ${details || 'None'}\n\n` +
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
          const trx = o.customer_input?.transaction_id ? ` (Trx: <code>${o.customer_input.transaction_id}</code>)` : ''
          reminderMsg += `${idx + 1}. <b>${o.products?.title || 'Unknown'}</b> - ৳${o.total} [${statusLabel}${trx}]\n` +
                         `   <code>/deliver ${o.id} CODE_HERE</code>\n\n`
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

    const chatId = body.message.chat.id
    const text = body.message.text.trim()

    // Authorization check: only admin can use the bot
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

      const revenue = revenueRes.data || 0
      const orders = ordersRes.count || 0
      const pending = pendingRes.count || 0

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
          const trx = o.customer_input?.transaction_id ? `\n   Trx: <code>${o.customer_input.transaction_id}</code>` : ''
          msg += `${idx + 1}. <b>${o.products?.title || 'Unknown'}</b> - ৳${o.total}\n` +
                 `   Status: ${statusLabel}${trx}\n` +
                 `   👉 <code>/deliver ${o.id} CODE_HERE</code>\n\n`
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
          msg += `${idx + 1}. <b>${req.product_name}</b> (${req.platform})\n` +
                 `   From: ${req.name}\n\n`
        })
        await sendMessage(chatId, msg)
      }
    }
    else if (text.startsWith('/deliver ')) {
      const parts = text.substring(9).trim().split(' ')
      const orderId = parts[0]
      const output = parts.slice(1).join(' ')
      
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
          await sendMessage(chatId, `❌ Failed to fulfill order: ${error.message}`)
        } else if (!data || data.length === 0) {
          await sendMessage(chatId, `❌ Order not found: ${orderId}`)
        } else {
          await sendMessage(chatId, `✅ Order <code>${orderId}</code> successfully fulfilled! The customer can now see the product code on their dashboard.`)
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
