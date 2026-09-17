-- =============================================================================
-- RetroHub v2 Schema Migration (PART 2: TABLES & FUNCTIONS)
-- =============================================================================
-- IMPORTANT: Make sure you have run PART 1 first, so the new enums are committed.

-- 2. Migrate existing orders to new status pipeline
UPDATE public.orders SET status = 'fulfilled'        WHERE status = 'completed';
UPDATE public.orders SET status = 'payment_verified' WHERE status = 'validated';
UPDATE public.orders SET status = 'sourcing'         WHERE status = 'processing';

-- 3. Add sourcing columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS source_url      TEXT,
  ADD COLUMN IF NOT EXISTS source_platform VARCHAR(100);

-- 4. Create deliveries table
CREATE TABLE IF NOT EXISTS public.deliveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  admin_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  delivery_code   TEXT NOT NULL,
  delivery_notes  TEXT,
  sourced_from    VARCHAR(255),
  cost_paid       DECIMAL(10,2),
  sourced_at      TIMESTAMP WITH TIME ZONE,
  delivered_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON public.deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_admin_id  ON public.deliveries(admin_id);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage deliveries"        ON public.deliveries;
DROP POLICY IF EXISTS "Users can view own order deliveries" ON public.deliveries;

CREATE POLICY "Admins can manage deliveries" ON public.deliveries
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own order deliveries" ON public.deliveries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = deliveries.order_id AND o.user_id = auth.uid()
    )
  );

-- 5. Create admin_action_logs table
CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  admin_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action        VARCHAR(100) NOT NULL,
  before_status public.order_status,
  after_status  public.order_status,
  notes         TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_order_id   ON public.admin_action_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id   ON public.admin_action_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_action_logs(created_at DESC);

ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view action logs"   ON public.admin_action_logs;
DROP POLICY IF EXISTS "Admins can insert action logs" ON public.admin_action_logs;

CREATE POLICY "Admins can view action logs" ON public.admin_action_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert action logs" ON public.admin_action_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Analytics Views
DROP VIEW IF EXISTS public.v_revenue_today;
CREATE VIEW public.v_revenue_today AS
  SELECT COALESCE(SUM(total), 0)::DECIMAL AS revenue
  FROM public.orders
  WHERE status = 'fulfilled' AND created_at >= CURRENT_DATE;

DROP VIEW IF EXISTS public.v_orders_today;
CREATE VIEW public.v_orders_today AS
  SELECT COUNT(*)::INTEGER AS order_count
  FROM public.orders
  WHERE created_at >= CURRENT_DATE;

DROP VIEW IF EXISTS public.v_profit_today;
CREATE VIEW public.v_profit_today AS
  SELECT
    COALESCE(SUM(d.cost_paid), 0)::DECIMAL              AS total_cost,
    COALESCE(SUM(o.total), 0)::DECIMAL                  AS total_revenue,
    COALESCE(SUM(o.total - COALESCE(d.cost_paid,0)),0)::DECIMAL AS profit
  FROM public.orders o
  LEFT JOIN public.deliveries d ON d.order_id = o.id
  WHERE o.status = 'fulfilled' AND o.created_at >= CURRENT_DATE;

DROP VIEW IF EXISTS public.v_pending_action_count;
CREATE VIEW public.v_pending_action_count AS
  SELECT COUNT(*)::INTEGER AS count
  FROM public.orders
  WHERE status IN ('pending', 'payment_submitted', 'payment_verified', 'sourcing');

GRANT SELECT ON public.v_revenue_today        TO authenticated;
GRANT SELECT ON public.v_orders_today         TO authenticated;
GRANT SELECT ON public.v_profit_today         TO authenticated;
GRANT SELECT ON public.v_pending_action_count TO authenticated;

-- 7. Migrate existing fulfilled orders into deliveries table
INSERT INTO public.deliveries (order_id, delivery_code, delivery_notes, delivered_at, created_at)
SELECT
  id,
  final_output,
  'Migrated from v1 schema',
  COALESCE(updated_at, created_at),
  COALESCE(created_at, NOW())
FROM public.orders
WHERE status = 'fulfilled'
  AND final_output IS NOT NULL
  AND length(trim(final_output)) > 0
ON CONFLICT DO NOTHING;

-- 8. Drop inventory_keys and key_status
DROP TABLE IF EXISTS public.inventory_keys CASCADE;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'key_status') THEN
    DROP TYPE public.key_status;
  END IF;
END $$;

-- 9. Drop old RPC functions
DROP FUNCTION IF EXISTS public.fulfill_order_manual(UUID);
DROP FUNCTION IF EXISTS public.check_inventory_availability(UUID);
DROP FUNCTION IF EXISTS public.retry_failed_order(UUID);
DROP FUNCTION IF EXISTS public.sync_all_stock();

