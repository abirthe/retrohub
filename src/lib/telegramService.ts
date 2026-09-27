// Telegram notification service
import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";

export async function sendTelegramNotification(message: string) {
  try {
    // 1. Primary: Use Supabase Edge Function (server-side secrets, no CORS or ad-blocker issues)
    const { error } = await supabase.functions.invoke("telegram-webhook", {
      body: { action: "notify", message },
    });

    if (error) {
      logger.warn("Edge function notification failed:", {
        message: error.message,
      });
    }
  } catch (err) {
    logger.warn("Error invoking telegram-webhook:", { error: String(err) });
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
    await supabase.functions.invoke("telegram-webhook", {
      body: { action: "order_created", ...params },
    });
  } catch (err) {
    logger.error("Failed to notify new order:", { error: String(err) });
  }
}

export async function notifyPaymentSubmitted(params: {
  orderIds: string[];
  transactionId: string;
  total?: number;
}) {
  try {
    await supabase.functions.invoke("telegram-webhook", {
      body: { action: "payment_submitted", ...params },
    });
  } catch (err) {
    logger.error("Failed to notify payment submission:", {
      error: String(err),
    });
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
    await supabase.functions.invoke("telegram-webhook", {
      body: { action: "custom_order", ...params },
    });
  } catch (err) {
    logger.error("Failed to notify custom order:", { error: String(err) });
  }
}

export async function triggerPendingReminder() {
  try {
    const { data } = await supabase.functions.invoke("telegram-webhook", {
      body: { action: "check_pending" },
    });
    return data;
  } catch (err) {
    logger.error("Failed to trigger pending reminder:", { error: String(err) });
    return null;
  }
}
