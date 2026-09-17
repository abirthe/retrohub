// Email service to send order completion emails
// This can be called from the frontend or backend

import { supabase } from '@/integrations/supabase/client';

interface EmailPayload {
  order_id: string;
  recipient: string;
  product_title: string;
  code: string;
  order_total: number;
}

/**
 * Send order completion email via Supabase Edge Function
 * This requires the Edge Function to be deployed and configured
 */
export async function sendOrderEmail(payload: EmailPayload) {
  try {
    // Get Supabase project URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    // Call the Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Email service error: ${error}`);
    }

    const result = await response.json();
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Don't throw - email failure shouldn't break order completion
    return { success: false, error: message };
  }
}

/**
 * Manually trigger email for a completed order
 * Call this after fulfilling an order
 */
export async function sendOrderCompletionEmail(orderId: string) {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        final_output,
        status,
        products(title),
        user_id
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'completed' || !order.final_output) {
      throw new Error('Order not completed or no code available');
    }

    // Get customer email using RPC function (works for admins)
    const { data: customerEmail, error: emailError } = await supabase.rpc(
      'get_user_email' as never,
      { p_user_id: order.user_id } as never
    );

    if (emailError || !customerEmail) {
      // Don't fail completely - email is optional
      return { 
        success: false, 
        error: 'Customer email not found. Customer can view code on /orders page.',
        warning: true 
      };
    }

    // Send email
    const productData = order.products as { title?: string } | null;
    const result = await sendOrderEmail({
      order_id: order.id,
      recipient: customerEmail as string,
      product_title: productData?.title || 'Product',
      code: order.final_output,
      order_total: Number(order.total),
    });

    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Don't throw - email failure shouldn't break order fulfillment
    return { success: false, error: message, warning: true };
  }
}

