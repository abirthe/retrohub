-- Migration: add_custom_orders
-- Description: Adds a table to track custom order requests

CREATE TABLE IF NOT EXISTS public.custom_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  product_name TEXT NOT NULL,
  platform     TEXT NOT NULL,
  details      TEXT,
  status       VARCHAR(50) DEFAULT 'pending',
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_orders_user_id ON public.custom_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON public.custom_orders(status);

ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

-- Allow public to insert custom orders (for guest requests)
DROP POLICY IF EXISTS "Anyone can insert custom orders" ON public.custom_orders;
CREATE POLICY "Anyone can insert custom orders" ON public.custom_orders
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view their own requests
DROP POLICY IF EXISTS "Users can view own custom orders" ON public.custom_orders;
CREATE POLICY "Users can view own custom orders" ON public.custom_orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage custom orders
DROP POLICY IF EXISTS "Admins can manage custom orders" ON public.custom_orders;
CREATE POLICY "Admins can manage custom orders" ON public.custom_orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
