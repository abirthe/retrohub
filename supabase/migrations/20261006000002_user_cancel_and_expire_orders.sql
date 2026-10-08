-- ================================================================
-- Migration: 20261006000002_user_cancel_and_expire_orders.sql
-- Enables customer cancellation of unpaid pending orders and 
-- automated 30-minute expiration for abandoned checkout orders.
-- ================================================================

-- 1. Function: cancel_unpaid_order
-- Allows an authenticated user to cancel their own pending order before payment is submitted.
CREATE OR REPLACE FUNCTION public.cancel_unpaid_order(
  p_order_id UUID,
  p_reason TEXT DEFAULT 'Cancelled by customer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- User must be the owner of the order OR an admin
  IF v_order.user_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: you do not own this order');
  END IF;

  -- Only pending orders can be cancelled by user
  IF v_order.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot cancel order with status: ' || v_order.status::TEXT);
  END IF;

  -- If payment (transaction_id) was already submitted, user cannot cancel directly
  IF v_order.customer_input IS NOT NULL AND v_order.customer_input->>'transaction_id' IS NOT NULL AND trim(v_order.customer_input->>'transaction_id') != '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment has already been submitted for this order. Please contact support.');
  END IF;

  UPDATE public.orders
  SET
    status = 'cancelled',
    final_output = COALESCE(p_reason, 'Cancelled by customer'),
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'message', 'Order cancelled successfully');
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_unpaid_order(UUID, TEXT) TO authenticated;

-- 2. Function: expire_stale_orders
-- Cancels any orders still pending after 30 minutes without payment submission
CREATE OR REPLACE FUNCTION public.expire_stale_orders()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  WITH expired AS (
    UPDATE public.orders
    SET
      status = 'cancelled',
      final_output = 'Payment window expired (30-minute limit exceeded)',
      updated_at = NOW()
    WHERE status = 'pending'
      AND (
        customer_input IS NULL 
        OR customer_input->>'transaction_id' IS NULL 
        OR trim(customer_input->>'transaction_id') = ''
      )
      AND created_at < (NOW() - INTERVAL '30 minutes')
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM expired;

  RETURN jsonb_build_object('success', true, 'expired_count', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_stale_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_orders() TO anon;
