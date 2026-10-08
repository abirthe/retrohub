// src/lib/orderPaymentWindow.ts
// Centralized logic for the 30-minute e-commerce payment window, expiration, and formatting.

export const PAYMENT_WINDOW_MINUTES = 30;
export const PAYMENT_WINDOW_MS = PAYMENT_WINDOW_MINUTES * 60 * 1000;

export interface OrderPaymentCheckable {
  status?: string | null;
  customer_input?: unknown;
  created_at?: string | null;
}

/**
 * Checks whether an order is pending and has not yet had a payment transaction submitted.
 */
export function isOrderUnpaid(order: OrderPaymentCheckable): boolean {
  if (order.status !== "pending") return false;
  const input = order.customer_input;
  if (!input || typeof input !== "object" || Array.isArray(input)) return true;
  const trx = (input as Record<string, unknown>).transaction_id;
  if (typeof trx === "string" && trx.trim().length > 0) {
    return false;
  }
  return true;
}

/**
 * Returns the exact millisecond epoch at which the order's 30-minute payment window expires.
 */
export function getOrderExpiryTimestamp(createdAt: string | Date | undefined | null): number {
  if (!createdAt) return Date.now();
  const createdTime = new Date(createdAt).getTime();
  if (isNaN(createdTime)) return Date.now();
  return createdTime + PAYMENT_WINDOW_MS;
}

/**
 * Returns remaining seconds until payment window expires (clamped to >= 0).
 */
export function getOrderRemainingSeconds(
  createdAt: string | Date | undefined | null,
  currentTimeMs: number = Date.now(),
): number {
  const expiry = getOrderExpiryTimestamp(createdAt);
  const diffMs = expiry - currentTimeMs;
  return Math.max(0, Math.floor(diffMs / 1000));
}

/**
 * Returns true if more than 30 minutes have elapsed since the order was created.
 */
export function isOrderExpired(
  createdAt: string | Date | undefined | null,
  currentTimeMs: number = Date.now(),
): boolean {
  return getOrderRemainingSeconds(createdAt, currentTimeMs) <= 0;
}

/**
 * Formats remaining seconds as "MM:SS" (e.g. 29:45 or 04:12).
 */
export function formatTimeRemaining(remainingSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(remainingSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Returns percentage (0 to 100) of the payment window remaining.
 */
export function getTimeProgressPercent(
  createdAt: string | Date | undefined | null,
  currentTimeMs: number = Date.now(),
): number {
  const remainingSecs = getOrderRemainingSeconds(createdAt, currentTimeMs);
  const totalSecs = PAYMENT_WINDOW_MINUTES * 60;
  const pct = (remainingSecs / totalSecs) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}
