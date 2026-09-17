-- Expand product_category enum with proper game and software categories
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'pc_game';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'xbox_game';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'ps_game';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'software';

-- Add UNIQUE constraint on title so ON CONFLICT (title) upsert works
ALTER TABLE public.products ADD CONSTRAINT products_title_unique UNIQUE (title);

-- Add index on platform for filtering performance
CREATE INDEX IF NOT EXISTS idx_products_platform ON public.products(platform);

-- Add index on is_active + category for homepage queries
CREATE INDEX IF NOT EXISTS idx_products_active_category ON public.products(is_active, category);
