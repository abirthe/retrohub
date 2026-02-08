-- Admin Order Management Functions
-- Backend-connected order fulfillment and management system

-- Add 'cancelled' status to order_status enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'cancelled' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
    ) THEN
        ALTER TYPE public.order_status ADD VALUE 'cancelled';
    END IF;
END $$;

-- ============================================
-- 1. MANUAL ORDER FULFILLMENT FUNCTION
-- ============================================
-- Admin can manually fulfill orders (only if keys exist in database)

CREATE OR REPLACE FUNCTION public.fulfill_order_manual(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_product RECORD;
  v_available_key_id UUID;
  v_key_code TEXT;
  v_result JSONB;
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  -- Get order details
  SELECT o.*, p.delivery_type, p.title as product_title
  INTO v_order
  FROM public.orders o
  JOIN public.products p ON o.product_id = p.id
  WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Check if order can be fulfilled
  IF v_order.status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order already completed');
  END IF;

  IF v_order.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot fulfill cancelled order');
  END IF;

  -- Only fulfill instant_code products
  IF v_order.delivery_type != 'instant_code' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Manual fulfillment only available for instant_code products');
  END IF;

  -- Find available key (backend verification)
  SELECT id, pin_code INTO v_available_key_id, v_key_code
  FROM public.inventory_keys
  WHERE product_id = v_order.product_id
    AND status = 'available'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- If no key available, return error
  IF v_available_key_id IS NULL THEN
    UPDATE public.orders
    SET status = 'failed',
        final_output = 'Fulfillment failed: No keys available in inventory',
        updated_at = NOW()
    WHERE id = p_order_id;

    INSERT INTO public.audit_logs (
      event_type, actor_id, table_name, record_id, after_state
    ) VALUES (
      'order_fulfill_failed', auth.uid(), 'orders', p_order_id,
      jsonb_build_object('reason', 'No keys available', 'order_id', p_order_id)
    );

    RETURN jsonb_build_object('success', false, 'error', 'No keys available in inventory');
  END IF;

  -- Mark key as sold
  UPDATE public.inventory_keys
  SET status = 'sold',
      order_id = p_order_id,
      sold_at = NOW()
  WHERE id = v_available_key_id;

  -- Update order with code and mark as completed
  UPDATE public.orders
  SET final_output = v_key_code,
      status = 'completed',
      updated_at = NOW()
  WHERE id = p_order_id;

  -- Log the fulfillment
  INSERT INTO public.audit_logs (
    event_type, actor_id, table_name, record_id, after_state
  ) VALUES (
    'order_fulfilled_manual', auth.uid(), 'orders', p_order_id,
    jsonb_build_object('order_id', p_order_id, 'key_id', v_available_key_id, 'status', 'completed')
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Order fulfilled successfully',
    'order_id', p_order_id,
    'key_assigned', true
  );
END;
$$;

-- ============================================
-- 2. HOLD ORDER FUNCTION
-- ============================================
-- Admin can put orders on hold

CREATE OR REPLACE FUNCTION public.hold_order(p_order_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
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

  -- Check if order can be held
  IF v_order.status IN ('completed', 'cancelled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot hold ' || v_order.status || ' order');
  END IF;

  -- Update order status (using customer_input to store hold reason)
  UPDATE public.orders
  SET status = 'processing',
      customer_input = COALESCE(customer_input, '{}'::jsonb) || jsonb_build_object('hold_reason', p_reason, 'held_at', NOW()::text, 'held_by', auth.uid()::text),
      updated_at = NOW()
  WHERE id = p_order_id;

  -- Log the hold
  INSERT INTO public.audit_logs (
    event_type, actor_id, table_name, record_id, after_state
  ) VALUES (
    'order_held', auth.uid(), 'orders', p_order_id,
    jsonb_build_object('order_id', p_order_id, 'reason', p_reason, 'status', 'processing')
  );

  RETURN jsonb_build_object('success', true, 'message', 'Order put on hold');
END;
$$;

-- ============================================
-- 3. CANCEL ORDER FUNCTION
-- ============================================
-- Admin can cancel orders

CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id UUID, p_reason TEXT DEFAULT NULL)
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

  -- Check if order can be cancelled
  IF v_order.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order already cancelled');
  END IF;

  IF v_order.status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot cancel completed order. Use refund instead.');
  END IF;

  -- If order has a key assigned, release it back to inventory
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

  -- Update order status to cancelled
  UPDATE public.orders
  SET status = 'cancelled',
      final_output = COALESCE(p_reason, 'Order cancelled by admin'),
      updated_at = NOW()
  WHERE id = p_order_id;

  -- Log the cancellation
  INSERT INTO public.audit_logs (
    event_type, actor_id, table_name, record_id, after_state
  ) VALUES (
    'order_cancelled', auth.uid(), 'orders', p_order_id,
    jsonb_build_object('order_id', p_order_id, 'reason', p_reason, 'key_released', v_key_id IS NOT NULL)
  );

  RETURN jsonb_build_object('success', true, 'message', 'Order cancelled', 'key_released', v_key_id IS NOT NULL);
END;
$$;

-- ============================================
-- 4. REFUND ORDER FUNCTION
-- ============================================
-- Admin can refund completed orders

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

  -- Update order status and add refund info
  UPDATE public.orders
  SET status = 'failed',
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

  RETURN jsonb_build_object('success', true, 'message', 'Order refunded', 'key_released', v_key_id IS NOT NULL);
END;
$$;

-- ============================================
-- 5. VALIDATE ORDER FUNCTION
-- ============================================
-- Admin can validate orders (mark as ready for fulfillment)

CREATE OR REPLACE FUNCTION public.validate_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
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

  -- Check if order can be validated
  IF v_order.status IN ('completed', 'cancelled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot validate ' || v_order.status || ' order');
  END IF;

  -- Update order status
  UPDATE public.orders
  SET status = 'validated',
      updated_at = NOW()
  WHERE id = p_order_id;

  -- Log the validation
  INSERT INTO public.audit_logs (
    event_type, actor_id, table_name, record_id, after_state
  ) VALUES (
    'order_validated', auth.uid(), 'orders', p_order_id,
    jsonb_build_object('order_id', p_order_id, 'status', 'validated')
  );

  RETURN jsonb_build_object('success', true, 'message', 'Order validated');
END;
$$;

-- ============================================
-- 6. CHECK INVENTORY AVAILABILITY FUNCTION
-- ============================================
-- Check if product has available keys before fulfillment

CREATE OR REPLACE FUNCTION public.check_inventory_availability(p_product_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available_count INTEGER;
  v_product RECORD;
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  -- Get product info
  SELECT * INTO v_product FROM public.products WHERE id = p_product_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  -- Count available keys
  SELECT COUNT(*) INTO v_available_count
  FROM public.inventory_keys
  WHERE product_id = p_product_id AND status = 'available';

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'product_title', v_product.title,
    'available_keys', v_available_count,
    'in_stock', v_product.in_stock,
    'has_inventory', v_available_count > 0
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.fulfill_order_manual(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hold_order(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_order(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_inventory_availability(UUID) TO authenticated;

