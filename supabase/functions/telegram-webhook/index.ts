import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function sendMessage(chatId: string | number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

serve(async (req) => {
  try {
    const body = await req.json()

    // Process only text messages
    if (!body.message || !body.message.text) {
      return new Response('OK', { status: 200 })
    }

    const chatId = body.message.chat.id
    const text = body.message.text.trim()

    // Simple security: only reply to the admin chat ID
    if (chatId.toString() !== ADMIN_CHAT_ID) {
      await sendMessage(chatId, '⛔ Unauthorized access. This bot is private.')
      return new Response('OK', { status: 200 })
    }

    if (text === '/start' || text === '/help') {
      const helpMsg = `🤖 <b>Admin Notification Bot Commands</b>\n\n` +
        `/summary - View today's stats (revenue, orders, etc.)\n` +
        `/orders - View the 5 most recent pending orders\n` +
        `/custom - View the 5 most recent custom order requests`
      await sendMessage(chatId, helpMsg)
    } 
    else if (text === '/summary') {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      
      const [revenueRes, ordersRes, pendingRes] = await Promise.all([
        supabase.rpc('get_daily_revenue', { start_date: startOfDay.toISOString() }),
        supabase.from('orders').select('id', { count: 'exact' }).gte('created_at', startOfDay.toISOString()),
        supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'pending'),
      ])

      const revenue = revenueRes.data || 0
      const orders = ordersRes.count || 0
      const pending = pendingRes.count || 0

      const msg = `📊 <b>Daily Store Summary</b>\n\n` +
        `💰 <b>Revenue:</b> ৳${revenue}\n` +
        `📦 <b>Orders Today:</b> ${orders}\n` +
        `⏳ <b>Pending Actions:</b> ${pending}`
      await sendMessage(chatId, msg)
    }
    else if (text === '/orders') {
      const { data } = await supabase
        .from('orders')
        .select('id, total, status, created_at, products(title)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5)

      if (!data || data.length === 0) {
        await sendMessage(chatId, '🎉 No pending orders right now!')
      } else {
        let msg = `📦 <b>Latest 5 Pending Orders:</b>\n\n`
        data.forEach((o: any, idx: number) => {
          msg += `${idx + 1}. <b>${o.products?.title || 'Unknown'}</b> - ৳${o.total}\n` +
                 `   ID: <code>${o.id}</code>\n\n`
        })
        await sendMessage(chatId, msg)
      }
    }
    else if (text === '/custom') {
      const { data } = await supabase
        .from('custom_orders')
        .select('id, name, product_name, platform')
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
    else {
      await sendMessage(chatId, '❓ Unknown command. Type /help to see available commands.')
    }

    return new Response('OK', { status: 200 })
  } catch (err: any) {
    console.error('Error handling webhook:', err.message)
    return new Response('Error', { status: 500 })
  }
})
