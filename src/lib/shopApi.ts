import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ProductCategory = Database['public']['Enums']['product_category'];
export type DeliveryType = Database['public']['Enums']['delivery_type'];
export type Region = Database['public']['Enums']['region_tag'];
export type OrderStatus = Database['public']['Enums']['order_status'];
export type AppRole = Database['public']['Enums']['app_role'];

export type Product = Database['public']['Tables']['products']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type Delivery = Database['public']['Tables']['deliveries']['Row'];
export type AdminActionLog = Database['public']['Tables']['admin_action_logs']['Row'];

// Fetch products from database
export async function fetchProducts(): Promise<Product[]> {
  try {
    const PAGE_SIZE = 1000;
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (countError) throw countError;
    const total = count ?? 0;
    const numPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    if (numPages === 1) {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, sale_price, cost_price, image_url, category, platform, region, in_stock, delivery_type, source_url, source_platform, created_at, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Product[]) ?? [];
    }

    const pagePromises = Array.from({ length: numPages }, (_, i) => {
      const from = i * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      return supabase
        .from('products')
        .select('id, title, sale_price, cost_price, image_url, category, platform, region, in_stock, delivery_type, source_url, source_platform, created_at, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(from, to);
    });

    const results = await Promise.all(pagePromises);
    const allProducts: Product[] = [];
    for (const res of results) {
      if (res.error) throw res.error;
      if (res.data) {
        allProducts.push(...(res.data as Product[]));
      }
    }
    return allProducts;
  } catch (error) {
    throw error;
  }
}


// Fetch orders from database (admin only)
export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, products(title, platform, in_stock, delivery_type, source_url, source_platform), profiles(email)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Fetch deliveries for an order
export async function fetchOrderDeliveries(orderId: string) {
  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Delivery[];
}

// Admin Stats
export async function fetchAdminStats() {
  const [revenueRes, ordersRes, profitRes, pendingRes] = await Promise.all([
    supabase.from('v_revenue_today').select('revenue').maybeSingle(),
    supabase.from('v_orders_today').select('order_count').maybeSingle(),
    supabase.from('v_profit_today').select('*').maybeSingle(),
    supabase.from('v_pending_action_count').select('count').maybeSingle(),
  ]);

  return {
    revenue: revenueRes.data?.revenue || 0,
    orders: ordersRes.data?.order_count || 0,
    profit: profitRes.data?.profit || 0,
    pendingActions: pendingRes.data?.count || 0,
  };
}

// Create an order
export async function createOrder(
  productId: string,
  total: number,
  customerInput: Record<string, string> = {}
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

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

// Verify payment
export async function validateOrder(orderId: string) {
  const { data, error } = await supabase.rpc('verify_payment' as never, {
    p_order_id: orderId
  } as never);
  if (error) throw error;
  return (data as unknown) as { success: boolean; error?: string; message?: string };
}

// Start Sourcing
export async function startSourcing(orderId: string) {
  const { data, error } = await supabase.rpc('start_sourcing' as never, {
    p_order_id: orderId
  } as never);
  if (error) throw error;
  return (data as unknown) as { success: boolean; error?: string; message?: string };
}

// Fulfill order manually via deliveries table
export async function fulfillOrder(
  orderId: string,
  deliveryCode: string,
  costPaid?: number,
  sourcedFrom?: string,
  notes?: string
) {
  const { data, error } = await supabase.rpc('fulfill_order' as never, {
    p_order_id: orderId,
    p_delivery_code: deliveryCode,
    p_cost_paid: costPaid || null,
    p_sourced_from: sourcedFrom || null,
    p_notes: notes || null
  } as never);
  if (error) throw error;
  return (data as unknown) as { success: boolean; error?: string; message?: string; delivery_id?: string };
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
  return (data as unknown) as { success: boolean; error?: string; message?: string };
}

// Refund order
export async function refundOrder(orderId: string, reason?: string) {
  const { data, error } = await supabase.rpc('refund_order' as never, {
    p_order_id: orderId,
    p_reason: reason || null
  } as never);
  if (error) throw error;
  return (data as unknown) as { success: boolean; error?: string; message?: string };
}

// Update order with transaction ID and set to payment_submitted
export async function updateOrderTransactionId(orderIds: string[], transactionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const updates = orderIds.map(async (id) => {
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
        customer_input: newInput,
        status: 'payment_submitted'
      })
      .eq('id', id)
      .eq('user_id', user.id);
  });

  const results = await Promise.all(updates);

  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    throw new Error('Failed to submit payment. Please contact support.');
  }

  return { success: true };
}

// Update product prices (Admin only)
export async function updateProductPrice(id: string, salePrice: number, costPrice: number) {
  const { error } = await supabase
    .from('products')
    .update({ sale_price: salePrice, cost_price: costPrice })
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}

// Update full product details (Admin only)
export async function updateProductDetails(id: string, details: Partial<Product>) {
  const { error } = await supabase
    .from('products')
    .update(details)
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}

// Custom Orders API

export interface CustomOrderPayload {
  name: string;
  email: string;
  productName: string;
  platform: string;
  details: string;
}

export type CustomOrderRow = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  product_name: string;
  platform: string;
  details: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

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
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchCustomOrders() {
  const { data, error } = await supabase
    .from('custom_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as CustomOrderRow[];
}

export async function updateCustomOrderStatus(id: string, status: string) {
  const { error } = await supabase
    .from('custom_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}