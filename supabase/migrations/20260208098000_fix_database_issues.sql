-- Fix Database Issues Migration
-- 1. Foreign Key Constraint on inventory_keys.order_id
-- 2. Index on inventory_keys.order_id
-- 3. Add 'refunded' to order_status enum
-- 4. Update refund_order function to set status = 'refunded'
-- 5. Auto-calculate cost and profit on orders

-- ============================================
-- 1. ADD 'refunded' TO order_status ENUM
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'refunded' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
    ) THEN
        ALTER TYPE public.order_status ADD VALUE 'refunded';
    END IF;
END $$;

-- ============================================
-- 2. FOREIGN KEY & INDEX ON INVENTORY_KEYS
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_inventory_keys_order'
          AND table_name = 'inventory_keys'
    ) THEN
        ALTER TABLE public.inventory_keys
        ADD CONSTRAINT fk_inventory_keys_order
        FOREIGN KEY (order_id)
        REFERENCES public.orders(id)
        ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inventory_keys_order ON public.inventory_keys(order_id);

-- ============================================
-- 3. UPDATE REFUND_ORDER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.refund_order(p_order_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_key_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  -- Get order
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Check if order can be refunded
  IF v_order.status != 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only completed orders can be refunded');
  END IF;

  -- Release key back to inventory if it exists
  SELECT id INTO v_key_id
  FROM public.inventory_keys
  WHERE order_id = p_order_id AND status = 'sold';

  IF v_key_id IS NOT NULL THEN
    UPDATE public.inventory_keys
    SET status = 'available',
        order_id = NULL,
        sold_at = NULL
    WHERE id = v_key_id;
  END IF;

  -- Update order status to refunded and add refund info
  UPDATE public.orders
  SET status = 'refunded',
      final_output = COALESCE(p_reason, 'Order refunded') || ' | Original: ' || COALESCE(final_output, ''),
      customer_input = COALESCE(customer_input, '{}'::jsonb) || jsonb_build_object('refunded_at', NOW()::text, 'refunded_by', auth.uid()::text, 'refund_reason', p_reason),
      updated_at = NOW()
  WHERE id = p_order_id;

  -- Log the refund
  INSERT INTO public.audit_logs (
    event_type, actor_id, table_name, record_id, after_state
  ) VALUES (
    'order_refunded', auth.uid(), 'orders', p_order_id,
    jsonb_build_object('order_id', p_order_id, 'reason', p_reason, 'key_released', v_key_id IS NOT NULL, 'original_total', v_order.total)
  );

  RETURN jsonb_build_object('success', true, 'message', 'Order refunded successfully', 'key_released', v_key_id IS NOT NULL);
END;
$$;

-- ============================================
-- 4. AUTO-CALCULATE ORDER COST & PROFIT
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_order_financials()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost_price DECIMAL(10,2);
BEGIN
  IF NEW.product_id IS NOT NULL AND (NEW.cost IS NULL OR NEW.profit IS NULL) THEN
    SELECT cost_price INTO v_cost_price
    FROM public.products
    WHERE id = NEW.product_id;

    IF v_cost_price IS NOT NULL THEN
      NEW.cost := COALESCE(NEW.cost, v_cost_price);
      NEW.profit := COALESCE(NEW.profit, NEW.total - v_cost_price);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_calculate_order_financials ON public.orders;

CREATE TRIGGER trigger_calculate_order_financials
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_order_financials();
