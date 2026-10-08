-- Migration: 20261009000001_fix_security_definer_warnings.sql
-- Fixes Supabase linter warnings for exposed SECURITY DEFINER functions.

-- 1. append_session_message
-- Intended only for service_role (edge functions). Revoke public access.
REVOKE EXECUTE ON FUNCTION public.append_session_message(BIGINT, JSONB, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.append_session_message(BIGINT, JSONB, INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.append_session_message(BIGINT, JSONB, INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.append_session_message(BIGINT, JSONB, INT) TO service_role;

-- 2. cancel_unpaid_order
-- Intended for authenticated users. We move the elevated privileges part to a private schema.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.do_cancel_unpaid_order(p_order_id UUID, p_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET
    status = 'cancelled',
    final_output = COALESCE(p_reason, 'Cancelled by customer'),
    updated_at = NOW()
  WHERE id = p_order_id;
END;
$$;

-- Redefine public function as SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.cancel_unpaid_order(
  p_order_id UUID,
  p_reason TEXT DEFAULT 'Cancelled by customer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Security Invoker: runs with caller's RLS. Caller can SELECT their own orders.
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  IF v_order.user_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: you do not own this order');
  END IF;

  IF v_order.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot cancel order with status: ' || v_order.status::TEXT);
  END IF;

  IF v_order.customer_input IS NOT NULL AND v_order.customer_input->>'transaction_id' IS NOT NULL AND trim(v_order.customer_input->>'transaction_id') != '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment has already been submitted for this order. Please contact support.');
  END IF;

  -- Delegate elevated UPDATE to private function
  PERFORM private.do_cancel_unpaid_order(p_order_id, p_reason);

  RETURN jsonb_build_object('success', true, 'message', 'Order cancelled successfully');
END;
$$;

-- Ensure proper grants
REVOKE EXECUTE ON FUNCTION public.cancel_unpaid_order(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cancel_unpaid_order(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancel_unpaid_order(UUID, TEXT) TO authenticated;

-- 3. expire_stale_orders
-- Move elevated privileges to private schema
CREATE OR REPLACE FUNCTION private.do_expire_stale_orders()
RETURNS INT
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
  
  RETURN v_count;
END;
$$;

-- Redefine public function as SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.expire_stale_orders()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  v_count := private.do_expire_stale_orders();
  RETURN jsonb_build_object('success', true, 'expired_count', v_count);
END;
$$;

-- Ensure execute grants on public function
GRANT EXECUTE ON FUNCTION public.expire_stale_orders() TO anon, authenticated;
