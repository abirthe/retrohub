-- ================================================================
-- 1. SECURE ORDER PAYMENT SUBMISSION RPC
-- Prevents unauthorized order manipulation, enforces ownership & pending status
-- ================================================================

CREATE OR REPLACE FUNCTION public.submit_order_payment(
  p_order_id UUID,
  p_transaction_id TEXT,
  p_payment_method TEXT DEFAULT 'manual'
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

  -- Order must be pending or payment_submitted
  IF v_order.status NOT IN ('pending', 'payment_submitted') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot submit payment for order with status: ' || v_order.status::TEXT);
  END IF;

  -- Validate transaction ID format (minimum 4 characters, max 64)
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
-- 2. AUTHORITATIVE PRICE ENFORCEMENT ON ORDER CREATION
-- Overwrites total with authoritative products.sale_price to prevent client tampering
-- ================================================================

CREATE OR REPLACE FUNCTION public.calculate_order_financials()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_price DECIMAL(10,2);
  v_cost_price DECIMAL(10,2);
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    SELECT sale_price, cost_price INTO v_sale_price, v_cost_price
    FROM public.products
    WHERE id = NEW.product_id;

    -- Authoritative sale price prevents client-side price tampering
    IF v_sale_price IS NOT NULL THEN
      NEW.total := v_sale_price;
    END IF;

    IF v_cost_price IS NOT NULL THEN
      NEW.cost := v_cost_price;
      NEW.profit := NEW.total - v_cost_price;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
