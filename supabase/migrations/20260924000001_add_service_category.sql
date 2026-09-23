-- Add 'service' to product_category enum
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'service';
