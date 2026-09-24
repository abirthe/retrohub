-- Migration: Set all products' delivery_type to 'instant_code' while keeping it fully changeable
-- 1. Update all existing products to 'instant_code'
UPDATE public.products
SET delivery_type = 'instant_code'::public.delivery_type;

-- 2. Set 'instant_code' as the column default for any new products inserted in the future
-- (Merchants can still change delivery_type to 'api_h2h' or 'automation' at any time via Admin UI or SQL)
ALTER TABLE public.products
ALTER COLUMN delivery_type SET DEFAULT 'instant_code'::public.delivery_type;
