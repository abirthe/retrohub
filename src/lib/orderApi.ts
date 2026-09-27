// src/lib/orderApi.ts
// All order lifecycle functions: creation, admin operations, stats, deliveries.

import { supabase } from "@/integrations/supabase/client";
import { notifyNewOrder } from "./telegramService";
import { logger } from "./logger";
import type { Order, Delivery } from "./types";

// ─── Customer Order Creation ──────────────────────────────────────────────────

/**
 * Creates a new order with authoritative server-side price enforcement.
 * Prevents client-side price tampering by re-fetching sale_price from DB.
 */
export async function createOrder(
  productId: string,
  total: number,
  customerInput: Record<string, string> = {},
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data: productData, error: productFetchError } = await supabase
    .from("products")
    .select("title, sale_price, in_stock")
    .eq("id", productId)
    .single();

  if (productFetchError || !productData) {
    throw new Error("Product not found or unavailable");
  }

  if (
    productData.in_stock !== null &&
    productData.in_stock !== undefined &&
    productData.in_stock <= 0
  ) {
    throw new Error(
      `Sorry, "${productData.title || "this product"}" is currently out of stock.`,
    );
  }

  const authoritativeTotal = Number(productData.sale_price) || total;

  const { data: orderData, error: insertError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      product_id: productId,
      total: authoritativeTotal,
      customer_input: customerInput || {},
      status: "pending",
    })
    .select()
    .single();

  if (insertError) throw insertError;

  try {
    const isLowStock =
      productData.in_stock !== null &&
      productData.in_stock !== undefined &&
      productData.in_stock <= 3;
    const gameId =
      typeof customerInput?.game_id === "string" ? customerInput.game_id : "";
    await notifyNewOrder({
      orderId: orderData.id,
      productName: productData.title || "Unknown Product",
      total: authoritativeTotal,
      userId: user.id,
      gameId,
      lowStock: isLowStock,
      remainingStock: productData.in_stock ?? undefined,
    });
  } catch (e) {
    logger.error("Error sending telegram notification for order:", {
      error: String(e),
    });
  }

  return orderData;
}

// ─── Admin Order Reads ────────────────────────────────────────────────────────

/** Fetch all orders with product & profile data for the Admin dashboard. */
export async function fetchOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, products(title, platform, in_stock, delivery_type, cost_price, source_url, source_platform), profiles(email)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** Fetch all deliveries linked to an order. */
export async function fetchOrderDeliveries(orderId: string) {
  const { data, error } = await supabase
    .from("deliveries")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Delivery[];
}

/** Fetch today's revenue, order count, profit and pending action count for KPI grid. */
export async function fetchAdminStats() {
  const [revenueRes, ordersRes, profitRes, pendingRes] = await Promise.all([
    supabase.from("v_revenue_today").select("revenue").maybeSingle(),
    supabase.from("v_orders_today").select("order_count").maybeSingle(),
    supabase.from("v_profit_today").select("*").maybeSingle(),
    supabase.from("v_pending_action_count").select("count").maybeSingle(),
  ]);
  return {
    revenue: revenueRes.data?.revenue || 0,
    orders: ordersRes.data?.order_count || 0,
    profit: profitRes.data?.profit || 0,
    pendingActions: pendingRes.data?.count || 0,
  };
}

// ─── Admin Order State Transitions (RPC-backed) ───────────────────────────────

type RpcResult = { success: boolean; error?: string; message?: string };

export async function validateOrder(orderId: string): Promise<RpcResult> {
  const { data, error } = await supabase.rpc(
    "verify_payment" as never,
    { p_order_id: orderId } as never,
  );
  if (error) throw error;
  return data as unknown as RpcResult;
}

export async function startSourcing(orderId: string): Promise<RpcResult> {
  const { data, error } = await supabase.rpc(
    "start_sourcing" as never,
    { p_order_id: orderId } as never,
  );
  if (error) throw error;
  return data as unknown as RpcResult;
}

export async function fulfillOrder(
  orderId: string,
  deliveryCode: string,
  costPaid?: number,
  sourcedFrom?: string,
  notes?: string,
): Promise<RpcResult & { delivery_id?: string }> {
  const { data, error } = await supabase.rpc(
    "fulfill_order" as never,
    {
      p_order_id: orderId,
      p_delivery_code: deliveryCode,
      p_cost_paid: costPaid || null,
      p_sourced_from: sourcedFrom || null,
      p_notes: notes || null,
    } as never,
  );
  if (error) throw error;
  return data as unknown as RpcResult & { delivery_id?: string };
}

export async function holdOrder(
  orderId: string,
  reason?: string,
): Promise<RpcResult> {
  const { data, error } = await supabase.rpc(
    "hold_order" as never,
    { p_order_id: orderId, p_reason: reason || null } as never,
  );
  if (error) throw error;
  return data as unknown as RpcResult;
}

export async function cancelOrder(
  orderId: string,
  reason?: string,
): Promise<RpcResult> {
  const { data, error } = await supabase.rpc(
    "cancel_order" as never,
    { p_order_id: orderId, p_reason: reason || null } as never,
  );
  if (error) throw error;
  return data as unknown as RpcResult;
}

export async function refundOrder(
  orderId: string,
  reason?: string,
): Promise<RpcResult> {
  const { data, error } = await supabase.rpc(
    "refund_order" as never,
    { p_order_id: orderId, p_reason: reason || null } as never,
  );
  if (error) throw error;
  return data as unknown as RpcResult;
}
