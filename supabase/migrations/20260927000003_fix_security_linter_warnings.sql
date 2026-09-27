-- ================================================================
-- Migration: fix_security_linter_warnings
-- Resolves all 4 Supabase database linter warnings observed 2026-09-27
-- ================================================================

-- ================================================================
-- 1. FIX: RLS Policy Always True on customer_support_sessions
--
-- The always-true policy used USING (true) WITH CHECK (true) for ALL
-- operations, which bypasses RLS for every database role.
-- The service role already bypasses RLS by default, so the blanket
-- true policy is unnecessary and triggers the linter.
--
-- Fix: Drop the permissive ALL policy and replace with scoped policies:
--   - Admins can SELECT and UPDATE sessions via the dashboard.
--   - The Edge Function bot uses the service_role key which bypasses
--     RLS entirely, so no INSERT/DELETE policy is needed.
-- ================================================================

DROP POLICY IF EXISTS "Service role has full access to support sessions" ON public.customer_support_sessions;

CREATE POLICY "Admins can view support sessions"
    ON public.customer_support_sessions
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update support sessions"
    ON public.customer_support_sessions
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ================================================================
-- 2 & 3. FIX: submit_order_payment SECURITY DEFINER callable by anon
--
-- The function already guards unauthenticated calls internally via
-- auth.uid() IS NULL, but Supabase flags SECURITY DEFINER functions
-- accessible by anon as a privilege escalation risk regardless.
--
-- Fix:
--   a) Revoke EXECUTE from anon and PUBLIC.
--   b) Convert to SECURITY INVOKER — the function reads/writes only
--      orders the calling user owns, and the orders table RLS already
--      enforces ownership. SECURITY INVOKER is safer because it runs
--      with the caller's privileges, not elevated superuser context.
-- ================================================================

REVOKE EXECUTE ON FUNCTION public.submit_order_payment(UUID, TEXT, TEXT) FROM anon, PUBLIC;

CREATE OR REPLACE FUNCTION public.submit_order_payment(
  p_order_id UUID,
  p_transaction_id TEXT,
  p_payment_method TEXT DEFAULT 'manual'
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

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  IF v_order.user_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: you do not own this order');
  END IF;

  IF v_order.status NOT IN ('pending', 'payment_submitted') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot submit payment for order with status: ' || v_order.status::TEXT);
  END IF;

  IF p_transaction_id IS NULL OR length(trim(p_transaction_id)) < 4 OR length(p_transaction_id) > 64 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction ID must be between 4 and 64 characters');
  END IF;

  UPDATE public.orders
  SET
    customer_input = jsonb_set(
      jsonb_set(COALESCE(customer_input, '{}'::jsonb), '{transaction_id}', to_jsonb(trim(p_transaction_id))),
      '{payment_method}', to_jsonb(COALESCE(p_payment_method, 'manual'))
    ),
    status = 'payment_submitted',
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'message', 'Payment transaction submitted successfully');
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_order_payment(UUID, TEXT, TEXT) TO authenticated;

-- ================================================================
-- 4. NOTE: Leaked Password Protection (manual dashboard action)
-- Enable at: Authentication -> Sign In / Up -> Password ->
--   "Enable Leaked Password Protection" (HaveIBeenPwned.org check).
-- This cannot be changed via SQL migrations.
-- ================================================================
