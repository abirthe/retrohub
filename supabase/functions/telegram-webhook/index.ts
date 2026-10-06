// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { 
  supabase, 
  corsHeaders, 
  SUPABASE_ANON_KEY, 
  SUPABASE_SERVICE_ROLE_KEY, 
  TELEGRAM_WEBHOOK_SECRET, 
  ADMIN_CHAT_ID 
} from './config.ts'
import { 
  escapeHtml, 
  sendMessage, 
  sendCustomerBotMessage,
  answerCallbackQuery, 
  resolveOrder, 
  sendOrderInspection 
} from './utils.ts'

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
      } else if (action === 'support_resolve' && orderIdentifier) {
        const targetChatId = Number(orderIdentifier)
        if (targetChatId) {
          await supabase
            .from('customer_support_sessions')
            .update({
              state: 'bot_active',
              resolved_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('chat_id', targetChatId)

          await sendCustomerBotMessage(
            targetChatId,
            `✅ <b>Support Inquiry Resolved</b>\n\nYour support ticket has been closed by our merchant desk. Retro Chan is back to assist you anytime!`,
            {
              inline_keyboard: [
                [
                  { text: '📦 Track My Order', callback_data: 'prompt_order' },
                  { text: '🛒 Visit Store', url: 'https://www.retrohub.tech' },
                ],
              ],
            }
          )
          await sendMessage(chatId, `✅ Session for Chat <code>${targetChatId}</code> marked resolved and returned to Retro Chan AI.`)
          await answerCallbackQuery(cq.id, 'Session Resolved')
        } else {
          await answerCallbackQuery(cq.id, 'Invalid Chat ID', true)
        }
      } else if (action === 'support_reply' && orderIdentifier) {
        const targetChatId = orderIdentifier
        await sendMessage(chatId, `💬 <b>To reply to Chat <code>${targetChatId}</code>:</b>\nType: <code>/reply ${targetChatId} &lt;your message&gt;</code>`)
        await answerCallbackQuery(cq.id, 'Use /reply ' + targetChatId)
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
        `📊 <b>Store & Inventory:</b>\n` +
        `• <code>/summary</code> - Today's financial metrics & revenue\n` +
        `• <code>/stock [search]</code> - Check stock or view low inventory\n` +
        `• <code>/custom</code> - View pending custom quote requests\n` +
        `• <code>/remind</code> - Trigger instant pending orders scan\n\n` +
        `💬 <b>Customer Support Triage:</b>\n` +
        `• <code>/reply [chat_id] [message]</code> - Reply directly to escalated customer\n` +
        `• <code>/resolve [chat_id]</code> - Close ticket & return customer to AI concierge\n\n` +
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
          .rpc('product_search', { search_query: searchQuery, max_results: 8 })

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
      const parts = text.substring(6).trim().split(' ')
      const targetChatId = parts[0]?.trim()
      const replyMsg = parts.slice(1).join(' ').trim()

      if (!targetChatId || !replyMsg) {
        await sendMessage(chatId, '⚠️ <b>Usage:</b> <code>/reply [chat_id] [message]</code>\n<i>Example:</i> <code>/reply 123456789 Hello, your order is being processed!</code>')
      } else {
        const numericChatId = Number(targetChatId)
        const customerText = `👨‍💻 <b>RetroHub Support Desk:</b>\n\n${escapeHtml(replyMsg)}`
        const customerKeyboard = {
          inline_keyboard: [
            [{ text: '🤖 Resume with Retro Chan AI', callback_data: 'resume_bot' }],
          ],
        }

        const sendRes = await sendCustomerBotMessage(targetChatId, customerText, customerKeyboard)
        if (sendRes && sendRes.ok) {
          try {
            await supabase
              .from('customer_support_sessions')
              .update({
                state: 'agent_active',
                updated_at: new Date().toISOString(),
              })
              .eq('chat_id', numericChatId)

            const sessionMsg = {
              sender: 'agent',
              text: replyMsg.substring(0, 800),
              time: new Date().toISOString(),
            }
            await supabase.rpc('append_session_message', {
              p_chat_id: numericChatId,
              p_message: sessionMsg,
              p_max_messages: 8,
            }).catch(() => {})
          } catch (_) {}

          await sendMessage(chatId, `📨 <b>Reply Sent!</b>\nDelivered to Customer Chat <code>${escapeHtml(targetChatId)}</code>.`)
        } else {
          await sendMessage(chatId, `❌ Failed to deliver message to Chat <code>${escapeHtml(targetChatId)}</code>. Please verify that the customer has interacted with @retrochanbot.`)
        }
      }
    }
    else if (text.startsWith('/resolve')) {
      const targetChatId = text.substring(8).trim()
      if (!targetChatId) {
        await sendMessage(chatId, '⚠️ <b>Usage:</b> <code>/resolve [chat_id]</code>\n<i>Example:</i> <code>/resolve 123456789</code>')
      } else {
        const numericChatId = Number(targetChatId)
        await supabase
          .from('customer_support_sessions')
          .update({
            state: 'bot_active',
            resolved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('chat_id', numericChatId)

        await sendCustomerBotMessage(
          targetChatId,
          `✅ <b>Support Ticket Resolved</b>\n\nYour support session has been closed by our merchant desk. Retro Chan is back to assist you!`,
          {
            inline_keyboard: [
              [
                { text: '📦 Track My Order', callback_data: 'prompt_order' },
                { text: '🛒 Visit Store', url: 'https://www.retrohub.tech' },
              ],
            ],
          }
        )
        await sendMessage(chatId, `✅ Session for Chat <code>${escapeHtml(targetChatId)}</code> marked resolved and returned to Retro Chan AI.`)
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
