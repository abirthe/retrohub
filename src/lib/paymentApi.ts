// src/lib/paymentApi.ts
// Customer payment submission: bKash TrxID submission and Telegram notification dispatch.

import { supabase } from '@/integrations/supabase/client';
import { notifyPaymentSubmitted } from './telegramService';

/**
 * Submits payment transaction IDs for a batch of orders.
 * Tries the secure `submit_order_payment` RPC first (SECURITY DEFINER, validates ownership),
 * then falls back to a direct table update for admins or when the RPC is unavailable.
 */
export async function updateOrderTransactionId(orderIds: string[], transactionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const trimmedTrx = transactionId.trim();

  const updates = orderIds.map(async (id) => {
    // 1. Try secure RPC (bypasses RLS restrictions safely for non-admin customers)
    const { data: rpcData, error: rpcError } = await supabase.rpc('submit_order_payment' as never, {
      p_order_id: id,
      p_transaction_id: trimmedTrx,
      p_payment_method: 'manual',
    } as never);

    if (!rpcError && (rpcData as { success?: boolean })?.success) {
      return { success: true };
    }

    // 2. Fallback: direct table update for admins or when RPC is not yet registered
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('customer_input')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const currentInput = (currentOrder?.customer_input as Record<string, string>) || {};
    const newInput = { ...currentInput, transaction_id: trimmedTrx, payment_method: 'manual' };

    return supabase
      .from('orders')
      .update({ customer_input: newInput, status: 'payment_submitted' })
      .eq('id', id)
      .eq('user_id', user.id);
  });

  const results = await Promise.all(updates);
  const errors = results.filter(r => 'error' in r && Boolean(r.error));
  if (errors.length > 0) {
    throw new Error('Failed to submit payment. Please contact support.');
  }

  // Notify admin via Telegram immediately
  try {
    await notifyPaymentSubmitted({ orderIds, transactionId: trimmedTrx });
  } catch (e) {
    console.error('Error sending payment notification:', e);
  }

  return { success: true };
}
