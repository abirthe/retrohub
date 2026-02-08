-- Auto Features Migration
-- Automatic stock updates and order fulfillment

-- ============================================
-- 1. AUTO STOCK UPDATE FUNCTION
-- ============================================
-- Automatically updates product.in_stock based on available inventory_keys

CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update stock count for the affected product
  UPDATE public.products
  SET in_stock = (
    SELECT COUNT(*)
    FROM public.inventory_keys
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND status = 'available'
  )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger: Update stock when inventory_keys change
CREATE TRIGGER trigger_update_stock_on_inventory_change
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_stock();

-- ============================================
-- 2. AUTO ORDER FULFILLMENT FUNCTION
-- ============================================
-- Automatically fulfills orders for instant_code products

CREATE OR REPLACE FUNCTION public.auto_fulfill_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_delivery_type delivery_type;
  v_available_key_id UUID;
  v_key_code TEXT;
BEGIN
  -- Only process when order status changes to 'validated'
  IF NEW.status = 'validated' AND (OLD.status IS NULL OR OLD.status != 'validated') THEN
    
    -- Get product delivery type
    SELECT delivery_type INTO v_product_delivery_type
    FROM public.products
    WHERE id = NEW.product_id;
    
    -- Auto-fulfill instant_code products
    IF v_product_delivery_type = 'instant_code' THEN
      
      -- Find an available key
      SELECT id, pin_code INTO v_available_key_id, v_key_code
      FROM public.inventory_keys
      WHERE product_id = NEW.product_id
        AND status = 'available'
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED;
      
      -- If key found, fulfill the order
      IF v_available_key_id IS NOT NULL THEN
        -- Mark key as sold
        UPDATE public.inventory_keys
        SET status = 'sold',
            order_id = NEW.id,
            sold_at = NOW()
        WHERE id = v_available_key_id;
        
        -- Update order with the code and mark as completed
        UPDATE public.orders
        SET final_output = v_key_code,
            status = 'completed',
            updated_at = NOW()
        WHERE id = NEW.id;
        
        -- Log the fulfillment
        INSERT INTO public.audit_logs (
          event_type,
          actor_id,
          table_name,
          record_id,
          after_state
        ) VALUES (
          'order_auto_fulfilled',
          NEW.user_id,
          'orders',
          NEW.id,
          jsonb_build_object(
            'order_id', NEW.id,
            'key_id', v_available_key_id,
            'status', 'completed'
          )
        );
      ELSE
        -- No keys available, mark as failed
        UPDATE public.orders
        SET status = 'failed',
            final_output = 'Auto-fulfillment failed: No keys available in inventory',
            updated_at = NOW()
        WHERE id = NEW.id;
        
        -- Log the failure
        INSERT INTO public.audit_logs (
          event_type,
          actor_id,
          table_name,
          record_id,
          after_state
        ) VALUES (
          'order_auto_fulfill_failed',
          NEW.user_id,
          'orders',
          NEW.id,
          jsonb_build_object(
            'order_id', NEW.id,
            'reason', 'No keys available'
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger: Auto-fulfill orders when status changes to validated
CREATE TRIGGER trigger_auto_fulfill_order
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'validated')
  EXECUTE FUNCTION public.auto_fulfill_order();

-- ============================================
-- 3. AUTO VALIDATE ORDER FUNCTION (Optional)
-- ============================================
-- Automatically validates orders (if you want to skip manual validation)
-- Uncomment if you want orders to auto-validate on creation

-- CREATE OR REPLACE FUNCTION public.auto_validate_order()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = public
-- AS $$
-- BEGIN
--   -- Auto-validate new orders (skip pending state)
--   IF NEW.status = 'pending' THEN
--     NEW.status := 'validated';
--   END IF;
--   RETURN NEW;
-- END;
-- $$;

-- CREATE TRIGGER trigger_auto_validate_order
--   BEFORE INSERT ON public.orders
--   FOR EACH ROW
--   EXECUTE FUNCTION public.auto_validate_order();

-- ============================================
-- 4. INITIAL STOCK SYNC
-- ============================================
-- Update all product stock counts based on current inventory

UPDATE public.products p
SET in_stock = (
  SELECT COUNT(*)
  FROM public.inventory_keys ik
  WHERE ik.product_id = p.id
    AND ik.status = 'available'
);

-- ============================================
-- 5. HELPER FUNCTION: MANUAL STOCK SYNC
-- ============================================
-- Call this function to manually sync all stock counts

CREATE OR REPLACE FUNCTION public.sync_all_stock()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products p
  SET in_stock = (
    SELECT COUNT(*)
    FROM public.inventory_keys ik
    WHERE ik.product_id = p.id
      AND ik.status = 'available'
  );
END;
$$;

-- ============================================
-- 6. HELPER FUNCTION: RETRY FAILED ORDERS
-- ============================================
-- Manually retry failed orders

CREATE OR REPLACE FUNCTION public.retry_failed_order(p_order_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_delivery_type delivery_type;
  v_available_key_id UUID;
  v_key_code TEXT;
BEGIN
  -- Get order and product info
  SELECT p.delivery_type INTO v_product_delivery_type
  FROM public.orders o
  JOIN public.products p ON o.product_id = p.id
  WHERE o.id = p_order_id
    AND o.status = 'failed';
  
  IF v_product_delivery_type IS NULL THEN
    RETURN false;
  END IF;
  
  -- Only retry instant_code orders
  IF v_product_delivery_type = 'instant_code' THEN
    -- Find available key
    SELECT id, pin_code INTO v_available_key_id, v_key_code
    FROM public.inventory_keys
    WHERE product_id = (SELECT product_id FROM public.orders WHERE id = p_order_id)
      AND status = 'available'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF v_available_key_id IS NOT NULL THEN
      -- Mark key as sold
      UPDATE public.inventory_keys
      SET status = 'sold',
          order_id = p_order_id,
          sold_at = NOW()
      WHERE id = v_available_key_id;
      
      -- Update order
      UPDATE public.orders
      SET final_output = v_key_code,
          status = 'completed',
          updated_at = NOW()
      WHERE id = p_order_id;
      
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.sync_all_stock() TO authenticated;
GRANT EXECUTE ON FUNCTION public.retry_failed_order(UUID) TO authenticated;

