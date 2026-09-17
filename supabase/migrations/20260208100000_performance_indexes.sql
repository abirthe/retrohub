-- 20260208100000_performance_indexes.sql
-- Add indexes for storefront and admin dashboard performance

-- Index for fetching active products sorted by newest (storefront)
CREATE INDEX IF NOT EXISTS idx_products_active_recent ON public.products(is_active, created_at DESC);

-- Index for fetching orders sorted by newest (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_orders_recent ON public.orders(created_at DESC);

-- Index for querying orders by customer (user profile)
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
