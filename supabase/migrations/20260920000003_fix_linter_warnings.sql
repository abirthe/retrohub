-- Migration: fix_linter_warnings
-- Description: Fixes Supabase database linter warnings regarding RLS and Security Definer

-- 1. Fix RLS policy "Anyone can insert custom orders"
DROP POLICY IF EXISTS "Anyone can insert custom orders" ON public.custom_orders;
CREATE POLICY "Anyone can insert custom orders" ON public.custom_orders
  FOR INSERT
  WITH CHECK (user_id IS NOT DISTINCT FROM auth.uid());

-- 2. Downgrade admin functions from SECURITY DEFINER to SECURITY INVOKER
ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;
ALTER FUNCTION public.cancel_order(uuid, text) SECURITY INVOKER;
ALTER FUNCTION public.fulfill_order(uuid, text, numeric, text, text) SECURITY INVOKER;
ALTER FUNCTION public.hold_order(uuid, text) SECURITY INVOKER;
ALTER FUNCTION public.refund_order(uuid, text) SECURITY INVOKER;
ALTER FUNCTION public.start_sourcing(uuid) SECURITY INVOKER;
ALTER FUNCTION public.validate_order(uuid) SECURITY INVOKER;
ALTER FUNCTION public.verify_payment(uuid) SECURITY INVOKER;

-- 3. Revoke EXECUTE from authenticated for internal background functions
REVOKE EXECUTE ON FUNCTION public.send_order_completion_email(uuid) FROM authenticated;

-- 4. Drop unused or dangerous SECURITY DEFINER functions
DROP FUNCTION IF EXISTS public.create_order_with_stock_check(uuid, uuid, numeric, jsonb);
DROP FUNCTION IF EXISTS public.get_user_email(uuid);

-- 5. Add RLS policy so admins can view all profiles (replacing get_user_email)
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
