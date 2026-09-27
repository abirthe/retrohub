// src/lib/customOrderApi.ts
// Custom order submission and admin management.

import { supabase } from '@/integrations/supabase/client';
import { notifyCustomOrder } from './telegramService';
import type { CustomOrderPayload, CustomOrderRow } from './types';

export async function submitCustomOrder(payload: CustomOrderPayload) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('custom_orders')
    .insert({
      user_id: user?.id || null,
      name: payload.name,
      email: payload.email,
      product_name: payload.productName,
      platform: payload.platform,
      details: payload.details,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  try {
    await notifyCustomOrder({
      name: payload.name,
      email: payload.email,
      productName: payload.productName,
      platform: payload.platform,
      details: payload.details,
    });
  } catch (e) {
    console.error('Error sending telegram notification for custom order:', e);
  }

  return data;
}

export async function fetchCustomOrders() {
  const { data, error } = await supabase
    .from('custom_orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as unknown as CustomOrderRow[];
}

export async function updateCustomOrderStatus(id: string, status: string) {
  const { error } = await supabase
    .from('custom_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}
