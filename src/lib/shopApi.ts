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
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Fetch orders from database (admin only)
export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, products(title, platform)')
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

  // Use the stock-validated order creation function
  const { data, error } = await (supabase.rpc as any)('create_order_with_stock_check', {
    p_user_id: user.id,
    p_product_id: productId,
    p_total: total,
    p_customer_input: customerInput || {}
  });

  if (error) throw error;

  // If stock validation failed
  if (!data.success) {
    throw new Error(data.error || 'Order creation failed');
  }

  // Get the created order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', data.order_id)
    .single();

  if (orderError) throw orderError;
  return order;
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

// Fulfill order manually (backend verifies inventory)
export async function fulfillOrder(orderId: string) {
  const { data, error } = await (supabase.rpc as any)('fulfill_order_manual', {
    p_order_id: orderId
  });
  if (error) throw error;
  return (data as unknown) as { success: boolean; error?: string; message?: string; key_assigned?: boolean };
}

// Hold order
export async function holdOrder(orderId: string, reason?: string) {
  const { data, error } = await (supabase.rpc as any)('hold_order', {
    p_order_id: orderId,
    p_reason: reason || null
  });
  if (error) throw error;
  return (data as unknown) as { success: boolean; error?: string; message?: string };
}

// Cancel order
export async function cancelOrder(orderId: string, reason?: string) {
  const { data, error } = await (supabase.rpc as any)('cancel_order', {
    p_order_id: orderId,
    p_reason: reason || null
  });
  if (error) throw error;
  return (data as unknown) as { success: boolean; error?: string; message?: string; key_released?: boolean };
}

// Refund order
export async function refundOrder(orderId: string, reason?: string) {
  const { data, error } = await (supabase.rpc as any)('refund_order', {
    p_order_id: orderId,
    p_reason: reason || null
  });
  if (error) throw error;
  return (data as unknown) as { success: boolean; error?: string; message?: string; key_released?: boolean };
}

// Validate order
export async function validateOrder(orderId: string) {
  const { data, error } = await (supabase.rpc as any)('validate_order', {
    p_order_id: orderId
  });
  if (error) throw error;
  return (data as unknown) as { success: boolean; error?: string; message?: string };
}

// Check inventory availability
export async function checkInventoryAvailability(productId: string) {
  const { data, error } = await (supabase.rpc as any)('check_inventory_availability', {
    p_product_id: productId
  });
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
    console.error('Failed to update some orders:', errors);
    throw new Error('Failed to update transaction ID for created orders. Please contact support.');
  }

  return { success: true };
}