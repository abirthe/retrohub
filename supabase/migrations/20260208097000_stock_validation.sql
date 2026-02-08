-- Stock Validation for Orders
-- Ensures customers can order until stock reaches 0 (including last item)

-- Function to validate stock before creating order
CREATE OR REPLACE FUNCTION public.validate_order_stock(p_product_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
  v_available_stock INTEGER;
BEGIN
  -- Get product info
  SELECT * INTO v_product
  FROM public.products
  WHERE id = p_product_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found or inactive');
  END IF;

  -- Get actual available stock from inventory_keys
  SELECT COUNT(*) INTO v_available_stock
  FROM public.inventory_keys
  WHERE product_id = p_product_id AND status = 'available';

  -- Allow ordering if stock > 0 (including last item)
  IF v_available_stock > 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'available_stock', v_available_stock,
      'can_order', true
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Product out of stock',
      'available_stock', 0,
      'can_order', false
    );
  END IF;
END;
$$;

-- Function to create order with stock validation
CREATE OR REPLACE FUNCTION public.create_order_with_stock_check(
  p_user_id UUID,
  p_product_id UUID,
  p_total DECIMAL(10,2),
  p_customer_input JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock_check JSONB;
  v_order_id UUID;
BEGIN
  -- Validate stock before creating order
  v_stock_check := public.validate_order_stock(p_product_id);
  
  IF (v_stock_check->>'can_order')::boolean = false THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', v_stock_check->>'error',
      'available_stock', (v_stock_check->>'available_stock')::integer
    );
  END IF;

  -- Create the order
  INSERT INTO public.orders (
    user_id,
    product_id,
    total,
    customer_input,
    status
  ) VALUES (
    p_user_id,
    p_product_id,
    p_total,
    p_customer_input,
    'pending'
  ) RETURNING id INTO v_order_id;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'message', 'Order created successfully'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.validate_order_stock(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_stock_check(UUID, UUID, DECIMAL, JSONB) TO authenticated;

