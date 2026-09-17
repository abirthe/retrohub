import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ProductCategory = Database['public']['Enums']['product_category'];
export type DeliveryType = Database['public']['Enums']['delivery_type'];
export type Region = Database['public']['Enums']['region_tag'];
export type OrderStatus = Database['public']['Enums']['order_status'];
export type KeyStatus = Database['public']['Enums']['key_status'];
export type AppRole = Database['public']['Enums']['app_role'];

export type Product = Database['public']['Tables']['products']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type InventoryKey = Database['public']['Tables']['inventory_keys']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

// Fetch products from database
export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, sale_price, image_url, category, platform, region, in_stock, delivery_type, created_at, is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Fetch orders from database (admin only)
export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, products(title, platform, in_stock, delivery_type)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Create an order with stock validation
export async function createOrder(
  productId: string,
  total: number,
  customerInput: Record<string, string> = {}
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Bypass stock validation and create order directly
  const { data: orderData, error: insertError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      product_id: productId,
      total: total,
      customer_input: customerInput || {},
      status: 'pending'
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return orderData;
}


// Check if user has admin role
export async function checkIsAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc('has_role', {
    _user_id: user.id,
    _role: 'admin'
  });

  if (error) return false;
  return data ?? false;
}

// Admin Order Management Functions

// Fulfill order manually (backend verifies inventory or handles custom orders)
export async function fulfillOrder(orderId: string, customOutput?: string) {
  // Check if it's a custom order
  const { data: order } = await supabase.from('orders').select('product_id').eq('id', orderId).single();
  
  // If no product_id (custom request) OR admin explicitly provided a custom output/key
  if (!order?.product_id || customOutput) {
    const { error } = await supabase.from('orders').update({
      status: 'completed',
      final_output: customOutput || 'Order fulfilled manually.',
    }).eq('id', orderId);
    
    if (error) return { success: false, error: error.message };
    return { success: true, message: 'Order fulfilled manually' };
  }

  // Otherwise, use automated inventory key assignment
  const { data, error } = await supabase.rpc('fulfill_order_manual' as never, {
    p_order_id: orderId
  } as never);
  if (error) throw error;
  return (data as unknown) as { success: boolean; error?: string; message?: string; key_assigned?: boolean };
}

// Hold order
export async function holdOrder(orderId: string, reason?: string) {
  const { data, error } = await supabase.rpc('hold_order' as never, {
    p_order_id: orderId,
    p_reason: reason || null
  } as never);
  if (error) throw error;
  return (data as unknown) as { success: boolean; error?: string; message?: string };
}

// Cancel order
export async function cancelOrder(orderId: string, reason?: string) {
  const { data, error } = await supabase.rpc('cancel_order' as never, {
    p_order_id: orderId,
    p_reason: reason || null
  } as never);
  if (error) throw error;
  return (data as unknown) as { success: boolean; error?: string; message?: string; key_released?: boolean };
}

// Refund order
export async function refundOrder(orderId: string, reason?: string) {
  const { data, error } = await supabase.rpc('refund_order' as never, {
    p_order_id: orderId,
    p_reason: reason || null
  } as never);
  if (error) throw error;
  return (data as unknown) as { success: boolean; error?: string; message?: string; key_released?: boolean };
}

// Validate order
export async function validateOrder(orderId: string) {
  const { data, error } = await supabase.rpc('validate_order' as never, {
    p_order_id: orderId
  } as never);
  if (error) throw error;
  return (data as unknown) as { success: boolean; error?: string; message?: string };
}

// Check inventory availability
export async function checkInventoryAvailability(productId: string) {
  const { data, error } = await supabase.rpc('check_inventory_availability' as never, {
    p_product_id: productId
  } as never);
  if (error) throw error;
  return (data as unknown) as { success: boolean; error?: string; product_id?: string; product_title?: string; available_keys?: number; in_stock?: number; has_inventory?: boolean };
}

// Update order with transaction ID
export async function updateOrderTransactionId(orderIds: string[], transactionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // We use Promise.all to update multiple orders if necessary, though usually it's one cart checkout = multiple orders
  const updates = orderIds.map(async (id) => {
    // Check if we can update customer_input. 
    // We first fetch the current input to avoid overwriting other data if possible, 
    // but here we might just merge or overwrite.
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('customer_input')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const currentInput = (currentOrder?.customer_input as Record<string, string>) || {};
    const newInput = { ...currentInput, transaction_id: transactionId, payment_method: 'manual' };

    return supabase
      .from('orders')
      .update({
        customer_input: newInput
      })
      .eq('id', id)
      .eq('user_id', user.id);
  });

  const results = await Promise.all(updates);

  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    throw new Error('Failed to update transaction ID for created orders. Please contact support.');
  }

  return { success: true };
}