-- 10. New RPC: verify_payment
CREATE OR REPLACE FUNCTION public.verify_payment(p_order_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found'); END IF;
  IF v_order.status NOT IN ('pending', 'payment_submitted') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot verify at status: ' || v_order.status::TEXT);
  END IF;
  UPDATE public.orders SET status = 'payment_verified', updated_at = NOW() WHERE id = p_order_id;
  INSERT INTO public.admin_action_logs (order_id, admin_id, action, before_status, after_status)
    VALUES (p_order_id, auth.uid(), 'verify_payment', v_order.status, 'payment_verified');
  RETURN jsonb_build_object('success', true, 'message', 'Payment verified');
END; $$;

-- 11. New RPC: start_sourcing
CREATE OR REPLACE FUNCTION public.start_sourcing(p_order_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found'); END IF;
  IF v_order.status NOT IN ('payment_verified', 'pending', 'payment_submitted') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot start sourcing at: ' || v_order.status::TEXT);
  END IF;
  UPDATE public.orders SET status = 'sourcing', updated_at = NOW() WHERE id = p_order_id;
  INSERT INTO public.admin_action_logs (order_id, admin_id, action, before_status, after_status)
    VALUES (p_order_id, auth.uid(), 'start_sourcing', v_order.status, 'sourcing');
  RETURN jsonb_build_object('success', true, 'message', 'Sourcing started');
END; $$;

-- 12. New RPC: fulfill_order
CREATE OR REPLACE FUNCTION public.fulfill_order(
  p_order_id      UUID,
  p_delivery_code TEXT,
  p_cost_paid     DECIMAL DEFAULT NULL,
  p_sourced_from  TEXT    DEFAULT NULL,
  p_notes         TEXT    DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order       RECORD;
  v_delivery_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  IF p_delivery_code IS NULL OR trim(p_delivery_code) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Delivery code is required');
  END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found'); END IF;
  IF v_order.status IN ('fulfilled', 'cancelled', 'refunded') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot fulfill at: ' || v_order.status::TEXT);
  END IF;

  INSERT INTO public.deliveries (order_id, admin_id, delivery_code, delivery_notes, sourced_from, cost_paid, sourced_at, delivered_at)
    VALUES (p_order_id, auth.uid(), p_delivery_code, p_notes, p_sourced_from, p_cost_paid, NOW(), NOW())
    RETURNING id INTO v_delivery_id;

  UPDATE public.orders
    SET status       = 'fulfilled',
        final_output = p_delivery_code,
        cost         = COALESCE(p_cost_paid, cost),
        profit       = CASE WHEN p_cost_paid IS NOT NULL THEN total - p_cost_paid ELSE profit END,
        updated_at   = NOW()
    WHERE id = p_order_id;

  INSERT INTO public.admin_action_logs (order_id, admin_id, action, before_status, after_status, notes, metadata)
    VALUES (p_order_id, auth.uid(), 'fulfill_order', v_order.status, 'fulfilled', p_notes,
      jsonb_build_object('delivery_id', v_delivery_id, 'sourced_from', p_sourced_from, 'cost_paid', p_cost_paid));

  RETURN jsonb_build_object('success', true, 'message', 'Order fulfilled', 'delivery_id', v_delivery_id);
END; $$;

-- 13. New RPC: hold_order
CREATE OR REPLACE FUNCTION public.hold_order(p_order_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found'); END IF;
  IF v_order.status IN ('fulfilled', 'cancelled', 'refunded') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot hold a ' || v_order.status::TEXT || ' order');
  END IF;
  UPDATE public.orders
    SET status = 'sourcing',
        customer_input = COALESCE(customer_input, '{}'::jsonb) ||
          jsonb_build_object('hold_reason', p_reason, 'held_at', NOW()::TEXT, 'held_by', auth.uid()::TEXT),
        updated_at = NOW()
    WHERE id = p_order_id;
  INSERT INTO public.admin_action_logs (order_id, admin_id, action, before_status, after_status, notes)
    VALUES (p_order_id, auth.uid(), 'hold_order', v_order.status, 'sourcing', p_reason);
  RETURN jsonb_build_object('success', true, 'message', 'Order held');
END; $$;

-- 14. New RPC: cancel_order
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found'); END IF;
  IF v_order.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order already cancelled');
  END IF;
  IF v_order.status = 'fulfilled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Use refund for fulfilled orders');
  END IF;
  UPDATE public.orders
    SET status = 'cancelled', final_output = COALESCE(p_reason, 'Cancelled by admin'), updated_at = NOW()
    WHERE id = p_order_id;
  INSERT INTO public.admin_action_logs (order_id, admin_id, action, before_status, after_status, notes)
    VALUES (p_order_id, auth.uid(), 'cancel_order', v_order.status, 'cancelled', p_reason);
  RETURN jsonb_build_object('success', true, 'message', 'Order cancelled');
END; $$;

-- 15. New RPC: refund_order
CREATE OR REPLACE FUNCTION public.refund_order(p_order_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found'); END IF;
  IF v_order.status != 'fulfilled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only fulfilled orders can be refunded');
  END IF;
  UPDATE public.orders
    SET status = 'refunded',
        customer_input = COALESCE(customer_input, '{}'::jsonb) ||
          jsonb_build_object('refunded_at', NOW()::TEXT, 'refunded_by', auth.uid()::TEXT, 'refund_reason', p_reason),
        updated_at = NOW()
    WHERE id = p_order_id;
  INSERT INTO public.admin_action_logs (order_id, admin_id, action, before_status, after_status, notes)
    VALUES (p_order_id, auth.uid(), 'refund_order', 'fulfilled', 'refunded', p_reason);
  RETURN jsonb_build_object('success', true, 'message', 'Order refunded');
END; $$;

-- 16. validate_order alias (backward compat)
CREATE OR REPLACE FUNCTION public.validate_order(p_order_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN public.verify_payment(p_order_id);
END; $$;

-- 17. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.verify_payment(UUID)                           TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_sourcing(UUID)                           TO authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_order(UUID, TEXT, DECIMAL, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hold_order(UUID, TEXT)                         TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order(UUID, TEXT)                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_order(UUID, TEXT)                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_order(UUID)                           TO authenticated;
