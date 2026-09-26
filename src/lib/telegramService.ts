// Telegram notification service
import { supabase } from '@/integrations/supabase/client';

export async function sendTelegramNotification(message: string) {
  try {
    // 1. Primary: Use Supabase Edge Function (server-side secrets, no CORS or ad-blocker issues)
    const { error } = await supabase.functions.invoke('telegram-webhook', {
      body: { action: 'notify', message },
    });

    if (error) {
      console.warn('Edge function notification failed, trying fallback:', error.message);
      await fallbackDirectNotification(message);
    }
  } catch (err) {
    console.warn('Error invoking telegram-webhook:', err);
    await fallbackDirectNotification(message);
  }
}

export async function notifyNewOrder(params: {
  orderId: string;
  productName: string;
  total: number;
  userId?: string;
  gameId?: string;
  lowStock?: boolean;
  remainingStock?: number;
}) {
  try {
    await supabase.functions.invoke('telegram-webhook', {
      body: { action: 'order_created', ...params },
    });
  } catch (err) {
    console.error('Failed to notify new order:', err);
  }
}

export async function notifyPaymentSubmitted(params: {
  orderIds: string[];
  transactionId: string;
  total?: number;
}) {
  try {
    await supabase.functions.invoke('telegram-webhook', {
      body: { action: 'payment_submitted', ...params },
    });
  } catch (err) {
    console.error('Failed to notify payment submission:', err);
  }
}

export async function notifyCustomOrder(params: {
  name: string;
  email: string;
  productName: string;
  platform: string;
  details?: string;
}) {
  try {
    await supabase.functions.invoke('telegram-webhook', {
      body: { action: 'custom_order', ...params },
    });
  } catch (err) {
    console.error('Failed to notify custom order:', err);
  }
}

export async function triggerPendingReminder() {
  try {
    const { data } = await supabase.functions.invoke('telegram-webhook', {
      body: { action: 'check_pending' },
    });
    return data;
  } catch (err) {
    console.error('Failed to trigger pending reminder:', err);
    return null;
  }
}

async function fallbackDirectNotification(message: string) {
  const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || '';

  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
  } catch (e) {
    console.error('Direct fallback telegram notification error:', e);
  }
}
