-- Create enums for product categories and delivery types
CREATE TYPE public.product_category AS ENUM ('giftcard', 'topup', 'subscription');
CREATE TYPE public.delivery_type AS ENUM ('instant_code', 'api_h2h', 'automation');
CREATE TYPE public.region_tag AS ENUM ('GLOBAL', 'US', 'EU', 'ASIA', 'LATAM');
CREATE TYPE public.order_status AS ENUM ('pending', 'validated', 'processing', 'completed', 'failed');
CREATE TYPE public.key_status AS ENUM ('available', 'sold', 'expired');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 1. Product Master Table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category product_category NOT NULL,
    region region_tag DEFAULT 'GLOBAL',
    delivery_type delivery_type NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL,
    platform VARCHAR(100),
    description TEXT,
    image_url TEXT,
    in_stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Digital Key Vault (Serialized Inventory)
CREATE TABLE public.inventory_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    pin_code TEXT NOT NULL,
    serial_number VARCHAR(100),
    status key_status DEFAULT 'available',
    sold_at TIMESTAMP WITH TIME ZONE,
    order_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, role)
);

-- 5. Orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    customer_input JSONB DEFAULT '{}',
    final_output TEXT,
    status order_status DEFAULT 'pending',
    total DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    profit DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Audit Logs for tracking all changes
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    actor_id UUID,
    table_name VARCHAR(100),
    record_id UUID,
    before_state JSONB,
    after_state JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_delivery_type ON public.products(delivery_type);
CREATE INDEX idx_inventory_product_status ON public.inventory_keys(product_id, status);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_audit_event_type ON public.audit_logs(event_type);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Products: Public read, admin write
CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Inventory Keys: Only admins can view/manage
CREATE POLICY "Admins can manage inventory" ON public.inventory_keys
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: Users can view/edit their own
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- User Roles: Only admins can manage, users can view their own
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Orders: Users see own orders, admins see all
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Audit Logs: Only admins can view
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
-- Fix permissive audit logs INSERT policy by adding user authentication check
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (actor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
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


-- Add all regions to region_tag enum
-- This migration adds comprehensive regional coverage

-- Note: PostgreSQL enum values can only be added, not removed
-- We add all major regions for global coverage

-- Add new region values to the enum
DO $$ 
BEGIN
  -- Add regions if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'UK' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'UK';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CA' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'CA'; -- Canada
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'MX' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'MX'; -- Mexico
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'BR' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'BR'; -- Brazil
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'IN' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'IN'; -- India
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CN' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'CN'; -- China
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'JP' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'JP'; -- Japan
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'KR' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'KR'; -- South Korea
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'AU' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'AU'; -- Australia
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'NZ' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'NZ'; -- New Zealand
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ME' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'ME'; -- Middle East
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'AFRICA' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'AFRICA';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'OCEANIA' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'OCEANIA';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'AE' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'AE'; -- UAE
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SA' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'SA'; -- Saudi Arabia
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ZA' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'ZA'; -- South Africa
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'RU' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'RU'; -- Russia
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'TR' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'TR'; -- Turkey
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SG' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'SG'; -- Singapore
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'MY' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'MY'; -- Malaysia
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'TH' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'TH'; -- Thailand
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ID' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'ID'; -- Indonesia
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PH' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'PH'; -- Philippines
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'VN' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'VN'; -- Vietnam
  END IF;
END $$;


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


-- Add 'cancelled' status to order_status enum
-- This migration adds the 'cancelled' status value to the order_status enum
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


-- Email Notification Function for Order Completion
-- Sends email to customer when order is completed

CREATE OR REPLACE FUNCTION public.send_order_completion_email(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_user_email TEXT;
  v_product_title TEXT;
  v_code TEXT;
  v_result JSONB;
BEGIN
  -- Get order details with user email
  SELECT 
    o.*,
    u.email,
    p.title as product_title
  INTO v_order
  FROM public.orders o
  JOIN auth.users u ON o.user_id = u.id
  JOIN public.products p ON o.product_id = p.id
  WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Only send email for completed orders with codes
  IF v_order.status != 'completed' OR v_order.final_output IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not completed or no code available');
  END IF;

  v_user_email := v_order.email;
  v_product_title := v_order.product_title;
  v_code := v_order.final_output;

  -- Log email attempt (you can integrate with actual email service here)
  INSERT INTO public.audit_logs (
    event_type, actor_id, table_name, record_id, after_state
  ) VALUES (
    'email_sent', v_order.user_id, 'orders', p_order_id,
    jsonb_build_object(
      'order_id', p_order_id,
      'recipient', v_user_email,
      'product', v_product_title,
      'code_sent', true
    )
  );

  -- Return success (actual email sending will be handled by Edge Function or external service)
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Email notification queued',
    'recipient', v_user_email,
    'order_id', p_order_id
  );
END;
$$;

-- Trigger to automatically send email when order is completed
-- Note: This calls an Edge Function via HTTP request
CREATE OR REPLACE FUNCTION public.trigger_send_completion_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_supabase_url TEXT;
  v_supabase_anon_key TEXT;
  v_payload JSONB;
  v_response TEXT;
BEGIN
  -- Only send email when order status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    IF NEW.final_output IS NOT NULL THEN
      -- Get user email
      SELECT email INTO v_user_email
      FROM auth.users
      WHERE id = NEW.user_id;

      -- Get Supabase URL and anon key from environment (set via Supabase dashboard)
      -- For now, we'll log the email attempt and let Edge Function handle it
      -- The Edge Function will be called via webhook or manually
      
      -- Log email notification
      INSERT INTO public.audit_logs (
        event_type, actor_id, table_name, record_id, after_state
      ) VALUES (
        'email_queued', NEW.user_id, 'orders', NEW.id,
        jsonb_build_object(
          'order_id', NEW.id,
          'recipient', v_user_email,
          'status', 'queued'
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_send_completion_email ON public.orders;
CREATE TRIGGER trg_send_completion_email
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_completion_email();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.send_order_completion_email(UUID) TO authenticated;


-- Helper function to get user email (for email service)
CREATE OR REPLACE FUNCTION public.get_user_email(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Get email from auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = p_user_id;
  
  RETURN v_email;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_email(UUID) TO authenticated;

-- Update trigger to actually call Edge Function via HTTP
-- Note: PostgreSQL can't make HTTP requests directly, so we'll use pg_net extension if available
-- Otherwise, the frontend will handle email sending

CREATE OR REPLACE FUNCTION public.trigger_send_completion_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  -- Only send email when order status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    IF NEW.final_output IS NOT NULL THEN
      -- Get user email
      SELECT email INTO v_user_email
      FROM auth.users
      WHERE id = NEW.user_id;

      -- Log email notification (actual sending handled by frontend/Edge Function)
      INSERT INTO public.audit_logs (
        event_type, actor_id, table_name, record_id, after_state
      ) VALUES (
        'email_queued', NEW.user_id, 'orders', NEW.id,
        jsonb_build_object(
          'order_id', NEW.id,
          'recipient', v_user_email,
          'status', 'queued',
          'note', 'Email will be sent via Edge Function'
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


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
