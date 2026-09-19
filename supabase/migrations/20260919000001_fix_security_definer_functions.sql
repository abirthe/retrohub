-- Fix Supabase Security Definer Executable Warnings

-- 1. Revoke EXECUTE from PUBLIC and anon (unauthenticated users) for ALL listed functions.
REVOKE EXECUTE ON FUNCTION public.auto_fulfill_order() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_order_financials() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_order(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_order_with_stock_check(uuid, uuid, numeric, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fulfill_order(uuid, text, numeric, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_email(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.hold_order(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.refund_order(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.send_order_completion_email(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.start_sourcing(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.trigger_send_completion_email() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_product_stock() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_order(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_order_stock(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.verify_payment(uuid) FROM PUBLIC, anon;


-- 2. Revoke EXECUTE from authenticated (signed-in users) for Admin/Internal only functions.
-- These functions should only be callable by database triggers or the Service Role (which bypasses RLS and permissions).
REVOKE EXECUTE ON FUNCTION public.auto_fulfill_order() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_order_financials() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cancel_order(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fulfill_order(uuid, text, numeric, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.hold_order(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_order(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.send_order_completion_email(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.start_sourcing(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_send_completion_email() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_product_stock() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_order(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_order_stock(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_payment(uuid) FROM authenticated;

-- (Intentionally keeping `create_order_with_stock_check`, `get_user_email`, and `has_role` executable by `authenticated` so standard logged-in users can use them).
